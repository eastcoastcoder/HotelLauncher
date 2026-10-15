/* eslint-env jest */
const mockStore = new Map();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async key =>
      mockStore.has(key) ? mockStore.get(key) : null,
    ),
    setItem: jest.fn(async (key, value) => {
      mockStore.set(key, value);
    }),
    removeItem: jest.fn(async key => {
      mockStore.delete(key);
    }),
    clear: jest.fn(async () => {
      mockStore.clear();
    }),
  },
}));

jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    fs: {
      dirs: { DocumentDir: '/data/hotel-launcher' },
      exists: jest.fn(async () => false),
      unlink: jest.fn(async () => undefined),
      cp: jest.fn(async () => true),
      readFile: jest.fn(async () => ''),
      writeFile: jest.fn(async () => undefined),
    },
  },
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(async () => ({ didCancel: true })),
}));
