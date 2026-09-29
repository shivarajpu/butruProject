/**
 * Social brand glyphs used by the footer / support widgets.
 *
 * All of them use `currentColor`-equivalent `stroke="#1A1A1A"` placeholders —
 * the widgets render them inside a themed circle, so keep the glyph itself
 * monochrome and let the surrounding view carry the brand colour.
 */

const wrap = (body: string, size = 18) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

export const INSTAGRAM_SVG = wrap(
  `<rect x="3" y="3" width="18" height="18" rx="5" stroke="#E1306C" stroke-width="1.8"/>
   <circle cx="12" cy="12" r="4" stroke="#E1306C" stroke-width="1.8"/>
   <circle cx="17.2" cy="6.8" r="1.1" fill="#E1306C"/>`,
);

export const FACEBOOK_SVG = wrap(
  `<path d="M14.5 8.5H16.8V5.6h-2.6c-2.3 0-3.7 1.4-3.7 3.7v1.6H8.2v2.9h2.3V21h3.1v-7.2h2.3l.4-2.9h-2.7V9.7c0-.8.3-1.2.9-1.2z" fill="#1877F2"/>`,
);

export const YOUTUBE_SVG = wrap(
  `<rect x="2.5" y="5.5" width="19" height="13" rx="4" stroke="#FF0000" stroke-width="1.8"/>
   <path d="M10.2 9.4l4.6 2.6-4.6 2.6V9.4z" fill="#FF0000"/>`,
);

export const TELEGRAM_SVG = wrap(
  `<path d="M21.2 4.6L2.9 11.4c-.8.3-.8 1.4 0 1.7l4.3 1.4 1.7 5.1c.2.7 1.1.9 1.6.3l2.4-2.5 4.3 3.2c.6.4 1.4.1 1.6-.6l2.9-14c.2-.8-.6-1.5-1.4-1.2z" fill="#229ED9"/>
   <path d="M7.2 14.5l9.3-6.6-7.4 7.3-.3 3.3-1.6-4z" fill="#FFFFFF"/>`,
);

export const WHATSAPP_SVG = wrap(
  `<path d="M12 3.2a8.7 8.7 0 0 0-7.5 13.2L3.4 20.8l4.5-1.1A8.7 8.7 0 1 0 12 3.2z" stroke="#25D366" stroke-width="1.7"/>
   <path d="M9 8.2c.2-.4.4-.4.6-.4h.5c.2 0 .4 0 .6.4l.8 1.9c.1.2 0 .4-.1.5l-.5.6c-.1.2-.2.3-.1.5.4.7 1 1.3 1.7 1.7.2.1.4 0 .5-.1l.6-.7c.1-.2.3-.2.5-.1l1.8.9c.2.1.4.2.4.4 0 .5-.2 1.1-.5 1.4-.3.3-.8.4-1.3.4-1.2 0-3.1-1.1-4.6-2.6-1.2-1.2-2.3-2.8-2.3-4.2 0-.6.2-1 .4-1.3z" fill="#25D366"/>`,
);
