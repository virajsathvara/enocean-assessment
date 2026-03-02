export const INTERVAL_MS: Record<string, number> = {
  '1m': 60000,
  '5m': 5 * 60000,
  '1h': 60 * 60000,
  '1d': 24 * 60 * 60000,
  '1mtest': 60, // for testing: 1 second buckets
  '5mtest': 5 * 60, // for testing: 1 second buckets
};
