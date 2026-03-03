import { Test, TestingModule } from '@nestjs/testing';

import { MongoDBService } from '../../../database/db.service';
import { DevicesService } from '../../../modules/devices/devices.service';

describe('DevicesService', () => {
  let moduleRef: TestingModule;
  let service: DevicesService;
  let mockDbService: any;
  let fakeCollection: any;

  beforeAll(async () => {
    // set up fake collection and db service
    fakeCollection = {
      find: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([{ foo: 'bar' }]),
    };

    mockDbService = {
      getDb: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue(fakeCollection),
      }),
    };

    moduleRef = await Test.createTestingModule({
      providers: [
        DevicesService,
        {
          provide: MongoDBService,
          useValue: mockDbService,
        },
      ],
    }).compile();

    service = moduleRef.get<DevicesService>(DevicesService);
  });

  // validation is performed by controller/DTO layer; service is a thin proxy.
  // the only unit test here covers the happy path and type coercion.

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDeviceHistory', () => {
    it('should return device history with correct pagination and total count', async () => {
      // adjust fakeCollection to also support countDocuments
      fakeCollection.countDocuments = jest.fn().mockResolvedValueOnce(123);

      const result = await service.getDeviceHistory(
        'dev1',
        {
          page: 2,
          limit: 5,
        },
        'fake-urc',
      );

      expect(result).toEqual({
        data: [{ foo: 'bar' }],
        total: 123,
        page: 2,
        limit: 5,
      });

      expect(fakeCollection.find).toHaveBeenCalledWith({ deviceId: 'dev1' });
      expect(fakeCollection.skip).toHaveBeenCalledWith((2 - 1) * 5);
      expect(fakeCollection.limit).toHaveBeenCalledWith(5);
      expect(fakeCollection.countDocuments).toHaveBeenCalledWith({ deviceId: 'dev1' });
    });
  });

  describe('getDeviceSensorAggregate', () => {
    it('should return aggregated sensor data with correct parameters', async () => {
      const fakeAggregateResult = [
        { _id: 1234567890000, avgValue: 42 },
        { _id: 1234567895000, avgValue: 43 },
      ];
      fakeCollection.aggregate = jest.fn().mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValue(fakeAggregateResult),
      });

      const result = await service.getDeviceSensorAggregate({
        deviceId: 'dev1',
        sensor: 'temperature',
        from: 1234567890000,
        to: 1234567895000,
        interval: '5m',
        urc: 'fake-urc',
      });

      expect(result).toEqual(fakeAggregateResult);
    });
  });
});
