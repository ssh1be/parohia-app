import { requireOptionalNativeModule } from 'expo-modules-core';

const stub = {
  addListener: () => {},
  removeListeners: () => {},
  subscribeToTopicAsync: () => Promise.resolve(null),
  unsubscribeFromTopicAsync: () => Promise.resolve(null),
};

// Expo Go on Android does not include this native module; development builds do.
export default requireOptionalNativeModule('ExpoTopicSubscriptionModule') ?? stub;
