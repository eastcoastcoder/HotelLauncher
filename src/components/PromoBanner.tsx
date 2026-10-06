import React, { useState } from 'react';
import {
  Image,
  LayoutChangeEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { launcherConfig } from '../config/launcherConfig';

const FALLBACK_ASPECT_RATIO = 2172 / 287;
const SCREEN_WIDTH_FRACTION = 0.6;

export function PromoBanner() {
  const { width: screenWidth } = useWindowDimensions();
  const [rowWidth, setRowWidth] = useState(0);
  const source = launcherConfig.promoBanner.image;
  const resolved = Image.resolveAssetSource(source);
  const aspectRatio =
    resolved != null && resolved.width > 0 && resolved.height > 0
      ? resolved.width / resolved.height
      : FALLBACK_ASPECT_RATIO;
  // Sixty percent of the screen, but never wider than the content column.
  // Android Image injects the asset's own width and height. An aspectRatio on
  // the image then rebuilds the width from that height and runs off the screen,
  // so the frame sets both sides explicitly and the image fills the frame.
  const targetWidth = Math.round(screenWidth * SCREEN_WIDTH_FRACTION);
  const bannerWidth =
    rowWidth > 0 ? Math.min(targetWidth, rowWidth) : targetWidth;
  const bannerHeight = Math.max(1, Math.round(bannerWidth / aspectRatio));

  const onRowLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    setRowWidth(current => (current === next ? current : next));
  };

  return (
    <View style={styles.row} onLayout={onRowLayout}>
      <View
        style={[styles.frame, { width: bannerWidth, height: bannerHeight }]}
      >
        <Image
          source={source}
          accessibilityLabel="Promotional banner"
          resizeMode="contain"
          style={styles.image}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: 16,
    alignItems: 'flex-end',
  },
  frame: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
