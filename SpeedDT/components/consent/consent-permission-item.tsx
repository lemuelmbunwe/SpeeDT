import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type ConsentPermissionItemProps = {
  icon: ReactNode;
  label: string;
  isLast?: boolean;
};

export function ConsentPermissionItem({ icon, label, isLast = false }: ConsentPermissionItemProps) {
  return (
    <View
      className={`flex-row items-center py-3.5 ${isLast ? '' : 'border-b border-white/70'}`}>
      <View
        className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-white"
        style={{
          shadowColor: '#1A2E4A',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 3,
          elevation: 2,
        }}>
        {icon}
      </View>
      <Text className="flex-1 text-sm font-semibold leading-5 text-brand-navy">{label}</Text>
    </View>
  );
}
