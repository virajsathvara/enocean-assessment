import { BadRequestException, Injectable } from '@nestjs/common';
import { Collection, Filter } from 'mongodb';

import {
  DeviceHistoryDoc,
  DeviceSensorAggregateResult,
  GetDeviceHistoryQuery,
  getDeviceSensorAggregateArgs,
  Logger,
} from '../../../../../libs/common/src';
import { INTERVAL_MS } from '../../../../../libs/common/src/helpers';
import { MongoDBService } from '../../database/db.service';
const logger = new Logger('devices-service');

@Injectable()
export class DevicesService {
  constructor(private readonly dbService: MongoDBService) {}

  async getDeviceHistory(deviceId: string, query: GetDeviceHistoryQuery, urc?: string) {
    try {
      logger.info(
        `Received getDeviceHistory request for deviceId: ${deviceId}, query: ${JSON.stringify(query)}, urc: ${urc}`,
      );
      // basic sanity checks for required params and types
      if (!deviceId || typeof deviceId !== 'string') {
        throw new BadRequestException('deviceId must be a non-empty string');
      }

      const { limit, page, from, to, sensor } = query;
      if (from && to && from > to) {
        throw new BadRequestException('from cannot be greater than to');
      }

      const filter: Filter<DeviceHistoryDoc> = { deviceId };
      if (sensor) filter.sensor = sensor;
      if (from !== undefined || to !== undefined) {
        filter.ts = {};
        if (from !== undefined) filter.ts.$gte = from;
        if (to !== undefined) filter.ts.$lte = to;
      }

      const historyCollection = this.dbService
        .getDb()
        .collection('devices.history') as Collection<DeviceHistoryDoc>;

      /**
       * To optimize for large datasets, we run the countDocuments and find queries in parallel. Both queries use the same filter to ensure consistency.
       * Another option is to use aggregation with $facet to get both the paginated results and total count in a single query, but that may have performance implications depending on the dataset size and indexes.
       * Since this is sensor data which can be high volume, I have used separate queries to leverage indexes effectively.
       */
      const [deviceHistory, totalCount] = await Promise.all([
        historyCollection
          .find(filter)
          .skip((page - 1) * limit)
          .limit(limit)
          .sort({ ts: -1 }) // sort by timestamp descending
          .toArray(),
        historyCollection.countDocuments(filter),
      ]);

      logger.info(
        `getDeviceHistory request completed for deviceId: ${deviceId}, returned ${deviceHistory.length} records out of total ${totalCount}, urc: ${urc}`,
      );

      return {
        data: deviceHistory,
        total: totalCount,
        page,
        limit,
      };
    } catch (error: any) {
      logger.error(`Error in getDeviceHistory: ${error.message}, urc: ${urc}`, { error });
      throw error;
    }
  }

  makeAggregationPipeline(
    deviceId: string,
    sensor: string,
    from: number,
    to: number,
    intervalMs: number,
  ) {
    return [
      // 1. match the device, sensor, time range and ensure value is numeric
      {
        $match: {
          deviceId,
          sensor,
          ts: { $gte: from, $lte: to },
          // value might be stored as number or numeric string; $type check
          $expr: { $in: [{ $type: '$value' }, ['double', 'int', 'long', 'decimal']] },
        },
      },

      // 2. compute a bucket key by rounding timestamp down to a multiple of intervalMs
      {
        $addFields: {
          bucketTs: {
            $subtract: [
              '$ts',
              { $mod: ['$ts', intervalMs] }, // ts - (ts % interval)
            ],
          },
          numericValue: { $toDouble: '$value' }, // safe cast for aggregation
        },
      },

      // 3. group by the bucket key and aggregate
      {
        $group: {
          _id: '$bucketTs',
          min: { $min: '$numericValue' },
          max: { $max: '$numericValue' },
          avg: { $avg: '$numericValue' },
          count: { $sum: 1 },
        },
      },

      // 4. convert the _id field back to ts and sort ascending
      {
        $project: {
          _id: 0,
          ts: '$_id',
          min: 1,
          max: 1,
          avg: 1,
          count: 1,
        },
      },
      { $sort: { ts: 1 } },
    ];
  }

  async getDeviceSensorAggregate(
    args: getDeviceSensorAggregateArgs,
  ): Promise<DeviceSensorAggregateResult[]> {
    const { deviceId, sensor, from, to, interval, urc } = args;
    const funcLog = `getDeviceSensorAggregate - deviceId: ${deviceId}, sensor: ${sensor}, urc: ${urc}`;
    try {
      logger.info(`Received getDeviceSensorAggregate request for ${funcLog}`);
      // basic validations for required params and types
      if (from && to && from > to) {
        throw new BadRequestException('from cannot be greater than to');
      }
      const intervalMs = INTERVAL_MS[interval];

      const pipeline = this.makeAggregationPipeline(deviceId, sensor, from, to, intervalMs);
      logger.debug(`Aggregation pipeline for ${funcLog}: ${JSON.stringify(pipeline)}`);

      const historyCollection = this.dbService
        .getDb()
        .collection('devices.history') as Collection<DeviceHistoryDoc>;
      return (await historyCollection
        .aggregate(pipeline)
        .toArray()) as DeviceSensorAggregateResult[];
    } catch (error: any) {
      logger.error(`Error in getDeviceSensorAggregate: ${error.message}, ${funcLog}`, { error });
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException('Invalid query parameters');
    }
  }
}
