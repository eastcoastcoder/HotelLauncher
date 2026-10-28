import { useState } from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Animated, Text } from 'react-native';
import { NavReturnProvider } from '../src/navigation/NavReturn';
import { ShellSlideProvider } from '../src/navigation/ShellSlide';
import { GuideGrid } from '../src/screens/GuideGrid';
import { WatchTV } from '../src/screens/WatchTV';
import { colors } from '../src/theme/colors';

const slideTargets: number[] = [];
let backHandler: (() => void) | null = null;

beforeEach(() => {
  slideTargets.length = 0;
  backHandler = null;
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

function Harness() {
  const [fullscreen, setFullscreen] = useState(false);
  return (
    <ShellSlideProvider width={960}>
      <NavReturnProvider>
        <Text testID="guide-state">
          {fullscreen ? 'fullscreen' : 'preview'}
        </Text>
        <WatchTV
          onFullscreenChange={setFullscreen}
          onCloseHandlerChange={close => {
            backHandler = close;
          }}
        />
      </NavReturnProvider>
    </ShellSlideProvider>
  );
}

test('the preview is cropped from the full-width guide without claiming focus', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<Harness />);
  });

  expect(
    renderer!.root.findByProps({ testID: 'watch-tv-preview-grid' }),
  ).toBeTruthy();
  expect(
    renderer!.root.findAll(
      node => node.props.hasTVPreferredFocus === true,
    ),
  ).toHaveLength(0);
  expect(
    renderer!.root.findByProps({ testID: 'guide-state' }).props.children,
  ).toBe('preview');

  await ReactTestRenderer.act(() => {
    renderer!.unmount();
  });
});

test('guide text is idle until a channel is focused and follows vertical focus', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<GuideGrid />);
  });

  const textColor = (title: string) => {
    const text = renderer!.root.findByProps({ children: title });
    const style = Array.isArray(text.props.style)
      ? text.props.style
      : [text.props.style];
    return style.find(
      value => value != null && typeof value === 'object' && 'color' in value,
    )?.color;
  };

  expect(textColor('Hotel TV')).toBe(colors.navIdle);
  expect(textColor('NBC')).toBe(colors.navIdle);
  await ReactTestRenderer.act(() => {
    renderer!.root
      .findByProps({ testID: 'guide-row-hotel' })
      .props.onFocusChange(true);
  });
  expect(textColor('Hotel TV')).toBe(colors.navActive);
  expect(textColor('NBC')).toBe(colors.navIdle);

  await ReactTestRenderer.act(() => {
    renderer!.root
      .findByProps({ testID: 'guide-row-nbc' })
      .props.onFocusChange(true);
    renderer!.root
      .findByProps({ testID: 'guide-row-hotel' })
      .props.onFocusChange(false);
  });
  expect(textColor('Hotel TV')).toBe(colors.navIdle);
  expect(textColor('NBC')).toBe(colors.navActive);

  await ReactTestRenderer.act(() => {
    renderer!.unmount();
  });
});

test('the navigation and full-width guide reveal together', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<Harness />);
  });

  await ReactTestRenderer.act(() => {
    renderer!.root
      .findByProps({ testID: 'watch-tv-entry' })
      .props.onFocusChange(true);
  });

  expect(slideTargets).toEqual([-228, 0]);
  expect(
    renderer!.root.findByProps({ testID: 'watch-tv-grid' }).props.interactive,
  ).toBe(true);
  expect(
    renderer!.root.findByProps({ testID: 'guide-row-hotel' })
      .props.hasTVPreferredFocus,
  ).toBeUndefined();
  expect(
    renderer!.root.findByProps({ testID: 'guide-state' }).props.children,
  ).toBe('fullscreen');
  expect(
    renderer!.root.findAllByProps({ testID: 'watch-tv-entry' }),
  ).toHaveLength(0);

  await ReactTestRenderer.act(() => {
    renderer!.root
      .findByProps({ testID: 'guide-row-hotel' })
      .props.onFocusChange(true);
  });
  expect(
    renderer!.root.findAllByProps({ testID: 'watch-tv-entry' }),
  ).toHaveLength(0);

  await ReactTestRenderer.act(() => {
    renderer!.root.findByType(GuideGrid).props.onClose();
  });

  expect(slideTargets).toEqual([-228, 0, 0, 228]);
  expect(
    renderer!.root.findByProps({ testID: 'watch-tv-preview-grid' }),
  ).toBeTruthy();
  expect(
    renderer!.root.findByProps({ testID: 'guide-state' }).props.children,
  ).toBe('preview');

  await ReactTestRenderer.act(() => {
    renderer!.unmount();
  });
});

test('the registered Back action closes the guide through its transition', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<Harness />);
  });

  await ReactTestRenderer.act(() => {
    renderer!.root
      .findByProps({ testID: 'watch-tv-entry' })
      .props.onFocusChange(true);
  });
  slideTargets.length = 0;

  await ReactTestRenderer.act(() => {
    backHandler?.();
  });

  expect(slideTargets).toEqual([0, 228]);
  expect(
    renderer!.root.findByProps({ testID: 'guide-state' }).props.children,
  ).toBe('preview');

  await ReactTestRenderer.act(() => {
    renderer!.unmount();
  });
});
