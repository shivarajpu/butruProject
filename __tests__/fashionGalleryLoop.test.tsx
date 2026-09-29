/**
 * The fashion gallery row renders two copies of its items so the marquee can
 * loop seamlessly, but a 2-item row was showing as two stacked duplicate lists.
 * `flexDirection: 'row'` on the animated container is what keeps the copies
 * side by side, and the trailing margin that broke the loop width is what made
 * the wrap jump.
 */

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Text, View } from 'react-native';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
  createNavigationContainerRef: () => ({ navigate: jest.fn(), isReady: () => true }),
}));

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({ storefront: { config: { website: { collections: [], widgets: [] } } } }),
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

import { FashionSectionWidget } from '../src/widgets/home/MarketingWidgets';
import type { GalleryItem, StoreWidget } from '../src/storefront/types';

const items: GalleryItem[] = [
  { type: 'text', text: 'one', hasStars: false },
  { type: 'text', text: 'two', hasStars: false },
];

const widget: StoreWidget = {
  id: 'w1',
  type: 'fashion_section',
  order: 0,
  page: null,
  title: 'Tell Us Your Vibe',
  layout: 'multiple',
  config: { heading: 'TELL US YOUR VIBE.', galleryRow1: items },
} as unknown as StoreWidget;

const render = async () => {
  let tree!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = TestRenderer.create(<FashionSectionWidget widget={widget} />);
  });
  return tree;
};

const flatten = (style: unknown): Record<string, unknown> => {
  if (Array.isArray(style)) return style.reduce<Record<string, unknown>>((acc, s) => ({ ...acc, ...flatten(s) }), {});
  return (style as Record<string, unknown>) ?? {};
};

describe('fashion gallery marquee', () => {
  it('lays the two loop copies out in a row, not stacked', async () => {
    const tree = await render();

    // The animated wrapper is the parent of both copies. It defaults to a
    // column, which is exactly what stacked the duplicate lists.
    const loop = tree.root
      .findAll(node => typeof node.type !== 'string')
      .find(node => flatten(node.props.style).flexDirection === 'row' && node.findAllByType(View).length > 0);

    expect(loop).toBeDefined();
    expect(flatten(loop!.props.style).flexDirection).toBe('row');
  });

  it('keeps every gap inside a track so the loop width stays exact', async () => {
    const tree = await render();

    const tracks = tree.root
      .findAllByType(View)
      .filter(node => {
        const style = flatten(node.props.style);
        return style.flexDirection === 'row' && Array.isArray(node.props.style) === false;
      });

    // A trailing margin would sit outside the measured width, so the marquee
    // would jump by that much on every wrap.
    for (const track of tracks) {
      expect(flatten(track.props.style).marginRight).toBeUndefined();
    }
  });

  it('still renders the configured items', async () => {
    const tree = await render();
    const texts = tree.root.findAllByType(Text).map(node => String(node.props.children));

    expect(texts).toContain('one');
    expect(texts).toContain('two');
  });
});
