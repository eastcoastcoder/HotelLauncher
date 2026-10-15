import { streamMenuItems } from '../src/config/launcherConfig';
import {
  normalizeCustomAppIds,
  normalizeInstalledApps,
} from '../src/services/installedApps';
import {
  applyCustomAppIds,
  resolveLaunchAppId,
} from '../src/services/streamLaunch';

test('stream rows use Android package ids and an empty custom app', () => {
  expect(
    streamMenuItems.map(item => [item.id, item.appId, item.customAppId]),
  ).toEqual([
    ['bonkflix', 'com.netflix.ninja', null],
    ['dogetube', 'com.google.android.youtube.tv', null],
    ['primecheems', 'com.amazon.amazonvideo.livingroom', null],
    ['dogeneyplus', 'com.disney.disneyplus', null],
    ['dululu', 'com.hulu.livingroomplus', null],
    ['hbomaxxing', 'com.wbd.stream', null],
  ]);
});

test('a custom app id is launched ahead of the built-in id', () => {
  expect(
    resolveLaunchAppId({
      appId: 'com.google.android.youtube.tv',
      customAppId: 'com.netflix.ninja',
    }),
  ).toBe('com.netflix.ninja');
  expect(
    resolveLaunchAppId({
      appId: 'com.disney.disneyplus',
      customAppId: '  ',
    }),
  ).toBe('com.disney.disneyplus');
  expect(resolveLaunchAppId({ appId: null, customAppId: null })).toBeNull();
});

test('saved custom ids replace the config field and clear restores it', () => {
  const assigned = applyCustomAppIds(streamMenuItems, {
    dogetube: 'com.netflix.ninja',
    bonkflix: '   ',
  });
  expect(assigned.find(item => item.id === 'dogetube')?.customAppId).toBe(
    'com.netflix.ninja',
  );
  expect(assigned.find(item => item.id === 'bonkflix')?.customAppId).toBeNull();
  expect(
    streamMenuItems.find(item => item.id === 'dogetube')?.customAppId,
  ).toBe(null);

  const cleared = applyCustomAppIds(streamMenuItems, {});
  expect(cleared.every(item => item.customAppId == null)).toBe(true);
});

test('native app lists drop blank package ids', () => {
  expect(
    normalizeInstalledApps([
      { appId: ' com.netflix.ninja ', label: ' Netflix ' },
      { appId: ' ', label: 'Missing' },
      { label: 'No id' },
      null,
    ]),
  ).toEqual([{ appId: 'com.netflix.ninja', label: 'Netflix' }]);
  expect(
    normalizeCustomAppIds({
      youtube: ' com.netflix.ninja ',
      prime: ' ',
      extra: 12,
    }),
  ).toEqual({ youtube: 'com.netflix.ninja' });
});
