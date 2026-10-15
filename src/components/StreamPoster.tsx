import { useState } from 'react';
import {
  Image,
  LayoutChangeEvent,
  StyleSheet,
  View,
} from 'react-native';
import { streamMenuItems } from '../config/launcherConfig';
import { streamPosters } from '../theme/streamPosters';

export function StreamPoster({ menuItemId }: { menuItemId: string | null }) {
  const source = menuItemId == null ? null : streamPosters[menuItemId] ?? null;
  const title = streamMenuItems.find(item => item.id === menuItemId)?.title;
  const [slot, setSlot] = useState({ width: 0, height: 0 });
  const side =
    slot.width > 0 && slot.height > 0 ? Math.min(slot.width, slot.height) : 0;

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    const next = {
      width: Math.round(width),
      height: Math.round(height),
    };
    setSlot(current =>
      current.width === next.width && current.height === next.height
        ? current
        : next,
    );
  };

  return (
    <View
      pointerEvents="none"
      focusable={false}
      style={styles.slot}
      onLayout={onLayout}
      testID="stream-poster-slot"
    >
      {source != null && side > 0 ? (
        <View
          pointerEvents="none"
          focusable={false}
          style={[styles.frame, { width: side, height: side }]}
        >
          <Image
            source={source}
            accessibilityLabel={title == null ? 'Stream poster' : `${title} poster`}
            resizeMode="contain"
            fadeDuration={0}
            style={styles.image}
            testID="stream-poster"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  frame: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
