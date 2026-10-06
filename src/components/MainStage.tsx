import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TVFocusGuideView, View } from 'react-native';
import { launcherConfig } from '../config/launcherConfig';
import { loadMainStageMediaConfig } from '../config/mainStageMedia';
import { loadChannelVideoIds } from '../services/youtubeChannel';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { Focusable } from './Focusable';
import { YouTubeStage } from './YouTubeStage';

type Props = {
  fullscreen: boolean;
  onEnterFullscreen: () => void;
  onExitFullscreen: () => void;
};

export function MainStage({
  fullscreen,
  onEnterFullscreen,
  onExitFullscreen,
}: Props) {
  const stage = launcherConfig.mainStage;
  const media = loadMainStageMediaConfig();
  const [videoIds, setVideoIds] = useState<string[] | null>(null);
  const [playing, setPlaying] = useState(false);
  const [focused, setFocused] = useState(false);
  const hitRef = useRef<View>(null);
  const wasFullscreen = useRef(false);
  const audible = focused || fullscreen;

  useEffect(() => {
    if (!media.channel) {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    loadChannelVideoIds(media, controller.signal)
      .then(ids => {
        if (!cancelled) {
          setVideoIds(ids);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVideoIds([]);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [media]);

  // Chrome hiding can move D-pad focus. Put it back on the stage so the
  // video stays unmuted until the viewer arrows away.
  useEffect(() => {
    const entered = fullscreen && !wasFullscreen.current;
    const left = !fullscreen && wasFullscreen.current;
    wasFullscreen.current = fullscreen;
    if (!entered && !left) {
      return;
    }
    const node = hitRef.current;
    if (!node) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      node.requestTVFocus();
    });
    return () => cancelAnimationFrame(frame);
  }, [fullscreen]);

  const playlist = videoIds ?? [];
  const showPlayer = playlist.length > 0;

  return (
    <TVFocusGuideView
      style={[styles.stage, fullscreen && styles.stageFull]}
      trapFocusUp={fullscreen}
      trapFocusDown={fullscreen}
      trapFocusLeft={fullscreen}
      trapFocusRight={fullscreen}
    >
      {showPlayer ? (
        <YouTubeStage
          videoIds={playlist}
          muted={!audible}
          onPlaying={() => setPlaying(true)}
          onFatal={() => {
            setPlaying(false);
            setVideoIds([]);
            onExitFullscreen();
          }}
        />
      ) : null}
      {showPlayer && playing ? null : (
        <View style={styles.staticStage}>
          <View style={styles.glow} />
          <Text style={styles.kicker}>{stage.kicker}</Text>
          <Text style={styles.title}>{stage.title}</Text>
          <Text style={styles.subtitle}>{stage.subtitle}</Text>
        </View>
      )}
      {showPlayer ? (
        <Focusable
          ref={hitRef}
          style={[styles.hit, fullscreen && styles.hitFull]}
          focusedStyle={fullscreen ? styles.hitFullFocus : styles.hitFocus}
          onFocusChange={setFocused}
          onPress={onEnterFullscreen}
        >
          <View />
        </Focusable>
      ) : null}
    </TVFocusGuideView>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: colors.stage,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
  },
  stageFull: {
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: '#000000',
  },
  hit: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderRadius: 14,
  },
  hitFull: {
    borderRadius: 0,
    borderWidth: 0,
  },
  hitFocus: {
    backgroundColor: 'transparent',
    borderColor: colors.accent,
  },
  hitFullFocus: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  staticStage: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 28,
  },
  glow: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(231, 164, 106, 0.16)',
  },
  kicker: {
    ...type.kicker,
    color: colors.accent,
    marginBottom: 8,
  },
  title: {
    ...type.title,
    color: colors.textPrimary,
  },
  subtitle: {
    ...type.body,
    color: colors.textSecondary,
    marginTop: 8,
    maxWidth: 520,
  },
});
