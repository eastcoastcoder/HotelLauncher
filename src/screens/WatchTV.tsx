import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  findNodeHandle,
  StyleSheet,
  View,
} from 'react-native';
import { Focusable } from '../components/Focusable';
import { useNavReturn } from '../navigation/NavReturn';
import { useShellSlide } from '../navigation/ShellSlide';
import { GuideGrid } from './GuideGrid';

type Props = {
  fullscreen: boolean;
  onEnterFullscreen: () => void;
  onExitFullscreen: () => void;
};

type Phase = 'preview' | 'opening' | 'guide';

const SLIDE_MS = 360;

export function WatchTV({
  fullscreen,
  onEnterFullscreen,
  onExitFullscreen,
}: Props) {
  const [phase, setPhase] = useState<Phase>('preview');
  const [armed, setArmed] = useState(true);
  const phaseRef = useRef<Phase>('preview');
  const openingRef = useRef(false);
  const pushedRef = useRef(false);
  const entryRef = useRef<View>(null);
  const previewX = useRef(new Animated.Value(0)).current;
  const previewOpacity = useRef(new Animated.Value(1)).current;
  const gridX = useRef(new Animated.Value(72)).current;
  const gridOpacity = useRef(new Animated.Value(0)).current;
  const nav = useNavReturn();
  const navRef = useRef(nav);
  navRef.current = nav;
  const shell = useShellSlide();
  const shellRef = useRef(shell);
  shellRef.current = shell;
  const enterRef = useRef(onEnterFullscreen);
  enterRef.current = onEnterFullscreen;
  const exitRef = useRef(onExitFullscreen);
  exitRef.current = onExitFullscreen;
  const fullscreenRef = useRef(fullscreen);
  fullscreenRef.current = fullscreen;
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeRef = useRef(() => {});
  closeRef.current = () => {
    if (fullscreenRef.current) {
      exitRef.current();
      return;
    }
    openingRef.current = false;
    shellRef.current?.shellX.setValue(0);
    shellRef.current?.setCover(null);
    pushedRef.current = false;
    previewX.setValue(0);
    previewOpacity.setValue(1);
    if (phaseRef.current === 'preview') {
      return;
    }
    phaseRef.current = 'preview';
    setPhase('preview');
    setArmed(false);
    if (armTimer.current != null) {
      clearTimeout(armTimer.current);
    }
    armTimer.current = setTimeout(() => {
      armTimer.current = null;
      setArmed(true);
    }, 450);
    requestAnimationFrame(() => {
      navRef.current?.focusMain('WatchTV');
    });
  };

  const publishEntry = () => {
    const node = entryRef.current;
    navRef.current?.setEntry(
      'WatchTV',
      node == null ? null : findNodeHandle(node),
    );
  };

  useEffect(() => {
    return () => {
      navRef.current?.setEntry('WatchTV', null);
      shellRef.current?.shellX.setValue(0);
      shellRef.current?.setCover(null);
      if (armTimer.current != null) {
        clearTimeout(armTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (phase !== 'opening') {
      return;
    }
    const shellSlide = shellRef.current;
    const width = shellSlide?.getWidth() ?? 0;
    const easing = Easing.out(Easing.cubic);
    let ended = false;

    const finish = () => {
      ended = true;
      if (openingRef.current === false) {
        return;
      }
      openingRef.current = false;
      if (pushedRef.current && shellSlide != null) {
        shellSlide.shellX.setValue(0);
      }
      enterRef.current();
      setPhase('guide');
      phaseRef.current = 'guide';
    };

    if (shellSlide != null && width > 0) {
      pushedRef.current = true;
      previewX.setValue(0);
      previewOpacity.setValue(1);
      shellSlide.shellX.setValue(0);
      gridX.setValue(width);
      shellSlide.setCover(
        <Animated.View
          style={[styles.cover, { transform: [{ translateX: gridX }] }]}
        >
          <GuideGrid onClose={() => closeRef.current()} />
        </Animated.View>,
      );
      const shellMove = Animated.timing(shellSlide.shellX, {
        toValue: -width,
        duration: SLIDE_MS,
        easing,
        useNativeDriver: true,
      });
      const guideMove = Animated.timing(gridX, {
        toValue: 0,
        duration: SLIDE_MS,
        easing,
        useNativeDriver: true,
      });
      let pending = 2;
      const step = ({ finished }: { finished: boolean }) => {
        if (!finished) {
          pending = 0;
          ended = true;
          return;
        }
        pending -= 1;
        if (pending === 0) {
          finish();
        }
      };
      shellMove.start(step);
      guideMove.start(step);
      return () => {
        if (!ended) {
          shellMove.stop();
          guideMove.stop();
        }
      };
    }

    pushedRef.current = false;
    previewX.setValue(0);
    previewOpacity.setValue(1);
    const animation = Animated.parallel([
      Animated.timing(previewX, {
        toValue: -240,
        duration: SLIDE_MS,
        easing,
        useNativeDriver: true,
      }),
      Animated.timing(previewOpacity, {
        toValue: 0,
        duration: SLIDE_MS,
        easing,
        useNativeDriver: true,
      }),
    ]);
    animation.start(({ finished }) => {
      if (!finished) {
        ended = true;
        return;
      }
      finish();
    });
    return () => {
      if (!ended) {
        animation.stop();
      }
    };
  }, [gridX, phase, previewOpacity, previewX]);

  useEffect(() => {
    if (phase !== 'guide' || pushedRef.current) {
      return;
    }
    navRef.current?.setEntry('WatchTV', null);
    gridX.setValue(72);
    gridOpacity.setValue(0);
    const animation = Animated.parallel([
      Animated.timing(gridX, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(gridOpacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    let ended = false;
    animation.start(() => {
      ended = true;
    });
    return () => {
      if (!ended) {
        animation.stop();
      }
    };
  }, [gridOpacity, gridX, phase]);

  useEffect(() => {
    if (fullscreen || phaseRef.current === 'preview') {
      return;
    }
    shellRef.current?.shellX.setValue(0);
    shellRef.current?.setCover(null);
    pushedRef.current = false;
    previewX.setValue(0);
    previewOpacity.setValue(1);
    openingRef.current = false;
    phaseRef.current = 'preview';
    setPhase('preview');
    setArmed(false);
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        navRef.current?.focusMain('WatchTV');
      });
    });
    if (armTimer.current != null) {
      clearTimeout(armTimer.current);
    }
    armTimer.current = setTimeout(() => {
      armTimer.current = null;
      setArmed(true);
    }, 450);
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
      if (armTimer.current != null) {
        clearTimeout(armTimer.current);
        armTimer.current = null;
      }
    };
  }, [fullscreen, previewOpacity, previewX]);

  const onEntryFocus = (focused: boolean) => {
    if (
      !focused ||
      !armed ||
      phaseRef.current !== 'preview' ||
      openingRef.current
    ) {
      return;
    }
    openingRef.current = true;
    phaseRef.current = 'opening';
    setPhase('opening');
  };

  const showIncoming = phase === 'guide' && !pushedRef.current;

  return (
    <View style={[styles.root, fullscreen ? styles.guideRoot : styles.bleed]}>
      {showIncoming ? (
        <Animated.View
          style={[
            styles.fill,
            { opacity: gridOpacity, transform: [{ translateX: gridX }] },
          ]}
        >
          <GuideGrid onClose={() => closeRef.current()} />
        </Animated.View>
      ) : phase === 'guide' ? null : (
        <Animated.View
          testID="watch-tv-preview"
          style={[
            styles.fill,
            {
              opacity: previewOpacity,
              transform: [{ translateX: previewX }],
            },
          ]}
        >
          <GuideGrid interactive={false} testID="watch-tv-preview-grid" />
          <Focusable
            ref={entryRef}
            testID="watch-tv-entry"
            focusable={armed}
            onLayout={publishEntry}
            onFocusChange={onEntryFocus}
            style={styles.entry}
            focusedStyle={styles.entryFocused}
          >
            <View />
          </Focusable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  bleed: {
    marginRight: -28,
    marginBottom: -24,
  },
  guideRoot: {
    backgroundColor: '#000000',
  },
  fill: {
    flex: 1,
  },
  cover: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
  },
  entry: {
    ...StyleSheet.absoluteFill,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  entryFocused: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
});
