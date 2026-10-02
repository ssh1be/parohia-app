import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { entrance } from '../../constants/theme';

interface RevealProps {
  children: ReactNode;
  /** Position in a staggered sequence; each step adds 60ms. */
  index?: number;
  style?: StyleProp<ViewStyle>;
}

export function Reveal({ children, index = 0, style }: RevealProps) {
  return (
    <Animated.View entering={entrance.card(Math.min(index, 8) * 60)} style={style}>
      {children}
    </Animated.View>
  );
}
