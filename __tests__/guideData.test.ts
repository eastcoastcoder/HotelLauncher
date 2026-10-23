import {
  formatSlotLabel,
  guideChannels,
  initialWindowStart,
  minuteOfDay,
  nowFraction,
  previewChannels,
  slotStarts,
  slotTitle,
} from '../src/screens/guideData';

test('guide window opens on the half hour before now', () => {
  const now = new Date(2026, 5, 1, 18, 30);
  const start = initialWindowStart(now);
  const slots = slotStarts(start);

  expect(slots.map(formatSlotLabel)).toEqual([
    '6:00 PM',
    '6:30 PM',
    '7:00 PM',
    '7:30 PM',
  ]);
  expect(nowFraction(start, minuteOfDay(now))).toBe(0.25);
});

test('hotel guide shows the current title and then YouTube', () => {
  const now = new Date(2026, 5, 1, 18, 42);
  const slots = slotStarts(initialWindowStart(now));
  const hotel = previewChannels[0];
  const minute = minuteOfDay(now);

  expect(slotTitle(hotel, slots[1], minute)).toBe('Hotel Channel');
  expect(slotTitle(hotel, slots[2], minute)).toBe('YouTube');
  expect(guideChannels.map(channel => channel.name)).toEqual([
    'Hotel TV',
    'NBC',
    'FOX',
    'ABC',
    'CBS',
  ]);
});
