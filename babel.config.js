module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
  //    "expo-router/babel", // 🔥 REQUIRED (you were missing this)

      [
        "module-resolver",
        {
          alias: {
            "@": ".",
          },
        },
      ],

      "react-native-reanimated/plugin",

      // "react-native-reanimated/plugin",
    ],
  };
};