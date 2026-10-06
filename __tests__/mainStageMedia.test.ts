import example from '../src/config/mainStage.example.json';
import {
  normalizeMainStageMediaConfig,
  videoIdFromInput,
} from '../src/config/mainStageMedia';
import {
  buildYouTubeStageHtml,
  isStageRequestAllowed,
} from '../src/components/youtubeStageHtml';
import {
  channelVideosPageUrl,
  filterExcludedVideoIds,
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
  expect(html).toContain('Math.random');
  expect(html).toContain('setStageMuted');
  expect(html).toContain('overflow: hidden');
  expect(html).toContain('position: fixed');
  expect(html.indexOf('shuffle(ids)')).toBeLessThan(html.indexOf('new YT.Player'));
  expect(html).not.toContain('(index + 1) % ids.length');
  expect(html).not.toContain('ADdXw-HMnwc');
  expect(
    isStageRequestAllowed('https://www.youtube.com/embed/EBBcMKXSdhU'),
  ).toBe(true);
  expect(isStageRequestAllowed('https://com.hotellauncher/')).toBe(true);
  expect(isStageRequestAllowed('https://example.com/watch')).toBe(false);
});
