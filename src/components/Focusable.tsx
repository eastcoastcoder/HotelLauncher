import { forwardRef, useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  onPressOut?: () => void;
  onLongPress?: () => void;
  delayLongPress?: number;
  hasTVPreferredFocus?: boolean;
  focusable?: boolean;
  style?: StyleProp<ViewStyle>;
  focusedStyle?: StyleProp<ViewStyle>;
  onFocusChange?: (focused: boolean) => void;
  testID?: string;
  nextFocusUp?: number;
  nextFocusDown?: number;
  nextFocusLeft?: number;
  nextFocusRight?: number;
  onLayout?: () => void;
};

export const Focusable = forwardRef<View, Props>(function FocusableControl(
  {
    children,
    onPress,
    onPressOut,
    onLongPress,
    delayLongPress,
    hasTVPreferredFocus,
    focusable = true,
    style,
    focusedStyle,
    onFocusChange,
    testID,
    nextFocusUp,
    nextFocusDown,
    nextFocusLeft,
    nextFocusRight,
    onLayout,
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
      onPressOut={onPressOut}
      // A focusable Android TV view already clicks through its OnClickListener,
      // and that plays a system click. Pressable would play a second one.
      android_disableSound={focusable ? true : undefined}
      onLongPress={onLongPress}
      delayLongPress={delayLongPress}
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
      onLayout={onLayout}
      testID={testID}
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
