import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactTestRenderer from 'react-test-renderer';
import { StyleSheet, Text } from 'react-native';

import { LaunchNotice } from '../src/components/LaunchNotice';
import { BackgroundProvider } from '../src/context/BackgroundContext';
import { LaunchNoticeProvider } from '../src/context/LaunchNoticeContext';
import { Stream } from '../src/screens/Stream';
import { streamPosters } from '../src/theme/streamPosters';
import {
  clearCustomAppId,
  getCustomAppIds,
  launchApp,
  listInstalledApps,
  setCustomAppId,
} from '../src/services/installedApps';

jest.mock('../src/services/installedApps', () => ({
  listInstalledApps: jest.fn(async () => [
    { appId: 'com.netflix.ninja', label: 'BonkFlix' },
    { appId: 'com.google.android.youtube.tv', label: 'DogeTube' },
  ]),
  launchApp: jest.fn(async () => true),
  getCustomAppIds: jest.fn(async () => ({})),
  setCustomAppId: jest.fn(async () => undefined),
  clearCustomAppId: jest.fn(async () => undefined),
}));

const frames: Array<(time: number) => void> = [];
const originalFrame = globalThis.requestAnimationFrame;

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  frames.length = 0;
  globalThis.requestAnimationFrame = (callback: (time: number) => void) => {
    frames.push(callback);
    return frames.length;
  };
});

afterEach(() => {
  globalThis.requestAnimationFrame = originalFrame;
});

function flushFrame() {
  const pending = frames.splice(0);
  ReactTestRenderer.act(() => {
    pending.forEach(callback => callback(0));
  });
}

const mockedLaunch = jest.mocked(launchApp);
const mockedList = jest.mocked(listInstalledApps);
const mockedGet = jest.mocked(getCustomAppIds);
const mockedSet = jest.mocked(setCustomAppId);
const mockedClear = jest.mocked(clearCustomAppId);

function pressableFor(
  renderer: ReactTestRenderer.ReactTestRenderer,
  title: string,
) {
  const text = renderer.root.findAllByType(Text).find(node => {
    const children = node.props.children;
    return (
      children === title ||
      (Array.isArray(children) && children.includes(title))
    );
  });
  if (text == null) {
    throw new Error(`No label for ${title}`);
  }
  let node: ReactTestRenderer.ReactTestInstance | null = text;
  while (node) {
    if (typeof node.props.onPress === 'function') {
      return node;
    }
    node = node.parent;
  }
  throw new Error(`No pressable for ${title}`);
}

async function flush() {
  await ReactTestRenderer.act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function releaseOpeningSelect(
  renderer: ReactTestRenderer.ReactTestRenderer,
  title = 'DogeTube',
) {
  await ReactTestRenderer.act(async () => {
    pressableFor(renderer, title).props.onPressOut();
  });
}

function renderStream() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <LaunchNoticeProvider>
        <BackgroundProvider>
          <Stream screen="Stream" />
          <LaunchNotice />
        </BackgroundProvider>
      </LaunchNoticeProvider>,
    );
  });
  return renderer;
}

function showPoster(renderer: ReactTestRenderer.ReactTestRenderer, title: string) {
  ReactTestRenderer.act(() => {
    pressableFor(renderer, title).props.onFocus();
  });
  const slot = renderer.root.findByProps({ testID: 'stream-poster-slot' });
  ReactTestRenderer.act(() => {
    slot.props.onLayout({
      nativeEvent: { layout: { width: 800, height: 600, x: 0, y: 0 } },
    });
  });
  return renderer.root.findByProps({ testID: 'stream-poster' });
}

