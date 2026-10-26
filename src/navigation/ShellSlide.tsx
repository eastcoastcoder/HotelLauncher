import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { Animated, StyleSheet, View } from 'react-native';

type ShellSlideValue = {
  navigationX: Animated.Value;
  getWidth: () => number;
};

const ShellSlideContext = createContext<ShellSlideValue | null>(null);

/**
 * Shares the navigation animation and viewport dimensions with Watch TV.
 */
export function ShellSlideProvider({
  width,
  children,
}: {
  width: number;
  children: ReactNode;
}) {
  const navigationX = useRef(new Animated.Value(0)).current;
  const widthRef = useRef(width);
  widthRef.current = width;
  const api = useMemo<ShellSlideValue>(
    () => ({
      navigationX,
      getWidth: () => widthRef.current,
    }),
    [navigationX],
  );

  return (
    <ShellSlideContext.Provider value={api}>
      <View style={styles.host}>
        {children}
      </View>
    </ShellSlideContext.Provider>
  );
}

export function useShellSlide() {
  return useContext(ShellSlideContext);
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
    overflow: 'hidden',
  },
});
