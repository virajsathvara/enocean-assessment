import { cleanCollections, getTestMongoClient, insertTestEvents } from '@enocean/testing';
import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Collection, Db, MongoClient } from 'mongodb';
import request from 'supertest';

import {
  AppConfig,
  DeviceHistoryDoc,
  DeviceLatestDoc,
  loadConfig,
} from '../../../../../../libs/common/src';
import { ApiModule } from '../../../api.module';

describe('DevicesService', () => {
  let moduleRef: TestingModule;
  let app: any;
  let db: Db;
  let mongoClient: MongoClient;
  let history: Collection<DeviceHistoryDoc>;
  let latest: Collection<DeviceLatestDoc>;
  let config: AppConfig;

  beforeAll(async () => {
    // set up test sensor data in Mongo before app init, so the service has something to query.
    config = loadConfig();
    const mongo = await getTestMongoClient(config.mongo.uri, config.mongo.dbName);
    db = mongo.db;
    history = mongo.history;
    latest = mongo.latest;
    mongoClient = mongo.client;

    // clean collections before starting tests to ensure a clean slate
    await cleanCollections(db);

    //  insert test events for device 'devTest1'
    await insertTestEvents(history, latest, 'devTest1');

    moduleRef = await Test.createTestingModule({
      imports: [ApiModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    // Wait a bit for any in-flight async flushes to settle before
    // tearing down the mongo connection
    await new Promise((r) => setTimeout(r, 2000));
    await mongoClient.close();
    await app.close();
  });

  describe('Validations - GET /devices/:id/history', () => {
    it('should return 400 for invalid pagination parameters', async () => {
      await request(app.getHttpServer()).get('/devices/dev1/history?page=-1&limit=5').expect(400);
      await request(app.getHttpServer()).get('/devices/dev1/history?page=abc&limit=5').expect(400);
      await request(app.getHttpServer()).get('/devices/dev1/history?page=1&limit=0').expect(400);
      await request(app.getHttpServer()).get('/devices/dev1/history?page=1&limit=abc').expect(400);
    });

    it('should return 400 for from and to parameters that are not numbers', async () => {
      await request(app.getHttpServer()).get('/devices/dev1/history?from=abc&to=def').expect(400);
      await request(app.getHttpServer()).get('/devices/dev1/history?from=123&to=def').expect(400);
      await request(app.getHttpServer()).get('/devices/dev1/history?from=abc&to=456').expect(400);
    });

    it('should return 400 if from is greater than to', async () => {
      const now = Date.now();
      await request(app.getHttpServer())
        .get(`/devices/dev1/history?from=${now + 1000}&to=${now}`)
        .expect(400);
    });
  });

  describe('Happy Paths - GET /devices/:id/history', () => {
    it('should return device history with correct pagination and total count', async () => {
      await request(app.getHttpServer())
        .get('/devices/devTest1/history?page=2&limit=5')
        .expect(200)
        .expect((res) => {
          expect(res.body.total).toEqual(20);
          expect(res.body.page).toEqual(2);
          expect(res.body.limit).toEqual(5);
          expect(res.body.data.length).toEqual(5);
          // Check that the data is in the expected order (newest first)
          expect(res.body.data[0].ts).toBeGreaterThan(res.body.data[4].ts);
        });
    });

    it('should return device history between from and to', async () => {
      const tsFrom = Date.now() - 5000; // 5 seconds ago
      const tsTo = Date.now() + 5000; // 5 seconds in the future
      await request(app.getHttpServer())
        .get(`/devices/devTest1/history?page=2&limit=5&from=${tsFrom}&to=${tsTo}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.total).toEqual(20);
          expect(res.body.page).toEqual(2);
          expect(res.body.limit).toEqual(5);
          expect(res.body.data.length).toEqual(5);
          // Check that the data is in the expected order (newest first)
          expect(res.body.data[0].ts).toBeGreaterThan(res.body.data[4].ts);
        });
    });
  });

  describe('Validations - GET /devices/:deviceId/sensors/:sensor/aggregate', () => {
    it('should return 400 for invalid method parameters', async () => {
      await request(app.getHttpServer())
        .get('/devices/ /sensors/temperature/aggregate?from=0&to=1772489051894&interval=1m')
        .expect(400);
      await request(app.getHttpServer())
        .get('/devices/dev1/sensors/ /aggregate?from=0&to=1772489051894&interval=1m')
        .expect(400);
    });

    it('should return 400 for from and to parameters that are not numbers', async () => {
      await request(app.getHttpServer())
        .get('/devices/dev1/sensors/temperature/aggregate?from=abc&to=def&interval=1m')
        .expect(400);
      await request(app.getHttpServer())
        .get('/devices/dev1/sensors/temperature/aggregate?from=123&to=def&interval=1m')
        .expect(400);
      await request(app.getHttpServer())
        .get('/devices/dev1/sensors/temperature/aggregate?from=abc&to=456&interval=1m')
        .expect(400);
    });

    it('should return 400 if from is greater than to', async () => {
      const now = Date.now();
      await request(app.getHttpServer())
        .get(`/devices/dev1/sensors/temperature/aggregate?from=${now + 1000}&to=${now}&interval=1m`)
        .expect(400);
    });
  });

  describe('Happy Paths - GET /devices/:deviceId/sensors/:sensor/aggregate', () => {
    it('should return device history with correct pagination and total count', async () => {
      const tsFrom = Date.now() - 5000; // 5 seconds ago
      const tsTo = Date.now() + 15000; // 15 seconds in the future

      // we have pushed 10 events with integer values and 5 readings with non-integer values for devTest1's temperature sensor in the test setup.
      await request(app.getHttpServer())
        .get(`/devices/devTest1/sensors/temp/aggregate?from=${tsFrom}&to=${tsTo}&interval=5s`)
        .expect(200)
        .expect((res) => {
          expect(res.body.length).toBeGreaterThanOrEqual(1);

          const firstData = res.body[0];
          const total = res.body.reduce((sum: number, bucket: any) => sum + bucket.count, 0);
          expect(firstData.min).toBeGreaterThanOrEqual(0);
          expect(firstData.max).toBeGreaterThanOrEqual(firstData.min);
          expect(firstData.avg).toBeGreaterThanOrEqual(firstData.min);
          expect(total).toBeGreaterThanOrEqual(10); // at least the 10 integer events should be counted, non-integer values are filtered out in the pipeline
        });
    });
  });
});
