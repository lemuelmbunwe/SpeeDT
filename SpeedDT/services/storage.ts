import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  DEVICE_ID: "@speeddt_device_id",
  PENDING_METRICS: "@speeddt_pending_metrics",
  USER_PREFERENCES: "@speeddt_user_preferences",
  LAST_UPLOAD_AT: "@speeddt_last_upload_at",
};

export async function saveDeviceId(id: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.DEVICE_ID, id);
}

export async function getDeviceId(): Promise<string | null> {
  return await AsyncStorage.getItem(KEYS.DEVICE_ID);
}

export async function clearDeviceId(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.DEVICE_ID);
}

export async function savePendingMetrics(metrics: any[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.PENDING_METRICS, JSON.stringify(metrics));
}

export async function getPendingMetrics(): Promise<any[]> {
  const raw = await AsyncStorage.getItem(KEYS.PENDING_METRICS);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as any[];
  } catch (error) {
    return [];
  }
}

export async function addPendingMetric(metric: any): Promise<void> {
  const metrics = await getPendingMetrics();
  metrics.push(metric);
  await savePendingMetrics(metrics);
}

export async function clearPendingMetrics(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.PENDING_METRICS);
}

export async function saveLastUploadAt(timestamp: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.LAST_UPLOAD_AT, String(timestamp));
}

export async function getLastUploadAt(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(KEYS.LAST_UPLOAD_AT);
  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function clearLastUploadAt(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.LAST_UPLOAD_AT);
}

export async function saveUserPreferences(prefs: object): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER_PREFERENCES, JSON.stringify(prefs));
}

export async function getUserPreferences(): Promise<object | null> {
  const raw = await AsyncStorage.getItem(KEYS.USER_PREFERENCES);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as object;
  } catch (error) {
    return null;
  }
}
