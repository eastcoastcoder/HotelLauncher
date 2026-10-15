import React, { useState } from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text } from 'react-native';
import { Navigation } from '../src/components/Navigation';
import {
  BackgroundProvider,
  useBackground,
} from '../src/context/BackgroundContext';
import { streamMenuItems } from '../src/config/launcherConfig';
import { menuBackgrounds } from '../src/theme/screenBackground';

const frames: Array<(time: number) => void> = [];
const originalFrame = globalThis.requestAnimationFrame;

beforeEach(() => {
  frames.length = 0;
  globalThis.requestAnimationFrame = (callback: (time: number) => void) => {
    frames.push(callback);
    return frames.length;
  };
});

afterEach(() => {
  globalThis.requestAnimationFrame = originalFrame;
});

function Readout() {
  const { screenBackground, hoveredMenuItemId, activeMenuItemId } =
    useBackground();
  return (
    <>
      <Text testID="background">
        {screenBackground == null ? 'default' : String(screenBackground.image)}
      </Text>
      <Text testID="hovered">{hoveredMenuItemId ?? 'none'}</Text>
      <Text testID="active">{activeMenuItemId ?? 'none'}</Text>
    </>
  );
}

function textOf(renderer: ReactTestRenderer.ReactTestRenderer, testID: string) {
  return renderer.root.findByProps({ testID }).props.children;
}

function controlsFor(
  renderer: ReactTestRenderer.ReactTestRenderer,
  title: string,
) {
  const text = renderer.root.findByProps({ children: title });
  let node: ReactTestRenderer.ReactTestInstance | null = text;
  let focus: ReactTestRenderer.ReactTestInstance | null = null;
  let press: ReactTestRenderer.ReactTestInstance | null = null;
  while (node) {
    if (focus == null && typeof node.props.onFocus === 'function') {
      focus = node;
    }
    if (press == null && typeof node.props.onPress === 'function') {
      press = node;
    }
    node = node.parent;
  }
  if (focus == null || press == null) {
    throw new Error(`No focusable for ${title}`);
  }
  return { focus, press };
}

function Harness({
  onSelect = () => {},
}: {
  onSelect?: (screen: string | null) => void;
}) {
  return (
    <BackgroundProvider>
      <Readout />
      <Navigation
        active="Stream"
        menuItems={streamMenuItems}
        onSelect={onSelect}
      />
    </BackgroundProvider>
  );
}

async function flushFrame() {
  const pending = frames.splice(0, frames.length);
  await ReactTestRenderer.act(() => {
    pending.forEach(callback => callback(0));
  });
}

test('menu hover shows that row background and a row without one restores the default', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<Harness />);
  });

  expect(textOf(renderer!, 'background')).toBe('default');

  await ReactTestRenderer.act(() => {
    controlsFor(renderer!, 'Bonkflix').focus.props.onFocus();
  });
  expect(textOf(renderer!, 'background')).toBe(
    String(menuBackgrounds.bonkflix.image),
  );
  expect(textOf(renderer!, 'hovered')).toBe('bonkflix');

  await ReactTestRenderer.act(() => {
    controlsFor(renderer!, 'Bonkflix').focus.props.onBlur();
    controlsFor(renderer!, 'DogeTube').focus.props.onFocus();
  });
  expect(textOf(renderer!, 'background')).toBe(
    String(menuBackgrounds.dogetube.image),
  );
  expect(textOf(renderer!, 'hovered')).toBe('dogetube');

  await flushFrame();
  expect(textOf(renderer!, 'hovered')).toBe('dogetube');
  expect(textOf(renderer!, 'background')).toBe(
    String(menuBackgrounds.dogetube.image),
  );

  await ReactTestRenderer.act(() => {
    controlsFor(renderer!, 'DogeTube').focus.props.onBlur();
    controlsFor(renderer!, 'Amazon Prime Video').focus.props.onFocus();
  });
  expect(textOf(renderer!, 'background')).toBe('default');
  expect(textOf(renderer!, 'hovered')).toBe('prime');

  await flushFrame();
  expect(textOf(renderer!, 'hovered')).toBe('prime');
  expect(textOf(renderer!, 'background')).toBe('default');
});

test('Bonkflix stays on screen after select when focus leaves the row', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<Harness />);
  });

  const bonkflix = controlsFor(renderer!, 'Bonkflix');
  await ReactTestRenderer.act(() => {
    bonkflix.focus.props.onFocus();
    bonkflix.press.props.onPress();
  });
  await ReactTestRenderer.act(() => {
    bonkflix.focus.props.onBlur();
  });
  await flushFrame();

  expect(textOf(renderer!, 'hovered')).toBe('none');
  expect(textOf(renderer!, 'active')).toBe('bonkflix');
  expect(textOf(renderer!, 'background')).toBe(
    String(menuBackgrounds.bonkflix.image),
  );
});

function LeaveHarness() {
  const [showMenu, setShowMenu] = useState(true);
  return (
    <BackgroundProvider>
      <Readout />
      {showMenu ? (
        <Navigation
          active="Stream"
          menuItems={streamMenuItems}
          onSelect={() => {}}
        />
      ) : null}
      <Text testID="hide" onPress={() => setShowMenu(false)}>
        hide
      </Text>
    </BackgroundProvider>
  );
}

test('leaving the menu releases a Bonkflix claim', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<LeaveHarness />);
  });

  const bonkflix = controlsFor(renderer!, 'Bonkflix');
  await ReactTestRenderer.act(() => {
    bonkflix.focus.props.onFocus();
    bonkflix.press.props.onPress();
  });
  expect(textOf(renderer!, 'background')).toBe(
    String(menuBackgrounds.bonkflix.image),
  );

  await ReactTestRenderer.act(() => {
    renderer!.root.findByProps({ testID: 'hide' }).props.onPress();
  });
  expect(textOf(renderer!, 'hovered')).toBe('none');
  expect(textOf(renderer!, 'active')).toBe('none');
  expect(textOf(renderer!, 'background')).toBe('default');
});

test('Bonkflix scrim is the 7deg ramp from the plan', () => {
  const overlay = menuBackgrounds.bonkflix.overlay;
  expect(overlay).toHaveLength(1);
  expect(overlay[0]).toMatchObject({
    type: 'linear-gradient',
    direction: '7deg',
  });
  const stops = overlay[0].colorStops;
  expect(stops[0]).toMatchObject({
    color: 'rgba(0, 0, 0, 0.8500)',
    positions: ['0%'],
  });
  expect(stops[stops.length - 1]).toMatchObject({
    color: 'rgba(0, 0, 0, 0.6000)',
    positions: ['100%'],
  });
  expect(stops).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        color: 'rgba(0, 0, 0, 0.7250)',
        positions: ['53.50%'],
      }),
    ]),
  );
});

test('useBackground requires the provider', async () => {
  function Bare() {
    useBackground();
    return null;
  }

  class Boundary extends React.Component<
    { children: React.ReactNode },
    { message: string | null }
  > {
    state = { message: null };

    static getDerivedStateFromError(error: Error) {
      return { message: error.message };
    }

    render() {
      if (this.state.message != null) {
        return <Text testID="error">{this.state.message}</Text>;
      }
      return this.props.children;
    }
  }

  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <Boundary>
        <Bare />
      </Boundary>,
    );
  });
  errorSpy.mockRestore();

  expect(textOf(renderer!, 'error')).toBe(
    'useBackground must be used within BackgroundProvider',
  );
});
