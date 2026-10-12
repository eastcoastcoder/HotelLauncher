import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { StyleSheet, Text } from 'react-native';
import { LaunchNotice } from '../src/components/LaunchNotice';
import { BackgroundProvider } from '../src/context/BackgroundContext';
import { LaunchNoticeProvider } from '../src/context/LaunchNoticeContext';
import { Stream } from '../src/screens/Stream';
import {
  clearCustomAppId,
  getCustomAppIds,
  launchApp,
  listInstalledApps,
  setCustomAppId,
} from '../src/services/installedApps';

jest.mock('react-native/Libraries/Modal/Modal', () => {
  const ReactActual = require('react');
  const { View: MockView } = require('react-native');
  const Modal = ({
    visible,
    children,
  }: {
    visible?: boolean;
    children?: React.ReactNode;
  }) =>
    visible === false
      ? null
      : ReactActual.createElement(MockView, null, children);
  return { __esModule: true, default: Modal };
});

jest.mock('../src/services/installedApps', () => ({
  listInstalledApps: jest.fn(async () => [
    { appId: 'com.netflix.ninja', label: 'Netflix' },
    { appId: 'com.google.android.youtube.tv', label: 'YouTube' },
  ]),
  launchApp: jest.fn(async () => true),
  getCustomAppIds: jest.fn(async () => ({})),
  setCustomAppId: jest.fn(async () => undefined),
  clearCustomAppId: jest.fn(async () => undefined),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

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
    return children === title || (Array.isArray(children) && children.includes(title));
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

test('select launches the built-in app and hold Select can replace or clear it', async () => {
  const renderer = renderStream();
  await flush();
  expect(mockedGet).toHaveBeenCalled();

  await ReactTestRenderer.act(async () => {
    pressableFor(renderer, 'YouTube').props.onPress();
  });
  await flush();
  expect(mockedLaunch).toHaveBeenCalledWith('com.google.android.youtube.tv');

  await ReactTestRenderer.act(async () => {
    pressableFor(renderer, 'YouTube').props.onLongPress();
  });
  await flush();
  expect(mockedList).toHaveBeenCalled();
  expect(renderer.root.findByProps({ testID: 'custom-app-dialog' })).toBeTruthy();

  await ReactTestRenderer.act(async () => {
    renderer.root
      .findByProps({ testID: 'custom-app-com.netflix.ninja' })
      .props.onPress();
  });
  await flush();
  expect(mockedSet).toHaveBeenCalledWith('youtube', 'com.netflix.ninja');

  await ReactTestRenderer.act(async () => {
    pressableFor(renderer, 'YouTube').props.onPress();
  });
  await flush();
  expect(mockedLaunch).toHaveBeenLastCalledWith('com.netflix.ninja');

  await ReactTestRenderer.act(async () => {
    pressableFor(renderer, 'YouTube').props.onLongPress();
  });
  await flush();
  await ReactTestRenderer.act(async () => {
    renderer.root.findByProps({ testID: 'custom-app-clear' }).props.onPress();
  });
  await flush();
  expect(mockedClear).toHaveBeenCalledWith('youtube');
  expect(renderer.root.findByProps({ testID: 'custom-app-dialog' })).toBeTruthy();

  await ReactTestRenderer.act(async () => {
    renderer.root.findByProps({ testID: 'custom-app-dialog' });
    const back = renderer.root.findAll(
      node => typeof node.props.onRequestClose === 'function',
    );
    if (back.length > 0) {
      back[0].props.onRequestClose();
    }
  });

  await ReactTestRenderer.act(async () => {
    pressableFor(renderer, 'YouTube').props.onPress();
  });
  await flush();
  expect(mockedLaunch).toHaveBeenLastCalledWith(
    'com.google.android.youtube.tv',
  );
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

test('a failed launch is drawn over the promo banner', async () => {
  mockedLaunch.mockRejectedValueOnce(new Error('missing'));
  const renderer = renderStream();
  await flush();

  await ReactTestRenderer.act(async () => {
    pressableFor(renderer, 'YouTube').props.onPress();
  });
  await flush();

  const notice = renderer.root.findByProps({ testID: 'stream-launch-notice' });
  expect(notice.props.children).toBe(
    'YouTube could not open com.google.android.youtube.tv. Hold Select to pick an installed app.',
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
