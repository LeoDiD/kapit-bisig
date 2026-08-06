const { getDefaultConfig } = require('expo/metro-config');

// Metro's fallback watcher creates one fs.watch handle per directory on
// Windows. This project has a large Expo dependency tree, so initialization
// can exceed Metro's four-minute watcher timeout. Node supports recursive
// fs.watch on Windows, which lets Metro use a single native watcher instead.
if (process.platform === 'win32') {
  const NativeWatcher = require('@expo/metro-file-map/build/watchers/NativeWatcher').default;
  NativeWatcher.isSupported = () => true;
}

module.exports = getDefaultConfig(__dirname);