test('the focused stream service shows its poster on the right', async () => {
  const renderer = renderStream();
  await flush();
  expect(renderer.root.findAllByProps({ testID: 'stream-poster' })).toHaveLength(
    0,
  );

  const bonkflix = showPoster(renderer, 'Bonkflix');
  expect(bonkflix.props.source).toBe(streamPosters.bonkflix);
  expect(bonkflix.props.resizeMode).toBe('contain');
  expect(bonkflix.props.accessibilityLabel).toBe('Bonkflix poster');
  const frame = renderer.root.findByProps({ testID: 'stream-poster' }).parent;
  expect(StyleSheet.flatten(frame?.props.style)).toMatchObject({
    width: 600,
    height: 600,
    overflow: 'hidden',
  });
  expect(
    StyleSheet.flatten(
      renderer.root.findByProps({ testID: 'stream-poster-slot' }).props.style,
    ),
  ).toMatchObject({
    flex: 1,
    alignItems: 'flex-end',
  });

  const dogetube = showPoster(renderer, 'DogeTube');
  expect(dogetube.props.source).toBe(streamPosters.dogetube);
  expect(dogetube.props.accessibilityLabel).toBe('DogeTube poster');

  const prime = showPoster(renderer, 'Prime Cheems');
  expect(prime.props.source).toBe(streamPosters.primecheems);
  expect(showPoster(renderer, 'DogeNEY+').props.source).toBe(
    streamPosters.dogeneyplus,
  );
  expect(showPoster(renderer, 'Dululu').props.source).toBe(streamPosters.dululu);
  expect(showPoster(renderer, 'HBO Maxxing').props.source).toBe(
    streamPosters.hbomaxxing,
  );

  ReactTestRenderer.act(() => {
    pressableFor(renderer, 'HBO Maxxing').props.onBlur();
  });
  flushFrame();
  expect(renderer.root.findAllByProps({ testID: 'stream-poster' })).toHaveLength(
    0,
  );
});

test('select launches the built-in app and hold Select can replace or clear it', async () => {
  const renderer = renderStream();
  await flush();
  expect(mockedGet).toHaveBeenCalled();

  await ReactTestRenderer.act(async () => {
    pressableFor(renderer, 'DogeTube').props.onPress();
  });
  await flush();
  expect(mockedLaunch).toHaveBeenCalledWith('com.google.android.youtube.tv');

  await ReactTestRenderer.act(async () => {
    pressableFor(renderer, 'DogeTube').props.onLongPress();
  });
  await flush();
  expect(mockedList).toHaveBeenCalled();
  expect(
    renderer.root.findByProps({ testID: 'custom-app-dialog' }),
  ).toBeTruthy();
  await releaseOpeningSelect(renderer);

  await ReactTestRenderer.act(async () => {
    renderer.root
      .findByProps({ testID: 'custom-app-com.netflix.ninja' })
      .props.onPress();
  });
  await flush();
  expect(mockedSet).toHaveBeenCalledWith('dogetube', 'com.netflix.ninja');

  await ReactTestRenderer.act(async () => {
    pressableFor(renderer, 'DogeTube').props.onPress();
  });
  await flush();
  expect(mockedLaunch).toHaveBeenLastCalledWith('com.netflix.ninja');

  await ReactTestRenderer.act(async () => {
    pressableFor(renderer, 'DogeTube').props.onLongPress();
  });
  await flush();
  await releaseOpeningSelect(renderer);
  await ReactTestRenderer.act(async () => {
    renderer.root.findByProps({ testID: 'custom-app-clear' }).props.onPress();
  });
  await flush();
  expect(mockedClear).toHaveBeenCalledWith('dogetube');
  expect(
    renderer.root.findByProps({ testID: 'custom-app-dialog' }),
  ).toBeTruthy();

  await ReactTestRenderer.act(async () => {
    const back = renderer.root.findAll(
      node => typeof node.props.onRequestClose === 'function',
    );
    back[0].props.onRequestClose();
  });

  await ReactTestRenderer.act(async () => {
    pressableFor(renderer, 'DogeTube').props.onPress();
  });
  await flush();
  expect(mockedLaunch).toHaveBeenLastCalledWith(
    'com.google.android.youtube.tv',
  );
});

