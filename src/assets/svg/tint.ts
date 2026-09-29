/**
 * tintSvg — turns a static, single-colour SVG string into a factory that
 * repaints it with a caller-supplied colour.
 *
 * Most icon constants in this app were exported as finished strings baked with
 * the original brand pink (#B12B5B), which meant the storefront config's
 * `theme.primaryColor` could never reach them. Rewriting every path by hand is
 * both error-prone and pointless: the path data never changes, only the paint.
 *
 * Matching happens on the *paint attributes* (`fill`, `stroke`, `stop-color`,
 * …) rather than on a bare hex scan, so a colour can never be substituted
 * inside path data, a `viewBox`, or one of the base64 raster payloads that the
 * icon module carries.
 *
 * Usage:
 *   const CHECK = tintSvg(`<svg ... fill="#B12B5B">...</svg>`);
 *   CHECK(theme.colors.primary)          // explicit colour
 *   CHECK(theme.colors.primary, '#B12B5B') // …while recolouring a second literal
 *
 * See `brand.ts` for the tone-assigned registry and `components/BrandIcon.tsx`
 * for the component that wires the theme in automatically.
 */

/** Paint-carrying attributes. Everything else in the markup is geometry. */
const PAINT_ATTR =
  /\b(fill|stroke|stop-color|flood-color|lighting-color)(\s*=\s*)(["'])([^"']*)\3/g;

/**
 * The handful of CSS colour keywords these icons actually use. `none` is
 * deliberately absent — it means "no paint", not "paint me black".
 */
const KEYWORD: Record<string, string> = {
  black: '#000000',
  white: '#FFFFFF',
};

/**
 * Colour literals that must never be retinted by the auto-detect path, because
 * they carry meaning rather than branding: contrast ink that has to stay
 * legible against a brand button, plus the semantic success / error / rating
 * hues (a green tick, a red "sold out" badge, a gold star).
 *
 * The wishlist heart is deliberately *not* here: a saved heart is the tenant's
 * brand colour (`theme.colors.primary`, from the storefront API), and it is
 * painted by the `heartFilledSvg` / `heartOutlineSvg` factories rather than by
 * a baked-in literal, so there is nothing here to protect.
 *
 * Black is *not* here on purpose — chrome like a back arrow or a menu burger is
 * painted `black` and is expected to follow `colors.text`. To tint a white icon
 * on purpose, pass it explicitly: `tintSvg(svg, { source: '#FFFFFF' })`.
 */
const PRESERVED = new Set([
  '#fff',
  '#ffffff',
  '#22c55e',
  '#16a34a',
  '#dc2626',
  '#ef4444',
  '#2e7d32',
  '#ffc107',
]);

/**
 * What `tintSvg` hands back: a factory that repaints the artwork on demand.
 *
 *   <SvgXml xml={BAG_SVG(colors.text)} width={19} height={21} />
 *
 * Calling it with no argument returns the source markup unchanged, which keeps
 * the factory a safe drop-in for the original string constant.
 */
export type TintedSvg = (color?: string) => string;

export interface TintOptions {
  /**
   * The literal to recolour, bypassing {@link PRESERVED}. Required to tint
   * white ink, and useful when an icon carries two brand-ish hues and you know
   * which one should follow the theme.
   */
  source?: string;
  /**
   * Recolour this literal *as well as* the detected one. Use for icons that
   * mix two shades of the same brand colour.
   */
  also?: string[];
}

const normalise = (value: string): string => {
  const trimmed = value.trim();
  return KEYWORD[trimmed.toLowerCase()] ?? trimmed;
};

/**
 * The first paint value in the markup that is neither a keyword-only "no paint"
 * nor a preserved semantic colour. Snapshotted at definition time so that a
 * colour injected by a previous call is never itself treated as a target.
 */
const detectSource = (svg: string): string | null => {
  for (const match of svg.matchAll(PAINT_ATTR)) {
    const value = normalise(match[4]);
    if (!value || value.toLowerCase() === 'none' || PRESERVED.has(value.toLowerCase())) {
      continue;
    }
    return match[4];
  }
  return null;
};

export const tintSvg = (svg: string, options: TintOptions = {}): TintedSvg => {
  const detected = detectSource(svg);
  const targets = [options.source, detected, ...(options.also ?? [])].filter(
    (value): value is string => Boolean(value),
  );

  if (targets.length === 0) return () => svg;

  // One-entry memo: during a re-render every icon in the tree asks for the same
  // colour, so this collapses to a hit for all but the first call.
  let lastColor: string | undefined;
  let lastResult = svg;

  return (color?: string): string => {
    if (!color) return svg;
    if (color === lastColor) return lastResult;

    let next = svg;
    for (const target of targets) {
      const pattern = new RegExp(
        `(\\b(?:fill|stroke|stop-color|flood-color|lighting-color)\\s*=\\s*["'])${target.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&',
        )}(["'])`,
        'g',
      );
      next = next.replace(pattern, `$1${color}$2`);
    }

    lastColor = color;
    lastResult = next;
    return next;
  };
};
