import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';

import { getDeviceId } from '@/services/storage';
import { getLatestMetric, getAverageSpeed, getHistory, getLocationHistory } from '@/services/api';
import { routes } from '@/navigation/routes';

const GAUGE_SIZE = 188;
const GAUGE_RADIUS = 74;
const GAUGE_STROKE = 14;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

const RECENT_ICONS = {
  location: 'location-outline',
  business: 'business-outline',
  train: 'train-outline',
} as const;

function DownloadGauge({ value, progress }: { value: number; progress: number }) {
  const strokeDashoffset = GAUGE_CIRCUMFERENCE * (1 - progress);

  return (
    <View className="items-center justify-center" style={{ width: GAUGE_SIZE, height: GAUGE_SIZE }}>
      <Svg width={GAUGE_SIZE} height={GAUGE_SIZE}>
        <Circle
          cx={GAUGE_SIZE / 2}
          cy={GAUGE_SIZE / 2}
          r={GAUGE_RADIUS}
          stroke="#C5D9ED"
          strokeWidth={GAUGE_STROKE}
          fill="none"
        />
        <Circle
          cx={GAUGE_SIZE / 2}
          cy={GAUGE_SIZE / 2}
          r={GAUGE_RADIUS}
          stroke="#3CB4A0"
          strokeWidth={GAUGE_STROKE}
          fill="none"
          strokeDasharray={`${GAUGE_CIRCUMFERENCE} ${GAUGE_CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${GAUGE_SIZE / 2}, ${GAUGE_SIZE / 2}`}
        />
      </Svg>
      <View className="absolute items-center">
        <Text className="text-5xl font-bold text-brand-navy">{value}</Text>
        <Text className="text-base font-semibold text-brand-teal">Mbps</Text>
      </View>
    </View>
  );
}

