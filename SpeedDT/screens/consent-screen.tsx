import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { cssInterop } from 'nativewind';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConsentPermissionItem } from '@/components/consent/consent-permission-item';
import { PrimaryButton } from '@/components/ui/primary-button';
import { routes } from '@/navigation/routes';
import { getAppVersion, getDeviceModel, getOsVersion } from '@/services/device-info';
import { registerDevice } from '@/services/api';
import { saveDeviceId } from '@/services/storage';
import { registerBackgroundCollection } from '@/services/background-collection';

cssInterop(LinearGradient, { className: 'style' });

const PERMISSION_ITEMS = [
  {
    key: 'network',
    label: 'Background Network Metrics Collection',
    icon: <Ionicons name="cellular" size={20} color="#3CB4A0" />,
  },
  {
    key: 'location',
    label: 'GPS Location for Coverage Mapping',
    icon: <Ionicons name="location" size={20} color="#3CB4A0" />,
  },
  {
    key: 'feedback',
    label: 'Occasional QoE Feedback Prompts',
    icon: <Ionicons name="chatbubble-ellipses-outline" size={20} color="#3CB4A0" />,
  },
] as const;

export function ConsentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAgree = async () => {
    setLoading(true);
    setError(null);

    try {
      const device_model = await getDeviceModel();
      const os = await getOsVersion();
      const app_version = await getAppVersion();

      const response = await registerDevice({
        device_model,
        os,
        app_version,
        consent_given: true,
      });

      await saveDeviceId(response.data.anonymous_id);
      await registerBackgroundCollection();
      router.replace(routes.tabs.home);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to register device. Please try again.';
      console.error('Device registration failed', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#EEF4FB', '#F4F8FC', '#FFFFFF']}
      className="flex-1"
      style={{ flex: 1 }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 16,
          justifyContent: 'center',
        }}
        showsVerticalScrollIndicator={false}>
        <View className="items-center">
          <View
            className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-white"
            style={{
              shadowColor: '#1A2E4A',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}>
            <MaterialCommunityIcons name="shield-account" size={36} color="#1A2E4A" />
          </View>

          <Text className="mb-3 text-center text-3xl font-bold text-brand-navy">Before We Begin</Text>

          <Text className="mb-8 text-center text-base leading-6 text-brand-muted">
            To provide accurate insights, QoE needs the following permissions:
          </Text>
        </View>

        <View className="rounded-2xl bg-brand-light-blue px-4 py-2">
          {PERMISSION_ITEMS.map((item, index) => (
            <ConsentPermissionItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              isLast={index === PERMISSION_ITEMS.length - 1}
            />
          ))}
        </View>
      </ScrollView>

      <View
        className="border-t border-slate-100 bg-white/80 px-6 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <PrimaryButton label="I AGREE & CONTINUE" onPress={handleAgree} disabled={loading} />
        {loading ? (
          <View className="mt-3 items-center">
            <ActivityIndicator size="small" color="#3CB4A0" />
          </View>
        ) : null}
        {error ? (
          <Text className="mt-3 text-center text-sm text-red-500">{error}</Text>
        ) : null}
        <Pressable accessibilityRole="link" className="mt-4 items-center active:opacity-70">
          <Text className="text-sm font-medium text-brand-blue underline">Read our Privacy Policy</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}
