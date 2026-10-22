export function shuffleIds(
  ids: readonly string[],
  random: () => number = Math.random,
): string[] {
  const list = [...ids];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const swap = list[i];
    list[i] = list[j];
    list[j] = swap;
  }
  return list;
}

/**
 * Same advance as the WebView page: step forward, and when the deck wraps,
 * shuffle without leaving the video that just ended in front.
 * With shuffle off, the wrap starts again at the first id.
 */
export function advancePlaylist(
  ids: readonly string[],
  index: number,
  random: () => number = Math.random,
  shuffle = true,
): { ids: string[]; index: number } {
  const ended = ids[index];
  let nextIndex = index + 1;
  let nextIds = [...ids];
  if (nextIndex >= ids.length) {
    nextIndex = 0;
    if (shuffle) {
      nextIds = shuffleIds(ids, random);
      if (nextIds.length > 1 && nextIds[0] === ended) {
        const swap = nextIds[0];
        nextIds[0] = nextIds[1];
        nextIds[1] = swap;
      }
    }
  }
  return { ids: nextIds, index: nextIndex };
}
