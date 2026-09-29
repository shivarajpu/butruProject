/**
 * The "Use Current Location" button used to hang on the second tap, and on a
 * real device often left the address form blank. The cause was an iOS deadlock
 * in the geolocation library's `requestAuthorization`, which is asserted here
 * from the JS side: on iOS the modal must never call it, and the button must
 * always come out of its loading state.
 */

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Text, TouchableOpacity } from 'react-native';

const mockRequestAuthorization = jest.fn();
const mockGetCurrentPosition = jest.fn();

jest.mock('@react-native-community/geolocation', () => ({
  __esModule: true,
  default: {
    getCurrentPosition: (...args: unknown[]) => mockGetCurrentPosition(...args),
    requestAuthorization: (...args: unknown[]) => mockRequestAuthorization(...args),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(null),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../src/theme/useAppTheme', () => ({
  useAppTheme: () => ({
    colors: {
      primary: '#B12B5B',
      primaryLight: '#FCE8F0',
      text: '#1A1A1A',
      textSecondary: '#767575',
      textMuted: '#8E8E93',
      textOnPrimary: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceVariant: '#F5F5F5',
      border: '#E8E8E8',
      overlay: 'rgba(0,0,0,0.4)',
      star: '#FFB800',
      error: '#D32F2F',
    },
    fontFamily: { regular: 'System', medium: 'System', bold: 'System' },
  }),
}));

jest.mock('../src/storefront/selectors', () => ({
  selectCurrency: () => 'INR',
}));

import AddAddressModal from '../src/components/AddAddressModal';

const openModal = async (visible: boolean) => {
  let tree!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = TestRenderer.create(
      <AddAddressModal visible={visible} onClose={jest.fn()} onSaved={jest.fn()} />,
    );
  });
  return tree;
};

const locateButton = (tree: TestRenderer.ReactTestRenderer) =>
  tree.root
    .findAllByType(TouchableOpacity)
    .find(node =>
      node
        .findAllByType(Text)
        .some(text => /Use Current Location|Finding your location/.test(String(text.props.children))),
    );

const textOf = (tree: TestRenderer.ReactTestRenderer) =>
  tree.root
    .findAllByType(Text)
    .map(node => String(node.props.children))
    .join(' | ');

/** Resolves `getCurrentPosition` and lets the reverse-geocode fetch settle. */
const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

beforeEach(() => {
  mockRequestAuthorization.mockReset();
  mockGetCurrentPosition.mockReset();
  globalThis.fetch = jest.fn().mockResolvedValue({
    json: () =>
      Promise.resolve({
        address: { road: 'M.G. Road', city: 'Pune', state: 'Maharashtra', postcode: '411001' },
      }),
  }) as unknown as typeof fetch;
});

afterEach(() => {
  jest.useRealTimers();
});

