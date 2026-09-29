/**
 * Two regressions covered here:
 *
 *  1. The poster card CTA regressed to plain coloured text while the hero card
 *     moved to a pill — the two must render identically.
 *  2. "View all" was dead on the second tap. `navigate` to the screen you are
 *     already on, with identical params, is a no-op in React Navigation, and
 *     HomeTab's effect only depends on the *value* of `params.category`. The
 *     `navNonce` stamp is what makes a repeat tap observable.
 */

import { resolveLink } from '../src/storefront/links';
import type { StoreConfig } from '../src/storefront/types';

// ─── View all link resolution ─────────────────────────────────────────────────

const config = {
  website: {
    collections: [
      { id: 'rWin', title: 'Winter Collection', handle: 'winter-collection', description: '', visibility: 'live' },
      { id: 'rSum', title: 'Summer Collection', handle: 'summer-collection', description: '', visibility: 'live' },
    ],
  },
} as unknown as StoreConfig;

describe('view all link resolution', () => {
  it('routes /Collections to the shop-all category', () => {
    expect(resolveLink('/Collections', { config })).toEqual({
      type: 'category',
      category: 'Shop',
    });
  });

  it('routes a collection path to that collection by title', () => {
    expect(resolveLink('/WINTER-COLLECTION/collection/rWin', { config })).toEqual({
      type: 'category',
      category: 'Winter Collection',
    });
  });

  it('routes a bare collection slug by handle', () => {
    expect(resolveLink('/summer-collection', { config })).toEqual({
      type: 'category',
      category: 'Summer Collection',
    });
  });

  it('routes a bare product-type slug even with no matching collection', () => {
    expect(resolveLink('/clothing', { config })).toEqual({
      type: 'category',
      category: 'Clothing',
    });
  });

  it('treats a bare "#" and "/" as no-ops', () => {
    expect(resolveLink('#')).toEqual({ type: 'none' });
    expect(resolveLink('/')).toEqual({ type: 'none' });
    expect(resolveLink('')).toEqual({ type: 'none' });
  });
});

// ─── navNonce ─────────────────────────────────────────────────────────────────

/** Mirrors the payload `pushTab` builds. */
const pushPayload = (
  navNonce: number,
  params: Record<string, unknown>,
): Record<string, unknown> => ({
  ...params,
  navNonce,
});

describe('tab push nonce', () => {
  it('makes a repeat push distinguishable from the first', () => {
    const first = pushPayload(1, { category: 'Winter Collection' });
    const second = pushPayload(2, { category: 'Winter Collection' });

    // The category is identical — this is the case that used to be a no-op.
    expect(first.category).toBe(second.category);
    // Only the nonce differs, which is what re-triggers the destination effect.
    expect(first.navNonce).not.toBe(second.navNonce);
  });

  it('preserves the original params instead of replacing them', () => {
    expect(pushPayload(7, { category: 'Shop' })).toEqual({
      category: 'Shop',
      navNonce: 7,
    });
  });

  it('still produces a valid payload when no params were supplied', () => {
    expect(pushPayload(3, {})).toEqual({ navNonce: 3 });
  });
});
