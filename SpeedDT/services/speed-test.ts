import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getTestBaseUrl(): string {
  const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envBaseUrl) {
    return `${envBaseUrl.replace(/\/$/, '')}/api/test-files`;
  }

  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:5000/api/test-files`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api/test-files';
  }

  return 'http://localhost:5000/api/test-files';
}

const TEST_BASE_URL = getTestBaseUrl();

export interface SpeedTestResult {
  download_mbps: number;
  upload_mbps: number;
  latency_ms: number;
  jitter_ms: number;
  packet_loss_pct: number;
}

export async function runFullSpeedTest(): Promise<SpeedTestResult> {
  const latencies = await measureLatency();
  const latencyMs = median(latencies);
  const jitterMs = calculateStandardDeviation(latencies);

  const [downloadMbps, uploadMbps] = await Promise.all([
    measureDownloadSpeed(),
    measureUploadSpeed(),
  ]);

  return {
    download_mbps: Math.round(downloadMbps * 10) / 10,
    upload_mbps: Math.round(uploadMbps * 10) / 10,
    latency_ms: Math.round(latencyMs),
    jitter_ms: Math.round(jitterMs),
    packet_loss_pct: 0,
  };
}

async function measureLatency(): Promise<number[]> {
  const attempts = 5;
  const measurements: number[] = [];

  for (let i = 0; i < attempts; i += 1) {
    const start = Date.now();
    const response = await fetch(`${TEST_BASE_URL}/ping`, { method: "GET" });
    if (!response.ok) {
      throw new Error("Latency ping failed");
    }
    const end = Date.now();
    measurements.push(end - start);
  }

  return measurements;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function calculateStandardDeviation(values: number[]): number {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

async function measureDownloadSpeed(): Promise<number> {
  const fileUrl = `${TEST_BASE_URL}/download.bin`;
  const start = Date.now();
  const response = await fetch(fileUrl, { method: "GET" });
  if (!response.ok) {
    throw new Error("Download test failed");
  }
  const blob = await response.blob();
  const end = Date.now();

  const bytes = blob.size;
  const seconds = Math.max((end - start) / 1000, 0.001);
  return (bytes * 8) / seconds / 1_000_000;
}

async function measureUploadSpeed(): Promise<number> {
  const uploadUrl = `${TEST_BASE_URL}/upload`;
  const payload = new Uint8Array(1_000_000);
  const start = Date.now();

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: payload,
  });

  if (!response.ok) {
    throw new Error("Upload test failed");
  }

  const end = Date.now();
  const seconds = Math.max((end - start) / 1000, 0.001);
  return (payload.byteLength * 8) / seconds / 1_000_000;
}
