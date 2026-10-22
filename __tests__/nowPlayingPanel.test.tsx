import ReactTestRenderer from 'react-test-renderer';
import { Text } from 'react-native';

import { NowPlayingPanel } from '../src/components/NowPlayingPanel';
import { loadYouTubeVideoDetails } from '../src/services/youtubeVideo';

jest.mock('../src/services/youtubeVideo', () => ({
  loadYouTubeVideoDetails: jest.fn(async () => ({
    title: 'Fetched title',
    description: 'A short film about the room.',
  })),
}));

const loadDetails = jest.mocked(loadYouTubeVideoDetails);

function textFor(
  renderer: ReactTestRenderer.ReactTestRenderer,
  value: string,
) {
  return renderer.root.findAllByType(Text).some(node => {
    const children = node.props.children;
    return children === value || (Array.isArray(children) && children.join('') === value);
  });
}

test('learn more opens the description and close returns to the panel', async () => {
  const onPrevious = jest.fn();
  const onTogglePlay = jest.fn();
  const onNext = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <NowPlayingPanel
        track={{
          videoId: 'EBBcMKXSdhU',
          title: 'Evening arrival',
          paused: false,
        }}
        onPrevious={onPrevious}
        onNext={onNext}
        onTogglePlay={onTogglePlay}
      />,
    );
  });

  expect(textFor(renderer!, 'Evening arrival')).toBe(true);
  expect(textFor(renderer!, 'PAUSE')).toBe(true);
  expect(loadDetails).toHaveBeenCalledWith('EBBcMKXSdhU', expect.any(AbortSignal));

  const previous = renderer!.root.findByProps({
    testID: 'now-playing-previous',
  });
  expect(previous.props.focusable).toBe(true);
  await ReactTestRenderer.act(async () => {
    previous.props.onPress();
    renderer!.root.findByProps({ testID: 'now-playing-play' }).props.onPress();
    renderer!.root.findByProps({ testID: 'now-playing-next' }).props.onPress();
  });
  expect(onPrevious).toHaveBeenCalledTimes(1);
  expect(onTogglePlay).toHaveBeenCalledTimes(1);
  expect(onNext).toHaveBeenCalledTimes(1);

  await ReactTestRenderer.act(async () => {
    renderer!.root
      .findByProps({ testID: 'now-playing-learn-more' })
      .props.onPress();
  });

  expect(
    renderer!.root.findByProps({ testID: 'now-playing-description' }).props
      .children,
  ).toBe('A short film about the room.');
  expect(
    renderer!.root.findByProps({ testID: 'now-playing-close' }).props
      .hasTVPreferredFocus,
  ).toBe(true);

  await ReactTestRenderer.act(async () => {
    renderer!.root.findByProps({ testID: 'now-playing-close' }).props.onPress();
  });
  expect(
    renderer!.root.findAllByProps({ testID: 'now-playing-details' }),
  ).toHaveLength(0);

  await ReactTestRenderer.act(async () => {
    renderer!.unmount();
  });
});

test('an idle panel keeps the configured title and skips transport', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<NowPlayingPanel />);
  });

  expect(textFor(renderer!, 'Welcome film')).toBe(true);
  expect(
    renderer!.root.findByProps({ testID: 'now-playing-play' }).props.focusable,
  ).toBe(false);

  await ReactTestRenderer.act(async () => {
    renderer!.root
      .findByProps({ testID: 'now-playing-learn-more' })
      .props.onPress();
  });
  expect(
    renderer!.root.findByProps({ testID: 'now-playing-description' }).props
      .children,
  ).toBe('A short welcome loop for the lobby and in-room televisions.');

  await ReactTestRenderer.act(async () => {
    renderer!.unmount();
  });
});
