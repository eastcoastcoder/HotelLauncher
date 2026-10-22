import example from '../src/config/mainStage.example.json';
import {
  normalizeMainStageMediaConfig,
  videoIdFromInput,
} from '../src/config/mainStageMedia';
import {
  buildYouTubeStageHtml,
  isStageRequestAllowed,
  parseStagePlayerMessage,
} from '../src/components/youtubeStageHtml';
import {
  channelVideosPageUrl,
  filterExcludedVideoIds,
  loadChannelVideoIds,
  videoIdsFromChannelHtml,
} from '../src/services/youtubeChannel';

test('example config keeps the stage static', () => {
  expect(normalizeMainStageMediaConfig(example)).toEqual({
    channel: '',
    exclude: [],
  });
});

test('reads a video id from a watch URL', () => {
  expect(videoIdFromInput('https://www.youtube.com/watch?v=ADdXw-HMnwc')).toBe(
    'ADdXw-HMnwc',
  );
  expect(videoIdFromInput('ADdXw-HMnwc')).toBe('ADdXw-HMnwc');
  expect(videoIdFromInput('https://youtu.be/ADdXw-HMnwc')).toBe('ADdXw-HMnwc');
});

test('normalizes a channel config and drops junk exclusions', () => {
  expect(
    normalizeMainStageMediaConfig({
      channel: '  http://youtube.com/@hotelchannel  ',
      exclude: [
        'ADdXw-HMnwc',
        'https://www.youtube.com/watch?v=EBBcMKXSdhU',
        'nope',
        12,
      ],
    }),
  ).toEqual({
    channel: 'http://youtube.com/@hotelchannel',
    exclude: ['ADdXw-HMnwc', 'EBBcMKXSdhU'],
  });
});

test('builds the videos page from a channel URL, handle, or id', () => {
  expect(channelVideosPageUrl('http://youtube.com/@hotelchannel')).toBe(
    'https://www.youtube.com/@hotelchannel/videos',
  );
  expect(channelVideosPageUrl('@hotelchannel')).toBe(
    'https://www.youtube.com/@hotelchannel/videos',
  );
  expect(
    channelVideosPageUrl(
      'https://www.youtube.com/channel/UC5d4VoZzRbIxqVqFtyWhGWQ',
    ),
  ).toBe('https://www.youtube.com/channel/UC5d4VoZzRbIxqVqFtyWhGWQ/videos');
  expect(channelVideosPageUrl('')).toBeNull();
  expect(
    channelVideosPageUrl('https://example.com/@hotelchannel'),
  ).toBeNull();
});

test('takes channel videos in page order and skips excluded ids', () => {
  const html = `
    {"contentId":"EBBcMKXSdhU"}
    {"contentId":"ADdXw-HMnwc"}
    {"contentId":"EBBcMKXSdhU"}
    {"contentId":"1QeXb2Caf0s"}
  `;
  expect(
    filterExcludedVideoIds(videoIdsFromChannelHtml(html), ['ADdXw-HMnwc']),
  ).toEqual(['EBBcMKXSdhU', '1QeXb2Caf0s']);
});

test('stage document shuffles the channel, stays quiet until unmuted, and cannot scroll', () => {
  const html = buildYouTubeStageHtml(['EBBcMKXSdhU', '1QeXb2Caf0s']);
  expect(html).toContain('EBBcMKXSdhU');
  expect(html).toContain('1QeXb2Caf0s');
  expect(html).toContain('https://www.youtube.com/iframe_api');
  expect(html).toContain('function shuffle');
  expect(html).toContain('var shuffleOn = true');
  expect(html).toContain('Math.random');
  expect(html).toContain('setStageMuted');
  expect(html).toContain('window.stageCommand');
  expect(html).toContain("command === 'previous'");
  expect(html).toContain("command === 'toggle'");
  expect(html).toContain('overflow: hidden');
  expect(html).toContain('position: fixed');
  expect(html.indexOf('shuffle(ids)')).toBeLessThan(html.indexOf('new YT.Player'));
  expect(html).not.toContain('(index + 1) % ids.length');
  expect(html).not.toContain('ADdXw-HMnwc');
  const ordered = buildYouTubeStageHtml(
    ['EBBcMKXSdhU', '1QeXb2Caf0s'],
    { shuffle: false },
  );
  expect(ordered).toContain('var shuffleOn = false');
  expect(ordered).toContain('["EBBcMKXSdhU","1QeXb2Caf0s"]');
  expect(
    isStageRequestAllowed('https://www.youtube.com/embed/EBBcMKXSdhU'),
  ).toBe(true);
  expect(isStageRequestAllowed('https://com.hotellauncher/')).toBe(true);
  expect(isStageRequestAllowed('https://example.com/watch')).toBe(false);
  expect(parseStagePlayerMessage('playing')).toEqual({
    event: 'playing',
    videoId: '',
    title: '',
  });
  expect(
    parseStagePlayerMessage(
      '{"event":"paused","videoId":"EBBcMKXSdhU","title":"Lobby"}',
    ),
  ).toEqual({
    event: 'paused',
    videoId: 'EBBcMKXSdhU',
    title: 'Lobby',
  });
  expect(parseStagePlayerMessage('failed')).toEqual({ event: 'failed' });
  expect(parseStagePlayerMessage('nope')).toBeNull();
});

test('loaded channel ids are shuffled unless shuffle is off', async () => {
  const html = `
    {"contentId":"EBBcMKXSdhU"}
    {"contentId":"1QeXb2Caf0s"}
    {"contentId":"ADdXw-HMnwc"}
  `;
  const original = global.fetch;
  global.fetch = jest.fn(async () => ({
    ok: true,
    text: async () => html,
  })) as typeof fetch;

  try {
    let n = 0;
    const values = [0, 0];
    const shuffled = await loadChannelVideoIds(
      { channel: '@shufflechannel', exclude: [] },
      undefined,
      { random: () => values[n++] ?? 0 },
    );
    expect(shuffled).toEqual([
      '1QeXb2Caf0s',
      'ADdXw-HMnwc',
      'EBBcMKXSdhU',
    ]);

    const ordered = await loadChannelVideoIds(
      { channel: '@shufflechannel', exclude: [] },
      undefined,
      { shuffle: false },
    );
    expect(ordered).toEqual([
      'EBBcMKXSdhU',
      '1QeXb2Caf0s',
      'ADdXw-HMnwc',
    ]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  } finally {
    global.fetch = original;
  }
});
