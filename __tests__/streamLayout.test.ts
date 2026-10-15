import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addedStreamAppId,
  loadStreamLayout,
  normalizeStreamLayout,
  saveStreamLayout,
} from '../src/services/streamLayout';

const defaults = ['bonkflix', 'dogetube'];

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('normalize keeps known hidden ids and one row per package', () => {
  expect(
    normalizeStreamLayout(
      {
        hiddenDefaultIds: ['dogetube', 'missing', 'dogetube', 4],
        addedApps: [
          { title: ' Plex ', appId: ' com.plexapp.android ' },
          { title: 'Again', appId: 'com.plexapp.android' },
          { title: ' ', appId: 'tv.plex' },
          { title: 'Nope', appId: ' ' },
          null,
        ],
      },
      defaults,
    ),
  ).toEqual({
    hiddenDefaultIds: ['dogetube'],
    addedApps: [
      {
        id: addedStreamAppId('com.plexapp.android'),
        title: 'Plex',
        appId: 'com.plexapp.android',
      },
      {
        id: addedStreamAppId('tv.plex'),
        title: 'tv.plex',
        appId: 'tv.plex',
      },
    ],
  });
  expect(normalizeStreamLayout(null, defaults)).toEqual({
    hiddenDefaultIds: [],
    addedApps: [],
  });
});

test('load reads a saved layout and rejects a broken payload', async () => {
  await saveStreamLayout({
    hiddenDefaultIds: ['bonkflix'],
    addedApps: [
      {
        id: 'stale',
        title: 'Plex',
        appId: 'com.plexapp.android',
      },
    ],
  });
  await expect(loadStreamLayout(defaults)).resolves.toEqual({
    hiddenDefaultIds: ['bonkflix'],
    addedApps: [
      {
        id: addedStreamAppId('com.plexapp.android'),
        title: 'Plex',
        appId: 'com.plexapp.android',
      },
    ],
  });

  await AsyncStorage.setItem('stream_layout', '{');
  await expect(loadStreamLayout(defaults)).rejects.toThrow(
    'stream layout is not json',
  );
});
