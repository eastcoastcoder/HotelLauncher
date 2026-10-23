export type GuideMark = 'hotel' | 'abc' | 'cbs' | 'cw' | 'fox' | 'nbc';

export type GuideChannel = {
  id: string;
  number: string;
  name: string;
  mark: GuideMark;
  /** Title in the preview row and in the slot that contains now. */
  nowTitle: string;
  /** Later slots, cycling. The first entry is the half hour after now. */
  lineup: readonly string[];
};

const hotel: GuideChannel = {
  id: 'hotel',
  number: '01',
  name: 'Hotel TV',
  mark: 'hotel',
  nowTitle: 'Hotel Channel',
  lineup: ['YouTube', 'City Lights', 'Late Checkout', 'Morning Board'],
};

const abc: GuideChannel = {
  id: 'abc',
  number: '02',
  name: 'ABC',
  mark: 'abc',
  nowTitle: 'GMA: What You Missed',
  lineup: ['Local News', 'Primetime', 'Nightline', 'Morning Show'],
};

const cbs: GuideChannel = {
  id: 'cbs',
  number: '03',
  name: 'CBS',
  mark: 'cbs',
  nowTitle: 'The Bold and the Beautiful',
  lineup: ['Evening News', 'Late Show', 'Morning News'],
};

const cw: GuideChannel = {
  id: 'cw',
  number: '04',
  name: 'The CW',
  mark: 'cw',
  nowTitle: 'Flip Side',
  lineup: ['Weekend Movie', 'Tomorrow Tonight'],
};

const fox: GuideChannel = {
  id: 'fox',
  number: '05',
  name: 'FOX',
  mark: 'fox',
  nowTitle: 'The Jennifer Hudson Show',
  lineup: ['Sports Desk', 'After Hours', 'Morning Buzz'],
};

const nbc: GuideChannel = {
  id: 'nbc',
  number: '06',
  name: 'NBC',
  mark: 'nbc',
  nowTitle: 'Nightly News',
  lineup: ['Prime Drama', 'Late Night', 'Today'],
};

/** Order beside the sidebar. */
export const previewChannels: readonly GuideChannel[] = [
  hotel,
  abc,
  cbs,
  cw,
  fox,
];

/** Order in the fullscreen guide. */
export const guideChannels: readonly GuideChannel[] = [
  hotel,
  nbc,
  fox,
  abc,
  cbs,
];

export const SLOT_MINUTES = 30;
export const SLOT_COUNT = 4;
const DAY_MINUTES = 24 * 60;

export function minuteOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function floorToSlot(minute: number): number {
  const wrapped = ((minute % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  return Math.floor(wrapped / SLOT_MINUTES) * SLOT_MINUTES;
}

/** Window opens one slot before now, so now is the second column. */
export function initialWindowStart(date: Date): number {
  return (floorToSlot(minuteOfDay(date)) - SLOT_MINUTES + DAY_MINUTES) % DAY_MINUTES;
}

export function slotStarts(
  windowStart: number,
  count = SLOT_COUNT,
): number[] {
  const origin = (windowStart + DAY_MINUTES) % DAY_MINUTES;
  return Array.from(
    { length: count },
    (_, index) => (origin + index * SLOT_MINUTES) % DAY_MINUTES,
  );
}

export function formatSlotLabel(minute: number): string {
  const wrapped = ((minute % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const hour24 = Math.floor(wrapped / 60);
  const mins = wrapped % 60;
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${mins.toString().padStart(2, '0')} ${suffix}`;
}

export function formatClock(date: Date): string {
  return formatSlotLabel(minuteOfDay(date));
}

export function slotContains(slotStart: number, minute: number): boolean {
  const start = floorToSlot(slotStart);
  const at = ((minute % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const end = (start + SLOT_MINUTES) % DAY_MINUTES;
  if (start < end) {
    return at >= start && at < end;
  }
  return at >= start || at < end;
}

/** 0 at the left edge of the window, 1 at the right edge. Null when now is outside. */
export function nowFraction(
  windowStart: number,
  minute: number,
  slots = SLOT_COUNT,
): number | null {
  const span = slots * SLOT_MINUTES;
  const at = ((minute % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const origin = (windowStart + DAY_MINUTES) % DAY_MINUTES;
  let delta = at - origin;
  if (delta < 0) {
    delta += DAY_MINUTES;
  }
  if (delta > span) {
    return null;
  }
  return delta / span;
}

export function slotTitle(
  channel: GuideChannel,
  slotStart: number,
  minute: number,
): string {
  const nowSlot = floorToSlot(minute);
  const slot = floorToSlot(slotStart);
  if (slot === nowSlot) {
    return channel.nowTitle;
  }
  const afterNow = (nowSlot + SLOT_MINUTES) % DAY_MINUTES;
  const steps = ((slot - afterNow + DAY_MINUTES) % DAY_MINUTES) / SLOT_MINUTES;
  return channel.lineup[steps % channel.lineup.length] ?? '';
}
