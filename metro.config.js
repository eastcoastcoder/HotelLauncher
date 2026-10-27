const fs = require('fs');
const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const localMainStage = path.join(__dirname, 'src/config/mainStage.local.json');
const exampleMainStage = path.join(
  __dirname,
  'src/config/mainStage.example.json',
);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  transformer: {
    babelTransformerPath: require.resolve(
      'react-native-svg-transformer/react-native',
    ),
  },
  resolver: {
    assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName.endsWith('mainStage.local.json')) {
        const resolved = path.resolve(
          path.dirname(context.originModulePath),
          moduleName,
        );
        // Missing local config means the static stage, via the committed example.
        if (resolved === localMainStage && !fs.existsSync(localMainStage)) {
          return {
            filePath: exampleMainStage,
            type: 'sourceFile',
          };
        }
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
