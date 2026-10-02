module.exports = function (api) {
    api.cache(true);
    return {
      presets: [
        [
          "babel-preset-expo",
          {
            jsxImportSource: "nativewind",
            // Hermes v1 skips private-field transforms, but EAS release hermesc still
            // rejects `#` syntax (e.g. react-native DOMRectReadOnly in the iOS bundle).
            unstable_transformProfile: "hermes-v0",
          },
        ],
        "nativewind/babel",
      ],
      plugins: [
        "react-native-reanimated/plugin",
      ],
    };
  };