test('the select release that opens the dialog does not choose or dismiss it', async () => {
  const renderer = renderStream();
  await flush();

  await ReactTestRenderer.act(async () => {
    pressableFor(renderer, 'DogeTube').props.onLongPress();
  });
  await flush();
  const dialog = renderer.root.findByProps({ testID: 'custom-app-dialog' });
  expect(dialog).toBeTruthy();
  expect(
    renderer.root.findByProps({ testID: 'custom-app-com.netflix.ninja' }).props
      .onPress,
  ).toBeUndefined();
  expect(
    renderer.root
      .findAllByProps({ testID: 'custom-app-hide' })
      .some(
        node =>
          typeof node.type !== 'function' &&
          typeof node.props.onPress === 'function',
      ),
  ).toBe(false);
  expect(
    renderer.root.findAllByProps({ testID: 'custom-app-select-guard' }),
  ).toHaveLength(0);

  expect(mockedSet).not.toHaveBeenCalled();
  expect(
    renderer.root.findByProps({ testID: 'custom-app-dialog' }),
  ).toBeTruthy();

  await releaseOpeningSelect(renderer);
  const chooseNetflix = () =>
    renderer.root
      .findByProps({ testID: 'custom-app-com.netflix.ninja' })
      .props.onPress();

  await ReactTestRenderer.act(async () => {
    chooseNetflix();
  });
  await flush();
  expect(mockedSet).toHaveBeenCalledWith('dogetube', 'com.netflix.ninja');
  expect(
    renderer.root.findAllByProps({ testID: 'custom-app-dialog' }),
  ).toHaveLength(0);
});

test('Bonkflix select launches Netflix by default', async () => {
  const renderer = renderStream();
  await flush();

  await ReactTestRenderer.act(async () => {
    pressableFor(renderer, 'Bonkflix').props.onPress();
  });
  await flush();
  expect(mockedLaunch).toHaveBeenCalledWith('com.netflix.ninja');
});

test('add app appends one row and select launches that package', async () => {
  const renderer = renderStream();
  await flush();

  await ReactTestRenderer.act(async () => {
    pressableFor(renderer, 'Add app').props.onPress();
  });
  await flush();
  await ReactTestRenderer.act(async () => {
    renderer.root
      .findByProps({ testID: 'custom-app-com.netflix.ninja' })
      .props.onPress();
  });
  await flush();
  expect(
    renderer.root.findAllByProps({ testID: 'custom-app-dialog' }),
  ).toHaveLength(0);

  await ReactTestRenderer.act(async () => {
    pressableFor(renderer, 'BonkFlix').props.onPress();
  });
  await flush();
  expect(mockedLaunch).toHaveBeenLastCalledWith('com.netflix.ninja');

  await ReactTestRenderer.act(async () => {
    pressableFor(renderer, 'Add app').props.onPress();
  });
  await flush();
  await ReactTestRenderer.act(async () => {
    renderer.root
      .findByProps({ testID: 'custom-app-com.netflix.ninja' })
      .props.onPress();
  });
  await flush();
  expect(
    renderer.root.findAll(
      node =>
        node.type === Text && node.props.children === 'BonkFlix',
    ),
  ).toHaveLength(1);
});

