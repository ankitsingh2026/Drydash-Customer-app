const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// 🔥 THIS FIXES YOUR ERROR
// config.resolver.unstable_enablePackageExports = false;
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve(
    "react-native-svg-transformer"
  ),
};

config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: false,
  assetExts: config.resolver.assetExts.filter(
    (ext) => ext !== "svg"
  ),
  sourceExts: [...config.resolver.sourceExts, "svg"],
};

module.exports = config;