function parseMetricValue(value: any): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatLocationLabel(value: any): string {
  const label = String(value ?? '').trim();
  if (!label) return 'Unknown Location';
  const normalized = label.toLowerCase();
  if (normalized.includes('mobile telephone network') || normalized.includes('mtn') || normalized.includes('cameroon')) {
    return 'Mobile Network';
  }
  return label;
}

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [download, setDownload] = useState<number>(0);
  const [upload, setUpload] = useState<number>(0);
  const [ping, setPing] = useState<number>(0);
  const [signalType, setSignalType] = useState<string>('Unknown');
  const [reliability, setReliability] = useState<number>(0);
  const [recentTests, setRecentTests] = useState<any[]>([]);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>('Unknown Location');

  const loadData = async () => {
    try {
      const deviceId = await getDeviceId();
      if (!deviceId) {
        router.replace(routes.consent);
        return;
      }

      const latestResponse = await getLatestMetric(deviceId);
      const avgResponse = await getAverageSpeed(deviceId);
      const historyResponse = await getHistory(deviceId, 1, 3);
      const locationResponse = await getLocationHistory(deviceId);

      const latest = latestResponse.data;
      const avg = avgResponse.data;
      const latestLocation = (locationResponse.data || []).find((item: any) => item.location_name)?.location_name;

      setDownload(parseMetricValue(latest.download_mbps ?? 0));
      setUpload(parseMetricValue(latest.upload_mbps ?? 0));
      setPing(parseMetricValue(latest.latency_ms ?? 0));
      setSignalType(latest.network_type ?? 'Unknown');
      setReliability(Math.min(Math.round((parseMetricValue(avg.average_download_mbps ?? 0)) + 5), 100));
      setLocationLabel(formatLocationLabel(latestLocation || latest.operator_name));

      const tests = (historyResponse.data || []).map((item: any) => ({
        id: String(item.metric_id),
        location: formatLocationLabel(item.operator_name || latestLocation),
        time: new Date(item.recorded_at).toLocaleString(),
        speed: parseMetricValue(item.download_mbps).toFixed(1),
        networkType: item.network_type ?? 'Unknown',
        icon: 'location' as const,
      }));
      setRecentTests(tests);
    } catch (err) {
      setError('Unable to load home data. Please refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [router]);

  const gaugeProgress = Math.min(download / 200, 1);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#EEF4FB]" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color="#3CB4A0" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#EEF4FB]" style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadData();
          }} />
        }
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 120,
        }}>
        <View className="mb-5 flex-row items-center justify-between">
          <Ionicons name="cellular" size={22} color="#1A2E4A" />
          <Text className="text-xl font-bold text-brand-navy">SpeeDT</Text>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-light-blue">
            <Ionicons name="wifi" size={18} color="#1A2E4A" />
          </View>
        </View>

        {error ? (
          <View className="mb-4 rounded-3xl bg-red-50 p-4">
            <Text className="text-sm font-medium text-red-700">{error}</Text>
          </View>
        ) : null}

        <View className="mb-4 rounded-3xl bg-brand-card px-4 pb-4 pt-5">
          <Text className="mb-2 text-center text-xs font-semibold tracking-wider text-brand-blue">
            CURRENT DOWNLOAD
          </Text>
          <View className="items-center">
            <DownloadGauge value={download} progress={gaugeProgress} />
          </View>
          <View className="mt-2 flex-row items-center">
            <View className="flex-1 flex-row items-center justify-center">
              <Ionicons name="arrow-up" size={14} color="#64748B" style={{ marginRight: 4 }} />
              <View>
                <Text className="text-xs text-brand-muted">Upload</Text>
                <Text className="text-sm font-bold text-brand-navy">{upload.toFixed(1)} Mbps</Text>
              </View>
            </View>
            <View className="h-8 w-px bg-slate-300" />
            <View className="flex-1 flex-row items-center justify-center">
              <Ionicons name="time-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
              <View>
                <Text className="text-xs text-brand-muted">Ping</Text>
                <Text className="text-sm font-bold text-brand-navy">{ping} ms</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mb-4 rounded-3xl bg-brand-card p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-xs font-semibold tracking-wider text-brand-blue">NETWORK STATUS</Text>
            <View className="h-2.5 w-2.5 rounded-full bg-brand-teal" />
          </View>
          <View className="flex-row items-center">
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-white">
              <Ionicons name="wifi" size={20} color="#3CB4A0" />
            </View>
            <View>
              <Text className="text-base font-bold text-brand-navy">Connected</Text>
              <Text className="text-sm text-brand-muted">{signalType}</Text>
              <Text className="text-sm text-brand-muted">Location: {locationLabel}</Text>
            </View>
          </View>
        </View>

        <View className="mb-6 rounded-3xl bg-brand-card p-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-xs font-semibold tracking-wider text-brand-blue">RELIABILITY SCORE</Text>
            <Ionicons name="information-circle-outline" size={18} color="#94A3B8" />
          </View>
          <Text className="mb-3 text-brand-navy">
            <Text className="text-4xl font-bold">{reliability}</Text>
            <Text className="text-lg text-brand-subtle"> /100</Text>
          </Text>
          <View className="h-2 overflow-hidden rounded-full bg-slate-200">
            <View className="h-full rounded-full bg-brand-navy" style={{ width: `${reliability}%` }} />
          </View>
        </View>

        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-brand-navy">Recent Tests</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(routes.tabs.history)}>
            <Text className="text-xs font-semibold tracking-wide text-brand-teal">VIEW ALL</Text>
          </Pressable>
        </View>

        <View className="rounded-3xl bg-brand-card px-3 py-1">
          {recentTests.length === 0 ? (
            <View className="p-6">
              <Text className="text-sm text-brand-muted">No recent tests available yet.</Text>
            </View>
          ) : (
            recentTests.map((test, index) => {
              const isExpanded = expandedTestId === test.id;
              const iconName = RECENT_ICONS[test.icon as keyof typeof RECENT_ICONS] ?? RECENT_ICONS.location;
              return (
                <Pressable
                  key={test.id}
                  onPress={() => setExpandedTestId(isExpanded ? null : test.id)}
                  className={`py-3.5 ${index < recentTests.length - 1 ? 'border-b border-white/60' : ''}`}>
                  <View className="flex-row items-center">
                    <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-light-blue">
                      <Ionicons name={iconName} size={18} color="#2E5B9E" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-brand-navy">{test.location}</Text>
                      <Text className="text-xs text-brand-subtle">{test.time}</Text>
                    </View>
                    <Text className="mr-2 text-sm font-semibold text-brand-teal">{test.speed} Mbps</Text>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-forward'} size={16} color="#94A3B8" />
                  </View>
                  {isExpanded ? (
                    <View className="mt-2 rounded-2xl bg-white/70 px-3 py-2">
                      <Text className="text-xs text-brand-subtle">Network: {test.networkType}</Text>
                      <Text className="mt-1 text-xs text-brand-subtle">Recorded: {test.time}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        className="absolute h-14 w-14 items-center justify-center rounded-full bg-brand-navy active:opacity-90"
        style={{ right: 20, bottom: 24 }}
        onPress={() => router.push(routes.tabs.test)}>
        <Ionicons name="play" size={22} color="#ffffff" style={{ marginLeft: 3 }} />
      </Pressable>
    </View>
  );
}
