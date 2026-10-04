import React, { useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { Header } from '../components/Header';
import { MainStage } from '../components/MainStage';
import { NowPlayingPanel } from '../components/NowPlayingPanel';
import { PromoBanner } from '../components/PromoBanner';
import { ScreenBody } from '../components/ScreenBody';
import { SideNavigation } from '../components/SideNavigation';
import { colors } from '../theme/colors';
import { ScreenId } from '../types';

export function TVApp() {
  const [screen, setScreen] = useState<ScreenId>('Discover');

  React.useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (screen !== 'Discover') {
          setScreen('Discover');
          return true;
        }
        return false;
      },
    );
    return () => subscription.remove();
  }, [screen]);

  return (
    <View style={styles.root}>
      <Header />
      <View style={styles.body}>
        <SideNavigation active={screen} onSelect={setScreen} />
        <View style={styles.main}>
          {screen === 'Discover' ? (
            <View style={styles.discover}>
              <MainStage />
              <NowPlayingPanel />
            </View>
          ) : (
            <ScreenBody screen={screen} />
          )}
          <PromoBanner />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 28,
    paddingBottom: 24,
  },
  main: {
    flex: 1,
  },
  discover: {
    flex: 1,
    flexDirection: 'row',
  },
});
