/**
 * Both address modals shipped icon factories that took a colour argument and
 * then ignored it:
 *
 *   const getHomeIconSvg = (_color: string) => `… stroke="#BE185D" …`
 *
 * The call sites were already correct — they passed `theme.colors.primary` — so
 * nothing failed loudly; the home pin simply stayed hardcoded pink for every
 * tenant. The add-address field icons were worse: frozen strings with no
 * parameter at all (`stroke="#999"`, `stroke="#9CA3AF"`), so they could not
 * follow the tenant's brand *or* dark mode.
 *
 * Asserting the rendered markup is the point. A factory that ignores its
 * argument still type-checks and still returns a valid SVG, so these tests ask
 * whether the caller's colour actually landed in the paint attributes.
 */

// The modals import Geolocation, whose native module is absent under Jest — the
// same reason `App.test.tsx` cannot run. Mocking it is enough here because these
// tests only read exported factories; nothing renders, so the event emitter the
// real module builds on import is never reached.
jest.mock('@react-native-community/geolocation', () => ({
  __esModule: true,
  default: {
    requestAuthorization: jest.fn(),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  },
  setRNConfiguration: jest.fn(),
  requestAuthorization: jest.fn(),
}));

import {
  getHomeIconSvg as getHomeIconSvgAdd,
  CHECK_GREEN_SVG,
  USER_ICON_SVG,
  PHONE_ICON_SVG,
  PINCODE_ICON_SVG,
  MAP_BUILDING_SVG,
  FLAG_ICON_SVG,
  CITY_ICON_SVG,
} from '../src/components/AddAddressModal';
import {
  getHomeIconSvg as getHomeIconSvgSelect,
  TRASH_SVG,
} from '../src/components/AddressSelectionModal';

const TEAL = '#0F766E';
const VIOLET = '#7C3AED';

/** Every paint attribute value in a fragment. */
const paints = (svg: string): string[] =>
  [...svg.matchAll(/\b(?:fill|stroke|stop-color|flood-color|lighting-color)\s*=\s*"([^"]*)"/g)].map(
    m => m[1],
  );

/** Paint values that were literal colours before the modals were fixed. */
const FROZEN = ['#BE185D', '#999', '#9CA3AF', '#C0392B', '#2E7D32'];

const cases: Array<[string, (color: string) => string, number]> = [
  ['add: home pin', getHomeIconSvgAdd, 2],
  ['add: default tick', CHECK_GREEN_SVG, 1],
  ['add: field user', USER_ICON_SVG, 1],
  ['add: field phone', PHONE_ICON_SVG, 1],
  ['add: field pincode', PINCODE_ICON_SVG, 1],
  ['add: field building', MAP_BUILDING_SVG, 3],
  ['add: field flag', FLAG_ICON_SVG, 1],
  ['add: field city', CITY_ICON_SVG, 11],
  ['select: home pin', getHomeIconSvgSelect, 2],
  ['select: delete', TRASH_SVG, 1],
];

describe('address modal icons paint with the caller colour', () => {
  it.each(cases)('%s uses the colour it is given', (_label, factory) => {
    const svg = factory(TEAL);

    expect(paints(svg)).toContain(TEAL);
    // Every non-`none` paint must be the caller's colour: no second frozen hue
    // hiding in a later path.
    expect(paints(svg).filter(p => p !== 'none').every(p => p === TEAL)).toBe(true);
  });

  it.each(cases)('%s repaints every stroke, not just the first', (_label, factory, strokes) => {
    // The home pin and the multi-path field icons are where a half-applied
    // change would still look plausible.
    expect(paints(factory(TEAL)).filter(p => p === TEAL)).toHaveLength(strokes);
  });

  it.each(cases)('%s still ships no frozen literal', (_label, factory) => {
    expect(factory(TEAL).toUpperCase()).not.toMatch(new RegExp(FROZEN.join('|')));
  });

  it.each(cases)('%s actually depends on its argument', (_label, factory) => {
    // The original bug in one assertion: same output for two different colours.
    expect(factory(TEAL)).not.toBe(factory(VIOLET));
    expect(paints(factory(VIOLET))).toContain(VIOLET);
  });

  it('follows the tenant brand for the home pin in both modals', () => {
    for (const factory of [getHomeIconSvgAdd, getHomeIconSvgSelect]) {
      // The root `<svg fill="none">` is geometry, not paint.
      expect(paints(factory(TEAL)).filter(p => p !== 'none')).toEqual([TEAL, TEAL]);
    }
  });

  it('keeps the success and delete semantics on palette tokens', () => {
    // A semantic green tick and a destructive delete still have to read as
    // green/red; they just resolve from the theme rather than a literal.
    expect(CHECK_GREEN_SVG('#2ECC71')).toContain('#2ECC71');
    expect(TRASH_SVG('#E74C3C')).toContain('#E74C3C');
  });
});
