import { Global, Module } from '@nestjs/common';

import { loadConfig } from '../../../../libs/common/src';
import { MongoDBService } from './db.service';
import { DevicesRepository } from './repositories/devices.repository';
const config = loadConfig();

@Global()
@Module({
  providers: [
    {
      provide: 'APP_CONFIG',
      useValue: config,
    },
    MongoDBService,
    DevicesRepository,
  ],
  exports: [MongoDBService, DevicesRepository],
})
export class MongoDbModule {}
