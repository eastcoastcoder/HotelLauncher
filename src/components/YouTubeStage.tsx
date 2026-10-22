import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { isYouTubeVideoId } from '../config/mainStageMedia';
import { colors } from '../theme/colors';
import {
  buildYouTubeStageHtml,
  isStageRequestAllowed,
  STAGE_EMBED_ORIGIN,
} from './youtubeStageHtml';
import { advancePlaylist, shuffleIds } from './youtubeStagePlaylist';

interface YouTubeStageProps {
  videoIds: readonly string[];
  /** When false, play the given order and loop it without reshuffling. */
  shuffle: boolean;
  muted: boolean;
  onPlaying: () => void;
  onFatal: () => void;
}

export function YouTubeStage({
  videoIds,
  shuffle,
  muted,
  onPlaying,
  onFatal,
}: YouTubeStageProps) {
  // Apple TV has no WebKit. The WebView import stays inside YouTubeWebStage
  // so this branch never loads it.
  if (Platform.OS === 'ios' && Platform.isTV) {
    return (
      <YouTubeTvStage
        videoIds={videoIds}
        shuffle={shuffle}
        muted={muted}
        onPlaying={onPlaying}
        onFatal={onFatal}
      />
    );
  }

  return (
    <YouTubeWebStage
      videoIds={videoIds}
      shuffle={shuffle}
      muted={muted}
      onPlaying={onPlaying}
      onFatal={onFatal}
    />
  );
}

const STALL_MS = 45000;

function YouTubeTvStage({
  videoIds,
  shuffle,
  muted,
  onPlaying,
  onFatal,
}: YouTubeStageProps) {
  const { NativeYouTubePlayer } =
    require('./NativeYouTubePlayer') as typeof import('./NativeYouTubePlayer');
  const playableKey = videoIds.filter(isYouTubeVideoId).join('\n');
  const [order, setOrder] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const orderRef = useRef(order);
  const indexRef = useRef(index);
  orderRef.current = order;
  indexRef.current = index;
  const failures = useRef(0);
  const onFatalRef = useRef(onFatal);
  const onPlayingRef = useRef(onPlaying);
  onFatalRef.current = onFatal;
  onPlayingRef.current = onPlaying;
  const stall = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearStall = useCallback(() => {
    if (stall.current != null) {
      clearTimeout(stall.current);
      stall.current = null;
    }
  }, []);

  const advance = useCallback(
    (failed: boolean) => {
      const current = orderRef.current;
      if (current.length === 0) {
        onFatalRef.current();
        return;
      }
      if (failed) {
        failures.current += 1;
        if (failures.current >= current.length) {
          onFatalRef.current();
          return;
        }
      } else {
        failures.current = 0;
      }
      const next = advancePlaylist(
        current,
        indexRef.current,
        Math.random,
        shuffle,
      );
      orderRef.current = next.ids;
      indexRef.current = next.index;
      setOrder(next.ids);
      setIndex(next.index);
    },
    [shuffle],
  );

  useEffect(() => {
    failures.current = 0;
    const source = playableKey === '' ? [] : playableKey.split('\n');
    const next = shuffle ? shuffleIds(source) : source;
    orderRef.current = next;
    indexRef.current = 0;
    setOrder(next);
    setIndex(0);
    if (next.length === 0) {
      onFatalRef.current();
    }
  }, [playableKey, shuffle]);

  const videoId = order[index] ?? '';

  useEffect(() => {
    if (videoId === '') {
      return;
    }
    clearStall();
    stall.current = setTimeout(() => advance(true), STALL_MS);
    return clearStall;
  }, [videoId, advance, clearStall]);

  if (videoId === '') {
    return <View style={styles.frame} pointerEvents="none" />;
  }

  return (
    <View
      style={styles.frame}
      pointerEvents="none"
      focusable={false}
      tvFocusable={false}>
      <NativeYouTubePlayer
        style={styles.web}
        videoId={videoId}
        play
        muted={muted}
        onStatus={event => {
          const state = event.nativeEvent.state;
          if (state === 'playing') {
            clearStall();
            failures.current = 0;
            onPlayingRef.current();
          } else if (state === 'ended') {
            clearStall();
            advance(false);
          } else if (state === 'error') {
            clearStall();
            advance(true);
          }
        }}
      />
    </View>
  );
}

function YouTubeWebStage({
  videoIds,
  shuffle,
  muted,
  onPlaying,
  onFatal,
}: YouTubeStageProps) {
  const { WebView } = require('react-native-webview') as typeof import('react-native-webview');
  const html = useMemo(
    () => buildYouTubeStageHtml(videoIds, { shuffle }),
    [videoIds, shuffle],
  );
  const webRef = useRef<ComponentRef<typeof WebView>>(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const pushPlayback = useCallback(() => {
    const flag = mutedRef.current ? 'true' : 'false';
    webRef.current?.injectJavaScript(
      `window.setStageMuted&&window.setStageMuted(${flag});window.fitStage&&window.fitStage();true;`,
    );
  }, []);

  useEffect(() => {
    pushPlayback();
  }, [muted, pushPlayback]);

  return (
    // D-pad stays on the stage control. A focused WebView scrolls this page.
    <View
      style={styles.frame}
      pointerEvents="none"
      focusable={false}
      tvFocusable={false}
      onLayout={pushPlayback}
    >
      <WebView
        ref={webRef}
        style={styles.web}
        source={{ html, baseUrl: `${STAGE_EMBED_ORIGIN}/` }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowsFullscreenVideo={false}
        mediaPlaybackRequiresUserAction={false}
        setSupportMultipleWindows={false}
        setBuiltInZoomControls={false}
        setDisplayZoomControls={false}
        scalesPageToFit={false}
        androidLayerType="hardware"
        scrollEnabled={false}
        nestedScrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        allowsInlineMediaPlayback
        focusable={false}
        accessible={false}
        onLoadEnd={pushPlayback}
        onShouldStartLoadWithRequest={request =>
          isStageRequestAllowed(request.url)
        }
        onError={onFatal}
        onHttpError={onFatal}
        onMessage={event => {
          if (event.nativeEvent.data === 'playing') {
            onPlaying();
          } else if (event.nativeEvent.data === 'failed') {
            onFatal();
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.stage,
  },
  web: {
    flex: 1,
    backgroundColor: colors.stage,
  },
});
