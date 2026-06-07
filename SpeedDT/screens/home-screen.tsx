import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

const MOCK = {
  download: 142,
  upload: 48.2,
  ping: 12,
  gaugeProgress: 0.75,
  network: {
    status: 'Connected',
    type: '5G Ultra Wideband',
  },
  reliability: 98,
  recentTests: [
    {
      id: '1',
      location: 'Downtown Core',
      time: 'Today, 09:41 AM',
      speed: 138,
      icon: 'location' as const,
    },
    {
      id: '2',
      location: 'Business District',
      time: 'Yesterday, 06:15 PM',
      speed: 112,
      icon: 'business' as const,
    },
    {
      id: '3',
      location: 'Transit Hub',
      time: 'Oct 24, 11:20 AM',
      speed: 95,
      icon: 'train' as const,
    },
  ],
};

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

export function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#EEF4FB]" style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
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

        <View className="mb-4 rounded-3xl bg-brand-card px-4 pb-4 pt-5">
          <Text className="mb-2 text-center text-xs font-semibold tracking-wider text-brand-blue">
            CURRENT DOWNLOAD
          </Text>
          <View className="items-center">
            <DownloadGauge value={MOCK.download} progress={MOCK.gaugeProgress} />
          </View>
          <View className="mt-2 flex-row items-center">
            <View className="flex-1 flex-row items-center justify-center">
              <Ionicons name="arrow-up" size={14} color="#64748B" style={{ marginRight: 4 }} />
              <View>
                <Text className="text-xs text-brand-muted">Upload</Text>
                <Text className="text-sm font-bold text-brand-navy">{MOCK.upload} Mbps</Text>
              </View>
            </View>
            <View className="h-8 w-px bg-slate-300" />
            <View className="flex-1 flex-row items-center justify-center">
              <Ionicons name="time-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
              <View>
                <Text className="text-xs text-brand-muted">Ping</Text>
                <Text className="text-sm font-bold text-brand-navy">{MOCK.ping} ms</Text>
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
              <Text className="text-base font-bold text-brand-navy">{MOCK.network.status}</Text>
              <Text className="text-sm text-brand-muted">{MOCK.network.type}</Text>
            </View>
          </View>
        </View>

        <View className="mb-6 rounded-3xl bg-brand-card p-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-xs font-semibold tracking-wider text-brand-blue">RELIABILITY SCORE</Text>
            <Ionicons name="information-circle-outline" size={18} color="#94A3B8" />
          </View>
          <Text className="mb-3 text-brand-navy">
            <Text className="text-4xl font-bold">{MOCK.reliability}</Text>
            <Text className="text-lg text-brand-subtle"> /100</Text>
          </Text>
          <View className="h-2 overflow-hidden rounded-full bg-slate-200">
            <View
              className="h-full rounded-full bg-brand-navy"
              style={{ width: `${MOCK.reliability}%` }}
            />
          </View>
        </View>

        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-brand-navy">Recent Tests</Text>
          <Pressable accessibilityRole="button">
            <Text className="text-xs font-semibold tracking-wide text-brand-teal">VIEW ALL</Text>
          </Pressable>
        </View>

        <View className="rounded-3xl bg-brand-card px-3 py-1">
          {MOCK.recentTests.map((test, index) => (
            <View
              key={test.id}
              className={`flex-row items-center py-3.5 ${
                index < MOCK.recentTests.length - 1 ? 'border-b border-white/60' : ''
              }`}>
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-light-blue">
                <Ionicons name={RECENT_ICONS[test.icon]} size={18} color="#2E5B9E" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-brand-navy">{test.location}</Text>
                <Text className="text-xs text-brand-subtle">{test.time}</Text>
              </View>
              <Text className="mr-2 text-sm font-semibold text-brand-teal">{test.speed} Mbps</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </View>
          ))}
        </View>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        className="absolute h-14 w-14 items-center justify-center rounded-full bg-brand-navy active:opacity-90"
        style={{ right: 20, bottom: 24 }}>
        <Ionicons name="play" size={22} color="#ffffff" style={{ marginLeft: 3 }} />
      </Pressable>
    </View>
  );
}
