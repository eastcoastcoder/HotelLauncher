import {
  airingsFor,
  formatSlotLabel,
  guideChannels,
  initialWindowStart,
  minuteOfDay,
  nowFraction,
  slotStarts,
} from '../src/screens/guideData';

test('guide window opens on the current half hour', () => {
  const now = new Date(2026, 5, 1, 18, 30);
  const start = initialWindowStart(now);
  const slots = slotStarts(start);

  expect(slots.map(formatSlotLabel)).toEqual([
    '6:30PM',
    '7PM',
    '7:30PM',
    '8PM',
    '8:30PM',
  ]);
  expect(nowFraction(start, minuteOfDay(now))).toBe(0);
});

test('hotel program fills the open window and YouTube follows it', () => {
  const now = new Date(2026, 5, 1, 18, 42);
  const minute = minuteOfDay(now);
  const start = initialWindowStart(now);
  const hotel = guideChannels[0];
  const airings = airingsFor(hotel, start, 5 * 30, minute);

  expect(airings[0]).toMatchObject({
    title: 'Hotel Channel',
    offset: 0,
    minutes: 150,
  });
  expect(nowFraction(start, minute)).toBeCloseTo(12 / 150);

  const shifted = airingsFor(hotel, (start + 30) % (24 * 60), 5 * 30, minute);
  expect(shifted.map(airing => airing.title)).toEqual([
    'Hotel Channel',
    'YouTube',
  ]);
  expect(guideChannels.map(channel => channel.name)).toEqual([
    'Hotel TV',
    'NBC',
    'FOX',
    'ABC',
    'CBS',
  ]);
});
