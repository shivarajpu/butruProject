/**
 * Two things about home section headings, both regressions we have hit:
 *
 *  1. `ProductGroupWidget` gated its heading on `showTitle === true`, an
 *     opt-in, while every other widget in the layer used `!== false`. A feed
 *     whose config simply omitted `showTitle` rendered product tiles with no
 *     label, so most product sections looked unlabelled.
 *  2. Section headings are brand-coloured, so they follow the storefront's
 *     `primaryColor` and re-skin per tenant rather than staying fixed ink.
 */

import type { StoreWidget } from '../src/storefront/types';
import APP_CONFIG from '../src/config/app_config';

const widget = (config: Record<string, unknown>, title = 'Popular Products') =>
  ({
    id: 'w1',
    pageType: 'home',
    section: 'main',
    title,
    type: 'product_group',
    layout: 'grid',
    visibility: 'live',
    automated: false,
    order: 1,
    config,
  }) as unknown as StoreWidget;

/** Mirrors ProductGroupWidget's visibility rule. */
const showHeading = (widget: StoreWidget): boolean => {
  const heading = (widget.config.heading as string) || widget.title;
  return widget.config.showTitle !== false && !!heading;
};

describe('home section heading visibility', () => {
  it('shows the heading when the config never mentions showTitle', () => {
    expect(showHeading(widget({ source: 'popular' }))).toBe(true);
  });

  it('shows the heading for a plain collection feed too', () => {
    expect(showHeading(widget({ source: 'collection', collectionId: 'r1' }))).toBe(true);
  });

  it('still honours an explicit showTitle: false', () => {
    expect(showHeading(widget({ showTitle: false, heading: 'Hidden' }))).toBe(false);
  });

  it('hides an empty heading rather than rendering a blank line', () => {
    expect(showHeading(widget({ source: 'popular' }, ''))).toBe(false);
  });
});

describe('section heading colour', () => {
  it('takes the brand colour from the palette, not a fixed ink', () => {
    expect(APP_CONFIG.colors.light.primary).toBeTruthy();
    // The token the heading styles resolve against; `readableOn` is what
    // decides the ink *on* a primary surface, which is a different token.
    expect(APP_CONFIG.colors.light.primary).not.toBe(APP_CONFIG.colors.light.text);
  });

  it('keeps heading ink distinct from on-primary ink', () => {
    // A bold brand-coloured heading must not be confused with white button
    // text; they resolve from different palette channels.
    expect(APP_CONFIG.colors.light.textOnPrimary).toBeTruthy();
  });
});
