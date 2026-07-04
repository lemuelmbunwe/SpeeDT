import { ActivityIndicator, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

import { OnboardingScreen } from '@/screens/onboarding-screen';
import { getDeviceId } from '@/services/storage';
import { registerBackgroundCollection } from '@/services/background-collection';
import { routes } from '@/navigation/routes';

export default function Index() {
  const router = useRouter();
  const [checkingDevice, setCheckingDevice] = useState(true);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const deviceId = await getDeviceId();
      if (!isMounted) {
        return;
      }

      if (deviceId) {
        await registerBackgroundCollection();
        router.replace(routes.tabs.home);
      } else {
        setCheckingDevice(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (checkingDevice) {
    return (
      <View className="flex-1 items-center justify-center bg-[#EEF4FB]">
        <ActivityIndicator size="large" color="#3CB4A0" />
      </View>
    );
  }

  return <OnboardingScreen />;
}
