import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { ShellSlideProvider } from './ShellSlide';
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
import { NavReturnProvider } from './NavReturn';
import { useShellSlide } from './ShellSlide';
import { ScreenId } from '../types';

export function TVApp() {
  const [screen, setScreen] = useState<ScreenId>('Discover');
  const [videoFullscreen, setVideoFullscreen] = useState(false);
  const [watchGuideFullscreen, setWatchGuideFullscreen] = useState(false);
  const watchGuideCloseRef = useRef<(() => void) | null>(null);
  const registerWatchGuideClose = useCallback((close: (() => void) | null) => {
    watchGuideCloseRef.current = close;
  }, []);
  const showChrome = !videoFullscreen;
  const showHeader = showChrome || screen === 'WatchTV';
  const screenBackground = useScreenBackground();
  const { width: windowWidth } = useWindowDimensions();

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (videoFullscreen) {
          setVideoFullscreen(false);
          return true;
        }
        if (screen === 'WatchTV') {
          watchGuideCloseRef.current?.();
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
  }, [screen, videoFullscreen, watchGuideFullscreen]);

  return (
    <View style={screenBackground ? styles.rootPlain : styles.root}>
      {screenBackground ? (
        <ScreenBackground background={screenBackground} />
      ) : null}
      {showHeader ? <Header /> : null}
      <ShellSlideProvider width={windowWidth}>
        <TVBody
          screen={screen}
          setScreen={setScreen}
          videoFullscreen={videoFullscreen}
          setVideoFullscreen={setVideoFullscreen}
          watchGuideFullscreen={watchGuideFullscreen}
          setWatchGuideFullscreen={setWatchGuideFullscreen}
          registerWatchGuideClose={registerWatchGuideClose}
          onWatchTVNavigationFocus={() => watchGuideCloseRef.current?.()}
          showChrome={showChrome}
        />
      </ShellSlideProvider>
    </View>
  );
}

type TVBodyProps = {
  screen: ScreenId;
  setScreen: (screen: ScreenId) => void;
  videoFullscreen: boolean;
  setVideoFullscreen: (fullscreen: boolean) => void;
  watchGuideFullscreen: boolean;
  setWatchGuideFullscreen: (fullscreen: boolean) => void;
  registerWatchGuideClose: (close: (() => void) | null) => void;
  onWatchTVNavigationFocus: () => void;
  showChrome: boolean;
};

function TVBody({
  screen,
  setScreen,
  videoFullscreen,
  setVideoFullscreen,
  watchGuideFullscreen,
  setWatchGuideFullscreen,
  registerWatchGuideClose,
  onWatchTVNavigationFocus,
  showChrome,
}: TVBodyProps) {
  const shell = useShellSlide();
  const watchGuideOpen = screen === 'WatchTV' && watchGuideFullscreen;

  useEffect(() => {
    if (screen !== 'WatchTV') {
      shell?.navigationX.setValue(0);
      setWatchGuideFullscreen(false);
    }
  }, [screen, setWatchGuideFullscreen, shell]);

  return (
    <View style={styles.body}>
      <NavReturnProvider>
        <Animated.View
          style={[
            styles.navigation,
            { transform: [{ translateX: shell?.navigationX ?? 0 }] },
            showChrome ? undefined : styles.hidden,
          ]}
        >
          <Navigation
            active={screen}
            enabled={showChrome && !watchGuideOpen}
            menuItems={menuItems}
            onItemFocus={item => {
              if (item.screen === 'WatchTV' && watchGuideOpen) {
                onWatchTVNavigationFocus();
              }
              if (item.screen != null) {
                setVideoFullscreen(false);
                setScreen(item.screen);
              }
            }}
            onSelect={next => {
              if (next == null) {
                return;
              }
              setVideoFullscreen(false);
              setScreen(next);
            }}
          />
        </Animated.View>
        <View
          style={[
            styles.main,
            watchGuideOpen ? styles.watchGuideMain : undefined,
          ]}
        >
          <ScreenBody
            screen={screen}
            videoFullscreen={videoFullscreen}
            setVideoFullscreen={setVideoFullscreen}
            showChrome={showChrome}
            onWatchTVFullscreenChange={setWatchGuideFullscreen}
            onWatchTVCloseHandlerChange={registerWatchGuideClose}
          />
          <View
            style={
              !showChrome || screen !== 'Discover'
                ? styles.hidden
                : undefined
            }
          >
            <PromoBanner />
          </View>
          {showChrome && !watchGuideOpen ? <LaunchNotice /> : null}
        </View>
      </NavReturnProvider>
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
    paddingBottom: 24,
  },
  navigation: {
    position: 'absolute',
    left: 28,
    top: 0,
    zIndex: 2,
  },
  hidden: {
    display: 'none',
  },
  main: {
    flex: 1,
    marginLeft: 228,
    marginRight: 28,
    zIndex: 1,
  },
  watchGuideMain: {
    zIndex: 0,
  },
});
