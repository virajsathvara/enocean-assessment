import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

import { INTERVAL_MS } from '../helpers';

export class GetDeviceHistoryQuery {
  @IsOptional()
  @IsString()
  sensor?: string;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  from?: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  to?: number;

  @IsInt()
  @Transform(({ value }) => parseInt(value))
  @Min(1, { message: 'page must be >= 1' })
  page = 1;

  @IsInt()
  @Transform(({ value }) => parseInt(value))
  @Min(1, { message: 'limit must be >= 1' })
  limit = 50;
}

export class GetDeviceHistoryMethodParams {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  deviceId!: string;
}
export class getDeviceSensorAggregateQuery {
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  from!: number;

  @IsInt()
  @Transform(({ value }) => parseInt(value))
  to!: number;

  @IsString()
  @IsEnum(Object.keys(INTERVAL_MS) as Array<keyof typeof INTERVAL_MS>, {
    message: `interval must be one of ${Object.keys(INTERVAL_MS).join(', ')}`,
  })
  interval!: keyof typeof INTERVAL_MS;
}

export class getDeviceSensorAggregateMethodParams {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  deviceId!: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  sensor!: string;
}
