import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';

// Suppress redbox/yellowbox popups on mobile screen (errors/warnings will still print to terminal)
LogBox.ignoreAllLogs();

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
