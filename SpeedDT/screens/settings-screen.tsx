import { Text } from 'react-native';

import { ScreenContainer } from '@/components/screen-container';

export function SettingsScreen() {
  return (
    <ScreenContainer className="items-center justify-center">
      <Text className="text-xl text-gray-900" style={{ color: '#11181C', fontSize: 20 }}>
        Settings
      </Text>
    </ScreenContainer>
  );
}
