/**
 * The wishlist / like heart wears the tenant's brand colour.
 *
 * A saved heart is `theme.colors.primary`, which the storefront bridge fills
 * from the API's `theme.primaryColor` — so one tenant's likes are pink and the
 * next store's are teal, with no code change. That means the heart has to be a
 * factory (`heartFilledSvg(color)` / `heartOutlineSvg(color)`) instead of a
 * baked-in string constant.
 *
 * These tests guard the regression that started it: the hearts were literal
 * markup painted `#E53935`, so only `CategoryTab` — which had its own private
 * copies of the two factories — followed the API, while the home feed, the
 * storefront grids, the product page and the wishlist itself all showed a fixed
 * red. The literal constants are gone and `#e53935` is no longer exempt from
 * tinting, so there is no way back to a per-page hardcoded like colour.
 */

import * as icons from '../src/assets/svg';
import { heartFilledSvg, heartOutlineSvg } from '../src/assets/svg';
import { tintSvg } from '../src/assets/svg/tint';
import { BRAND } from '../src/assets/svg/brand';

const RED = '#E53935';
const TEAL = '#0F766E';
const VIOLET = '#7C3AED';

const paints = (svg: string): string[] =>
  [...svg.matchAll(/\b(?:fill|stroke|stop-color)\s*=\s*"([^"]*)"/g)].map(m => m[1]);

const pathOf = (svg: string): string =>
  svg.match(/ d="([^"]+)"/)?.[1] ?? '';

describe('the like heart follows the API primary colour', () => {
  it('paints the saved heart in the colour it is handed', () => {
    for (const primary of [TEAL, VIOLET, '#B12B5B']) {
      expect(paints(heartFilledSvg(primary))).toContain(primary);
    }
  });

  it('paints the unsaved outline in the colour it is handed', () => {
    for (const muted of ['#8E8E93', TEAL]) {
      expect(paints(heartOutlineSvg(muted))).toContain(muted);
    }
  });

  it('no longer carries a fixed red', () => {
    expect(paints(heartFilledSvg(TEAL))).not.toContain(RED);
    expect(paints(heartOutlineSvg(TEAL))).not.toContain(RED);
  });

  it('keeps one silhouette, so liking only changes the fill', () => {
    // The filled and outline hearts used to be different artwork, so tapping
    // like reshaped the icon instead of just filling it in.
    expect(pathOf(heartFilledSvg(TEAL))).toBe(pathOf(heartOutlineSvg(TEAL)));
    expect(paints(heartOutlineSvg(TEAL))).not.toContain('fill="#E53935"');
  });
});

describe('nothing can reintroduce a baked-in red heart', () => {
  it('no longer exports the literal heart constants', () => {
    expect('HEART_FILLED_SVG' in icons).toBe(false);
    expect('HEART_OUTLINE_SVG' in icons).toBe(false);
    expect('WISHLIST_SVG' in icons).toBe(false);
  });

  it('does not shield #e53935 from the tinting path any more', () => {
    const red = `<svg viewBox="0 0 24 24" fill="${RED}"><path d="M12 21z"/></svg>`;

    expect(paints(tintSvg(red)(TEAL))).toContain(TEAL);
  });

  it('is not registered as a brand glyph with a fixed tone', () => {
    // Registration is fine as long as it follows the theme; what must not come
    // back is a heart painting itself in its own hue.
    const hearts = Object.entries(BRAND).filter(([key]) => /heart|wishlist/i.test(key));
    expect(hearts).toEqual([]);
  });
});
