import ReactTestRenderer from 'react-test-renderer';
import ReactNativeBlobUtil from 'react-native-blob-util';
import App from '../App';
import {
  launcherConfig,
  welcomeMessageForGuest,
} from '../src/config/launcherConfig';
import { importHotelLogo, logoFileExtension } from '../src/services/hotelLogo';
import {
  defaultLauncherSettings,
  mergeLauncherSettings,
} from '../src/services/launcherSettings';

jest.mock('../src/config/mainStageMedia', () => ({
  loadMainStageMediaConfig: () => ({ channel: '', exclude: [] }),
}));

jest.mock('react-native-webview', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  return {
    WebView: (props: object) => ReactLib.createElement(View, props),
  };
});

test('welcome message fills the guest name from settings', () => {
  expect(welcomeMessageForGuest('Ethan')).toBe('Good Evening, Ethan');
  expect(welcomeMessageForGuest('  Ava  ')).toBe('Good Evening, Ava');
  expect(welcomeMessageForGuest('   ')).toBe('Good Evening');
  expect(launcherConfig.welcomeMessage).toContain('{guestName}');
  expect(welcomeMessageForGuest(defaultLauncherSettings().guestName)).toBe(
    'Good Evening, Guest',
  );
});

test('saved settings overlay defaults and keep an in-progress edit', () => {
  const defaults = defaultLauncherSettings();
  expect(defaults.guestName).toBe('Guest');
  expect(defaults.logoPath).toBeNull();
  expect(defaults.shuffleVideos).toBe(true);

  const stored = mergeLauncherSettings({
    guestName: 'Ava',
    discoverChannel: '',
    logoPath: '/data/hotel-launcher/hotel-logo.png',
    shuffleVideos: false,
    hotelLogo: 12,
    ignored: 'nope',
  });
  expect(stored.guestName).toBe('Ava');
  expect(stored.discoverChannel).toBe('');
  expect(stored.logoPath).toBe('/data/hotel-launcher/hotel-logo.png');
  expect(stored.shuffleVideos).toBe(false);
  expect(stored.weather).toBe(defaults.weather);

  const edited = mergeLauncherSettings(
    {
      guestName: 'Stored',
      weather: 'Rain',
      logoPath: '/stored.png',
      shuffleVideos: false,
    },
    {
      ...defaults,
      guestName: 'Typing',
      logoPath: '/typing.png',
      shuffleVideos: true,
    },
    new Set(['guestName', 'logoPath', 'shuffleVideos']),
  );
  expect(edited.guestName).toBe('Typing');
  expect(edited.logoPath).toBe('/typing.png');
  expect(edited.shuffleVideos).toBe(true);
  expect(edited.weather).toBe('Rain');
});

test('logo files use a picture extension', () => {
  expect(logoFileExtension('image/png', 'shot.heic')).toBe('png');
  expect(logoFileExtension(null, 'Lobby.JPEG')).toBe('jpg');
  expect(logoFileExtension(null, null, 'content://media/1')).toBe('jpg');
});

test('a gallery file is copied into app storage', async () => {
  const fs = ReactNativeBlobUtil.fs;
  jest.mocked(fs.exists).mockResolvedValue(true);
  const path = await importHotelLogo('file:///cache/photo.png', {
    mime: 'image/png',
    fileName: 'photo.png',
    previousPath: '/data/hotel-launcher/hotel-logo.jpg',
  });
  expect(path).toBe('/data/hotel-launcher/hotel-logo.png');
  expect(fs.cp).toHaveBeenCalledWith(
    '/cache/photo.png',
    '/data/hotel-launcher/hotel-logo.png',
  );
  expect(fs.unlink).toHaveBeenCalledWith('/data/hotel-launcher/hotel-logo.jpg');
});

function controlsFor(
  renderer: ReactTestRenderer.ReactTestRenderer,
  title: string,
) {
  const text = renderer.root.findByProps({ children: title });
  let node: ReactTestRenderer.ReactTestInstance | null = text;
  let press: ReactTestRenderer.ReactTestInstance | null = null;
  while (node) {
    if (press == null && typeof node.props.onPress === 'function') {
      press = node;
    }
    node = node.parent;
  }
  if (press == null) {
    throw new Error(`No pressable for ${title}`);
  }
  return press;
}

test('a guest name edit updates the welcome line', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(() => {
    controlsFor(renderer!, 'Settings').props.onPress();
  });

  const input = renderer!.root.findByProps({ testID: 'setting-guestName' });
  expect(input.props.value).toBe('Guest');
  const settingsFocus = renderer!.root.findByProps({ trapFocusUp: true });
  expect(settingsFocus.props.trapFocusDown).toBe(true);
  expect(settingsFocus.props.trapFocusLeft).toBeUndefined();
  expect(settingsFocus.findByProps({ testID: 'setting-guestName' })).toBe(
    input,
  );

  const shuffle = renderer!.root.findByProps({
    testID: 'setting-shuffle-videos',
  });
  expect(shuffle.findByProps({ children: 'On' })).toBeTruthy();
  await ReactTestRenderer.act(() => {
    shuffle.props.onPress();
  });
  expect(
    renderer!.root
      .findByProps({ testID: 'setting-shuffle-videos' })
      .findByProps({ children: 'Off' }),
  ).toBeTruthy();

  await ReactTestRenderer.act(() => {
    input.props.onChangeText('Ava');
  });

  expect(
    renderer!.root.findByProps({ children: 'Good Evening, Ava' }),
  ).toBeTruthy();

  await ReactTestRenderer.act(() => {
    renderer!.unmount();
  });
});
