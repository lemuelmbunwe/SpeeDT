import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line, Path } from 'react-native-svg';

const MOCK = {
  avgDownload: 45.2,
  peakRecorded: 120,
  records: [
    {
      id: '1',
      location: 'Molyko',
      meta: 'Today, 14:30 • 5G NSA',
      speed: '85.4',
      icon: 'location' as const,
      noService: false,
    },
    {
      id: '2',
      location: 'Clerks Quarters',
      meta: 'Yesterday, 09:15 • 4G LTE',
      speed: '32.1',
      icon: 'location' as const,
      noService: false,
    },
    {
      id: '3',
      location: 'Buea Highway',
      metaPrefix: 'Oct 24, 18:00 • ',
      metaHighlight: 'No Service',
      speed: '--',
      icon: 'no-service' as const,
      noService: true,
    },
  ],
};

function TrendChartMock() {
  return (
    <View className="mt-3">
      <Svg width="100%" height={160} viewBox="0 0 320 160" preserveAspectRatio="none">
        {[30, 60, 90, 120].map((y) => (
          <Line key={`h-${y}`} x1="0" y1={y} x2="320" y2={y} stroke="#D8E4F0" strokeWidth="1" />
        ))}
        {[0, 80, 160, 240, 320].map((x) => (
          <Line key={`v-${x}`} x1={x} y1="20" x2={x} y2="140" stroke="#D8E4F0" strokeWidth="1" />
        ))}

        <Path
          d="M0 105 C30 100, 50 95, 80 90 C110 85, 130 80, 160 75 C190 70, 220 55, 250 50 C280 45, 300 35, 320 30"
          stroke="#B8C9DC"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M0 120 C40 115, 70 100, 100 95 C130 88, 160 70, 190 60 C220 45, 260 35, 290 28 C305 24, 315 22, 320 20"
          stroke="#3CB4A0"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </Svg>

      <View className="mt-1 flex-row justify-between px-1">
        <Text className="text-xs text-brand-subtle">Mon</Text>
        <Text className="text-xs text-brand-subtle">Today</Text>
      </View>

      <View className="mt-3 flex-row items-center justify-center gap-5">
        <View className="flex-row items-center">
          <View className="mr-2 h-2.5 w-2.5 rounded-full bg-brand-teal" />
          <Text className="text-xs text-brand-muted">Speed</Text>
        </View>
        <View className="flex-row items-center">
          <View className="mr-2 h-2.5 w-2.5 rounded-full bg-[#B8C9DC]" />
          <Text className="text-xs text-brand-muted">Signal</Text>
        </View>
      </View>
    </View>
  );
}

export function HistoryScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#EEF4FB]" style={{ flex: 1 }}>
      <ScrollView
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
        <Text className="mb-5 text-sm text-brand-muted">Review your past network sensing data.</Text>

        <View className="mb-4 flex-row gap-3">
          <View className="flex-1 rounded-3xl bg-brand-card p-4">
            <View className="mb-3 flex-row items-start justify-between">
              <Text className="text-[10px] font-semibold tracking-wider text-brand-subtle">AVG DOWNLOAD</Text>
              <Ionicons name="arrow-down" size={16} color="#94A3B8" />
            </View>
            <Text className="text-brand-teal">
              <Text className="text-3xl font-bold">{MOCK.avgDownload}</Text>
              <Text className="text-sm text-brand-subtle"> Mbps</Text>
            </Text>
          </View>

          <View className="flex-1 rounded-3xl bg-brand-card p-4">
            <View className="mb-3 flex-row items-start justify-between">
              <Text className="text-[10px] font-semibold tracking-wider text-brand-subtle">PEAK RECORDED</Text>
              <Ionicons name="flash" size={16} color="#94A3B8" />
            </View>
            <Text className="text-brand-navy">
              <Text className="text-3xl font-bold">{MOCK.peakRecorded}</Text>
              <Text className="text-sm text-brand-subtle"> Mbps</Text>
            </Text>
          </View>
        </View>

        <View className="mb-6 rounded-3xl bg-brand-card p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-brand-navy">Signal & Speed Trend</Text>
            <Text className="text-xs font-semibold text-brand-teal">7 Days</Text>
          </View>
          <TrendChartMock />
        </View>

        <Text className="mb-3 text-lg font-bold text-brand-navy">Recent Records</Text>

        <View className="gap-3">
          {MOCK.records.map((record) => (
            <View key={record.id} className="flex-row items-center rounded-3xl bg-brand-card px-3 py-3.5">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-light-blue">
                {record.icon === 'location' ? (
                  <Ionicons name="location" size={18} color="#1A2E4A" />
                ) : (
                  <Ionicons name="cellular-outline" size={18} color="#1A2E4A" />
                )}
              </View>

              <View className="flex-1 pr-2">
                <Text className="text-sm font-bold text-brand-navy">{record.location}</Text>
                {record.noService ? (
                  <Text className="text-xs text-brand-subtle">
                    {record.metaPrefix}
                    <Text className="font-semibold text-[#B45309]">{record.metaHighlight}</Text>
                  </Text>
                ) : (
                  <Text className="text-xs text-brand-subtle">{record.meta}</Text>
                )}
              </View>

              <View className="mr-1 items-end">
                <Text
                  className={`text-sm font-bold ${
                    record.noService ? 'text-brand-subtle' : 'text-brand-teal'
                  }`}>
                  {record.speed}
                </Text>
                <Text className="text-[10px] font-semibold tracking-wide text-brand-subtle">MBPS</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </View>
          ))}
        </View>

        <Pressable accessibilityRole="button" className="mt-5 items-center active:opacity-70">
          <Text className="text-xs font-bold tracking-wider text-brand-navy">VIEW ALL RECORDS</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
