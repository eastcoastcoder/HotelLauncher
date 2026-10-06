import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../theme/colors';
import {
  buildYouTubeStageHtml,
  isStageRequestAllowed,
  STAGE_EMBED_ORIGIN,
} from './youtubeStageHtml';

interface YouTubeStageProps {
  videoIds: readonly string[];
  muted: boolean;
  onPlaying: () => void;
  onFatal: () => void;
}

export function YouTubeStage({
  videoIds,
  muted,
  onPlaying,
  onFatal,
}: YouTubeStageProps) {
  const html = useMemo(() => buildYouTubeStageHtml(videoIds), [videoIds]);
  const webRef = useRef<React.ComponentRef<typeof WebView>>(null);
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
