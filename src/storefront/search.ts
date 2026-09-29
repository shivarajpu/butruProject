/**
 * Client-side storefront search.
 *
 * Two things this has to get right, both of which the inline version in
 * `HomeTab` got wrong:
 *
 * 1. **Colour is searchable.** `StoreProduct.color` is a real field, but the
 *    filter only ever looked at `name`. Searching "red" returned nothing even
 *    when the grid was full of red items.
 * 2. **A query can span fields.** `"Classic Red"` never matched a product
 *    named `"Classic Shirt"` with `color: "Red"`, because a whole-string
 *    `includes` can only match inside one field. So matching is token-wise:
 *    every word has to appear *somewhere* on the product.
 *
 * Punctuation is dropped while tokenising, so a suggestion label like
 * `"Classic Shirt (Red)"` — which is what a tap writes back into the input —
 * still filters down to that one product.
 *
 * Kept free of React Native imports so it can be unit-tested directly.
 */

/** Only `name` is required, so a category or a collection satisfies this too. */
export interface Searchable {
  name?: string | null;
  color?: string | null;
  tag?: string | null;
  productCode?: string | null;
  websiteCategory?: string | null;
  categoryPath?: readonly string[] | null;
}

const lower = (value: unknown): string => String(value ?? '').toLowerCase();

/**
 * Punctuation only, rather than a `\p{L}` class: that keeps Devanagari and
 * other non-Latin product names intact and stays safe on Hermes.
 */
const PUNCTUATION = /[(){}\[\]<>,.!?:"'`~:;|_\-+*/\\%]/g;

const tokenize = (query: string): string[] =>
  lower(query)
    .replace(PUNCTUATION, ' ')
    .split(' ')
    .filter(Boolean);

/** Every field a shopper might plausibly type, folded into one haystack. */
export const searchHaystack = (item: Searchable): string =>
  [
    item.name,
    item.color,
    item.tag,
    item.productCode,
    item.websiteCategory,
    ...(item.categoryPath ?? []),
  ]
    .map(lower)
    .filter(Boolean)
    .join(' ');

/** True when every word of the query appears somewhere on the item. */
export const matchesQuery = (item: Searchable, query: string): boolean => {
  const tokens = tokenize(query);
  if (!tokens.length) return true;

  const haystack = searchHaystack(item);
  return tokens.every(token => haystack.includes(token));
};

/** Unfiltered when the query is blank, so callers can pass it straight through. */
export const filterByQuery = <T extends Searchable>(items: readonly T[], query: string): T[] =>
  tokenize(query).length ? items.filter(item => matchesQuery(item, query)) : [...items];

/**
 * Label for the suggestion row. The colour is appended only when the colour is
 * what the shopper matched on, so a same-named product in a different colour
 * stays distinguishable.
 */
export const suggestionLabel = (item: Searchable, query: string): string => {
  const name = String(item?.name ?? '').trim();
  const color = String(item?.color ?? '').trim();
  const colorLower = color.toLowerCase();

  if (!name) return color;
  if (!colorLower) return name;
  if (lower(name).includes(colorLower)) return name;

  const matchedOnColor = tokenize(query).some(token => colorLower.includes(token));
  return matchedOnColor ? `${name} (${color})` : name;
};

/** Unique, de-duplicated suggestion labels, most relevant first. */
export const buildSuggestions = <T extends Searchable>(
  items: readonly T[],
  query: string,
  limit = 6,
): string[] => {
  // A blank query has nothing to suggest, and would otherwise dump the whole
  // catalogue into the sheet.
  if (!tokenize(query).length) return [];

  const seen = new Set<string>();
  const suggestions: string[] = [];

  for (const item of filterByQuery(items, query)) {
    const label = suggestionLabel(item, query);
    if (!label || seen.has(label)) continue;

    seen.add(label);
    suggestions.push(label);
    if (suggestions.length >= limit) break;
  }

  return suggestions;
};

/**
 * Whether the product catalogue still has to be pulled in.
 *
 * The home feed is server-driven (`<DynamicPage />`), so `products` stays empty
 * until a category is picked or a search begins. Without a request at that
 * moment the results view had nothing to filter, and because the list view's
 * `loading` flag started out `true` it sat on a spinner indefinitely.
 *
 * `requested` is a latch rather than "is the list empty?" on purpose: an empty
 * catalogue is a legitimate answer, and re-deriving the decision from emptiness
 * would re-request on every render for a store that has no matching products.
 */
export const shouldRequestCatalogue = ({
  searchActive,
  requested,
  loading,
}: {
  searchActive: boolean;
  requested: boolean;
  loading: boolean;
}): boolean => searchActive && !requested && !loading;
