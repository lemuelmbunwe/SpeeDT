import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

type TestStatus = 'idle' | 'testing' | 'complete';

const MOCK_RESULTS = {
  download: 150.5,
  upload: 45.2,
  ping: 22,
  jitter: 4,
};

const CONNECTION = {
  network: { name: 'Starlink Network', type: 'Wi-Fi Connection' },
  server: { name: 'SpeeDT Core Server', location: 'Frankfurt, DE' },
};

const TEST_DURATION_MS = 2500;

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
  const [results, setResults] = useState<typeof MOCK_RESULTS | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const startTest = () => {
    if (status === 'testing') {
      return;
    }

    setStatus('testing');
    setResults(null);

    timeoutRef.current = setTimeout(() => {
      setResults(MOCK_RESULTS);
      setStatus('complete');
    }, TEST_DURATION_MS);
  };

  const downloadValue = status === 'complete' && results ? results.download.toFixed(1) : '--';
  const uploadValue = status === 'complete' && results ? results.upload.toFixed(1) : '--';
  const pingValue = formatMetric(results?.ping ?? null, status, ' ms');
  const jitterValue = formatMetric(results?.jitter ?? null, status, ' ms');

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
              <Text className="text-sm font-bold text-brand-navy">{CONNECTION.network.name}</Text>
              <Text className="text-xs text-brand-subtle">{CONNECTION.network.type}</Text>
            </View>
          </View>

          <View className="mx-4 h-px bg-white/70" />

          <Pressable
            accessibilityRole="button"
            className="flex-row items-center px-4 py-4 active:opacity-70">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-light-blue">
              <Ionicons name="server-outline" size={18} color="#1A2E4A" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-brand-navy">{CONNECTION.server.name}</Text>
              <Text className="text-xs text-brand-subtle">{CONNECTION.server.location}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#1A2E4A" />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
