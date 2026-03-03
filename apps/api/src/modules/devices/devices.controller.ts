import { Controller, Get, Headers, Param, Query } from '@nestjs/common';

import {
  DeviceSensorAggregateResult,
  GetDeviceHistoryResult,
} from '../../../../../libs/common/src';
import {
  GetDeviceHistoryMethodParams,
  GetDeviceHistoryQuery,
  getDeviceSensorAggregateMethodParams,
  getDeviceSensorAggregateQuery,
} from '../../../../../libs/common/src/models/devices.model';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get(':deviceId/history')
  async getDeviceHistory(
    @Param() params: GetDeviceHistoryMethodParams,
    @Query() query: GetDeviceHistoryQuery,
    @Headers('unique-reference-code') urc: string,
  ): Promise<GetDeviceHistoryResult> {
    return this.devicesService.getDeviceHistory(params.deviceId, query, urc);
  }

  //  aggregated sensor data for a device.
  @Get(':deviceId/sensors/:sensor/aggregate')
  async getDeviceSensorAggregate(
    @Param() params: getDeviceSensorAggregateMethodParams,
    @Query() query: getDeviceSensorAggregateQuery,
    @Headers('unique-reference-code') urc: string,
  ): Promise<DeviceSensorAggregateResult[]> {
    return await this.devicesService.getDeviceSensorAggregate({
      deviceId: params.deviceId,
      sensor: params.sensor,
      from: Number(query.from) || 0,
      to: Number(query.to) || Date.now(),
      interval: query.interval,
      urc,
    });
  }
}
