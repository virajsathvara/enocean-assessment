import { INTERVAL_MS } from './helpers';

/**
 * Kafka input event shape — comes from device gateways
 * TODO: add validation schema (zod?)
 */
export interface SensorEvent {
  deviceId: string;
  ts: number;
  sensor: string;
  value: number | string | boolean | null;
}

/**
 * Shape of a document in devices.latest collection
 */
export interface DeviceLatestDoc {
  _id: string; // deviceId
  sensors: Record<string, { value: any; ts: number }>;
  updatedAt: Date;
}

/**
 * Shape of a document in devices.history collection
 */
export interface DeviceHistoryDoc {
  _id?: string;
  deviceId: string;
  ts: number;
  sensor: string;
  value: any;
  ingestedAt: Date;
}

/**
 * Internal buffer entry used by the worker
 */
export interface BufferEntry {
  items: SensorEvent[];
  timer: ReturnType<typeof setTimeout> | null;
}

export type GetDeviceHistoryResponse = {
  data: DeviceHistoryDoc[];
  total: number;
  page: number;
  limit: number;
};

export type GetDeviceHistoryQuery = {
  sensor?: string;
  from?: number;
  to?: number;
  page: number;
  limit: number;
};

export type GetDeviceHistoryResult = {
  data: DeviceHistoryDoc[];
  total: number;
  page: number;
  limit: number;
};

export type getDeviceSensorAggregateQuery = {
  from: number;
  to: number;
  interval: keyof typeof INTERVAL_MS;
};

export type getDeviceSensorAggregateArgs = {
  deviceId: string;
  sensor: string;
  from: number;
  to: number;
  interval: string;
  urc: string;
};

export interface DeviceSensorAggregateResult {
  ts: number;
  min: number;
  max: number;
  avg: number;
  count: number;
}
