import { BadRequestException, Injectable } from '@nestjs/common';
import { IsNumberString, IsOptional, IsString, Min, ValidateIf } from 'class-validator';
import { Collection, Filter } from 'mongodb';

import { DeviceHistoryDoc, Logger } from '../../../../../libs/common/src';
import { MongoDBService } from '../../database/db.service';
const logger = new Logger('devices-service');

export class GetDeviceHistoryQuery {
  @IsOptional()
  @IsString()
  sensor?: string;

  @IsOptional()
  @IsNumberString()
  @ValidateIf((o) => o.to === undefined || o.from === undefined || Number(o.from) <= Number(o.to), {
    message: 'from cannot be greater than to',
  })
  from?: number;

  @IsOptional()
  @IsNumberString()
  @ValidateIf((o) => o.to === undefined || o.from === undefined || Number(o.from) >= Number(o.to), {
    message: 'to cannot be less than from',
  })
  to?: number;

  @IsNumberString()
  @Min(1, { message: 'page must be >= 1' })
  page = 1;

  @IsNumberString()
  @Min(1, { message: 'limit must be >= 1' })
  limit = 50;
}

@Injectable()
export class DevicesService {
  constructor(private readonly dbService: MongoDBService) {}

  async getDeviceHistory(deviceId: string, query: GetDeviceHistoryQuery) {
    // basic sanity checks; controller already ensures this is called from an HTTP path but
    // we still guard against programmer errors or malicious callers.
    if (!deviceId || typeof deviceId !== 'string') {
      throw new BadRequestException('deviceId must be a non-empty string');
    }

    const historyCollection = this.dbService
      .getDb()
      .collection('devices.history') as Collection<DeviceHistoryDoc>;

    const filter: Filter<DeviceHistoryDoc> = { deviceId };
    if (query.sensor) filter.sensor = query.sensor;
    if (query.from !== undefined || query.to !== undefined) {
      filter.ts = {};
      if (query.from !== undefined) filter.ts.$gte = Number(query.from);
      if (query.to !== undefined) filter.ts.$lte = Number(query.to);
    }
    logger.info(
      `Querying device history with filter: ${JSON.stringify(filter)}, page: ${query.page}, limit: ${query.limit}`,
    );
    return historyCollection
      .find(filter)
      .skip((Number(query.page) - 1) * Number(query.limit))
      .limit(Number(query.limit))
      .sort({ ts: -1 }) // sort by timestamp descending
      .toArray();
  }
}
