const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve(
    "react-native-svg-transformer"
  ),
};

config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: false,
  assetExts: [
    ...config.resolver.assetExts.filter(ext => ext !== "svg"),
    'lottie',
    'json',
  ],
  sourceExts: [
    ...config.resolver.sourceExts.filter(ext => ext !== "svg"),
    'svg',
    'lottie',
  ],
};

module.exports = config;