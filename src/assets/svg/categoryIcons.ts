/**
 * Drawer category glyphs.
 *
 * Style contract — every glyph here matches the built-in drawer icons
 * (`CLOTHING_SVG`, `SHOES_SVG`, `ACCESSORIES_SVG`, `TOYS_SVG`): monochrome
 * `stroke="#334155"`, `stroke-width="1.5"` on a 24-unit box, round caps and
 * joins, no fill. The drawer renders them all at 21x21, so a 24 viewBox with
 * a 1.5 stroke lands on the same optical weight as a 20 viewBox with 1.25.
 *
 * Do not introduce brand colours here — the row already tints via the theme.
 */

const strokeWrap = (body: string) =>
  `<svg width="21" height="21" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#334155" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

/** "In the spotlight" — a star. */
export const STAR_SVG = strokeWrap(
  `<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.775a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>`,
);

/** "New arrivals" — a four-point sparkle. */
export const SPARKLE_SVG = strokeWrap(
  `<path d="M12 3l1.8 4.6 4.6 1.8-4.6 1.8L12 15.8l-1.8-4.6L5.6 9.4l4.6-1.8L12 3z"/>
   <path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z"/>`,
);

/** "Combo offers" — a price tag. */
export const TAG_SVG = strokeWrap(
  `<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/>
   <circle cx="7.5" cy="7.5" r="1.4"/>`,
);
