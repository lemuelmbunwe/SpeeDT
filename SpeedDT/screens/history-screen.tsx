import { Text } from 'react-native';

import { ScreenContainer } from '@/components/screen-container';

export function HistoryScreen() {
  return (
    <ScreenContainer className="items-center justify-center">
      <Text className="text-xl text-gray-900" style={{ color: '#11181C', fontSize: 20 }}>
        History
      </Text>
    </ScreenContainer>
  );
}
