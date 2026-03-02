import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, ValidateIf } from 'class-validator';

import { INTERVAL_MS } from '../helpers';

export class GetDeviceHistoryQuery {
  @IsOptional()
  @IsString()
  sensor?: string;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  @ValidateIf((o) => o.to === undefined || o.from === undefined || Number(o.from) <= Number(o.to), {
    message: 'from cannot be greater than to',
  })
  from?: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  @ValidateIf((o) => o.to === undefined || o.from === undefined || Number(o.from) >= Number(o.to), {
    message: 'to cannot be less than from',
  })
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

export class getDeviceSensorAggregateQuery {
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  @ValidateIf((o) => o.to === undefined || o.from === undefined || Number(o.from) <= Number(o.to), {
    message: 'from cannot be greater than to',
  })
  from!: number;

  @IsInt()
  @Transform(({ value }) => parseInt(value))
  @ValidateIf((o) => o.to === undefined || o.from === undefined || Number(o.from) >= Number(o.to), {
    message: 'to cannot be less than from',
  })
  to!: number;

  @IsString()
  @ValidateIf((o) => !Object.keys(INTERVAL_MS).includes(o.interval), {
    message: `interval must be one of ${Object.keys(INTERVAL_MS).join(', ')}`,
  })
  interval!: keyof typeof INTERVAL_MS;
}
