import {
  advancePlaylist,
  shuffleIds,
} from '../src/components/youtubeStagePlaylist';

test('shuffle uses the supplied random source', () => {
  let n = 0;
  const values = [0, 0.9];
  const shuffled = shuffleIds(['a', 'b', 'c'], () => values[n++] ?? 0);
  expect(shuffled).toEqual(['c', 'b', 'a']);
});

test('advance steps through the deck', () => {
  expect(advancePlaylist(['a', 'b', 'c'], 0, () => 0)).toEqual({
    ids: ['a', 'b', 'c'],
    index: 1,
  });
});

test('a wrapped deck does not start on the video that just ended', () => {
  const next = advancePlaylist(['a', 'b', 'c'], 2, () => 0);
  expect(next.index).toBe(0);
  expect(next.ids[0]).not.toBe('c');
  expect(next.ids).toHaveLength(3);
});
