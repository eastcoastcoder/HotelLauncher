import React, { useEffect, useState } from 'react';
import { Image, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { launcherConfig } from '../config/launcherConfig';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';

const SOURCE_WIDTH = 2169;
const SOURCE_HEIGHT = 725;
// The file is a near-black matte around the lockup. Cropping to the artwork
// keeps DOGE BONK and CHEEMSYARD large enough to read in the header.
const ART = { x: 8, y: 150, width: 2082, height: 438 };
const LOGO_HEIGHT = 72;

function formatClock(date: Date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function Header() {
  const [now, setNow] = useState(() => new Date());
  const [brandWidth, setBrandWidth] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { weather } = launcherConfig;
  const logo = launcherConfig.logo;
  const resolved = Image.resolveAssetSource(logo);
  const sourceWidth =
    resolved != null && resolved.width > 0 ? resolved.width : SOURCE_WIDTH;
  const sourceHeight =
    resolved != null && resolved.height > 0 ? resolved.height : SOURCE_HEIGHT;
  const naturalWidth = LOGO_HEIGHT * (ART.width / ART.height);
  const frameWidth = Math.round(
    brandWidth > 0 ? Math.min(naturalWidth, brandWidth) : 0,
  );
  const frameHeight =
    frameWidth > 0 ? frameWidth * (ART.height / ART.width) : 0;
  // Android Image injects the asset's own width and height. An aspectRatio on
  // the image then rebuilds the width from that height and runs off the header,
  // so the frame sets both sides and the image is shifted inside it.
  const imageWidth = frameWidth * (sourceWidth / ART.width);
  const imageHeight = frameHeight * (sourceHeight / ART.height);

  const onBrandLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    setBrandWidth(current => (current === next ? current : next));
  };

  return (
    <View style={styles.row}>
      <View style={styles.brand} onLayout={onBrandLayout}>
        <View
          style={[styles.logoFrame, { width: frameWidth, height: frameHeight }]}
        >
          <Image
            source={logo}
            accessibilityLabel="DogeBonk and CheemsYard"
            resizeMode="cover"
            style={[
              styles.logo,
              {
                width: imageWidth,
                height: imageHeight,
                left: -imageWidth * (ART.x / sourceWidth),
                top: -imageHeight * (ART.y / sourceHeight),
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.welcome}>
        <Text style={styles.kicker}>{launcherConfig.welcomeKicker}</Text>
        <Text style={styles.welcomeText}>{launcherConfig.welcomeMessage}</Text>
      </View>

      <View style={styles.meta}>
        <Text style={styles.metaText}>
          {weather.summary} {weather.fahrenheit}°F / {weather.celsius}°C
        </Text>
        <Text style={styles.clock}>{formatClock(now)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 88,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  brand: {
    flex: 1,
    justifyContent: 'center',
  },
  logoFrame: {
    overflow: 'hidden',
  },
  logo: {
    position: 'absolute',
  },
  welcome: {
    flex: 1,
    alignItems: 'center',
  },
  kicker: {
    ...type.welcomeKicker,
    color: colors.textPrimary,
  },
  welcomeText: {
    ...type.welcome,
    color: colors.textPrimary,
    marginTop: 2,
  },
  meta: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 18,
  },
  metaText: {
    ...type.meta,
    color: colors.textSecondary,
  },
  clock: {
    ...type.meta,
    color: colors.textPrimary,
    minWidth: 88,
    textAlign: 'right',
  },
});
