/**
 * Guards the brand-icon recolouring.
 *
 * The failure this file exists to prevent is silent: a glyph that keeps its
 * baked brand pink because nobody passed it a colour. There is no type error
 * and no crash, the icon just quietly stops matching the storefront config, so
 * every registered glyph is asserted to actually repaint.
 */

import { BRAND, CATEGORY_GLYPHS } from '../src/assets/svg/brand';
import { TONE_TOKEN } from '../src/components/BrandIcon';
import APP_CONFIG from '../src/config/app_config';
import { tintSvg } from '../src/assets/svg/tint';

const TEAL = '#0F766E';
const PINK = '#B12B5B';

const ALL = { ...BRAND, ...CATEGORY_GLYPHS };

const PAINT_VALUE = /\b(?:fill|stroke|stop-color)="([^"]*)"/g;

const paintValues = (svg: string) =>
  [...svg.matchAll(PAINT_VALUE)].map(match => match[1]);

describe('brand registry', () => {
  it('has entries', () => {
    expect(Object.keys(BRAND).length).toBeGreaterThan(30);
  });

  it.each(Object.keys(ALL))('%s repaints to the API primary colour', key => {
    const { svg } = ALL[key as keyof typeof ALL];
    const painted = paintValues(svg(TEAL));

    expect(painted.length).toBeGreaterThan(0);
    expect(painted).toContain(TEAL);
  });

  it('leaves no baked brand hex behind after tinting', () => {
    // Every brand/source hex the app historically shipped.
    const baked = [
      '#E8006F', '#B12B5B', '#B92D5E', '#B8235A', '#B8255F',
      '#C23564', '#C2185B', '#E86A8D', '#1A1A1A', '#8E8E93',
      '#334155', '#333333', '#666666', '#4A4A4A', '#9CA3AF', '#777E91',
    ].map(hex => hex.toLowerCase());

    const offenders: string[] = [];
    for (const [key, { svg }] of Object.entries(ALL)) {
      for (const value of paintValues(svg(TEAL))) {
        const lower = value.toLowerCase();
        if (lower === 'none') continue;
        if (baked.includes(lower)) offenders.push(`${key}: ${value}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('is idempotent — tinting twice equals tinting once', () => {
    const once = BRAND.box.svg(TEAL);
    const twice = tintSvg(once, { source: TEAL })(PINK);
    expect(twice).toBe(once.replace(new RegExp(TEAL, 'g'), PINK));
  });

  it('returns the source markup when called with no colour', () => {
    expect(BRAND.box.svg()).not.toContain(TEAL);
  });

  it('recolours every occurrence of the source literal', () => {
    const { svg } = BRAND.truck;
    // The source artwork paints four separate paths.
    expect(paintValues(svg()).filter(v => v === '#E8006F').length).toBeGreaterThan(1);
    expect(paintValues(svg(TEAL)).filter(v => v === TEAL).length).toBeGreaterThan(1);
  });
});

describe('tintSvg', () => {
  const svg = `<svg viewBox="0 0 24 24"><path d="M1 2 L3 4" fill="none" stroke="black" stroke-width="2"/><circle fill="#B12B5B"/></svg>`;

  it('tints CSS colour keywords', () => {
    expect(tintSvg(svg, { source: 'black' })(TEAL)).toContain(`stroke="${TEAL}"`);
  });

  it('never rewrites fill="none"', () => {
    expect(tintSvg(svg, { source: 'black' })(TEAL)).toContain('fill="none"');
  });

  it('never rewrites hex inside path data', () => {
    const tinted = tintSvg(svg)(TEAL);
    expect(tinted).toContain('d="M1 2 L3 4"');
  });

  it('preserves white ink unless it is named explicitly', () => {
    const white = `<svg><path fill="#FFFFFF"/></svg>`;
    expect(tintSvg(white)(TEAL)).toBe(white);
    expect(tintSvg(white, { source: '#FFFFFF' })(TEAL)).toContain(`fill="${TEAL}"`);
  });

  it('preserves semantic hues', () => {
    const green = `<svg><path fill="#2E7D32"/><path fill="#B12B5B"/></svg>`;
    expect(tintSvg(green)(TEAL)).toContain('fill="#2E7D32"');
    expect(tintSvg(green)(TEAL)).toContain(`fill="${TEAL}"`);
  });

  it('detects the first tintable colour when no source is given', () => {
    // In this fixture `stroke="black"` precedes `fill="#B12B5B"`, and black is
    // deliberately tintable (chrome follows `colors.text`), so auto-detect must
    // land on the stroke and leave the fill alone.
    const tinted = tintSvg(svg)(TEAL);
    expect(tinted).toContain(`stroke="${TEAL}"`);
    expect(tinted).toContain('fill="#B12B5B"');
  });

  it('skips preserved and "none" values while auto-detecting', () => {
    const leading = `<svg><path fill="none"/><path fill="#FFC107"/><path fill="#B12B5B"/></svg>`;
    expect(tintSvg(leading)(TEAL)).toContain(`fill="${TEAL}"`);
  });
});

describe('tone resolution', () => {
  it('maps every tone to a real palette token', () => {
    const tokens = Object.values(TONE_TOKEN);
    expect(new Set(tokens).size).toBe(tokens.length);
    for (const token of tokens) {
      expect(APP_CONFIG.colors.light).toHaveProperty(token);
    }
  });

  it('sends onPrimary ink to the contrast token, not the brand token', () => {
    // White ink on a brand button must flip when the merchant picks a pale
    // colour, otherwise the glyph disappears into the button.
    expect(TONE_TOKEN.onPrimary).toBe('textOnPrimary');
    expect(TONE_TOKEN.onPrimary).not.toBe('primary');
    expect(BRAND.cart.tone).toBe('onPrimary');
    expect(BRAND.logoOnPrimary.tone).toBe('onPrimary');
  });

  it('keeps the splash wordmark and the in-app logo on different tones', () => {
    expect(BRAND.logoOnPrimary.tone).toBe('onPrimary');
    expect(BRAND.logo.tone).toBe('primary');
  });

  it('routes navigation chrome to text, not to the brand', () => {
    for (const key of ['arrowBack', 'backArrow', 'close', 'menu', 'bag', 'bellOutline'] as const) {
      expect(BRAND[key].tone).toBe('text');
    }
  });
});
