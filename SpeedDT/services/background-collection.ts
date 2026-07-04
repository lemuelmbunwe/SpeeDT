import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

import { addPendingMetric, clearPendingMetrics, getLastUploadAt, saveLastUploadAt, getPendingMetrics } from '@/services/storage';
import { getDeviceId } from '@/services/storage';
import { getCurrentLocation, getNetworkType, getOperatorName, getSignalStrength } from '@/services/device-info';
import { submitMetric } from '@/services/api';

const BACKGROUND_COLLECTION_TASK = 'speeddt-background-collection';

TaskManager.defineTask(BACKGROUND_COLLECTION_TASK, async () => {
  try {
    const deviceId = await getDeviceId();
    if (!deviceId) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const networkType = await getNetworkType();
    const operatorName = await getOperatorName();
    const signalStrength = await getSignalStrength();
    const location = await getCurrentLocation();

    const metric = {
      anonymous_id: deviceId,
      network_type: networkType,
      operator_name: operatorName,
      signal_strength_dbm: signalStrength,
      download_mbps: null,
      upload_mbps: null,
      latency_ms: null,
      jitter_ms: null,
      packet_loss_pct: null,
      ...(location ? { latitude: location.latitude, longitude: location.longitude } : {}),
    };

    await addPendingMetric(metric);

    const lastUploadAt = await getLastUploadAt();
    const oneHourAgo = Date.now() - 1000 * 60 * 60;
    if (!lastUploadAt || lastUploadAt <= oneHourAgo) {
      const queued = await getPendingMetrics();
      for (const queuedMetric of queued) {
        try {
          await submitMetric(queuedMetric);
        } catch (error) {
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      }
      await clearPendingMetrics();
      await saveLastUploadAt(Date.now());
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundCollection(): Promise<void> {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_COLLECTION_TASK, {
      minimumInterval: 300,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (error) {
    // ignore registration failures
  }
}

export async function unregisterBackgroundCollection(): Promise<void> {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_COLLECTION_TASK);
  } catch (error) {
    // ignore unregister failures
  }
}
