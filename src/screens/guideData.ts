export type GuideMark = 'hotel' | 'abc' | 'cbs' | 'cw' | 'fox' | 'nbc';

export type GuideProgram = {
  title: string;
  minutes: number;
};

export type GuideChannel = {
  id: string;
  number: string;
  name: string;
  mark: GuideMark;
  /** Repeats from the start of the half hour that contains now. */
  programs: readonly GuideProgram[];
};

export type GuideAiring = {
  title: string;
  /** Minutes from the window origin. Negative when the airing started earlier. */
  offset: number;
  minutes: number;
};

const hotel: GuideChannel = {
  id: 'hotel',
  number: '01',
  name: 'Hotel TV',
  mark: 'hotel',
  programs: [
    { title: 'Hotel Channel', minutes: 150 },
    { title: 'YouTube', minutes: 45 },
    { title: 'City Lights', minutes: 60 },
    { title: 'Late Checkout', minutes: 75 },
    { title: 'Morning Board', minutes: 60 },
  ],
};

const abc: GuideChannel = {
  id: 'abc',
  number: '04',
  name: 'ABC',
  mark: 'abc',
  programs: [
    { title: 'GMA: What You Missed', minutes: 38 },
    { title: 'Local News', minutes: 62 },
    { title: 'Primetime', minutes: 34 },
    { title: 'Nightline', minutes: 40 },
    { title: 'Morning Show', minutes: 45 },
  ],
};

const cbs: GuideChannel = {
  id: 'cbs',
  number: '05',
  name: 'CBS',
  mark: 'cbs',
  programs: [
    { title: 'The Bold and the Beautiful', minutes: 36 },
    { title: 'Evening News', minutes: 54 },
    { title: 'Late Show', minutes: 80 },
    { title: 'Morning News', minutes: 40 },
  ],
};

const cw: GuideChannel = {
  id: 'cw',
  number: '06',
  name: 'The CW',
  mark: 'cw',
  programs: [
    { title: 'Flip Side', minutes: 60 },
    { title: 'Weekend Movie', minutes: 90 },
    { title: 'Tomorrow Tonight', minutes: 30 },
  ],
};

const fox: GuideChannel = {
  id: 'fox',
  number: '03',
  name: 'FOX',
  mark: 'fox',
  programs: [
    { title: 'The Jennifer Hudson Show', minutes: 32 },
    { title: 'Sports Desk', minutes: 28 },
    { title: 'After Hours', minutes: 36 },
    { title: 'Morning Buzz', minutes: 30 },
  ],
};

const nbc: GuideChannel = {
  id: 'nbc',
  number: '02',
  name: 'NBC',
  mark: 'nbc',
  programs: [
    { title: 'Nightly News', minutes: 40 },
    { title: 'Today', minutes: 75 },
    { title: 'Prime Drama', minutes: 35 },
    { title: 'Late Night', minutes: 50 },
  ],
};

/** Order beside the sidebar. */
export const previewChannels: readonly GuideChannel[] = [
  hotel,
  abc,
  cbs,
  cw,
  fox,
];

/** Order in the guide. */
export const guideChannels: readonly GuideChannel[] = [
  hotel,
  nbc,
  fox,
  abc,
  cbs,
];

export const SLOT_MINUTES = 30;
export const SLOT_COUNT = 5;
const DAY_MINUTES = 24 * 60;

export function minuteOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function floorToSlot(minute: number): number {
  const wrapped = ((minute % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  return Math.floor(wrapped / SLOT_MINUTES) * SLOT_MINUTES;
}

/** First column is the half hour that contains now. */
export function initialWindowStart(date: Date): number {
  return floorToSlot(minuteOfDay(date));
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
  if (mins === 0) {
    return `${hour12}${suffix}`;
  }
  return `${hour12}:${mins.toString().padStart(2, '0')}${suffix}`;
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

function signedMinutes(from: number, to: number): number {
  let delta = ((to - from) % DAY_MINUTES + DAY_MINUTES) % DAY_MINUTES;
  if (delta > DAY_MINUTES / 2) {
    delta -= DAY_MINUTES;
  }
  return delta;
}

/** Airings that overlap a window of `span` minutes starting at `origin`. */
export function airingsFor(
  channel: GuideChannel,
  origin: number,
  span: number,
  now: number,
): GuideAiring[] {
  const cycle = channel.programs.reduce((sum, item) => sum + item.minutes, 0);
  if (cycle <= 0 || span <= 0) {
    return [];
  }
  const anchor = floorToSlot(now);
  const fromAnchor =
    ((signedMinutes(anchor, origin) % cycle) + cycle) % cycle;

  let index = 0;
  let consumed = 0;
  let guard = 0;
  while (
    consumed + channel.programs[index].minutes <= fromAnchor &&
    guard < channel.programs.length
  ) {
    consumed += channel.programs[index].minutes;
    index = (index + 1) % channel.programs.length;
    guard += 1;
  }
  const intoProgram = fromAnchor - consumed;
  const airings: GuideAiring[] = [];
  let offset = intoProgram === 0 ? 0 : -intoProgram;
  guard = 0;
  while (offset < span && guard < channel.programs.length + 6) {
    const program = channel.programs[index % channel.programs.length];
    airings.push({
      title: program.title,
      offset,
      minutes: program.minutes,
    });
    offset += program.minutes;
    index += 1;
    guard += 1;
  }
  return airings;
}
