import { streamMenuItems } from '../src/config/launcherConfig';
import {
  normalizeCustomAppIds,
  normalizeInstalledApps,
} from '../src/services/installedApps';
import { addedStreamAppId } from '../src/services/streamLayout';
import {
  STREAM_ADD_APP_ID,
  STREAM_HIDDEN_APPS_ID,
  applyCustomAppIds,
  buildStreamMenu,
  focusNeighbor,
  hiddenDefaultRows,
  resolveLaunchAppId,
  streamRowKind,
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

test('the stream menu hides defaults, then lists added apps and utility rows', () => {
  const plex = {
    id: addedStreamAppId('com.plexapp.android'),
    title: 'Plex',
    appId: 'com.plexapp.android',
  };
  const menu = buildStreamMenu(
    streamMenuItems,
    { dogetube: 'com.netflix.ninja' },
    ['bonkflix'],
    [plex],
  );
  expect(menu.map(item => item.id)).toEqual([
    'dogetube',
    'primecheems',
    'dogeneyplus',
    'dululu',
    'hbomaxxing',
    plex.id,
    STREAM_HIDDEN_APPS_ID,
    STREAM_ADD_APP_ID,
  ]);
  expect(menu.find(item => item.id === 'dogetube')?.customAppId).toBe(
    'com.netflix.ninja',
  );
  expect(menu.find(item => item.id === 'bonkflix')).toBeUndefined();
  expect(menu.at(-1)).toMatchObject({
    id: STREAM_ADD_APP_ID,
    title: 'Add app',
    appId: null,
  });

  const visible = buildStreamMenu(streamMenuItems, {}, [], []);
  expect(visible.map(item => item.id)).toEqual([
    ...streamMenuItems.map(item => item.id),
    STREAM_ADD_APP_ID,
  ]);
  expect(hiddenDefaultRows(streamMenuItems, ['dululu', 'bonkflix'])).toEqual([
    { id: 'bonkflix', title: 'Bonkflix' },
    { id: 'dululu', title: 'Dululu' },
  ]);
  expect(streamRowKind('dogetube', new Set([plex.id]))).toBe('default');
  expect(streamRowKind(plex.id, new Set([plex.id]))).toBe('added');
  expect(streamRowKind(STREAM_ADD_APP_ID, new Set())).toBe('add');
  expect(streamRowKind(STREAM_HIDDEN_APPS_ID, new Set())).toBe('hidden');
  expect(focusNeighbor(menu, 'dogetube')).toBe('primecheems');
  expect(focusNeighbor(menu, STREAM_ADD_APP_ID)).toBe(STREAM_HIDDEN_APPS_ID);
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
