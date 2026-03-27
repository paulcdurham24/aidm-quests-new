import {AppRegistry, NativeEventEmitter} from 'react-native';

// MUST run before any module that uses NativeEventEmitter (voice, iap, tts)
// RN 0.72+ removed removeListener but several native modules still call it
NativeEventEmitter.prototype.removeListener = function (_eventType, _listener) {
  // No-op polyfill — subscriptions should use .remove() instead
};

import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