test('hide removes a default and hidden apps restores one at a time', async () => {
  const renderer = renderStream();
  await flush();

  await ReactTestRenderer.act(async () => {
    pressableFor(renderer, 'Bonkflix').props.onLongPress();
  });
  await flush();
  await releaseOpeningSelect(renderer, 'Bonkflix');
  await ReactTestRenderer.act(async () => {
    renderer.root.findByProps({ testID: 'custom-app-hide' }).props.onPress();
  });
  await flush();
  expect(renderer.root.findAllByProps({ children: 'Bonkflix' })).toHaveLength(0);
  expect(pressableFor(renderer, 'Hidden apps')).toBeTruthy();

  await ReactTestRenderer.act(async () => {
    pressableFor(renderer, 'DogeTube').props.onLongPress();
  });
  await flush();
  await releaseOpeningSelect(renderer, 'DogeTube');
  await ReactTestRenderer.act(async () => {
    renderer.root.findByProps({ testID: 'custom-app-hide' }).props.onPress();
  });
  await flush();

  await ReactTestRenderer.act(async () => {
    pressableFor(renderer, 'Hidden apps').props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    renderer.root.findByProps({ testID: 'hidden-app-bonkflix' }).props.onPress();
  });
  await flush();
  expect(pressableFor(renderer, 'Bonkflix')).toBeTruthy();
  expect(
    renderer.root.findByProps({ testID: 'hidden-apps-dialog' }),
  ).toBeTruthy();
  expect(
    renderer.root.findAllByProps({ testID: 'hidden-app-dogetube' }).some(
      node =>
        typeof node.type !== 'function' &&
        typeof node.props.onPress === 'function',
    ),
  ).toBe(true);

  await ReactTestRenderer.act(async () => {
    renderer.root.findByProps({ testID: 'hidden-app-dogetube' }).props.onPress();
  });
  await flush();
  expect(pressableFor(renderer, 'DogeTube')).toBeTruthy();
  expect(
    renderer.root.findAllByProps({ testID: 'hidden-apps-dialog' }),
  ).toHaveLength(0);
  expect(renderer.root.findAllByProps({ children: 'Hidden apps' })).toHaveLength(
    0,
  );
});

test('hold Select on an added row can remove it', async () => {
  mockedList.mockResolvedValueOnce([
    { appId: 'com.plexapp.android', label: 'Plex' },
  ]);
  const renderer = renderStream();
  await flush();
  await ReactTestRenderer.act(async () => {
    pressableFor(renderer, 'Add app').props.onPress();
  });
  await flush();
  await ReactTestRenderer.act(async () => {
    renderer.root
      .findByProps({ testID: 'custom-app-com.plexapp.android' })
      .props.onPress();
  });
  await flush();

  await ReactTestRenderer.act(async () => {
    pressableFor(renderer, 'Plex').props.onLongPress();
  });
  await flush();
  expect(
    renderer.root.findAllByProps({ testID: 'custom-app-remove' }).length,
  ).toBeGreaterThan(0);
  await releaseOpeningSelect(renderer, 'Plex');
  await ReactTestRenderer.act(async () => {
    renderer.root.findByProps({ testID: 'custom-app-remove' }).props.onPress();
  });
  await flush();
  expect(renderer.root.findAllByProps({ children: 'Plex' })).toHaveLength(0);
  expect(pressableFor(renderer, 'DogeTube')).toBeTruthy();
});

test('a failed layout save leaves the default row in place', async () => {
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('disk'));
  const renderer = renderStream();
  await flush();

  await ReactTestRenderer.act(async () => {
    pressableFor(renderer, 'Bonkflix').props.onLongPress();
  });
  await flush();
  await releaseOpeningSelect(renderer, 'Bonkflix');
  await ReactTestRenderer.act(async () => {
    renderer.root.findByProps({ testID: 'custom-app-hide' }).props.onPress();
  });
  await flush();

  expect(pressableFor(renderer, 'Bonkflix')).toBeTruthy();
  expect(
    renderer.root.findByProps({ testID: 'stream-launch-notice' }).props.children,
  ).toBe('The stream list could not be saved.');
});

test('a failed launch is drawn over the promo banner', async () => {
  mockedLaunch.mockRejectedValueOnce(new Error('missing'));
  const renderer = renderStream();
  await flush();

  await ReactTestRenderer.act(async () => {
    pressableFor(renderer, 'DogeTube').props.onPress();
  });
  await flush();

  const notice = renderer.root.findByProps({ testID: 'stream-launch-notice' });
  expect(notice.props.children).toBe(
    'DogeTube could not open com.google.android.youtube.tv. Hold Select to pick an installed app.',
  );
  expect(StyleSheet.flatten(notice.props.style)).toMatchObject({
    color: '#FFFFFF',
    backgroundColor: 'rgba(16, 23, 34, 0.72)',
  });
  expect(StyleSheet.flatten(notice.parent?.props.style)).toMatchObject({
    position: 'absolute',
    bottom: 0,
    zIndex: 2,
    elevation: 4,
  });
});
