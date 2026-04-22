const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// 🔥 THIS FIXES YOUR ERROR
config.resolver.unstable_enablePackageExports = false;

module.exports = config;