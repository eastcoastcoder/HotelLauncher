const React = require('react');
import ReactTestRenderer from 'react-test-renderer';
import { Platform, Linking } from 'react-native';
import { MyMedia } from '../src/screens/MyMedia';
import { BackgroundProvider } from '../src/context/BackgroundContext';
import { NavReturnProvider } from '../src/navigation/NavReturn';
import { openHeadphoneSettings } from '../src/services/bluetoothSettings';

const mockSendIntent = jest.spyOn(Linking, 'sendIntent');
const mockOpenSettings = jest.spyOn(Linking, 'openSettings');

const ACCESSORIES_SLICE =
  'content://com.android.tv.settings.accessories.sliceprovider/general';

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

function renderMyMedia() {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      React.createElement(
        BackgroundProvider,
        null,
        React.createElement(
          NavReturnProvider,
          null,
          React.createElement(MyMedia, { screen: 'MyMedia' }),
        ),
      ),
    );
  });
  return renderer!;
}

describe('Bluetooth settings', () => {
  const originalOs = Platform.OS;

  beforeEach(() => {
    Platform.OS = 'android';
    mockSendIntent.mockReset().mockResolvedValue(undefined);
    mockOpenSettings.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    Platform.OS = originalOs;
  });

  test('the headphones row opens Remotes and Accessories', async () => {
    const renderer = renderMyMedia();

    await ReactTestRenderer.act(async () => {
      pressableFor(renderer, 'Connect My Headphones').props.onPress();
    });

    expect(mockSendIntent).toHaveBeenCalledWith('android.settings.SLICE_SETTINGS', [
      { key: 'slice_uri', value: ACCESSORIES_SLICE },
    ]);
    expect(mockOpenSettings).not.toHaveBeenCalled();
  });

  test('other My Media rows do not open Bluetooth settings', async () => {
    const renderer = renderMyMedia();

    await ReactTestRenderer.act(async () => {
      pressableFor(renderer, 'Chromecast').props.onPress();
    });

    expect(mockSendIntent).not.toHaveBeenCalled();
    expect(mockOpenSettings).not.toHaveBeenCalled();
  });

  test('resolves false when the accessories slice cannot be opened', async () => {
    mockSendIntent.mockRejectedValue(new Error('no slice activity'));

    await expect(openHeadphoneSettings()).resolves.toBe(false);
    expect(mockOpenSettings).not.toHaveBeenCalled();
  });

  test('does nothing on tvOS', async () => {
    Platform.OS = 'ios';

    await expect(openHeadphoneSettings()).resolves.toBe(false);
    expect(mockSendIntent).not.toHaveBeenCalled();
    expect(mockOpenSettings).not.toHaveBeenCalled();
  });
});
