import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getBaseUrl(): string {
  const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (envBaseUrl) {
    return envBaseUrl.replace(/\/$/, '');
  }

  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:5000`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }

  if (Platform.OS === 'ios') {
    return 'http://localhost:5000';
  }

  return 'http://localhost:5000';
}

const BASE_URL = getBaseUrl();

async function request<T>(method: string, path: string, body?: any): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} ${errorBody}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to reach ${url}: ${detail}`);
  }
}

function normalizeDeviceInfo(deviceInfo: {
  device_model: string;
  os: string;
  app_version: string;
  consent_given: boolean;
}) {
  const clamp = (value: string | undefined, maxLength: number) => {
    const text = value?.trim() ?? "";
    if (!text) {
      return "";
    }
    return text.length > maxLength ? text.slice(0, maxLength) : text;
  };

  return {
    ...deviceInfo,
    device_model: clamp(deviceInfo.device_model, 100) || "Unknown Device",
    os: clamp(deviceInfo.os, 50) || "Unknown OS",
    app_version: clamp(deviceInfo.app_version, 20) || "0.0.0",
  };
}

export async function registerDevice(deviceInfo: {
  device_model: string;
  os: string;
  app_version: string;
  consent_given: boolean;
}): Promise<{ success: boolean; data: { anonymous_id: string } }> {
  return request("POST", "/api/devices", normalizeDeviceInfo(deviceInfo));
}

export async function getDevice(deviceId: string): Promise<any> {
  return request("GET", `/api/devices/${deviceId}`);
}

export async function submitMetric(metric: {
  anonymous_id: string;
  network_type: string;
  operator_name?: string | null;
  signal_strength_dbm?: number | null;
  download_mbps?: number | null;
  upload_mbps?: number | null;
  latency_ms?: number | null;
  jitter_ms?: number | null;
  packet_loss_pct?: number | null;
}): Promise<any> {
  return request("POST", "/api/metrics", metric);
}

export async function getLatestMetric(deviceId: string): Promise<any> {
  return request("GET", `/api/analytics/latest-metric/${deviceId}`);
}

export async function getAverageSpeed(deviceId: string): Promise<any> {
  return request("GET", `/api/analytics/average-speed/${deviceId}`);
}

export async function getHistory(deviceId: string, page = 1, limit = 20): Promise<any> {
  return request("GET", `/api/metrics/history/${deviceId}?page=${page}&limit=${limit}`);
}

export async function getTrend(deviceId: string, days = 7): Promise<any> {
  return request("GET", `/api/analytics/trend/${deviceId}?days=${days}`);
}

export async function getLocationHistory(deviceId: string): Promise<any> {
  return request("GET", `/api/locations/history/${deviceId}`);
}

export async function trackLocation(location: {
  anonymous_id: string;
  latitude: number;
  longitude: number;
  location_name?: string;
}): Promise<any> {
  return request("POST", "/api/locations", location);
}

export async function submitFeedback(feedback: {
  anonymous_id: string;
  metric_id?: number | null;
  overall_rating: number;
  speed_rating: number;
  delay_rating: number;
  reliability_rating: number;
  comment?: string;
}): Promise<any> {
  return request("POST", "/api/feedback", feedback);
}

export async function getAverageQoE(deviceId: string): Promise<any> {
  return request("GET", `/api/analytics/average-qoe/${deviceId}`);
}

export async function updateDevicePreferences(deviceId: string, preferences: {
  data_collection_enabled?: boolean;
  wifi_only_uploads?: boolean;
  notifications_enabled?: boolean;
}): Promise<any> {
  return request("PUT", `/api/devices/${deviceId}/preferences`, preferences);
}

export async function deleteDeviceData(deviceId: string): Promise<any> {
  return request("DELETE", `/api/devices/${deviceId}/data`);
}
