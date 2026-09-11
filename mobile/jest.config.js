module.exports = {
  preset: 'jest-expo',
  clearMocks: true,
  testMatch: ['**/__tests__/**/*.jest.test.ts'],
  moduleDirectories: ['node_modules', '<rootDir>/node_modules/expo/node_modules'],
};
