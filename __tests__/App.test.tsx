/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

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

test('renders the hotel launcher', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(() => {
    renderer.unmount();
  });
});
