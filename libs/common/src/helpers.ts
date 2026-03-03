export const INTERVAL_MS: Record<string, number> = {
  '1m': 60000,
  '5m': 5 * 60000,
  '1h': 60 * 60000,
  '1d': 24 * 60 * 60000,
  '5s': 5000, // for testing: 5 second buckets
};
