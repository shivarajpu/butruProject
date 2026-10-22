/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { registerBackgroundMessageHandler } from './src/services/push';

AppRegistry.registerComponent(appName, () => App);

/**
 * Background message handler.
 *
 * Registered here — at the very top of the entry point — because a data-only
 * FCM message that arrives while the app is backgrounded or quit only wakes the
 * app if a handler is already in place. Registering it later (inside a React
 * effect) loses every message that arrives before the first render.
 *
 * Android runs this in a headless JS task; iOS starts the app in a background
 * state. Either way the handler must resolve quickly and must not touch the UI.
 */
registerBackgroundMessageHandler();
