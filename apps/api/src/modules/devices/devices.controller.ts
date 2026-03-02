import { Controller, Get, Param, Query } from '@nestjs/common';

import { GetDeviceHistoryQuery } from '../../../../../libs/common/src';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get(':deviceId/history')
  async getDeviceHistory(
    @Param() params: { deviceId: string },
    @Query() query: GetDeviceHistoryQuery,
  ): Promise<any> {
    return await this.devicesService.getDeviceHistory(params.deviceId, query);
  }
}
