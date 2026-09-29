/**
 * The testimonial widget is two independent blocks, not either/or: the live
 * config fills in the support strip, which used to mean the reviews were never
 * rendered at all. These cover both blocks appearing, reviews leading, and the
 * single-review case that has to look deliberate rather than like a carousel
 * with nothing to scroll to.
 */

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';

const mockTestimonials: jest.Mock<unknown[], []> = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    getState: () => ({ routeNames: ['HomeTab'] }),
    getParent: () => undefined,
  }),
}));

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({
      storefront: {
        config: {
          website: { testimonials: mockTestimonials() },
          socialLinks: {},
        },
      },
    }),
}));

jest.mock('../src/storefront/selectors', () => {
  const actual = jest.requireActual('../src/storefront/selectors');
  return { ...actual };
});

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
    },
    fontFamily: { regular: 'System', medium: 'System', bold: 'System' },
  }),
}));

jest.mock('../src/storefront/useStorefront', () => ({
  useStoreConfig: () => ({ website: { collections: [] } }),
}));

import TestimonialWidget from '../src/widgets/home/TestimonialWidget';

const review = (id: string, name: string, rating: number, date: string) => ({
  id,
  name,
  quote: `Quote from ${name}`,
  review: `Review from ${name}`,
  rating,
  productCode: '',
  city: 'Banglore',
  reviewDate: date,
  category: '',
  productImages: [],
  profilePicture: '',
  visibility: 'live',
});

const widget = {
  id: 'w1',
  pageType: 'home',
  section: 'custom',
  title: 'Customer Feedbacks',
  type: 'product_testimonial',
  layout: 'multiple',
  visibility: 'live',
  order: 10,
  // The live store config: the support strip is filled in, the heading is not.
  config: {
    showTitle: false,
    heading: '',
    supportTitle: '24×7 Support',
    supportPrefix: 'Email us on',
    helpPrefix: 'Call us on',
    phone: '+91 8128013130',
    instagramUrl: 'https://instagram.com/butrukids/',
  },
} as any;

const render = async () => {
  let tree!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = TestRenderer.create(<TestimonialWidget widget={widget} />);
  });
  return tree;
};

const texts = (tree: TestRenderer.ReactTestRenderer) =>
  tree.root.findAllByType(Text).map(node => node.props.children);

const flat = (tree: TestRenderer.ReactTestRenderer) =>
  texts(tree).filter((value): value is string => typeof value === 'string');

beforeEach(() => {
  mockTestimonials.mockReset();
  mockTestimonials.mockReturnValue([]);
});

describe('testimonial widget', () => {
  it('shows the reviews even though the config fills in the support strip', async () => {
    mockTestimonials.mockReturnValue([
      review('a', 'Madhavi', 5, '2026-09-24T00:00:00.000Z'),
    ]);
    const tree = await render();

    expect(flat(tree)).toContain('What customers say');
    // The support strip still renders — the two blocks are independent.
    expect(flat(tree)).toContain('24×7 Support');
  });

  it('puts the reviews above the support strip', async () => {
    mockTestimonials.mockReturnValue([
      review('a', 'Madhavi', 5, '2026-09-24T00:00:00.000Z'),
    ]);
    const tree = await render();
    const shown = flat(tree);

    expect(shown.indexOf('What customers say')).toBeLessThan(
      shown.indexOf('24×7 Support'),
    );
  });

  const cardWidths = (tree: TestRenderer.ReactTestRenderer) => {
    const scroller = tree.root.findAllByType(require('react-native').ScrollView)[0];
    return scroller
      .findAll(node => typeof node.props?.style?.width === 'number')
      .map(node => node.props.style.width as number);
  };

  it('gives a lone review the full row instead of a carousel card', async () => {
    mockTestimonials.mockReturnValue([
      review('a', 'Madhavi', 5, '2026-09-24T00:00:00.000Z'),
    ]);
    const tree = await render();
    const [width] = cardWidths(tree);

    // Wider than the 262px carousel card, so one review does not sit in a
    // narrow box with dead space beside it.
    expect(width).toBeGreaterThan(262);
  });

  it('keeps every card the same width once there are several', async () => {
    mockTestimonials.mockReturnValue([
      review('a', 'Madhavi', 5, '2026-09-24T00:00:00.000Z'),
      review('b', 'Rohan', 4, '2026-09-20T00:00:00.000Z'),
      review('c', 'Sana', 4, '2026-09-18T00:00:00.000Z'),
    ]);
    const tree = await render();
    const widths = cardWidths(tree);

    expect(widths.length).toBeGreaterThanOrEqual(3);
    expect(widths.every(width => width === 262)).toBe(true);
  });

  it('counts the reviews and averages the rating', async () => {
    mockTestimonials.mockReturnValue([
      review('a', 'Madhavi', 5, '2026-09-24T00:00:00.000Z'),
      review('b', 'Rohan', 4, '2026-09-20T00:00:00.000Z'),
      review('c', 'Sana', 4, '2026-09-18T00:00:00.000Z'),
    ]);
    const tree = await render();
    const shown = flat(tree);

    expect(shown).toContain('4.3');
    expect(shown).toContain('3 reviews');
  });

  it('leads with the newest review once there are several', async () => {
    mockTestimonials.mockReturnValue([
      review('old', 'Rohan', 4, '2026-09-01T00:00:00.000Z'),
      review('new', 'Madhavi', 5, '2026-09-24T00:00:00.000Z'),
    ]);
    const tree = await render();
    const shown = flat(tree);

    expect(shown.indexOf('Madhavi')).toBeLessThan(shown.indexOf('Rohan'));
  });

  it('reads the count in the singular for a single review', async () => {
    mockTestimonials.mockReturnValue([
      review('a', 'Madhavi', 5, '2026-09-24T00:00:00.000Z'),
    ]);
    const tree = await render();

    expect(flat(tree)).toContain('1 review');
  });

  it('renders the support strip on its own when there are no reviews', async () => {
    mockTestimonials.mockReturnValue([]);
    const tree = await render();
    const shown = flat(tree);

    expect(shown).toContain('24×7 Support');
    expect(shown).not.toContain('What customers say');
  });

  it('renders nothing when the store has neither', async () => {
    mockTestimonials.mockReturnValue([]);
    const empty = { ...widget, config: { showTitle: false, heading: '' } };
    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<TestimonialWidget widget={empty} />);
    });

    expect(tree.toJSON()).toBeNull();
  });
});
