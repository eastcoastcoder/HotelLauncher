import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TVFocusGuideView,
  useTVEventHandler,
  View,
  type HWEvent,
} from 'react-native';
import { ChannelMark } from '../components/ChannelMark';
import { Focusable } from '../components/Focusable';
import { colors } from '../theme/colors';
import {
  formatClock,
  formatSlotLabel,
  guideChannels,
  minuteOfDay,
  nowFraction,
  initialWindowStart,
  SLOT_COUNT,
  SLOT_MINUTES,
  slotContains,
  slotStarts,
  slotTitle,
  type GuideChannel,
} from './guideData';

const GRID_LINES = [0, 1, 2, 3, 4];
const CHANNEL_COLUMN = 188;
const RULER_HEIGHT = 52;
const ROW_HEIGHT = 64;
const GRID_LINE = 'rgba(96, 156, 214, 0.72)';
const NOW_LINE = '#8EBEFF';

type Props = {
  onClose?: () => void;
  /** Sidebar copy is visible only. Right from the menu opens the full guide. */
  interactive?: boolean;
  testID?: string;
};

export function GuideGrid({
  onClose,
  interactive = true,
  testID = 'watch-tv-grid',
}: Props) {
  const [now, setNow] = useState(() => new Date());
  const [windowStart, setWindowStart] = useState(() =>
    initialWindowStart(new Date()),
  );
  const [gridWidth, setGridWidth] = useState(0);
  const [pending, setPending] = useState<1 | -1 | 0>(0);
  const slide = useRef(new Animated.Value(0)).current;
  const firstRowRef = useRef<View>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const gridWidthRef = useRef(0);
  gridWidthRef.current = gridWidth;
  const shiftToken = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!interactive) {
      return;
    }
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        const node = firstRowRef.current;
        if (node != null && typeof node.requestTVFocus === 'function') {
          node.requestTVFocus();
        }
      });
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [interactive]);

  const beginShift = useCallback((direction: 1 | -1) => {
    if (pendingRef.current !== 0 || gridWidthRef.current <= 0) {
      return;
    }
    setPending(direction);
  }, []);

  const onRemote = useCallback(
    (event: HWEvent) => {
      if (!interactive) {
        return;
      }
      if (event.eventKeyAction != null && event.eventKeyAction !== 0) {
        return;
      }
      if (event.eventType === 'left') {
        onCloseRef.current?.();
        return;
      }
      if (event.eventType === 'right') {
        beginShift(1);
      }
    },
    [beginShift, interactive],
  );
  useTVEventHandler(onRemote);

  useLayoutEffect(() => {
    if (pending === 0 || gridWidth <= 0) {
      return;
    }
    const column = gridWidth / SLOT_COUNT;
    const direction = pending;
    const token = ++shiftToken.current;
    if (direction === -1) {
      slide.setValue(-column);
    } else {
      slide.setValue(0);
    }
    const animation = Animated.timing(slide, {
      toValue: direction === 1 ? -column : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (!finished || token !== shiftToken.current) {
        return;
      }
      setWindowStart(
        current => (current + direction * SLOT_MINUTES + 24 * 60) % (24 * 60),
      );
      slide.setValue(0);
      setPending(0);
    });
    return () => {
      shiftToken.current += 1;
      animation.stop();
    };
  }, [gridWidth, pending, slide]);

  const minute = minuteOfDay(now);
  const extra = pending === 0 ? 0 : 1;
  const origin =
    pending === -1 ? (windowStart - SLOT_MINUTES + 24 * 60) % (24 * 60) : windowStart;
  const slots = slotStarts(origin, SLOT_COUNT + extra);
  const visibleSlots = slotStarts(windowStart);
  const fraction = pending === 0 ? nowFraction(windowStart, minute) : null;

  const frame = (
    <View style={styles.fill} testID={testID}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brandSmall}>Hotel</Text>
          <Text style={styles.brandLarge}>TV</Text>
        </View>
        <Text style={styles.clock}>{formatClock(now)}</Text>
      </View>
      <View style={styles.ruler}>
        <View style={styles.modeCol}>
          <Text style={styles.watch}>WATCH</Text>
          <Text style={styles.dvr}>DVR</Text>
        </View>
        <View style={styles.rulerSlots}>
          {visibleSlots.map(slot => {
            const current = slotContains(slot, minute);
            return (
              <View key={slot} style={styles.slotHead}>
                <Text style={[styles.slotLabel, current && styles.slotLabelNow]}>
                  {formatSlotLabel(slot)}
                </Text>
                {current ? <View style={styles.underline} /> : null}
              </View>
            );
          })}
          {GRID_LINES.map(line => (
            <View
              key={line}
              pointerEvents="none"
              style={[styles.gridLine, { left: `${line * 25}%` }]}
            />
          ))}
          {fraction != null && gridWidth > 0 ? (
            <View
              pointerEvents="none"
              style={[styles.nowTick, { left: fraction * gridWidth }]}
            />
          ) : null}
        </View>
      </View>
      <View style={styles.rows}>
        {guideChannels.map((channel, index) => {
          const strip = (
            <GuideStrip
              channel={channel}
              slots={slots}
              minute={minute}
              gridWidth={gridWidth}
              slide={slide}
              fraction={fraction}
              onMeasure={
                index === 0
                  ? next => {
                      setGridWidth(current => (current === next ? current : next));
                    }
                  : undefined
              }
            />
          );
          if (!interactive) {
            return (
              <View
                key={channel.id}
                testID={`guide-row-${channel.id}`}
                style={styles.row}
              >
                {strip}
              </View>
            );
          }
          return (
            <Focusable
              key={channel.id}
              ref={index === 0 ? firstRowRef : undefined}
              testID={`guide-row-${channel.id}`}
              hasTVPreferredFocus={index === 0 ? true : undefined}
              style={styles.row}
              focusedStyle={styles.rowFocused}
            >
              {strip}
            </Focusable>
          );
        })}
      </View>
    </View>
  );

  if (!interactive) {
    return frame;
  }

  return (
    <TVFocusGuideView
      style={styles.fill}
      trapFocusUp
      trapFocusDown
      trapFocusLeft
      trapFocusRight
    >
      {frame}
    </TVFocusGuideView>
  );
}

