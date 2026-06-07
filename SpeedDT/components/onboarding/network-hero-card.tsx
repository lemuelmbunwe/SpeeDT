import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';
import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

cssInterop(LinearGradient, { className: 'style' });

export function NetworkHeroCard() {
  return (
    <LinearGradient
      colors={['#E8F0FA', '#D4E3F2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="mb-5 overflow-hidden rounded-3xl p-4">
      <View className="h-28 w-full">
        <Svg width="100%" height="100%" viewBox="0 0 320 100" preserveAspectRatio="none">
          <Path
            d="M0 70 C40 70, 50 45, 80 50 C110 55, 130 25, 160 30 C190 35, 210 60, 250 40 C280 25, 300 50, 320 35"
            stroke="#3CB4A0"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <Circle cx="160" cy="30" r="6" fill="#3CB4A0" />
          <Circle cx="160" cy="30" r="10" fill="#3CB4A0" opacity={0.25} />
        </Svg>
      </View>

      <View className="flex-row justify-between px-2">
        <View>
          <Text className="text-xs text-brand-blue">Ping</Text>
          <Text className="text-lg font-bold text-brand-navy">
            24<Text className="text-sm font-semibold">ms</Text>
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-brand-blue">Speed</Text>
          <Text className="text-lg font-bold text-brand-navy">
            120 <Text className="text-sm font-semibold">Mbps</Text>
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}
