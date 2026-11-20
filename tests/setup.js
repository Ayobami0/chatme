// Native modules unavailable under Jest. Only what the tested code imports is mocked.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
