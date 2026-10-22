import { videoDetailsFromWatchHtml } from '../src/services/youtubeVideo';

test('watch page video details keep the title and description', () => {
  const html = [
    '"videoDetails":{"videoId":"abcdefghijk","title":"Hello \\"Stay\\"",',
    '"shortDescription":"Line\\n{Two}","lengthSeconds":"3","keywords":["a"]}',
  ].join('');

  expect(videoDetailsFromWatchHtml(html)).toEqual({
    title: 'Hello "Stay"',
    description: 'Line\n{Two}',
  });
  expect(videoDetailsFromWatchHtml('no details')).toEqual({
    title: '',
    description: '',
  });
});
