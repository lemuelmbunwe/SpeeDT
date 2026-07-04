import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { getDeviceId, clearDeviceId, clearPendingMetrics } from '@/services/storage';
import { getDevice, updateDevicePreferences, deleteDeviceData } from '@/services/api';
import { registerBackgroundCollection, unregisterBackgroundCollection } from '@/services/background-collection';
import { routes } from '@/navigation/routes';

type SettingsToggleRowProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
};

type SettingsLinkRowProps = {
  icon: ReactNode;
  title: string;
  onPress: () => void;
  destructive?: boolean;
  showChevron?: boolean;
  isLast?: boolean;
};

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="mb-2 text-xs font-bold tracking-wider text-brand-teal">{title}</Text>
      <View className="overflow-hidden rounded-3xl bg-brand-card">{children}</View>
    </View>
  );
}

function SettingsToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  isLast = false,
}: SettingsToggleRowProps) {
  return (
    <View
      className={`flex-row items-center px-4 py-4 ${isLast ? '' : 'border-b border-white/70'}`}>
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-light-blue">
        {icon}
      </View>
      <View className="flex-1 pr-3">
        <Text className="text-sm font-bold text-brand-navy">{title}</Text>
        <Text className="text-xs text-brand-subtle">{subtitle}</Text>
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E2E8F0', true: '#3CB4A0' }}
        thumbColor="#ffffff"
        ios_backgroundColor="#E2E8F0"
      />
    </View>
  );
}

function SettingsLinkRow({
  icon,
  title,
  onPress,
  destructive = false,
  showChevron = true,
  isLast = false,
}: SettingsLinkRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`flex-row items-center px-4 py-4 active:opacity-70 ${
        isLast ? '' : 'border-b border-white/70'
      }`}>
      <View
        className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${
          destructive ? 'bg-red-50' : 'bg-brand-light-blue'
        }`}>
        {icon}
      </View>
      <Text
        className={`flex-1 text-sm font-bold ${destructive ? 'text-red-500' : 'text-brand-navy'}`}>
        {title}
      </Text>
      {showChevron ? (
        <Ionicons name="chevron-forward" size={16} color={destructive ? '#EF4444' : '#1A2E4A'} />
      ) : null}
    </Pressable>
  );
}

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dataCollection, setDataCollection] = useState(true);
  const [wifiOnlyUploads, setWifiOnlyUploads] = useState(true);
  const [notifications, setNotifications] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const deviceId = await getDeviceId();
        if (!deviceId) {
          router.replace(routes.consent);
          return;
        }

        const response = await getDevice(deviceId);
        const device = response.data;
        setDataCollection(!!device.data_collection_enabled);
        setWifiOnlyUploads(!!device.wifi_only_uploads);
        setNotifications(!!device.notifications_enabled);
      } catch (err) {
        setError('Unable to load settings.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [router]);

  const updatePreferences = async (field: 'data_collection_enabled' | 'wifi_only_uploads' | 'notifications_enabled', value: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const deviceId = await getDeviceId();
      if (!deviceId) {
        throw new Error('Device not found');
      }

      const payload = {
        data_collection_enabled: field === 'data_collection_enabled' ? value : dataCollection,
        wifi_only_uploads: field === 'wifi_only_uploads' ? value : wifiOnlyUploads,
        notifications_enabled: field === 'notifications_enabled' ? value : notifications,
      };

      await updateDevicePreferences(deviceId, payload);

      if (field === 'data_collection_enabled') {
        setDataCollection(value);
        if (value) {
          await registerBackgroundCollection();
        } else {
          await unregisterBackgroundCollection();
        }
      }

      if (field === 'wifi_only_uploads') setWifiOnlyUploads(value);
      if (field === 'notifications_enabled') setNotifications(value);
    } catch (err) {
      setError('Unable to update preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Delete All My Data',
      'This action will delete your device metrics, location, and feedback data. Your device registration will remain.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const deviceId = await getDeviceId();
              if (!deviceId) {
                throw new Error('Device not found');
              }
              await deleteDeviceData(deviceId);
              await clearPendingMetrics();
              await clearDeviceId();
              router.replace(routes.consent);
            } catch (err) {
              Alert.alert('Error', 'Unable to delete data. Please try again.');
            }
          },
        },
      ],
    );
  };

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
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 32,
        }}>
        <View className="mb-5 flex-row items-center justify-between">
          <Ionicons name="cellular" size={22} color="#1A2E4A" />
          <Text className="text-xl font-bold text-brand-navy">SpeeDT</Text>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-light-blue">
            <Ionicons name="wifi" size={18} color="#1A2E4A" />
          </View>
        </View>

        <Text className="mb-1 text-2xl font-bold text-brand-navy">Settings</Text>
        <Text className="mb-6 text-sm text-brand-muted">
          Manage your application preferences and data controls.
        </Text>

        {error ? (
          <View className="mb-4 rounded-3xl bg-red-50 p-4">
            <Text className="text-sm font-medium text-red-700">{error}</Text>
          </View>
        ) : null}

        <SettingsSection title="DATA & CONNECTIVITY">
          <SettingsToggleRow
            icon={<MaterialCommunityIcons name="database-outline" size={18} color="#1A2E4A" />}
            title="Data Collection Controls"
            subtitle="Allow background sensing"
            value={dataCollection}
            onValueChange={(value) => updatePreferences('data_collection_enabled', value)}
          />
          <SettingsToggleRow
            icon={<Ionicons name="wifi" size={18} color="#1A2E4A" />}
            title="Wi-Fi Only Uploads"
            subtitle="Save cellular data"
            value={wifiOnlyUploads}
            onValueChange={(value) => updatePreferences('wifi_only_uploads', value)}
            isLast
          />
        </SettingsSection>

        <SettingsSection title="ALERTS">
          <SettingsToggleRow
            icon={<Ionicons name="notifications-outline" size={18} color="#1A2E4A" />}
            title="Notifications"
            subtitle="Network anomaly alerts"
            value={notifications}
            onValueChange={(value) => updatePreferences('notifications_enabled', value)}
            isLast
          />
        </SettingsSection>

        <SettingsSection title="PRIVACY">
          <SettingsLinkRow
            icon={<Ionicons name="shield-checkmark-outline" size={18} color="#1A2E4A" />}
            title="View Policy"
            onPress={() => Alert.alert('Privacy Policy', 'Privacy policy content will be available in a future update.')}
          />
          <SettingsLinkRow
            icon={<Ionicons name="trash-outline" size={18} color="#EF4444" />}
            title="Delete All My Data"
            onPress={handleDeleteData}
            destructive
            showChevron={false}
            isLast
          />
        </SettingsSection>

        {saving ? (
          <View className="mb-4 items-center justify-center">
            <ActivityIndicator size="small" color="#3CB4A0" />
          </View>
        ) : null}

        <View className="mt-2 items-center py-6">
          <Ionicons name="speedometer-outline" size={28} color="#94A3B8" />
          <Text className="mt-2 text-base font-bold text-brand-subtle">SpeeDT</Text>
          <Text className="mt-1 text-xs text-brand-subtle">Version 1.0.0</Text>
          <Text className="mt-1 text-center text-[11px] text-brand-subtle">
            Secure Crowdsensing Network Monitor
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
