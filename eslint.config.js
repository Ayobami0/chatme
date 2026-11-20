// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

const jestGlobals = Object.fromEntries(
  ["jest", "describe", "it", "test", "expect", "beforeEach", "afterEach", "beforeAll", "afterAll"].map(
    (name) => [name, "readonly"],
  ),
);

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "example/*", "android/*", "ios/*", ".expo/*", ".agents/*", "coverage/*"],
  },
  {
    // Tests live in tests/ and the Jest setup at the root, outside the default test-file patterns.
    files: ["tests/**", "jest.setup.js"],
    languageOptions: { globals: jestGlobals },
  },
]);
