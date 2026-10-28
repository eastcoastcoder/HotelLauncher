import { useEffect, useState } from 'react';
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
import { useNavReturn } from '../src/navigation/NavReturn';
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
      (globalThis as { __focusCalls?: number[] }).__focusCalls?.push(handle);
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
(globalThis as { __focusCalls?: number[] }).__focusCalls = focusCallLog;

function focusCalls() {
  return focusCallLog;
}

beforeEach(() => {
  focusCalls().length = 0;
});

function Harness({
  initial,
  onSelectSpy,
  onEntryFocus,
}: {
  initial: ScreenId;
  onSelectSpy?: (screen: ScreenId | null) => void;
  onEntryFocus?: () => void;
}) {
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
        {onEntryFocus == null ? null : (
          <EntryFocusTarget onFocus={onEntryFocus} />
        )}
        <Navigation
          active={screen}
          menuItems={menuItems}
          onItemFocus={item => {
            if (item.screen != null) {
              setScreen(item.screen);
            }
          }}
          onSelect={next => {
            onSelectSpy?.(next);
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

function EntryFocusTarget({ onFocus }: { onFocus: () => void }) {
  const nav = useNavReturn();
  useEffect(() => {
    nav?.registerEntryNode('WatchTV', { requestTVFocus: onFocus });
    return () => nav?.registerEntryNode('WatchTV', null);
  }, [nav, onFocus]);
  return null;
}

test('focusing a main-menu row previews its screen without selecting it', async () => {
  const onSelect = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <Harness initial="Discover" onSelectSpy={onSelect} />,
    );
  });

  await ReactTestRenderer.act(() => {
    pressableFor(renderer!, 'Stream').props.onFocus();
  });

  expect(pressableFor(renderer!, 'Bonkflix')).toBeDefined();
  expect(pressableFor(renderer!, 'Stream').props.hasTVPreferredFocus).toBe(
    undefined,
  );
  expect(pressableFor(renderer!, 'Bonkflix').props.hasTVPreferredFocus).toBe(
    undefined,
  );
  expect(onSelect).not.toHaveBeenCalled();
});

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

test('the main navigation keeps vertical focus within its rows', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<Harness initial="WatchTV" />);
  });

  expect(pressableFor(renderer!, 'Watch TV').props.nextFocusUp).toBeDefined();
  expect(pressableFor(renderer!, 'Watch TV').props.nextFocusDown).toBeDefined();

  await ReactTestRenderer.act(() => {
    renderer!.unmount();
  });
});

test('the active row does not reclaim preferred focus after it blurs', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<Harness initial="WatchTV" />);
  });

  const watchTV = pressableFor(renderer!, 'Watch TV');
  await ReactTestRenderer.act(() => {
    watchTV.props.onFocus();
  });
  expect(
    pressableFor(renderer!, 'Watch TV').props.hasTVPreferredFocus,
  ).toBeUndefined();

  await ReactTestRenderer.act(() => {
    pressableFor(renderer!, 'Watch TV').props.onBlur();
  });
  expect(
    pressableFor(renderer!, 'Watch TV').props.hasTVPreferredFocus,
  ).toBeUndefined();

  await ReactTestRenderer.act(() => {
    renderer!.unmount();
  });
});

test('Select on Watch TV requests focus on its entry target', async () => {
  const onEntryFocus = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <Harness initial="WatchTV" onEntryFocus={onEntryFocus} />,
    );
  });

  await ReactTestRenderer.act(() => {
    pressableFor(renderer!, 'Watch TV').props.onPress();
  });

  expect(onEntryFocus).toHaveBeenCalledTimes(1);
  await ReactTestRenderer.act(() => {
    renderer!.unmount();
  });
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

  const openedRow = pressableFor(renderer!, 'Stream').props.nextFocusDown;
  const submenuEntry = myMedia.props.nextFocusRight;

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
          preferredFocusId="dululu"
          onSelect={() => {}}
        />
      </BackgroundProvider>,
    );
  });

  expect(pressableFor(renderer!, 'Dululu').props.android_disableSound).toBe(
    true,
  );
  expect(pressableFor(renderer!, 'Dululu').props.hasTVPreferredFocus).toBe(
    true,
  );
  expect(pressableFor(renderer!, 'Bonkflix').props.hasTVPreferredFocus).toBe(
    undefined,
  );
});

test('navigation width is configurable without changing the default', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <BackgroundProvider>
        <>
          <Navigation
            active="MyMedia"
            menuItems={mediaMenuItems}
            width={280}
            onSelect={() => {}}
          />
          <Navigation
            active="Stream"
            menuItems={streamMenuItems}
            onSelect={() => {}}
          />
        </>
      </BackgroundProvider>,
    );
  });

  expect(
    pressableFor(renderer!, 'Connect My Headphones').parent?.parent?.props.style,
  )
    .toEqual(expect.arrayContaining([expect.objectContaining({ width: 280 })]));
  expect(pressableFor(renderer!, 'Bonkflix').parent?.parent?.props.style).toEqual(
    expect.arrayContaining([expect.objectContaining({ width: 200 })]),
  );
});
