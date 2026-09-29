/**
 * The Girls & Boys Fashion section is two cards, each with its own "Shop Now"
 * CTA underneath it. Rendering it here proves both buttons are actually wired
 * to the whole-catalogue listing — a CTA that renders its label but resolves to
 * `none` (or never fires) looks identical to a working one.
 */

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Text, TouchableOpacity } from 'react-native';

const mockNavigate = jest.fn();
const mockNavigateToRoot = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    getState: () => ({ routeNames: ['HomeTab', 'CategoryTab', 'WishlistTab', 'AccountTab'] }),
    getParent: () => ({
      navigate: mockNavigateToRoot,
      getState: () => ({ routeNames: [] }),
    }),
  }),
}));

jest.mock('../src/storefront/useStorefront', () => ({
  useStoreConfig: () => ({ theme: { saleEventVisible: true }, website: { collections: [] } }),
}));

jest.mock('../src/storefront/catalog', () => ({
  fetchBanners: jest.fn(async (placement: string) => [
    { id: `b-${placement}`, title: placement.replace('home_', ''), image: 'a.jpg', ctaUrl: '' },
  ]),
}));

jest.mock('../src/theme/useAppTheme', () => ({
  useAppTheme: () => ({
    colors: {
      primary: '#B12B5B',
      textOnPrimary: '#FFFFFF',
      text: '#1A1A1A',
      textSecondary: '#767575',
      textMuted: '#8E8E93',
      surfaceVariant: '#F5F5F5',
      overlay: 'rgba(0,0,0,0.4)',
      star: '#FFB800',
      discount: '#00875A',
    },
    fontFamily: { regular: 'System', medium: 'System', bold: 'System' },
  }),
}));

import { GirlsBoysFashionWidget } from '../src/widgets/home/MarketingWidgets';

const baseWidget = {
  id: 'w1',
  pageType: 'home',
  section: 'custom',
  title: 'Girls & Boys Fashion',
  type: 'girls_boys_fashion',
  layout: 'multiple',
  visibility: 'live',
  order: 4,
  config: { showTitle: false, heading: '' },
} as any;

const renderWidget = async (config?: Record<string, unknown>) => {
  const widget = config
    ? { ...baseWidget, config: { ...baseWidget.config, ...config } }
    : baseWidget;
  let tree!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = TestRenderer.create(<GirlsBoysFashionWidget widget={widget} />);
  });
  return tree;
};

const labels = (tree: TestRenderer.ReactTestRenderer) =>
  tree.root.findAllByType(Text).map(node => node.props.children);

const pressLabelAt = (tree: TestRenderer.ReactTestRenderer, label: string, index = 0) => {
  const node = tree.root
    .findAllByType(Text)
    .filter(item => item.props.children === label)[index];
  expect(node).toBeTruthy();
  let button: TestRenderer.ReactTestInstance | null = node!;
  while (button && button.type !== TouchableOpacity) {
    button = button.parent;
  }
  expect(button).toBeTruthy();
  act(() => {
    button!.props.onPress();
  });
};

describe('girls & boys fashion "Shop Now" CTA', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockNavigateToRoot.mockClear();
  });

  it('still renders the two fashion cards', async () => {
    const tree = await renderWidget();
    expect(labels(tree)).toEqual(expect.arrayContaining(['girls_fashion', 'boys_fashion']));
  });

  it('gives each card its own "Shop Now" CTA', async () => {
    const tree = await renderWidget();
    expect(labels(tree).filter(value => value === 'Shop Now')).toHaveLength(2);
  });

  it('puts each CTA under its own card', async () => {
    const tree = await renderWidget();
    const texts = labels(tree).filter((value): value is string => typeof value === 'string');

    // girls card -> its CTA -> boys card -> its CTA
    expect(texts).toEqual(['girls_fashion', 'Shop Now', 'boys_fashion', 'Shop Now']);
  });

  it.each([0, 1])('opens the whole-catalogue listing from CTA %i', async index => {
    const tree = await renderWidget();
    pressLabelAt(tree, 'Shop Now', index);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const [screen, params] = mockNavigate.mock.calls[0];
    expect(screen).toBe('HomeTab');
    expect(params.category).toBe('Shop');
    // The nonce is what makes a repeat tap observable on the same category.
    expect(params.navNonce).toBeDefined();
  });

  it('re-navigates on a second tap instead of being swallowed', async () => {
    const tree = await renderWidget();
    pressLabelAt(tree, 'Shop Now', 0);
    pressLabelAt(tree, 'Shop Now', 0);

    expect(mockNavigate).toHaveBeenCalledTimes(2);
    expect(mockNavigate.mock.calls[1][1].navNonce).not.toBe(mockNavigate.mock.calls[0][1].navNonce);
  });

  it('follows a ctaUrl from the config when one is set', async () => {
    const tree = await renderWidget({ ctaUrl: '/Collections?type=Clothing' });
    pressLabelAt(tree, 'Shop Now', 0);

    expect(mockNavigate).toHaveBeenCalledWith(
      'HomeTab',
      expect.objectContaining({ category: 'Clothing' }),
    );
  });

  it('takes the label from ctaText when the admin overrides it', async () => {
    const tree = await renderWidget({ ctaText: 'View All' });

    expect(labels(tree)).toContain('View All');
    expect(labels(tree)).not.toContain('Shop Now');
  });
});
