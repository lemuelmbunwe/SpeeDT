import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { getDeviceId } from '@/services/storage';
import { getNetworkType, getOperatorName, getSignalStrength } from '@/services/device-info';
import { runFullSpeedTest } from '@/services/speed-test';
import { submitMetric } from '@/services/api';

type TestStatus = 'idle' | 'testing' | 'complete';

function parseMetricValue(value: any): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMetric(value: number | null, status: TestStatus, suffix = '') {
  if (status !== 'complete' || value === null) {
    return `--${suffix}`;
  }

  return `${value}${suffix}`;
}

function GoButton({ status, onPress }: { status: TestStatus; onPress: () => void }) {
  const isTesting = status === 'testing';

  return (
    <View className="mb-8 items-center justify-center">
      <View className="absolute h-56 w-56 items-center justify-center">
        {[0, 45, 90, 135].map((rotation) => (
          <View
            key={rotation}
            className="absolute h-24 w-16 rounded-full bg-brand-light-blue/40"
            style={{ transform: [{ rotate: `${rotation}deg` }] }}
          />
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isTesting }}
        onPress={onPress}
        disabled={isTesting}
        className="items-center active:opacity-90">
        <View className="h-52 w-52 items-center justify-center">
          <Svg width={208} height={208}>
            <Circle cx={104} cy={104} r={100} stroke="#D6E5F5" strokeWidth={2} fill="none" />
            <Circle cx={104} cy={8} r={5} fill="#22D3EE" />
          </Svg>

          <View className="absolute h-40 w-40 items-center justify-center rounded-full bg-brand-card">
            <Text className={`text-5xl font-bold text-cyan-400 ${isTesting ? 'opacity-60' : ''}`}>
              {isTesting ? '...' : 'GO'}
            </Text>
            <Text className="mt-1 text-xs font-semibold tracking-widest text-brand-subtle">
              {isTesting ? 'TESTING' : 'START TEST'}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export function TestScreen() {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<TestStatus>('idle');
  const [results, setResults] = useState<{ download: number; upload: number; ping: number; jitter: number } | null>(null);
  const [networkType, setNetworkType] = useState('Unknown');
  const [operatorName, setOperatorName] = useState<string | null>(null);
  const [signalStrength, setSignalStrength] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConnectionInfo = async () => {
      const type = await getNetworkType();
      const carrier = await getOperatorName();
      const signal = await getSignalStrength();
      setNetworkType(type);
      setOperatorName(carrier);
      setSignalStrength(signal);
    };

    loadConnectionInfo();
  }, []);

  const startTest = async () => {
    if (status === 'testing') {
      return;
    }

    setStatus('testing');
    setResults(null);
    setError(null);
    setLoading(true);

    try {
      const deviceId = await getDeviceId();
      if (!deviceId) {
        throw new Error('Device not registered');
      }

      const speedResult = await runFullSpeedTest();
      const signal = await getSignalStrength();
      const operator = await getOperatorName();
      const network = await getNetworkType();

      await submitMetric({
        anonymous_id: deviceId,
        network_type: network,
        operator_name: operator,
        signal_strength_dbm: signal,
        download_mbps: speedResult.download_mbps,
        upload_mbps: speedResult.upload_mbps,
        latency_ms: speedResult.latency_ms,
        jitter_ms: speedResult.jitter_ms,
        packet_loss_pct: speedResult.packet_loss_pct,
      });

      setResults({
        download: speedResult.download_mbps,
        upload: speedResult.upload_mbps,
        ping: speedResult.latency_ms,
        jitter: speedResult.jitter_ms,
      });
      setNetworkType(network);
      setOperatorName(operator);
      setSignalStrength(signal);
      setStatus('complete');
    } catch (err) {
      setError('Speed test failed. Please try again.');
      setStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  const downloadValue = status === 'complete' && results ? parseMetricValue(results.download)?.toFixed(1) ?? '--' : '--';
  const uploadValue = status === 'complete' && results ? parseMetricValue(results.upload)?.toFixed(1) ?? '--' : '--';
  const pingValue = formatMetric(parseMetricValue(results?.ping ?? null), status, ' ms');
  const jitterValue = formatMetric(parseMetricValue(results?.jitter ?? null), status, ' ms');

  return (
    <View className="flex-1 bg-[#EEF4FB]" style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 32,
        }}>
        <View className="mb-6 flex-row items-center justify-between">
          <Ionicons name="cellular" size={22} color="#1A2E4A" />
          <Text className="text-xl font-bold text-brand-navy">SpeeDT</Text>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-light-blue">
            <Ionicons name="wifi" size={18} color="#1A2E4A" />
          </View>
        </View>

        <GoButton status={status} onPress={startTest} />

        {error ? (
          <View className="mb-4 rounded-3xl bg-red-50 p-4">
            <Text className="text-sm font-medium text-red-700">{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View className="mb-4 items-center justify-center">
            <ActivityIndicator size="large" color="#3CB4A0" />
          </View>
        ) : null}

        <View className="mb-3 flex-row gap-3">
          <View className="flex-1 rounded-3xl bg-brand-card p-4">
            <View className="mb-4 flex-row items-center">
              <Ionicons name="arrow-down" size={14} color="#1A2E4A" style={{ marginRight: 6 }} />
              <Text className="text-sm font-semibold text-brand-navy">Download</Text>
            </View>
            <Text className="text-4xl font-bold text-brand-navy">{downloadValue}</Text>
            <Text className="mt-1 text-xs text-brand-subtle">Mbps</Text>
          </View>

          <View className="flex-1 rounded-3xl bg-brand-card p-4">
            <View className="mb-4 flex-row items-center">
              <Ionicons name="arrow-up" size={14} color="#1A2E4A" style={{ marginRight: 6 }} />
              <Text className="text-sm font-semibold text-brand-navy">Upload</Text>
            </View>
            <Text className="text-4xl font-bold text-brand-navy">{uploadValue}</Text>
            <Text className="mt-1 text-xs text-brand-subtle">Mbps</Text>
          </View>
        </View>

        <View className="mb-6 flex-row rounded-3xl bg-brand-card py-4">
          <View className="flex-1 flex-row items-center justify-center px-3">
            <View className="mr-2 h-8 w-8 items-center justify-center rounded-full bg-cyan-100">
              <Ionicons name="pulse" size={16} color="#22D3EE" />
            </View>
            <View>
              <Text className="text-xs text-brand-muted">Ping</Text>
              <Text className="text-base font-bold text-brand-navy">{pingValue}</Text>
            </View>
          </View>
          <View className="w-px bg-slate-200" />
          <View className="flex-1 items-center justify-center px-3">
            <Text className="text-xs text-brand-muted">Jitter</Text>
            <Text className="text-base font-bold text-brand-navy">{jitterValue}</Text>
          </View>
        </View>

        <View className="overflow-hidden rounded-3xl bg-brand-card">
          <View className="flex-row items-center px-4 py-4">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-light-blue">
              <Ionicons name="wifi" size={18} color="#1A2E4A" />
            </View>
            <View>
              <Text className="text-sm font-bold text-brand-navy">{operatorName ?? 'Unknown Operator'}</Text>
              <Text className="text-xs text-brand-subtle">{networkType}</Text>
            </View>
          </View>

          <View className="mx-4 h-px bg-white/70" />

          <Pressable
            accessibilityRole="button"
            onPress={() => Alert.alert('Server', 'SpeeDT Core Server • Frankfurt, DE')}
            className="flex-row items-center px-4 py-4 active:opacity-70">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-light-blue">
              <Ionicons name="server-outline" size={18} color="#1A2E4A" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-brand-navy">SpeeDT Core Server</Text>
              <Text className="text-xs text-brand-subtle">Frankfurt, DE</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#1A2E4A" />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
