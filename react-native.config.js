// tvOS autolinking uses the ios platform key. These podspecs declare iOS only,
// and their native code needs WebKit or Photos, which Apple TV does not provide.
// Android autolinking is unchanged.
module.exports = {
  dependencies: {
    'react-native-webview': {
      platforms: {
        ios: null,
      },
    },
    '@react-native-async-storage/async-storage': {
      platforms: {
        ios: null,
      },
    },
    'react-native-blob-util': {
      platforms: {
        ios: null,
      },
    },
    'react-native-image-picker': {
      platforms: {
        ios: null,
      },
    },
  },
};
