import { useState } from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Animated, Pressable, Text } from 'react-native';
import { NavReturnProvider } from '../src/navigation/NavReturn';
import { ShellSlideProvider } from '../src/navigation/ShellSlide';
import { WatchTV } from '../src/screens/WatchTV';

const slideTargets: number[] = [];

beforeEach(() => {
  slideTargets.length = 0;
  jest.spyOn(Animated, 'timing').mockImplementation((value, config) => {
    const toValue =
      config != null && typeof config === 'object' && 'toValue' in config
        ? Number(config.toValue)
        : 0;
    slideTargets.push(toValue);
    return {
      start: (callback?: (result: { finished: boolean }) => void) => {
        if (value != null && 'setValue' in value) {
          (value.setValue as (next: number) => void)(toValue);
        }
        callback?.({ finished: true });
      },
      stop: () => {},
      reset: () => {},
    };
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

function Harness({ width = 0 }: { width?: number }) {
  const [fullscreen, setFullscreen] = useState(false);
  const screen = (
    <NavReturnProvider>
      <WatchTV
        fullscreen={fullscreen}
        onEnterFullscreen={() => setFullscreen(true)}
        onExitFullscreen={() => setFullscreen(false)}
      />
      <Pressable testID="leave-guide" onPress={() => setFullscreen(false)}>
        <Text>Leave</Text>
      </Pressable>
    </NavReturnProvider>
  );
  if (width <= 0) {
    return screen;
  }
  return <ShellSlideProvider width={width}>{screen}</ShellSlideProvider>;
}

test('sidebar state shows the guide grid', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<Harness />);
  });

  expect(renderer!.root.findByProps({ testID: 'watch-tv-preview' })).toBeTruthy();
  expect(renderer!.root.findByProps({ testID: 'watch-tv-preview-grid' })).toBeTruthy();
  expect(renderer!.root.findByProps({ children: 'NOW' })).toBeTruthy();
  expect(renderer!.root.findByProps({ children: 'Hotel TV' })).toBeTruthy();
  expect(renderer!.root.findByProps({ children: 'Hotel Channel' })).toBeTruthy();
  expect(renderer!.root.findByProps({ children: 'NBC' })).toBeTruthy();
  expect(renderer!.root.findAllByProps({ testID: 'watch-tv-grid' })).toHaveLength(0);

  await ReactTestRenderer.act(() => {
    renderer!.unmount();
  });
});

test('focus from the right opens the fullscreen guide and back returns', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<Harness />);
  });

  await ReactTestRenderer.act(() => {
    renderer!.root
      .findByProps({ testID: 'watch-tv-entry' })
      .props.onFocusChange(true);
  });

  expect(renderer!.root.findByProps({ testID: 'watch-tv-grid' })).toBeTruthy();
  expect(renderer!.root.findByProps({ children: 'NOW' })).toBeTruthy();
  expect(renderer!.root.findByProps({ children: 'NBC' })).toBeTruthy();
  expect(renderer!.root.findByProps({ children: 'Hotel Channel' })).toBeTruthy();
  expect(renderer!.root.findAllByProps({ testID: 'watch-tv-preview' })).toHaveLength(0);

  await ReactTestRenderer.act(() => {
    renderer!.root.findByProps({ testID: 'leave-guide' }).props.onPress();
  });

  expect(renderer!.root.findByProps({ testID: 'watch-tv-preview' })).toBeTruthy();
  expect(renderer!.root.findAllByProps({ testID: 'watch-tv-grid' })).toHaveLength(0);

  await ReactTestRenderer.act(() => {
    renderer!.unmount();
  });
});

test('right opens by sliding the shell left and the guide in from the right', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<Harness width={960} />);
  });

  slideTargets.length = 0;
  await ReactTestRenderer.act(() => {
    renderer!.root
      .findByProps({ testID: 'watch-tv-entry' })
      .props.onFocusChange(true);
  });

  expect(slideTargets).toEqual([-960, 0]);
  expect(renderer!.root.findByProps({ testID: 'watch-tv-grid' })).toBeTruthy();
  expect(renderer!.root.findAllByProps({ testID: 'watch-tv-preview' })).toHaveLength(0);

  await ReactTestRenderer.act(() => {
    renderer!.unmount();
  });
});
