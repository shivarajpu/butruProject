/**
 * Drawer icon resolution.
 *
 * Collections come from the storefront config, so their titles are unknown at
 * build time. Each title is matched against keyword groups and given the icon
 * that actually represents it — falling back to a generic shop bag rather than
 * repeating one glyph for every row.
 */

import { CATEGORY_GLYPHS, type BrandIconDef } from '../assets/svg/brand';

/** Checked in order — the first group that matches wins. */
const ICON_GROUPS: Array<{ keywords: string[]; icon: BrandIconDef }> = [
  {
    keywords: ['shoe', 'footwear', 'sneaker', 'boot', 'sandal', 'heel'],
    icon: CATEGORY_GLYPHS.shoes,
  },
  {
    keywords: ['cloth', 'apparel', 'dress', 'kurti', 'shirt', 'top', 'tee', 'fashion', 'wear', 'jeans'],
    icon: CATEGORY_GLYPHS.clothing,
  },
  {
    keywords: ['accessor', 'jeweller', 'jewelry', 'bag', 'purse', 'watch', 'belt', 'wallet', 'sunglass'],
    icon: CATEGORY_GLYPHS.accessories,
  },
  { keywords: ['toy', 'kids', 'kid', 'baby', 'infant'], icon: CATEGORY_GLYPHS.toys },
  { keywords: ['spotlight', 'featured', 'star'], icon: CATEGORY_GLYPHS.star },
  { keywords: ['new', 'latest', 'arrival', 'just in', 'fresh', 'trending'], icon: CATEGORY_GLYPHS.sparkle },
  {
    keywords: ['offer', 'combo', 'sale', 'deal', 'discount', 'off', 'clearance', 'festive'],
    icon: CATEGORY_GLYPHS.tag,
  },
  { keywords: ['all', 'shop', 'product', 'catalog', 'collection', 'store'], icon: CATEGORY_GLYPHS.bag },
];

/** Picks the icon that matches a collection title. */
export const categoryIcon = (title: string): BrandIconDef => {
  const name = (title ?? '').toLowerCase();
  const match = ICON_GROUPS.find(group => group.keywords.some(word => name.includes(word)));
  return match?.icon ?? CATEGORY_GLYPHS.bag;
};
