/**
 * The register/login payload store id must come from the binary's baked-in
 * identity, not the Metro-served bundle — every flavour shares port 8081, so a
 * client app can be served another client's bundle. These pin the precedence:
 * native (baked) value wins, bundle env is the fallback, and a __DEV__
 * mismatch is surfaced as a warning rather than silently mis-registering.
 */

// The "bundle" value is whatever clients/active.json currently points at —
// `@env` is inlined by the react-native-dotenv babel transform. Read it the
// same way the code under test does, so the test stays correct on any client.
import { EXPO_PUBLIC_STORE_ID } from '@env';

jest.mock('react-native', () => {
  const settings: Record<string, string> = {};
  return {
    Platform: { OS: 'ios' },
    Settings: {
      get: (key: string) => settings[key],
      set: (next: Record<string, string>) => Object.assign(settings, next),
      watchKeys: () => 1,
      clearWatch: () => {},
    },
    NativeModules: {},
  };
});

jest.mock('../src/config/clients', () => ({
  __esModule: true,
  default: {
    api: {
      storeId: 'not-used-fallback',
      storeSlug: 'not-used-fallback',
    },
  },
}));

const setNative = (storeId: string, storeSlug: string) => {
  const { Settings } = require('react-native');
  Settings.set({ ButruClientStoreId: storeId, ButruClientStoreSlug: storeSlug });
};

const freshButruNative = () => {
  jest.resetModules();
  // Bundle (from Metro) says butru; native (built-in) says clienta.
  setNative('6a99055a5298908f9841e405', 'butru-store');
  return require('../src/config/storeIdentity');
};

afterEach(() => {
  jest.resetModules();
});

describe('storeIdentity precedence', () => {
  it('prefers the native-baked store id over the bundle env value', () => {
    const { STORE_ID, STORE_SLUG } = freshButruNative();
    expect(STORE_ID).toBe('6a99055a5298908f9841e405');
    expect(STORE_SLUG).toBe('butru-store');
  });

  it('falls back to the bundle env value when native is absent', () => {
    setNative('', '');
    const { STORE_ID } = require('../src/config/storeIdentity');
    expect(STORE_ID).toBe(EXPO_PUBLIC_STORE_ID);
  });

  it('warns in __DEV__ when the served bundle disagrees with the binary', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { STORE_ID } = freshButruNative();
    expect(STORE_ID).toBe('6a99055a5298908f9841e405');
    const bundle = EXPO_PUBLIC_STORE_ID;
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(`binary is "6a99055a5298908f9841e405"`) &&
        expect.stringContaining(`the bundle (Metro) said "${bundle}"`),
    );
    warn.mockRestore();
  });
});