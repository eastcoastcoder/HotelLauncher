import { useEffect, useRef } from 'react';
import React from 'react';
import {
  Animated,
  Easing,
  findNodeHandle,
  StyleSheet,
  View,
  useTVEventHandler,
} from 'react-native';
import { Focusable } from '../components/Focusable';
import { useNavReturn } from '../navigation/NavReturn';
import { useShellSlide } from '../navigation/ShellSlide';
import { GuideGrid } from './GuideGrid';

type Props = {
  testID?: string;
  onFullscreenChange: (fullscreen: boolean) => void;
  onCloseHandlerChange: (close: (() => void) | null) => void;
};

const SLIDE_MS = 360;
const NAVIGATION_OFFSET = 228;

export function WatchTV({
  testID,
  onFullscreenChange,
  onCloseHandlerChange,
}: Props) {
  const entryRef = useRef<View>(null);
  const nav = useNavReturn();
  const shell = useShellSlide();
  const navRef = useRef(nav);
  navRef.current = nav;
  const shellRef = useRef(shell);
  shellRef.current = shell;
  const onFullscreenChangeRef = useRef(onFullscreenChange);
  onFullscreenChangeRef.current = onFullscreenChange;
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const guideX = useRef(new Animated.Value(NAVIGATION_OFFSET)).current;

  const [armed, setArmed] = React.useState(true);
  const [interactive, setInteractive] = React.useState(false);
  const interactiveRef = useRef(interactive);
  interactiveRef.current = interactive;

  // Track if animation has completed (to prevent multiple triggers)
  const animationFinishedRef = useRef(true);
  const closeGuideRef = useRef(() => {});

  useEffect(() => {
    onCloseHandlerChange(() => {
      if (interactiveRef.current) {
        closeGuideRef.current();
      } else {
        navRef.current?.focusMain('WatchTV');
      }
    });
    return () => onCloseHandlerChange(null);
  }, [onCloseHandlerChange]);

  const publishEntry = () => {
    const node = entryRef.current;
    nav?.setEntry('WatchTV', node == null ? null : findNodeHandle(node));
    nav?.registerEntryNode('WatchTV', node);
  };

  // Cleanup on unmount and when shell changes
  useEffect(() => {
    return () => {
      navRef.current?.setEntry('WatchTV', null);
      navRef.current?.registerEntryNode('WatchTV', null);
      shellRef.current?.navigationX.setValue(0);
      onFullscreenChangeRef.current(false);
      if (armTimer.current != null) {
        clearTimeout(armTimer.current);
      }
    };
  }, []);

  useTVEventHandler(event => {
    if (event.eventType === 'right') {
      if (interactiveRef.current) {
        return;
      }
      openGuide();
    }
    if (
      interactiveRef.current &&
      (event.eventType === 'left' || event.eventType === 'back')
    ) {
      closeGuide();
    }
  });

  const openGuide = () => {
    if (shell == null || !animationFinishedRef.current) {
      return;
    }
    animationFinishedRef.current = false;
    setInteractive(false);
    onFullscreenChange(true);
    const easing = Easing.out(Easing.cubic);
    const slideNavigation = Animated.timing(shell.navigationX, {
      toValue: -NAVIGATION_OFFSET,
      duration: SLIDE_MS,
      easing,
      useNativeDriver: true,
    });
    const slideGuide = Animated.timing(guideX, {
      toValue: 0,
      duration: SLIDE_MS,
      easing,
      useNativeDriver: true,
    });

    Animated.parallel([slideNavigation, slideGuide]).start(({ finished }) => {
      if (finished) {
        animationFinishedRef.current = true;
        setInteractive(true);
      }
    });
  };

  const closeGuide = () => {
    if (
      shell == null ||
      !animationFinishedRef.current ||
      !interactive
    ) {
      return;
    }
    animationFinishedRef.current = false;
    setInteractive(false);
    setArmed(false);
    if (armTimer.current != null) {
      clearTimeout(armTimer.current);
    }
    const easing = Easing.out(Easing.cubic);
    const slideNavigation = Animated.timing(shell.navigationX, {
      toValue: 0,
      duration: SLIDE_MS,
      easing,
      useNativeDriver: true,
    });
    const slideGuide = Animated.timing(guideX, {
      toValue: NAVIGATION_OFFSET,
      duration: SLIDE_MS,
      easing,
      useNativeDriver: true,
    });
    Animated.parallel([slideNavigation, slideGuide]).start(({ finished }) => {
      if (finished) {
        animationFinishedRef.current = true;
        onFullscreenChange(false);
        armTimer.current = setTimeout(() => {
          armTimer.current = null;
          setArmed(true);
        }, 450);
        requestAnimationFrame(() => {
          nav?.focusMain('WatchTV');
        });
      }
    });
  };

  closeGuideRef.current = closeGuide;

  return (
    <View
      style={[
        styles.root,
        {
          width: shell?.getWidth() ?? '100%',
          marginLeft: -NAVIGATION_OFFSET,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          { transform: [{ translateX: guideX }] },
        ]}
      >
        <GuideGrid
          interactive={interactive}
          testID={
            testID ??
            (interactive ? 'watch-tv-grid' : 'watch-tv-preview-grid')
          }
          onClose={closeGuide}
        />
        {!interactive && armed ? (
          <Focusable
            ref={entryRef}
            testID={testID ?? 'watch-tv-entry'}
            onLayout={publishEntry}
            onFocusChange={openGuide}
            style={styles.entry}
            focusedStyle={styles.entryFocused}
          >
            <View />
          </Focusable>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
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
