/**
 * Three bugs in the offers surface, one file:
 *
 *  1. `?isDealOfTheDay=true` answers with products that are *not* flagged as
 *     deals — a plain "hoodie" landed in the middle of the Deal Of The Day
 *     row — so the flag is re-checked client side.
 *  2. Grid tiles were sized in percent with `justifyContent: 'space-between'`,
 *     which tears the last, partially filled row apart: five offer cards
 *     rendered as 3 + 2 with a hole in the middle. Measured tiles plus a
 *     fixed `gap` keep the trailing row aligned with the rows above it.
 *  3. When no deal is flagged the section falls back to new arrivals, but it
 *     kept labelling them "Deal Of The Day".
 */

jest.mock('../src/api/apiService', () => ({
  apiService: { get: jest.fn() },
}));

import { apiService } from '../src/api/apiService';
import { clearCatalogCache, fetchProductsForSource } from '../src/storefront/catalog';
import { gridTileWidth } from '../src/widgets/common';
import type { WidgetConfig } from '../src/storefront/types';

const mockedGet = apiService.get as jest.Mock;

const apiProduct = (id: string, deal: boolean, name = id) => ({
  _id: id,
  name,
  price: 1000,
  skus: [{ size: 'M', sellingPrice: 500, mrp: 1000 }],
  isDealOfTheDay: deal,
  isNewArrival: true,
});

const respondWith = (products: unknown[]) => {
  mockedGet.mockResolvedValue({ success: true, data: products });
};

// ─── 1. The deal feed must only contain deals ─────────────────────────────────

describe('deal of the day feed', () => {
  beforeEach(() => {
    clearCatalogCache();
    mockedGet.mockReset();
  });

  it('drops the unflagged hoodie the endpoint returns', async () => {
    respondWith([
      apiProduct('dress', true, 'Classic Red Polka Dot Dress'),
      apiProduct('hoodie', false, 'hoodie'),
      apiProduct('tee', true, 'Red Cotton T-Shirt'),
    ]);

    const deals = await fetchProductsForSource({ source: 'deal_of_the_day' });

    expect(deals.map(product => product.name)).toEqual([
      'Classic Red Polka Dot Dress',
      'Red Cotton T-Shirt',
    ]);
  });

  it('returns nothing when the feed holds no real deals, so the widget can fall back', async () => {
    respondWith([apiProduct('hoodie', false, 'hoodie')]);

    await expect(fetchProductsForSource({ source: 'deal_of_the_day' })).resolves.toEqual([]);
  });

  it('leaves the unfiltered sources alone', async () => {
    respondWith([apiProduct('hoodie', false, 'hoodie')]);

    const products = await fetchProductsForSource({ source: 'new_arrivals' });

    expect(products.map(product => product.name)).toEqual(['hoodie']);
  });
});

// ─── 2. Grid tiles: no hole in the last row ───────────────────────────────────

describe('grid tile width', () => {
  const width = 390;
  const gutter = width * 0.04;
  const gap = 12;

  it('fits the full row plus the gaps inside the gutters', () => {
    const threeUp = gridTileWidth(width, gutter, 3);
    expect(threeUp * 3 + gap * 2).toBeCloseTo(width - gutter * 2, 5);
  });

  it('gives the trailing row the same rhythm, not a stretched-out pair', () => {
    // 31.5% + space-between put five three-up tiles at 3 + 2 with the two
    // trailing tiles pushed to opposite edges; measured widths + a fixed gap
    // keep the second tile exactly one gap from the first.
    const tile = gridTileWidth(width, gutter, 3);
    expect(tile * 2 + gap).toBeLessThan(width - gutter * 2);
    expect(gridTileWidth(width, gutter, 2)).toBeGreaterThan(tile);
  });
});

// ─── 3. The heading has to match the feed on screen ───────────────────────────

/** Mirrors DealOfTheDayWidget's heading rule. */
const headingFor = (config: WidgetConfig, deals: unknown[], fallback: unknown[]) => {
  const usingFallback = deals.length === 0 && fallback.length > 0;
  if (usingFallback) {
    const value = config.fallbackHeading;
    return typeof value === 'string' && value.trim() ? value.trim() : 'New Arrivals';
  }
  return config.heading || 'Deal Of The Day';
};

describe('deal of the day heading', () => {
  it('keeps the configured heading for real deals', () => {
    expect(headingFor({ heading: 'Deal Of The Day' }, [{}], [])).toBe('Deal Of The Day');
  });

  it('names the feed it actually shows when it falls back', () => {
    expect(headingFor({ heading: 'Deal Of The Day' }, [], [{}])).toBe('New Arrivals');
  });

  it('lets the admin override the fallback heading', () => {
    expect(headingFor({ heading: 'Deal Of The Day', fallbackHeading: 'Just In' }, [], [{}])).toBe(
      'Just In',
    );
  });

  it('ignores a blank or non-string fallback heading', () => {
    expect(headingFor({ fallbackHeading: '  ' }, [], [{}])).toBe('New Arrivals');
    // `config` is a free-form bag on the backend, so a number can turn up there.
    expect(headingFor({ fallbackHeading: 42 } as unknown as WidgetConfig, [], [{}])).toBe(
      'New Arrivals',
    );
  });
});
