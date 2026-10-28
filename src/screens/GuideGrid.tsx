import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
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
import { useNavReturn } from '../navigation/NavReturn';
import { colors } from '../theme/colors';
import {
  airingsFor,
  formatSlotLabel,
  guideChannels,
  initialWindowStart,
  minuteOfDay,
  nowFraction,
  SLOT_COUNT,
  SLOT_MINUTES,
  slotContains,
  slotStarts,
  type GuideAiring,
  type GuideChannel,
} from './guideData';

const CHANNEL_COLUMN = 236;
const RULER_HEIGHT = 52;
const ROW_HEIGHT = 72;
const NOW_LINE = '#4C8DFF';
const DAY_MINUTES = 24 * 60;

function percent(value: number): `${number}%` {
  return `${value}%`;
}

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
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const nav = useNavReturn();
  const watchTVMain = nav?.mains.WatchTV;
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
    const first = requestAnimationFrame(() => {
      const node = firstRowRef.current;
      if (node != null && typeof node.requestTVFocus === 'function') {
        node.requestTVFocus();
      }
    });
    return () => {
      cancelAnimationFrame(first);
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
        current =>
          (current + direction * SLOT_MINUTES + DAY_MINUTES) % DAY_MINUTES,
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
    pending === -1
      ? (windowStart - SLOT_MINUTES + DAY_MINUTES) % DAY_MINUTES
      : windowStart;
  const span = (SLOT_COUNT + extra) * SLOT_MINUTES;
  const visibleSlots = slotStarts(windowStart);
  const fraction = pending === 0 ? nowFraction(windowStart, minute) : null;
  let nowDelta = minute - origin;
  if (nowDelta < 0) {
    nowDelta += DAY_MINUTES;
  }
  const nowOffset = nowDelta < span ? nowDelta : null;
  const nowLabelOffset =
    gridWidth > 0
      ? Math.max(0, fraction == null ? 0 : fraction * gridWidth - 34)
      : 0;
  const nowLabelPosition = { left: nowLabelOffset };
  const nowLineStyle = {
    left: CHANNEL_COLUMN + (fraction ?? 0) * gridWidth,
    height: guideChannels.length * ROW_HEIGHT,
  };

  const frame = (
    <View testID={testID}>
      <View style={styles.ruler}>
        <View style={styles.channelSpacer} />
        <View
          style={styles.rulerSlots}
          onLayout={event => {
            const next = Math.round(event.nativeEvent.layout.width);
            setGridWidth(current => (current === next ? current : next));
          }}
        >
          {visibleSlots.map(slot => {
            const current = slotContains(slot, minute);
            return (
              <View key={slot} style={styles.slotHead}>
                <Text
                  style={[styles.slotLabel, current && styles.slotLabelNow]}
                >
                  {formatSlotLabel(slot)}
                </Text>
              </View>
            );
          })}
          {fraction != null ? (
            <Text
              pointerEvents="none"
              style={[styles.nowLabel, nowLabelPosition]}
            >
              NOW
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.rows}>
        {guideChannels.map((channel, index) => {
          const focused = interactive && channel.id === focusedId;
          const textColor = focused ? colors.navActive : colors.navIdle;
          const strip = (
            <GuideStrip
              channel={channel}
              origin={origin}
              span={span}
              minute={minute}
              nowOffset={nowOffset}
              slide={slide}
              focused={focused}
              textColor={textColor}
              open={interactive}
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
              style={styles.row}
              focusedStyle={styles.rowFocused}
              nextFocusLeft={watchTVMain ?? undefined}
              onFocusChange={next => {
                if (next) {
                  setFocusedId(channel.id);
                } else {
                  setFocusedId(current =>
                    current === channel.id ? null : current,
                  );
                }
              }}
            >
              {strip}
            </Focusable>
          );
        })}
        {fraction != null && gridWidth > 0 ? (
          <View pointerEvents="none" style={[styles.nowLine, nowLineStyle]} />
        ) : null}
      </View>
    </View>
  );

  if (!interactive) {
    return frame;
  }

  return (
    <TVFocusGuideView trapFocusUp trapFocusDown trapFocusRight>
      {frame}
    </TVFocusGuideView>
  );
}

function GuideStrip({
  channel,
  origin,
  span,
  minute,
  nowOffset,
  slide,
  focused,
  textColor,
  open,
}: {
  channel: GuideChannel;
  origin: number;
  span: number;
  minute: number;
  nowOffset: number | null;
  slide: Animated.Value;
  focused: boolean;
  textColor: string;
  open: boolean;
}) {
  const airings = airingsFor(channel, origin, span, minute);
  const selected = focused ? selectedAiring(airings, nowOffset) : null;
  const windowMinutes = SLOT_COUNT * SLOT_MINUTES;
  const stripStyle = {
    width: percent((span / windowMinutes) * 100),
    transform: [{ translateX: slide }],
  };

  return (
    <>
      <View style={[styles.channelCol, open && styles.channelColOpen]}>
        <ChannelMark mark={channel.mark} size={28} />
        <Text style={[styles.channelNumber, { color: textColor }]}>
          {channel.number}
        </Text>
        <Text
          style={[styles.channelName, { color: textColor }]}
          numberOfLines={1}
        >
          {channel.name}
        </Text>
      </View>
      <View style={styles.clip}>
        <Animated.View style={[styles.strip, stripStyle]}>
          {airings.map(airing => (
            <ProgramBlock
              key={`${channel.id}-${airing.offset}-${airing.title}`}
              airing={airing}
              span={span}
              selected={selected === airing}
              textColor={textColor}
            />
          ))}
        </Animated.View>
      </View>
    </>
  );
}

function selectedAiring(
  airings: GuideAiring[],
  nowOffset: number | null,
): GuideAiring | null {
  if (nowOffset != null) {
    const hit = airings.find(
      airing =>
        nowOffset >= airing.offset &&
        nowOffset < airing.offset + airing.minutes,
    );
    if (hit != null) {
      return hit;
    }
  }
  return airings.find(airing => airing.offset + airing.minutes > 0) ?? null;
}

function ProgramBlock({
  airing,
  span,
  selected,
  textColor,
}: {
  airing: GuideAiring;
  span: number;
  selected: boolean;
  textColor: string;
}) {
  const start = Math.max(0, airing.offset);
  const end = Math.min(span, airing.offset + airing.minutes);
  if (end <= start) {
    return null;
  }
  const place = {
    left: percent((start / span) * 100),
    width: percent(((end - start) / span) * 100),
  };
  return (
    <View style={[styles.program, place, selected && styles.programSelected]}>
      <Text
        style={[
          styles.programTitle,
          { color: textColor },
          selected && styles.programTitleSelected,
        ]}
        numberOfLines={1}
      >
        {airing.title}
      </Text>
      {selected ? null : (
        <View style={[styles.programRule, { backgroundColor: textColor }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ruler: {
    height: RULER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  channelSpacer: {
    width: CHANNEL_COLUMN,
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
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  slotLabel: {
    color: colors.navIdle,
    fontSize: 16,
    fontWeight: '500',
  },
  slotLabelNow: {
    borderBottomWidth: 2,
    borderBottomColor: NOW_LINE,
    paddingBottom: 3,
  },
  nowLabel: {
    position: 'absolute',
    bottom: 8,
    color: NOW_LINE,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
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
  },
  rowFocused: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  channelCol: {
    width: CHANNEL_COLUMN,
    paddingLeft: 12,
    paddingRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  channelColOpen: {
    paddingLeft: 32,
  },
  channelNumber: {
    fontSize: 16,
    fontWeight: '500',
  },
  channelName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  clip: {
    flex: 1,
    overflow: 'hidden',
  },
  strip: {
    height: '100%',
  },
  program: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingRight: 12,
  },
  programSelected: {
    top: 8,
    bottom: 8,
    borderWidth: 2,
    borderColor: colors.navActive,
    paddingRight: 16,
    paddingLeft: 16,
  },
  programTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  programTitleSelected: {
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  programRule: {
    height: 1,
    marginTop: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  nowLine: {
    position: 'absolute',
    top: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: NOW_LINE,
    zIndex: 2,
  },
});