function GuideStrip({
  channel,
  slots,
  minute,
  gridWidth,
  slide,
  fraction,
  onMeasure,
}: {
  channel: GuideChannel;
  slots: number[];
  minute: number;
  gridWidth: number;
  slide: Animated.Value;
  fraction: number | null;
  onMeasure?: (width: number) => void;
}) {
  return (
    <>
      <View style={styles.channelCol}>
        {channel.mark === 'hotel' ? null : (
          <ChannelMark mark={channel.mark} size={28} />
        )}
        <Text style={styles.channelName} numberOfLines={1}>
          {channel.name}
        </Text>
      </View>
      <View
        style={styles.clip}
        onLayout={
          onMeasure == null
            ? undefined
            : event => {
                onMeasure(Math.round(event.nativeEvent.layout.width));
              }
        }
      >
        <Animated.View
          style={[
            styles.strip,
            {
              width:
                gridWidth > 0
                  ? (gridWidth / SLOT_COUNT) * slots.length
                  : '100%',
              transform: [{ translateX: slide }],
            },
          ]}
        >
          {slots.map(slot => (
            <Cell
              key={`${channel.id}-${slot}`}
              channel={channel}
              slot={slot}
              minute={minute}
              width={gridWidth > 0 ? gridWidth / SLOT_COUNT : undefined}
            />
          ))}
        </Animated.View>
        {fraction != null && gridWidth > 0 ? (
          <View
            pointerEvents="none"
            style={[styles.nowLine, { left: fraction * gridWidth }]}
          />
        ) : null}
        {GRID_LINES.map(line => (
          <View
            key={line}
            pointerEvents="none"
            style={[styles.gridLine, { left: `${line * 25}%` }]}
          />
        ))}
      </View>
    </>
  );
}

function Cell({
  channel,
  slot,
  minute,
  width,
}: {
  channel: GuideChannel;
  slot: number;
  minute: number;
  width: number | undefined;
}) {
  const title = slotTitle(channel, slot, minute);
  return (
    <View style={[styles.cell, width != null ? { width } : styles.cellFlex]}>
      {title === 'YouTube' ? (
        <YouTubeBadge />
      ) : title ? (
        <Text style={styles.program} numberOfLines={1}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}

function YouTubeBadge() {
  return (
    <View style={styles.yt}>
      <View style={styles.ytPlay}>
        <View style={styles.ytTriangle} />
      </View>
      <Text style={styles.ytLabel}>YouTube</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: '#07090D',
  },
  header: {
    height: 72,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandSmall: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  brandLarge: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginTop: -2,
  },
  clock: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '500',
  },
  ruler: {
    height: RULER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  modeCol: {
    width: CHANNEL_COLUMN,
    paddingLeft: 28,
    paddingBottom: 8,
    gap: 2,
  },
  watch: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  dvr: {
    color: '#8E99A8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  rulerSlots: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%',
  },
  slotHead: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    paddingBottom: 6,
  },
  slotLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  slotLabelNow: {
    color: colors.textPrimary,
  },
  underline: {
    marginTop: 4,
    width: 36,
    height: 2,
    backgroundColor: NOW_LINE,
  },
  rows: {
    flex: 1,
  },
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 0,
    borderWidth: 0,
    borderTopWidth: 1,
    borderTopColor: GRID_LINE,
  },
  rowFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'transparent',
    borderTopColor: '#D5E6FA',
    borderLeftWidth: 3,
    borderLeftColor: '#FFFFFF',
  },
  channelCol: {
    width: CHANNEL_COLUMN,
    paddingLeft: 28,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  channelName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '500',
  },
  clip: {
    flex: 1,
    overflow: 'hidden',
  },
  strip: {
    flexDirection: 'row',
    height: '100%',
  },
  cell: {
    height: '100%',
    justifyContent: 'center',
    paddingRight: 8,
  },
  cellFlex: {
    flex: 1,
  },
  program: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 15,
    fontWeight: '500',
    paddingLeft: 10,
  },
  gridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: GRID_LINE,
  },
  nowLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: NOW_LINE,
    zIndex: 2,
  },
  nowTick: {
    position: 'absolute',
    bottom: 0,
    width: 2,
    height: 18,
    marginLeft: -1,
    backgroundColor: NOW_LINE,
  },
  yt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 10,
  },
  ytPlay: {
    width: 28,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#FF0033',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ytTriangle: {
    width: 0,
    height: 0,
    marginLeft: 2,
    borderLeftWidth: 8,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftColor: '#FFFFFF',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  ytLabel: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
