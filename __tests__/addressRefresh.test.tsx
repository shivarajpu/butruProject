import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

const mockRefresh = jest.fn();

jest.mock('../src/theme/useAppTheme', () => ({
  useAppTheme: () => ({ colors: new Proxy({}, { get: () => '#000000' }) }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

import AddressSelectionModal from '../src/components/AddressSelectionModal';

const renderModal = (visible: boolean): ReactTestRenderer =>
  create(
    <AddressSelectionModal
      visible={visible}
      addresses={[]}
      onSelect={jest.fn()}
      onClose={jest.fn()}
      onAddAddress={jest.fn()}
      onRefresh={mockRefresh}
    />,
  );

beforeEach(() => {
  mockRefresh.mockClear();
});

describe('address list refresh', () => {
  it('refreshes the address list as soon as the modal opens', () => {
    act(() => {
      renderModal(true);
    });

    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('does not refresh while the modal is closed', () => {
    act(() => {
      renderModal(false);
    });

    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('refreshes again when the modal is reopened', () => {
    let tree: ReactTestRenderer | undefined;
    act(() => {
      tree = renderModal(false);
    });

    act(() => {
      tree?.update(
        <AddressSelectionModal
          visible
          addresses={[]}
          onSelect={jest.fn()}
          onClose={jest.fn()}
          onAddAddress={jest.fn()}
          onRefresh={mockRefresh}
        />,
      );
    });

    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
