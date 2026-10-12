import React from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { MenuBackground } from '../theme/screenBackground';

export function ScreenBackground({ background }: { background: MenuBackground }) {
  const { width, height } = useWindowDimensions();

  return (
    <View
      pointerEvents="none"
      focusable={false}
      style={[styles.frame, { width, height }]}
    >
      <Image
        source={background.image}
        resizeMode="contain"
        fadeDuration={0}
        style={styles.image}
      />
      <View
        pointerEvents="none"
        focusable={false}
        style={[
          styles.scrim,
          { experimental_backgroundImage: background.overlay },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
