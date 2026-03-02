import { Controller, Get, Headers, Param, Query } from '@nestjs/common';

import {
  DeviceSensorAggregateResult,
  GetDeviceHistoryResult,
} from '../../../../../libs/common/src';
import {
  GetDeviceHistoryQuery,
  getDeviceSensorAggregateQuery,
} from '../../../../../libs/common/src/models/devices.model';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get(':deviceId/history')
  async getDeviceHistory(
    @Param() params: { deviceId: string },
    @Query() query: GetDeviceHistoryQuery,
    @Headers('unique-reference-code') urc: string,
  ): Promise<GetDeviceHistoryResult> {
    return this.devicesService.getDeviceHistory(params.deviceId, query, urc);
  }

  //  aggregated sensor data for a device.
  @Get(':deviceId/sensors/:sensor/aggregate')
  async getDeviceSensorAggregate(
    @Param() params: { deviceId: string; sensor: string },
    @Query() query: getDeviceSensorAggregateQuery,
  ): Promise<DeviceSensorAggregateResult[]> {
    return await this.devicesService.getDeviceSensorAggregate(
      params.deviceId,
      params.sensor,
      Number(query.from) || 0,
      Number(query.to) || Date.now(),
      query.interval,
    );
  }
}
