/**
 * Brand icon registry — the single place that answers "which colour does this
 * glyph follow?".
 *
 * Every icon the storefront can recolour is registered here against one of the
 * theme channels, so a call site never has to remember both the icon's baked
 * hex and the theme token it should track. `components/BrandIcon.tsx` reads the
 * tone and resolves it against `useAppTheme()`.
 *
 * The tones are intentionally few:
 *
 *   primary       the storefront's `theme.primaryColor` — brand glyphs, logos,
 *                 anything that should read as "this is the merchant's colour".
 *   onPrimary     white ink sitting on a primary surface. Tracked separately so
 *                 it flips to a dark ink when the merchant picks a pale colour.
 *   text          navigation chrome (back arrow, burger, close) that should
 *                 follow body text rather than the brand.
 *   textSecondary chevrons and disclosure arrows.
 *   textMuted     category glyphs, search, and other de-emphasised artwork.
 *
 * Icons deliberately absent: semantic hues (the green tick, gold star), the
 * official social marks in `socialIcons.ts`, and the base64 raster
 * illustrations. Those are fixed by design — repainting a Facebook mark in the
 * merchant's brand colour would be wrong, not customisable. The wishlist heart
 * is absent too, but for the opposite reason: it is a `primary`-coloured
 * glyph painted by the `heartFilledSvg` / `heartOutlineSvg` factories in
 * `index.ts` rather than through this registry.
 */

import {
  ABOUT_INFO_SVG,
  ACCOUNT_SVG,
  ACCESSORIES_SVG,
  ARROW_BACK_ICON,
  BACK_ARROW_SVG,
  BAG_SVG,
  BELL_ICON_SVG,
  BELL_SVG,
  BOX_ICON_SVG,
  Butruname,
  CART_WHITE_SVG,
  CHEVRON_DOWN_SVG,
  CHEVRON_RIGHT_PINK_SVG,
  CHEVRON_RIGHT_SVG,
  CLOSE_SVG,
  CLOTHING_SVG,
  DOCUMENT_SVG,
  EDIT_PENCIL_SVG,
  HELP_QUESTION_SVG,
  HELP_SVG,
  HOME_ACTIVE_SVG,
  LOCATION_PIN_SVG,
  LOCATION_PIN_SVGACOU,
  LOGOUT_ICON_SVG,
  MENU_SVG,
  ORDERS_SVG,
  PAYMENT_CARD_SVG,
  PRIVACY_SHIELD_SVG,
  PROFILE_USER_SVG,
  RETURN_REFUND_SVG,
  SEARCH_SVG,
  SHOES_SVG,
  TOYS_SVG,
  TRUCK_SVG,
  cameraicon,
  emailIcon,
  filter,
  helpSupportcallicon,
  helpSupportnameicon,
  helpsupportmailicon,
  passwordIcon,
  phoneIconPink,
  rewardIcon,
  secureIcon,
  supporIcon,
} from './index';
import { SPARKLE_SVG, STAR_SVG, TAG_SVG } from './categoryIcons';
import { Callicon, editPencilIcon, userProfileIcon } from './authIcons';
import { tintSvg, type TintedSvg } from './tint';

/** Which theme channel a glyph tracks. Resolved by `BrandIcon`. */
export type BrandIconTone = 'primary' | 'onPrimary' | 'text' | 'textSecondary' | 'textMuted';

/** A tintable glyph together with the channel it should follow. */
export interface BrandIconDef {
  svg: TintedSvg;
  tone: BrandIconTone;
}

const def = (svg: string, tone: BrandIconTone, source?: string): BrandIconDef => ({
  svg: tintSvg(svg, source ? { source } : {}),
  tone,
});

/**
 * Registers a glyph that is local to one screen rather than shared, so it still
 * gets the same theme wiring as the registry entries.
 *
 *   const SHARE = brandDef(SHARE_SVG, 'text', '#1A1A1A');
 *   <BrandIcon icon={SHARE} width={18} height={18} />
 */
export const brandDef = def;

/** Wraps an icon that is *already* a `tintSvg` factory. */
const tintedDef = (svg: TintedSvg, tone: BrandIconTone): BrandIconDef => ({ svg, tone });

