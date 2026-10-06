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
  main: {
    flex: 1,
  },
  discover: {
    flex: 1,
    flexDirection: 'row',
  },
});
