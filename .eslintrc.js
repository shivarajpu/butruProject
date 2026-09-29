module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      // Jest picks up setup files from the root, outside the `__tests__` glob
      // that @react-native already configures with the jest env.
      files: ['jest.setup.js', 'jest.setup.ts'],
      env: { jest: true },
    },
  ],
};