/** Every recolourable glyph, keyed by role rather than by export name. */
export const BRAND = {
  // ── primary: the merchant's brand colour ───────────────────────────────────
  logo: def(Butruname, 'primary', '#B92D5E'),
  wordmark: def(Butruname, 'primary', '#B92D5E'),
  chevronRightAccent: def(CHEVRON_RIGHT_PINK_SVG, 'primary', '#E8006F'),
  box: def(BOX_ICON_SVG, 'primary', '#E8006F'),
  profileUser: def(PROFILE_USER_SVG, 'primary', '#E8006F'),
  locationPin: def(LOCATION_PIN_SVGACOU, 'primary', '#E8006F'),
  paymentCard: def(PAYMENT_CARD_SVG, 'primary', '#E8006F'),
  bell: def(BELL_ICON_SVG, 'primary', '#E8006F'),
  document: def(DOCUMENT_SVG, 'primary', '#E8006F'),
  truck: def(TRUCK_SVG, 'primary', '#E8006F'),
  returnRefund: def(RETURN_REFUND_SVG, 'primary', '#E8006F'),
  privacyShield: def(PRIVACY_SHIELD_SVG, 'primary', '#E8006F'),
  helpQuestion: def(HELP_QUESTION_SVG, 'primary', '#E8006F'),
  aboutInfo: def(ABOUT_INFO_SVG, 'primary', '#E8006F'),
  logout: def(LOGOUT_ICON_SVG, 'primary', '#E8006F'),
  camera: def(cameraicon, 'primary', '#C2185B'),
  password: def(passwordIcon, 'primary', '#C23564'),
  profileOutline: def(userProfileIcon, 'primary', '#C23564'),
  secure: def(secureIcon, 'primary', '#E86A8D'),
  reward: def(rewardIcon, 'primary', '#E86A8D'),
  support: def(supporIcon, 'primary', '#E86A8D'),

  // Already-tinted factories elsewhere in the icon module — registered so they
  // render through BrandIcon too, instead of each call site calling them.
  home: tintedDef(HOME_ACTIVE_SVG, 'primary'),
  locationPinSm: tintedDef(LOCATION_PIN_SVG, 'primary'),
  email: tintedDef(emailIcon, 'primary'),
  phone: tintedDef(phoneIconPink, 'primary'),
  helpSupportName: tintedDef(helpSupportnameicon, 'primary'),
  helpSupportCall: tintedDef(helpSupportcallicon, 'primary'),
  helpSupportMail: tintedDef(helpsupportmailicon, 'primary'),
  editPencilSm: tintedDef(editPencilIcon, 'primary'),
  call: tintedDef(Callicon, 'primary'),

  // ── onPrimary: ink that must stay legible on a brand-filled surface ────────
  cart: def(CART_WHITE_SVG, 'onPrimary', '#FFFFFF'),
  pencil: def(EDIT_PENCIL_SVG, 'onPrimary', '#FFFFFF'),
  /** The wordmark on a solid brand backdrop, e.g. the splash screen. */
  logoOnPrimary: def(Butruname, 'onPrimary', '#B92D5E'),

  // ── text: navigation chrome ───────────────────────────────────────────────
  arrowBack: def(ARROW_BACK_ICON, 'text', 'black'),
  backArrow: def(BACK_ARROW_SVG, 'text', '#1A1A1A'),
  close: def(CLOSE_SVG, 'text', '#1A1A1A'),
  menu: def(MENU_SVG, 'text', 'black'),
  bellOutline: def(BELL_SVG, 'text', 'black'),
  bag: def(BAG_SVG, 'text', 'black'),

  // ── textSecondary: disclosure affordances ─────────────────────────────────
  chevronRight: def(CHEVRON_RIGHT_SVG, 'textSecondary', '#8E8E93'),
  chevronDown: def(CHEVRON_DOWN_SVG, 'textSecondary', '#666666'),
  search: def(SEARCH_SVG, 'textSecondary', '#8E8E93'),

  // ── textMuted: category glyphs and de-emphasised artwork ──────────────────
  clothing: def(CLOTHING_SVG, 'textMuted', '#334155'),
  shoes: def(SHOES_SVG, 'textMuted', '#334155'),
  accessories: def(ACCESSORIES_SVG, 'textMuted', '#334155'),
  toys: def(TOYS_SVG, 'textMuted', '#334155'),
  orders: def(ORDERS_SVG, 'textMuted', '#334155'),
  account: def(ACCOUNT_SVG, 'textMuted', '#334155'),
  help: def(HELP_SVG, 'textMuted', '#334155'),
  categoryStar: def(STAR_SVG, 'textMuted', '#334155'),
  categorySparkle: def(SPARKLE_SVG, 'textMuted', '#334155'),
  categoryTag: def(TAG_SVG, 'textMuted', '#334155'),
  filter: def(filter, 'textMuted', '#777E91'),
} as const;

/** Bag / category glyphs used by the drawer's keyword matcher. */
export const CATEGORY_GLYPHS = {
  shoes: BRAND.shoes,
  clothing: BRAND.clothing,
  accessories: BRAND.accessories,
  toys: BRAND.toys,
  bag: BRAND.bag,
  star: BRAND.categoryStar,
  sparkle: BRAND.categorySparkle,
  tag: BRAND.categoryTag,
} as const;
