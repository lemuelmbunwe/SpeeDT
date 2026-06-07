import { View, type ViewProps } from 'react-native';

type ScreenContainerProps = ViewProps & {
  className?: string;
};

export function ScreenContainer({ children, className, style, ...props }: ScreenContainerProps) {
  return (
    <View
      className={`flex-1 bg-white ${className ?? ''}`}
      style={[{ flex: 1, backgroundColor: '#ffffff' }, style]}
      {...props}>
      {children}
    </View>
  );
}
