import {AppRegistry, NativeEventEmitter} from 'react-native';

// MUST run before any module that uses NativeEventEmitter (voice, iap, tts)
// RN 0.72+ removed removeListener but several native modules still call it
NativeEventEmitter.prototype.removeListener = function (_eventType, _listener) {
  // No-op polyfill — subscriptions should use .remove() instead
};

// TODO: Re-enable Google Mobile Ads when Maven repository is stable
// import mobileAds from 'react-native-google-mobile-ads';
// mobileAds()
//   .initialize()
//   .then(adapterStatuses => {
//     console.log('[GoogleAds] Initialization complete:', adapterStatuses);
//   })
//   .catch(error => {
//     console.error('[GoogleAds] Initialization failed:', error);
//   });

import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
