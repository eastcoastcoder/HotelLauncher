import { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TVFocusGuideView,
  View,
} from 'react-native';
import { launcherConfig } from '../config/launcherConfig';
import { loadYouTubeVideoDetails } from '../services/youtubeVideo';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { Focusable } from './Focusable';
import { type NowPlayingTrack } from './stageTransport';
import { NavIcon } from './NavIcon';

type Props = {
  enabled?: boolean;
  track?: NowPlayingTrack | null;
  onPrevious?: () => void;
  onNext?: () => void;
  onTogglePlay?: () => void;
};

export function NowPlayingPanel({
  enabled = true,
  track = null,
  onPrevious,
  onNext,
  onTogglePlay,
}: Props) {
  const item = launcherConfig.nowPlaying;
  const videoId = track?.videoId ?? '';
  const live = videoId !== '';
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<{
    videoId: string;
    title: string;
    description: string;
  } | null>(null);
  const learnMoreRef = useRef<View>(null);

  useEffect(() => {
    if (!enabled) {
      setOpen(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!live) {
      setDetails(null);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    setDetails(null);
    loadYouTubeVideoDetails(videoId, controller.signal)
      .then(next => {
        if (!cancelled) {
          setDetails({ videoId, ...next });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetails({ videoId, title: '', description: '' });
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [live, videoId]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        setOpen(false);
        return true;
      },
    );
    return () => subscription.remove();
  }, [open]);

  const playerTitle = track?.title.trim() ?? '';
  const fetchedTitle = details?.videoId === videoId ? details.title.trim() : '';
  const title = playerTitle || fetchedTitle || (live ? '…' : item.title);
  const description = !live
    ? item.description
    : details?.videoId === videoId
    ? details.description.trim() || 'No description for this video.'
    : 'Loading description…';
  const canControl = enabled && live && !open;

  const closeDetails = () => {
    setOpen(false);
    const node = learnMoreRef.current;
    if (!node) {
      return;
    }
    requestAnimationFrame(() => {
      if (typeof node.requestTVFocus === 'function') {
        node.requestTVFocus();
      }
    });
  };

  return (
    <View style={styles.panel}>
      <Text style={styles.kicker}>{item.kicker}</Text>
      <Text style={styles.title} numberOfLines={4}>
        {title}
      </Text>
      <View style={styles.controls}>
        <Focusable
          style={styles.control}
          focusable={canControl}
          onPress={onPrevious}
          testID="now-playing-previous"
        >
          <NavIcon name="prev" color={colors.textPrimary} />
        </Focusable>
        <Focusable
          style={styles.control}
          focusable={canControl}
          onPress={onTogglePlay}
          testID="now-playing-play"
        >
          {track?.paused === false ? (
            <NavIcon name="pause" color={colors.textPrimary} />
          ) : (
            <NavIcon name="play" color={colors.textPrimary} />
          )}
        </Focusable>
        <Focusable
          style={styles.control}
          focusable={canControl}
          onPress={onNext}
          testID="now-playing-next"
        >
          <NavIcon name="next" color={colors.textPrimary} />
        </Focusable>
      </View>
      <Focusable
        ref={learnMoreRef}
        style={styles.cta}
        focusable={enabled && !open}
        onPress={() => setOpen(true)}
        testID="now-playing-learn-more"
      >
        <Text style={styles.ctaText}>{item.cta} →</Text>
      </Focusable>
      {open ? (
        <TVFocusGuideView
          style={styles.details}
          trapFocusUp
          trapFocusDown
          trapFocusLeft
          trapFocusRight
          testID="now-playing-details"
        >
          <ScrollView style={styles.detailsScroll} focusable={false}>
            <Text style={styles.body} testID="now-playing-description">
              {description}
            </Text>
          </ScrollView>
          <Focusable
            hasTVPreferredFocus
            style={styles.close}
            onPress={closeDetails}
            testID="now-playing-close"
          >
            <Text style={styles.ctaText}>CLOSE</Text>
          </Focusable>
        </TVFocusGuideView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: 188,
    marginLeft: 16,
    borderRadius: 16,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 16,
  },
  kicker: {
    ...type.kicker,
    color: colors.accent,
  },
  title: {
    ...type.title,
    fontSize: 20,
    color: colors.textPrimary,
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 16,
  },
  control: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  controlText: {
    ...type.cta,
    fontSize: 11,
    letterSpacing: 0.4,
    color: colors.textPrimary,
  },
  cta: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  ctaText: {
    ...type.cta,
    color: colors.accent,
  },
  details: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 420,
    maxHeight: 460,
    zIndex: 5,
    elevation: 6,
    borderRadius: 16,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 16,
  },
  detailsScroll: {
    maxHeight: 320,
  },
  body: {
    ...type.body,
    color: colors.textSecondary,
  },
  close: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
});
