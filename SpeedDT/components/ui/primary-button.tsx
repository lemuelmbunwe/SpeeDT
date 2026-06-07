import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, type PressableProps } from 'react-native';

type PrimaryButtonProps = PressableProps & {
  label: string;
  showArrow?: boolean;
  className?: string;
};

export function PrimaryButton({ label, showArrow = false, className, ...props }: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className={`flex-row items-center justify-center rounded-full bg-brand-navy py-4 active:opacity-90 ${className ?? ''}`}
      {...props}>
      <Text className="text-base font-semibold text-white">{label}</Text>
      {showArrow ? <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 8 }} /> : null}
    </Pressable>
  );
}
