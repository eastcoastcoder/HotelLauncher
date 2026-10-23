import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, StyleSheet, View } from 'react-native';

type ShellSlideValue = {
  shellX: Animated.Value;
  getWidth: () => number;
  setCover: (node: ReactNode) => void;
};

const ShellSlideContext = createContext<ShellSlideValue | null>(null);

/**
 * Slides the launcher body (navigation and the open screen) as one piece.
 * The header stays above this host. `setCover` paints the incoming screen
 * above the body, outside the transform.
 */
export function ShellSlideProvider({
  width,
  children,
}: {
  width: number;
  children: ReactNode;
}) {
  const shellX = useRef(new Animated.Value(0)).current;
  const [cover, setCover] = useState<ReactNode>(null);
  const widthRef = useRef(width);
  widthRef.current = width;
  const api = useMemo<ShellSlideValue>(
    () => ({
      shellX,
      getWidth: () => widthRef.current,
      setCover,
    }),
    [shellX],
  );

  return (
    <ShellSlideContext.Provider value={api}>
      <View style={styles.host}>
        <Animated.View
          style={[styles.shell, { transform: [{ translateX: shellX }] }]}
        >
          {children}
        </Animated.View>
        {cover}
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
  shell: {
    flex: 1,
  },
});
