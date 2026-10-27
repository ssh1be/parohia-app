const path = require('path');
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = withNativeWind(getDefaultConfig(__dirname), { input: './global.css' });
const previousResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const origin = typeof context.originModulePath === 'string'
    ? context.originModulePath.replace(/\\/g, '/')
    : '';

  // Expo Go's Android binary does not include ExpoTopicSubscriptionModule.
  // Keep the JS import from throwing so the rest of expo-notifications can load.
  if (
    platform === 'android' &&
    moduleName === './TopicSubscriptionModule' &&
    origin.includes('/expo-notifications/')
  ) {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'shims/TopicSubscriptionModule.android.js'),
    };
  }

  if (previousResolveRequest) {
    return previousResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;