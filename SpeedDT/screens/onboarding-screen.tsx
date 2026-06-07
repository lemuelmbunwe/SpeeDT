import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { cssInterop } from 'nativewind';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

cssInterop(LinearGradient, { className: 'style' });

import {
  ContributePreview,
  MonitoringPreview,
  SmartAlertsPreview,
} from '@/components/onboarding/feature-previews';
import { NetworkHeroCard } from '@/components/onboarding/network-hero-card';
import { OnboardingFeatureBlock } from '@/components/onboarding/onboarding-feature-block';
import { PrimaryButton } from '@/components/ui/primary-button';
import { routes } from '@/navigation/routes';

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['#EEF4FB', '#F4F8FC', '#FFFFFF']}
      className="flex-1"
      style={{ flex: 1 }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}>
        <View className="items-center pb-4 pt-2">
          <Text className="text-2xl font-bold tracking-tight text-brand-navy">SpeeDT</Text>
          <View className="mt-2 flex-row items-center rounded-full bg-brand-light-blue px-3 py-1.5">
            <View className="mr-2 h-2 w-2 rounded-full bg-brand-blue" />
            <Text className="text-xs font-medium text-brand-blue">Professional & Secure Modern UI</Text>
          </View>
        </View>

        <Text className="mb-3 text-center text-2xl font-bold leading-8 text-brand-navy">
          Understand Your Network{'\n'}Like Never Before
        </Text>

        <Text className="mb-5 text-center text-sm leading-5 text-brand-muted">
          Real-time insights. Privacy-first.{'\n'}Help build a better connected Cameroon.
        </Text>

        <NetworkHeroCard />

        <View className="mb-6 rounded-2xl bg-brand-card px-4 py-4">
          <Text className="text-center text-sm leading-5 text-brand-muted">
            QoE passively tracks your signal strength, speed, latency, and more — while giving you
            full control and protecting your privacy.
          </Text>
        </View>

        <OnboardingFeatureBlock
          icon={<Ionicons name="grid" size={18} color="#ffffff" />}
          title="Real-time Monitoring"
          subtitle="Vibrant dashboard preview">
          <MonitoringPreview />
        </OnboardingFeatureBlock>

        <OnboardingFeatureBlock
          icon={<Ionicons name="notifications" size={18} color="#ffffff" />}
          iconClassName="bg-brand-blue"
          title="Smart Alerts"
          subtitle="Alert notification illustration">
          <SmartAlertsPreview />
        </OnboardingFeatureBlock>

        <OnboardingFeatureBlock
          icon={<Ionicons name="globe-outline" size={18} color="#ffffff" />}
          iconClassName="bg-slate-500"
          title="Contribute Anonymously"
          subtitle="Cameroon coverage map illustration">
          <ContributePreview />
        </OnboardingFeatureBlock>
      </ScrollView>

      <View
        className="border-t border-slate-100 bg-white/80 px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <PrimaryButton
          label="Get Started"
          showArrow
          onPress={() => router.push(routes.consent)}
        />
      </View>
    </LinearGradient>
  );
}
