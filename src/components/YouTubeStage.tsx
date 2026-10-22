import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type RefObject,
} from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { isYouTubeVideoId } from '../config/mainStageMedia';
import { colors } from '../theme/colors';
import { type NowPlayingTrack, type StageTransport } from './stageTransport';
import {
  buildYouTubeStageHtml,
  isStageRequestAllowed,
  parseStagePlayerMessage,
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
  onNowPlaying?: (track: NowPlayingTrack) => void;
  transportRef?: RefObject<StageTransport | null>;
}

export function YouTubeStage({
  videoIds,
  shuffle,
  muted,
  onPlaying,
  onFatal,
  onNowPlaying,
  transportRef,
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
        onNowPlaying={onNowPlaying}
        transportRef={transportRef}
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
      onNowPlaying={onNowPlaying}
      transportRef={transportRef}
    />
  );
}

function useStageTransport(
  transportRef: RefObject<StageTransport | null> | undefined,
  transport: StageTransport,
) {
  const latest = useRef(transport);
  latest.current = transport;
  useEffect(() => {
    if (!transportRef) {
      return;
    }
    const api: StageTransport = {
      previous: () => latest.current.previous(),
      next: () => latest.current.next(),
      togglePlay: () => latest.current.togglePlay(),
    };
    transportRef.current = api;
    return () => {
      if (transportRef.current === api) {
        transportRef.current = null;
      }
    };
  }, [transportRef]);
}

const STALL_MS = 45000;

function YouTubeTvStage({
  videoIds,
  shuffle,
  muted,
  onPlaying,
  onFatal,
  onNowPlaying,
  transportRef,
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
  const [paused, setPaused] = useState(false);
  const onNowPlayingRef = useRef(onNowPlaying);
  onNowPlayingRef.current = onNowPlaying;

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
    setPaused(false);
    if (next.length === 0) {
      onFatalRef.current();
    }
  }, [playableKey, shuffle]);

  const videoId = order[index] ?? '';

  const previous = useCallback(() => {
    const current = orderRef.current;
    if (current.length === 0) {
      return;
    }
    failures.current = 0;
    const nextIndex =
      (indexRef.current - 1 + current.length) % current.length;
    indexRef.current = nextIndex;
    setIndex(nextIndex);
    setPaused(false);
  }, []);

  const next = useCallback(() => {
    setPaused(false);
    advance(false);
  }, [advance]);

  const togglePlay = useCallback(() => {
    setPaused(value => !value);
  }, []);

  useStageTransport(transportRef, { previous, next, togglePlay });

  useEffect(() => {
    onNowPlayingRef.current?.({
      videoId,
      title: '',
      paused: videoId === '' || paused,
    });
  }, [videoId, paused]);

  useEffect(() => {
    if (videoId === '') {
      return;
    }
    clearStall();
    stall.current = setTimeout(() => advance(true), STALL_MS);
    return clearStall;
  }, [videoId, advance, clearStall]);

  useEffect(() => {
    if (paused) {
      clearStall();
    }
  }, [paused, clearStall]);

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
        play={!paused}
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
  onNowPlaying,
  transportRef,
}: YouTubeStageProps) {
  const { WebView } = require('react-native-webview') as typeof import('react-native-webview');
  const html = useMemo(
    () => buildYouTubeStageHtml(videoIds, { shuffle }),
    [videoIds, shuffle],
  );
  const webRef = useRef<ComponentRef<typeof WebView>>(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const onNowPlayingRef = useRef(onNowPlaying);
  onNowPlayingRef.current = onNowPlaying;
  const trackRef = useRef<NowPlayingTrack | null>(null);

  const runCommand = useCallback((command: 'previous' | 'next' | 'toggle') => {
    const payload = JSON.stringify(command);
    webRef.current?.injectJavaScript(
      `window.stageCommand&&window.stageCommand(${payload});true;`,
    );
  }, []);

  useStageTransport(transportRef, {
    previous: () => runCommand('previous'),
    next: () => runCommand('next'),
    togglePlay: () => runCommand('toggle'),
  });

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
          const message = parseStagePlayerMessage(event.nativeEvent.data);
          if (message == null) {
            return;
          }
          if (message.event === 'failed') {
            onFatal();
            return;
          }
          if (message.event === 'playing') {
            onPlaying();
          }
          if (message.videoId === '') {
            return;
          }
          const title =
            message.title ||
            (trackRef.current?.videoId === message.videoId
              ? trackRef.current.title
              : '');
          const nextTrack = {
            videoId: message.videoId,
            title,
            paused: message.event === 'paused',
          };
          trackRef.current = nextTrack;
          onNowPlayingRef.current?.(nextTrack);
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
