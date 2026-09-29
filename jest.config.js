module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // Jest resolves the "react-native" export condition, which points
  // react-redux / @reduxjs/toolkit at their ESM builds. Those are not covered by
  // the preset's default allow-list, so they reach the runtime untransformed and
  // fail with "Cannot use import statement outside a module".
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-redux|@reduxjs|redux|redux-thunk|reselect|immer|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-gesture-handler|@react-native-async-storage)/)',
  ],
};
