import React, { useState } from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Navigation } from '../src/components/Navigation';
import { BackgroundProvider } from '../src/context/BackgroundContext';
import {
  hotelInfoMenuItems,
  mediaMenuItems,
  menuItems,
  streamMenuItems,
} from '../src/config/launcherConfig';
import { NavReturnProvider } from '../src/navigation/NavReturn';
import { ScreenId } from '../src/types';

jest.mock('react-native/Libraries/ReactNative/RendererProxy', () => {
  const actual = jest.requireActual(
    'react-native/Libraries/ReactNative/RendererProxy',
  );
  const handles = new WeakMap<object, number>();
  let nextHandle = 10;
  return {
    ...actual,
    findNodeHandle: (node: object | number | null) => {
      if (typeof node === 'number') {
        return node;
      }
      if (node == null || typeof node !== 'object') {
        return null;
      }
      const existing = handles.get(node);
      if (existing != null) {
        return existing;
      }
      const handle = nextHandle;
      nextHandle += 1;
      handles.set(node, handle);
      (globalThis as {__focusCalls?: number[]}).__focusCalls?.push(handle);
      return handle;
    },
  };
});

function pressableFor(
  renderer: ReactTestRenderer.ReactTestRenderer,
  title: string,
) {
  const text = renderer.root.findByProps({ children: title });
  let node: ReactTestRenderer.ReactTestInstance | null = text;
  while (node) {
    if (typeof node.props.onPress === 'function') {
      return node;
    }
    node = node.parent;
  }
  throw new Error(`No focusable for ${title}`);
}

function preferredTitles(renderer: ReactTestRenderer.ReactTestRenderer) {
  return renderer.root
    .findAll(
      node =>
        node.props.hasTVPreferredFocus === true &&
        typeof node.props.onPress === 'function',
    )
    .map(node => {
      const label = node.findAll(
        child => typeof child.props.children === 'string',
      );
      return label[label.length - 1]?.props.children;
    });
}

const focusCallLog: number[] = [];
(globalThis as {__focusCalls?: number[]}).__focusCalls = focusCallLog;

function focusCalls() {
  return focusCallLog;
}

beforeEach(() => {
  focusCalls().length = 0;
});

function Harness({ initial }: { initial: ScreenId }) {
  const [screen, setScreen] = useState(initial);
  const submenu =
    screen === 'Stream'
      ? streamMenuItems
      : screen === 'MyMedia'
        ? mediaMenuItems
        : screen === 'HotelInfo'
          ? hotelInfoMenuItems
          : null;
  return (
    <BackgroundProvider>
      <NavReturnProvider>
        <Navigation
          active={screen}
          menuItems={menuItems}
          onSelect={next => {
            if (next != null) {
              setScreen(next);
            }
          }}
        />
        {submenu == null ? null : (
          <Navigation active={screen} menuItems={submenu} onSelect={() => {}} />
        )}
      </NavReturnProvider>
    </BackgroundProvider>
  );
}

test('a submenu does not prefer its first row', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<Harness initial="Stream" />);
  });

  expect(new Set(preferredTitles(renderer!))).toEqual(new Set(['Stream']));
  expect(pressableFor(renderer!, 'Bonkflix').props.hasTVPreferredFocus).toBe(
    undefined,
  );
  expect(pressableFor(renderer!, 'Discover').props.hasTVPreferredFocus).toBe(
    undefined,
  );
});

test('left from a submenu returns to the screen row that opened it', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<Harness initial="Discover" />);
  });

  await ReactTestRenderer.act(() => {
    pressableFor(renderer!, 'My Media').props.onPress();
  });

  const myMedia = pressableFor(renderer!, 'My Media');
  const headphones = pressableFor(renderer!, 'Connect My Headphones');
  const chromecast = pressableFor(renderer!, 'Chromecast');

  const calls = focusCalls();
  const openedRow = calls[calls.length - 2];
  const submenuEntry = calls[calls.length - 1];

  expect(myMedia.props.hasTVPreferredFocus).toBe(true);
  expect(headphones.props.hasTVPreferredFocus).toBe(undefined);
  expect(chromecast.props.nextFocusLeft).toBe(openedRow);
  expect(headphones.props.nextFocusLeft).toBe(openedRow);
  expect(myMedia.props.nextFocusRight).toBe(submenuEntry);
  expect(openedRow).not.toBe(submenuEntry);
  expect(pressableFor(renderer!, 'Discover').props.nextFocusRight).toBe(
    undefined,
  );
});

test('an explicit preferred row still takes focus', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <BackgroundProvider>
        <Navigation
          active="Stream"
          menuItems={streamMenuItems}
          preferredFocusId="hulu"
          onSelect={() => {}}
        />
      </BackgroundProvider>,
    );
  });

  expect(pressableFor(renderer!, 'Hulu').props.android_disableSound).toBe(true);
  expect(pressableFor(renderer!, 'Hulu').props.hasTVPreferredFocus).toBe(true);
  expect(pressableFor(renderer!, 'Bonkflix').props.hasTVPreferredFocus).toBe(
    undefined,
  );
});
