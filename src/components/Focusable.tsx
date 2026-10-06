import React, { useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  hasTVPreferredFocus?: boolean;
  focusable?: boolean;
  style?: StyleProp<ViewStyle>;
  focusedStyle?: StyleProp<ViewStyle>;
  onFocusChange?: (focused: boolean) => void;
  nextFocusUp?: number;
  nextFocusDown?: number;
  nextFocusLeft?: number;
  nextFocusRight?: number;
};

export const Focusable = React.forwardRef<View, Props>(function FocusableControl(
  {
    children,
    onPress,
    hasTVPreferredFocus,
    focusable = true,
    style,
    focusedStyle,
    onFocusChange,
    nextFocusUp,
    nextFocusDown,
    nextFocusLeft,
    nextFocusRight,
  },
  ref,
) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      ref={ref}
      focusable={focusable}
      hasTVPreferredFocus={hasTVPreferredFocus}
      onPress={onPress}
      onFocus={() => {
        setFocused(true);
        onFocusChange?.(true);
      }}
      onBlur={() => {
        setFocused(false);
        onFocusChange?.(false);
      }}
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
});

Focusable.displayName = 'Focusable';

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
