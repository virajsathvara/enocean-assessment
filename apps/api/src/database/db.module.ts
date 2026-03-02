import { Global, Module } from '@nestjs/common';

import { loadConfig } from '../../../../libs/common/src';
import { MongoDBService } from './db.service';
const config = loadConfig();

@Global()
@Module({
  providers: [
    {
      provide: 'APP_CONFIG',
      useValue: config,
    },
    MongoDBService,
  ],
  exports: [MongoDBService],
})
export class MongoDbModule {}
