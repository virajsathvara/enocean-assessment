import { Module } from '@nestjs/common';

import { MongoDbModule } from './database/db.module';
import { HealthController } from './health.controller';
import { DevicesModule } from './modules/devices/devices.module';

@Module({
  imports: [MongoDbModule, DevicesModule],
  controllers: [HealthController],
})
export class ApiModule {}
