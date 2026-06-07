import type { ReactNode } from 'react';
import { Text, View, type ViewProps } from 'react-native';

type OnboardingFeatureBlockProps = ViewProps & {
  icon: ReactNode;
  iconClassName?: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function OnboardingFeatureBlock({
  icon,
  iconClassName,
  title,
  subtitle,
  children,
  className,
  ...props
}: OnboardingFeatureBlockProps) {
  return (
    <View className={`mb-6 ${className ?? ''}`} {...props}>
      <View className="mb-3 flex-row items-center">
        <View
          className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${iconClassName ?? 'bg-brand-navy'}`}>
          {icon}
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-brand-navy">{title}</Text>
          <Text className="text-xs text-brand-subtle">{subtitle}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}
