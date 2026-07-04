import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line, Path } from 'react-native-svg';

import { getDeviceId } from '@/services/storage';
import { getHistory, getTrend, getAverageSpeed, getLocationHistory } from '@/services/api';

function parseMetricValue(value: any): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

function TrendChart({ trend }: { trend: Array<{ day: string; avg_download: number; avg_signal: number }> }) {
  const normalizedTrend = trend.map((point) => ({
    ...point,
    avg_download: parseMetricValue(point.avg_download) ?? 0,
    avg_signal: parseMetricValue(point.avg_signal) ?? 0,
  }));

  if (normalizedTrend.length === 0 || normalizedTrend.every((point) => point.avg_download === 0)) {
    return (
      <View className="mt-3 rounded-3xl bg-white p-6">
        <Text className="text-sm text-brand-muted">No trend data available yet.</Text>
      </View>
    );
  }

  const width = 320;
  const height = 140;
  const maxValue = Math.max(...normalizedTrend.map((point) => point.avg_download), 1);
  const points = normalizedTrend.map((point, index) => ({
    x: (index / Math.max(normalizedTrend.length - 1, 1)) * width,
    y: height - (point.avg_download / maxValue) * (height - 20),
  }));
  const downloadPath = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ');

  return (
    <View className="mt-3">
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {[20, 60, 100, 140].map((y) => (
          <Line key={`h-${y}`} x1="0" y1={y} x2={width} y2={y} stroke="#D8E4F0" strokeWidth="1" />
        ))}
        {trend.map((_, index) => {
          const x = (index / Math.max(trend.length - 1, 1)) * width;
          return <Line key={index} x1={x} y1="0" x2={x} y2={height} stroke="#F1F5F9" strokeWidth="1" />;
        })}
        <Path d={downloadPath} stroke="#3CB4A0" strokeWidth="3" fill="none" strokeLinecap="round" />
      </Svg>

      <View className="mt-1 flex-row justify-between px-1">
        {normalizedTrend.map((point) => (
          <Text key={point.day} className="text-xs text-brand-subtle">
            {new Date(point.day).toLocaleDateString(undefined, { weekday: 'short' })}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [avgDownload, setAvgDownload] = useState(0);
  const [peakRecorded, setPeakRecorded] = useState(0);
  const [records, setRecords] = useState<any[]>([]);
  const [trend, setTrend] = useState<Array<{ day: string; avg_download: number; avg_signal: number }>>([]);
  const [locationLabel, setLocationLabel] = useState<string>('Unknown Location');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const deviceId = await getDeviceId();
        if (!deviceId) {
          return;
        }

        const avgResponse = await getAverageSpeed(deviceId);
        const trendResponse = await getTrend(deviceId, 7);
        const historyResponse = await getHistory(deviceId, 1, 20);
        const locationResponse = await getLocationHistory(deviceId);
        const latestLocation = (locationResponse.data || []).find((item: any) => item.location_name)?.location_name;

        setAvgDownload(parseMetricValue(avgResponse.data.average_download_mbps) ?? 0);
        setPeakRecorded(Math.ceil(parseMetricValue(avgResponse.data.average_download_mbps) ?? 0));
        setTrend(trendResponse.data ?? []);
        setLocationLabel(formatLocationLabel(latestLocation));

        setRecords(
          (historyResponse.data || []).map((item: any) => {
            const speedValue = parseMetricValue(item.download_mbps);
            return {
              id: String(item.metric_id),
              location: formatLocationLabel(item.operator_name || latestLocation),
              meta: `${new Date(item.recorded_at).toLocaleString()} • ${item.network_type || 'Unknown'}`,
              speed: speedValue !== null ? speedValue.toFixed(1) : '--',
              noService: speedValue === null,
            };
          }),
        );
      } catch (err) {
        // ignore for now
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

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
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 32,
        }}>
        <View className="mb-5 flex-row items-center justify-between">
          <Ionicons name="cellular" size={22} color="#1A2E4A" />
          <Text className="text-xl font-bold text-brand-navy">SpeeDT</Text>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-light-blue">
            <MaterialCommunityIcons name="transmission-tower" size={18} color="#1A2E4A" />
          </View>
        </View>

        <Text className="mb-1 text-2xl font-bold text-brand-navy">Performance History</Text>
        <Text className="mb-1 text-sm text-brand-muted">Review your past network sensing data.</Text>
        <Text className="mb-5 text-sm font-medium text-brand-teal">Location: {locationLabel}</Text>

        <View className="mb-4 flex-row gap-3">
          <View className="flex-1 rounded-3xl bg-brand-card p-4">
            <View className="mb-3 flex-row items-start justify-between">
              <Text className="text-[10px] font-semibold tracking-wider text-brand-subtle">AVG DOWNLOAD</Text>
              <Ionicons name="arrow-down" size={16} color="#94A3B8" />
            </View>
            <Text className="text-brand-teal">
              <Text className="text-3xl font-bold">{avgDownload.toFixed(1)}</Text>
              <Text className="text-sm text-brand-subtle"> Mbps</Text>
            </Text>
          </View>

          <View className="flex-1 rounded-3xl bg-brand-card p-4">
            <View className="mb-3 flex-row items-start justify-between">
              <Text className="text-[10px] font-semibold tracking-wider text-brand-subtle">PEAK RECORDED</Text>
              <Ionicons name="flash" size={16} color="#94A3B8" />
            </View>
            <Text className="text-brand-navy">
              <Text className="text-3xl font-bold">{peakRecorded}</Text>
              <Text className="text-sm text-brand-subtle"> Mbps</Text>
            </Text>
          </View>
        </View>

        <View className="mb-6 rounded-3xl bg-brand-card p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-brand-navy">Signal & Speed Trend</Text>
            <Text className="text-xs font-semibold text-brand-teal">7 Days</Text>
          </View>
          <TrendChart trend={trend} />
        </View>

        <Text className="mb-3 text-lg font-bold text-brand-navy">Recent Records</Text>

        <View className="gap-3">
          {records.length === 0 ? (
            <View className="rounded-3xl bg-brand-card p-6">
              <Text className="text-sm text-brand-muted">No history records available yet.</Text>
            </View>
          ) : (
            records.map((record) => (
              <View key={record.id} className="flex-row items-center rounded-3xl bg-brand-card px-3 py-3.5">
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-light-blue">
                  <Ionicons name="location" size={18} color="#1A2E4A" />
                </View>

                <View className="flex-1 pr-2">
                  <Text className="text-sm font-bold text-brand-navy">{record.location}</Text>
                  <Text className="text-xs text-brand-subtle">{record.meta}</Text>
                </View>

                <View className="mr-1 items-end">
                  <Text className={`text-sm font-bold ${record.noService ? 'text-brand-subtle' : 'text-brand-teal'}`}>
                    {record.speed}
                  </Text>
                  <Text className="text-[10px] font-semibold tracking-wide text-brand-subtle">MBPS</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </View>
            ))
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          className="mt-5 items-center active:opacity-70">
          <Text className="text-xs font-bold tracking-wider text-brand-navy">VIEW ALL RECORDS</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
