/**
 * `@react-native-community/geolocation` throws on import when its native module
 * is not linked, which is the case in Jest. Any suite that transitively reaches
 * `AddAddressModal` therefore failed to even mount. The stub keeps the
 * platform-level behaviour of the real module and lets each test drive the
 * outcome it needs.
 */

jest.mock('@react-native-community/geolocation', () => {
  const module = {
    __esModule: true,
    default: {
      getCurrentPosition: jest.fn((_success, error) =>
        error?.({ code: 2, message: 'Location unavailable in tests' }),
      ),
      watchPosition: jest.fn(() => 0),
      clearWatch: jest.fn(),
      requestAuthorization: jest.fn(),
    },
  };

  return module;
});
