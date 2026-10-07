import React, { useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { Header } from '../components/Header';
import { PromoBanner } from '../components/PromoBanner';
import { ScreenBody } from '../components/ScreenBody';
import { Navigation } from '../components/Navigation';
import { colors } from '../theme/colors';
import { ScreenId } from '../types';
import { menuItems } from '../config/launcherConfig';

export function TVApp() {
  const [screen, setScreen] = useState<ScreenId>('Discover');
  const [videoFullscreen, setVideoFullscreen] = useState(false);
  const showChrome = !videoFullscreen;

  React.useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (videoFullscreen) {
          setVideoFullscreen(false);
          return true;
        }
        if (screen !== 'Discover') {
          setScreen('Discover');
          return true;
        }
        return false;
      },
    );
    return () => subscription.remove();
  }, [screen, videoFullscreen]);

  return (
    <View style={styles.root}>
      <View style={showChrome ? undefined : styles.hidden}>
        <Header />
      </View>
      <View style={[styles.body, showChrome ? undefined : styles.bodyFull]}>
        <View style={showChrome ? undefined : styles.hidden}>
          <Navigation
            active={screen}
            enabled={showChrome}
            menuItems={menuItems}
            onSelect={next => {
              setVideoFullscreen(false);
              setScreen(next);
            }}
          />
        </View>
        <View style={styles.main}>
          <ScreenBody
            screen={screen}
            videoFullscreen={videoFullscreen}
            setVideoFullscreen={setVideoFullscreen}
            showChrome={showChrome}
          />
          <View style={showChrome ? undefined : styles.hidden}>
            <PromoBanner />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    // Hard black through the top three quarters, then the wash from Gradient.jpg
    // through to hard white at the bottom edge.
    experimental_backgroundImage: [
      {
        type: 'linear-gradient',
        direction: 'to bottom',
        colorStops: [
          { color: '#000000', positions: ['0%'] },
          { color: '#000000', positions: ['75%'] },
          { color: '#0F182D', positions: ['79%'] },
          { color: '#293A68', positions: ['82%'] },
          { color: '#38569E', positions: ['85%'] },
          { color: '#4A6BAF', positions: ['88%'] },
          { color: '#6E8ABF', positions: ['91%'] },
          { color: '#A9B7D6', positions: ['94%'] },
          { color: '#E4E8F2', positions: ['97%'] },
          { color: '#FFFFFF', positions: ['100%'] },
        ],
      },
    ],
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 28,
    paddingBottom: 24,
  },
  bodyFull: {
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  hidden: {
    display: 'none',
  },
  main: {
    flex: 1,
  },
});
