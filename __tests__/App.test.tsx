/**
 * @format
 */

import ReactTestRenderer from 'react-test-renderer';
import { Image } from 'react-native';
import App from '../App';
import { menuBackgrounds } from '../src/theme/screenBackground';

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

test('renders the hotel launcher', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(() => {
    renderer.unmount();
  });
});

test('Bonkflix focus paints its background image', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(() => {
    controlsFor(renderer!, 'Stream').press.props.onPress();
  });
  await ReactTestRenderer.act(() => {
    controlsFor(renderer!, 'Bonkflix').focus.props.onFocus();
  });

  const images = renderer!.root.findAllByType(Image);
  const background = images.find(
    image => image.props.source === menuBackgrounds.bonkflix.image,
  );
  expect(background?.props.resizeMode).toBe('contain');

  await ReactTestRenderer.act(() => {
    renderer!.unmount();
  });
});