describe('AddAddressModal — use current location', () => {
  it('never calls requestAuthorization on iOS, which would hang forever', async () => {
    const platform = jest.requireActual('react-native').Platform;
    const original = platform.OS;
    Object.defineProperty(platform, 'OS', { value: 'ios', configurable: true });

    mockGetCurrentPosition.mockImplementation((_ok: unknown, _err: unknown, _opts: unknown) => {});
    const tree = await openModal(true);

    await act(async () => {
      locateButton(tree)!.props.onPress();
    });
    await flush();

    expect(mockRequestAuthorization).not.toHaveBeenCalled();

    Object.defineProperty(platform, 'OS', { value: original, configurable: true });
  });

  it('leaves the loading state when permission is denied', async () => {
    const platform = jest.requireActual('react-native').Platform;
    const original = platform.OS;
    Object.defineProperty(platform, 'OS', { value: 'ios', configurable: true });

    mockGetCurrentPosition.mockImplementation((_ok: unknown, fail: unknown) => {
      (fail as (e: unknown) => void)({ code: 1, message: 'denied' });
    });
    const tree = await openModal(true);

    await act(async () => {
      locateButton(tree)!.props.onPress();
    });
    await flush();

    // The spinner label is gone, so the button is usable again.
    expect(textOf(tree)).not.toContain('Finding your location');

    Object.defineProperty(platform, 'OS', { value: original, configurable: true });
  });

  it('leaves the loading state when no fix is available', async () => {
    const platform = jest.requireActual('react-native').Platform;
    const original = platform.OS;
    Object.defineProperty(platform, 'OS', { value: 'ios', configurable: true });

    mockGetCurrentPosition.mockImplementation((_ok: unknown, fail: unknown) => {
      (fail as (e: unknown) => void)({ code: 2, message: 'unavailable' });
    });
    const tree = await openModal(true);

    await act(async () => {
      locateButton(tree)!.props.onPress();
    });
    await flush();

    expect(textOf(tree)).not.toContain('Finding your location');

    Object.defineProperty(platform, 'OS', { value: original, configurable: true });
  });

  it('reuses a recent fix instead of re-acquiring GPS on a repeat tap', async () => {
    const platform = jest.requireActual('react-native').Platform;
    const original = platform.OS;
    Object.defineProperty(platform, 'OS', { value: 'ios', configurable: true });

    let captured: { maximumAge?: number; timeout?: number } = {};
    mockGetCurrentPosition.mockImplementation(
      (ok: unknown, _fail: unknown, options: { maximumAge?: number; timeout?: number }) => {
        captured = options;
        (ok as (p: unknown) => void)({ coords: { latitude: 18.5, longitude: 73.8 } });
      },
    );

    const tree = await openModal(true);
    await act(async () => {
      locateButton(tree)!.props.onPress();
    });
    await flush();

    // 60s reuse window, and a 10s ceiling so a cold fix cannot look like a hang.
    expect(captured.maximumAge).toBe(60000);
    expect(captured.timeout).toBe(10000);

    Object.defineProperty(platform, 'OS', { value: original, configurable: true });
  });

  it('reports a failed address lookup inline and re-enables the button', async () => {
    const platform = jest.requireActual('react-native').Platform;
    const original = platform.OS;
    Object.defineProperty(platform, 'OS', { value: 'ios', configurable: true });

    mockGetCurrentPosition.mockImplementation((ok: unknown) => {
      (ok as (p: unknown) => void)({ coords: { latitude: 18.5, longitude: 73.8 } });
    });
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;

    const tree = await openModal(true);
    await act(async () => {
      locateButton(tree)!.props.onPress();
    });
    await flush();

    expect(textOf(tree)).toContain('could not be looked up');
    expect(textOf(tree)).toContain('Use Current Location');

    Object.defineProperty(platform, 'OS', { value: original, configurable: true });
  });

  it('ignores a reply that arrives after the modal was closed', async () => {
    const platform = jest.requireActual('react-native').Platform;
    const original = platform.OS;
    Object.defineProperty(platform, 'OS', { value: 'ios', configurable: true });

    // Never resolves until after the modal closes.
    let release: (p: unknown) => void = () => {};
    mockGetCurrentPosition.mockImplementation((ok: unknown) => {
      release = ok as (p: unknown) => void;
    });

    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(
        <AddAddressModal visible onClose={jest.fn()} onSaved={jest.fn()} />,
      );
    });

    await act(async () => {
      locateButton(tree)!.props.onPress();
    });

    // Reopening resets the form; a late reply must not write into it.
    await act(async () => {
      tree.update(<AddAddressModal visible={false} onClose={jest.fn()} onSaved={jest.fn()} />);
    });
    await act(async () => {
      release({ coords: { latitude: 18.5, longitude: 73.8 } });
    });
    await flush();

    expect(globalThis.fetch).not.toHaveBeenCalled();

    Object.defineProperty(platform, 'OS', { value: original, configurable: true });
  });
});
