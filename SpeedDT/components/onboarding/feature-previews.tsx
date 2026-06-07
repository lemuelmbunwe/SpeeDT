import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export function MonitoringPreview() {
  return (
    <View className="overflow-hidden rounded-2xl bg-brand-light-blue p-3">
      <View className="h-16 w-full">
        <Svg width="100%" height="100%" viewBox="0 0 300 60" preserveAspectRatio="none">
          <Path
            d="M0 50 L30 45 L60 48 L90 30 L120 35 L150 20 L180 28 L210 15 L240 25 L270 10 L300 18 L300 60 L0 60 Z"
            fill="#3CB4A0"
            opacity={0.35}
          />
          <Path
            d="M0 50 L30 45 L60 48 L90 30 L120 35 L150 20 L180 28 L210 15 L240 25 L270 10 L300 18"
            stroke="#3CB4A0"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      </View>
    </View>
  );
}

export function SmartAlertsPreview() {
  return (
    <View className="overflow-hidden rounded-2xl bg-brand-light-blue p-3">
      <View className="flex-row items-center rounded-xl bg-white px-3 py-2.5 shadow-sm">
        <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-red-100">
          <Ionicons name="warning" size={16} color="#EF4444" />
        </View>
        <View className="flex-1">
          <View className="mb-1.5 h-2 rounded-full bg-slate-200" style={{ width: '75%' }} />
          <View className="h-2 rounded-full bg-slate-100" style={{ width: '50%' }} />
        </View>
      </View>
    </View>
  );
}

export function ContributePreview() {
  return (
    <View className="overflow-hidden rounded-2xl bg-brand-light-blue p-3">
      <View className="h-20 items-center justify-center">
        <Svg width="120" height="72" viewBox="0 0 120 72">
          <Path
            d="M60 8 C45 8, 30 18, 28 32 C26 46, 38 58, 60 64 C82 58, 94 46, 92 32 C90 18, 75 8, 60 8 Z"
            fill="#C5D9ED"
            stroke="#A8C4DE"
            strokeWidth="1.5"
          />
          <Path
            d="M48 28 C52 22, 68 22, 72 28 C74 32, 70 38, 60 42 C50 38, 46 32, 48 28 Z"
            fill="#9BB8D4"
            opacity={0.6}
          />
          <Path d="M58 38 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0" fill="#3CB4A0" />
        </Svg>
      </View>
    </View>
  );
}
