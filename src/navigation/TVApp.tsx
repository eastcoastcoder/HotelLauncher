import React, { useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { Header } from '../components/Header';
import { LaunchNotice } from '../components/LaunchNotice';
import { Navigation } from '../components/Navigation';
import { PromoBanner } from '../components/PromoBanner';
import { ScreenBackground } from '../components/ScreenBackground';
import { ScreenBody } from '../components/ScreenBody';
import { menuItems } from '../config/launcherConfig';
import { useScreenBackground } from '../context/BackgroundContext';
import { colors } from '../theme/colors';
import { defaultScreenGradient } from '../theme/screenBackground';
import { ScreenId } from '../types';

export function TVApp() {
  const [screen, setScreen] = useState<ScreenId>('Discover');
  const [videoFullscreen, setVideoFullscreen] = useState(false);
  const showChrome = !videoFullscreen;
  const screenBackground = useScreenBackground();

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
    <View style={screenBackground ? styles.rootPlain : styles.root}>
      {screenBackground ? (
        <ScreenBackground background={screenBackground} />
      ) : null}
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
              if (next == null) {
                return;
              }
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
          {showChrome ? <LaunchNotice /> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    experimental_backgroundImage: defaultScreenGradient,
  },
  rootPlain: {
    flex: 1,
    backgroundColor: colors.background,
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
