import React, { useState } from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  hasTVPreferredFocus?: boolean;
  style?: StyleProp<ViewStyle>;
  focusedStyle?: StyleProp<ViewStyle>;
  nextFocusUp?: number;
  nextFocusDown?: number;
  nextFocusLeft?: number;
  nextFocusRight?: number;
};

export function Focusable({
  children,
  onPress,
  hasTVPreferredFocus,
  style,
  focusedStyle,
  nextFocusUp,
  nextFocusDown,
  nextFocusLeft,
  nextFocusRight,
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      hasTVPreferredFocus={hasTVPreferredFocus}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      nextFocusUp={nextFocusUp}
      nextFocusDown={nextFocusDown}
      nextFocusLeft={nextFocusLeft}
      nextFocusRight={nextFocusRight}
      style={[
        styles.base,
        style,
        focused && styles.focused,
        focused && focusedStyle,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 8,
  },
  focused: {
    borderColor: colors.accent,
    backgroundColor: colors.panelFocused,
  },
});
