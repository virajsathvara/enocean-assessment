import { AppConfig, Logger } from '@enocean/common';
import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';

const logger = new Logger('mongo-api-service');

@Injectable()
export class MongoDBService implements OnModuleInit, OnModuleDestroy {
  private client!: MongoClient;
  private db!: Db;

  constructor(@Inject('APP_CONFIG') private readonly config: AppConfig) {}

  async onModuleInit() {
    this.client = new MongoClient(this.config.mongo.uri);
    await this.client.connect();
    logger.info('MongoDB connection established');
    this.db = this.client.db(this.config.mongo.dbName);
  }

  async onModuleDestroy() {
    console.log('Closing MongoDB connection');
    await this.client?.close();
    logger.info('MongoDB connection closed');
  }

  getDb(): Db {
    return this.db;
  }
}
