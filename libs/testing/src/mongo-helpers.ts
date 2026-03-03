import { DeviceHistoryDoc, DeviceLatestDoc } from '@enocean/common';
import { Collection, Db, MongoClient } from 'mongodb';

/**
 * Connects to Mongo and returns the collections we care about.
 * Caller is responsible for closing the client.
 */
export async function getTestMongoClient(uri: string, dbName: string) {
  const client = new MongoClient(uri);
  await client.connect();
  const db: Db = client.db(dbName);

  const history: Collection<DeviceHistoryDoc> = db.collection('devices.history');
  const latest: Collection<DeviceLatestDoc> = db.collection('devices.latest');

  return { client, db, history, latest };
}

/**
 * Cleans test collections — useful between test runs
 */
export async function cleanCollections(db: Db) {
  await db.collection('devices.history').deleteMany({});
  await db.collection('devices.latest').deleteMany({});
}

/**
 * Polls mongo until the expected count of history docs appears,
 * or times out. Better than arbitrary sleep.
 */
export async function waitForHistoryCount(
  history: Collection<DeviceHistoryDoc>,
  expectedCount: number,
  timeoutMs = 15000,
  pollIntervalMs = 200,
): Promise<number> {
  const start = Date.now();
  let count = 0;
  while (Date.now() - start < timeoutMs) {
    count = await history.countDocuments();
    if (count >= expectedCount) return count;
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }
  return count; // return whatever we got, test will fail on assert
}

/**
 * Wait until latest collection has entries for all device IDs
 */
export async function waitForLatestDevices(
  latest: Collection<DeviceLatestDoc>,
  deviceIds: string[],
  timeoutMs = 15000,
  pollIntervalMs = 200,
): Promise<number> {
  const start = Date.now();
  let count = 0;
  while (Date.now() - start < timeoutMs) {
    count = await latest.countDocuments({ _id: { $in: deviceIds } });
    if (count >= deviceIds.length) return count;
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }
  return count;
}

/**
 * Push test events directly to mongo, bypassing the worker. Useful for testing the API against known data.
 * This function is a bit of a Frankenstein, but it gets the job done without needing to start the whole worker machinery. It also ensures the latest collection is updated consistently with history, which is important for API tests.
 * In a real-world scenario, we might want to have a more robust test data setup strategy, but this works for our current needs.
 */
export async function insertTestEvents(
  history: Collection<DeviceHistoryDoc>,
  latest: Collection<DeviceLatestDoc>,
  deviceId: string,
) {
  const historyDocs = createTestHistoryDocs(deviceId, ['temp', 'humidity'], 10);
  await history.insertMany(historyDocs);

  // Update latest collection based on inserted events
  const latestUpdates: Record<string, { value: any; ts: number }> = {};
  for (const h of historyDocs) {
    const existing = latestUpdates[h.sensor];
    if (!existing || h.ts > existing.ts) {
      latestUpdates[h.sensor] = { value: h.value, ts: h.ts };
    }
  }
  const updateFields: Record<string, any> = { updatedAt: new Date() };
  for (const [sensor, data] of Object.entries(latestUpdates)) {
    updateFields[`sensors.${sensor}`] = data;
  }

  await latest.updateOne({ _id: deviceId }, { $set: updateFields }, { upsert: true });
}

function createTestHistoryDocs(
  deviceId: string,
  sensors: string[],
  readingsPerSensor: number,
): DeviceHistoryDoc[] {
  const docs: DeviceHistoryDoc[] = [];
  for (const sensor of sensors) {
    for (let i = 0; i < readingsPerSensor; i++) {
      docs.push({
        _id: `${deviceId}-${sensor}-${i}`,
        deviceId,
        sensor,
        value: Math.floor(Math.random() * 1000),
        ts: Date.now() + i * 1000,
        ingestedAt: new Date(),
      });
    }

    // pushing string value for one reading to test mixed types in latest
    for (let i = 0; i < readingsPerSensor / 2; i++) {
      docs.push({
        _id: `${deviceId}-${sensor}-STR-${i}`,
        deviceId,
        sensor,
        value: String(Math.floor(Math.random() * 1000)),
        ts: Date.now() + i * 5000,
        ingestedAt: new Date(),
      });
    }
  }
  return docs;
}
