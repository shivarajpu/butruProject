/**
 * The home-tab search only looked at `product.name`, but `StoreProduct.color`
 * is a real field. So "red" matched nothing on a grid full of red items, and
 * "classic red" matched nothing for a second reason: a whole-string `includes`
 * can only match inside one field, and the two words live in different ones.
 */

import {
  buildSuggestions,
  filterByQuery,
  matchesQuery,
  searchHaystack,
  shouldRequestCatalogue,
  suggestionLabel,
} from '../src/storefront/search';

const catalogue = [
  { id: '1', name: 'Classic Shirt', color: 'Red', tag: 'Best Seller' },
  { id: '2', name: 'Classic Shirt', color: 'Blue', tag: '' },
  { id: '3', name: 'Anarkali Suit', color: 'Maroon', tag: 'New Arrival' },
  { id: '4', name: 'Kurta', color: 'Green', tag: '' },
  { id: '5', name: 'Palazzo', color: 'Black', tag: '' },
];

const names = (items: ReturnType<typeof filterByQuery>) => items.map(i => `${i.name} ${i.color}`);

describe('searching on colour', () => {
  it('finds a product by its colour alone', () => {
    expect(names(filterByQuery(catalogue, 'red'))).toEqual(['Classic Shirt Red']);
  });

  it('is case-insensitive', () => {
    expect(filterByQuery(catalogue, 'RED')).toHaveLength(1);
    expect(filterByQuery(catalogue, 'rEd')).toHaveLength(1);
  });
});

describe('a query that spans two fields', () => {
  it('matches "classic red" across name and colour', () => {
    // The reported failure: "Classic" is in the name, "Red" is the colour, so a
    // single-field `includes` could never satisfy both words.
    expect(filterByQuery(catalogue, 'classic red')).toHaveLength(1);
    expect(matchesQuery(catalogue[0], 'classic red')).toBe(true);
  });

  it('excludes the same name in a different colour', () => {
    const [hit] = filterByQuery(catalogue, 'classic red');

    expect(hit.color).toBe('Red');
  });

  it('requires every token to match something', () => {
    expect(filterByQuery(catalogue, 'classic purple')).toHaveLength(0);
  });

  it('tolerates extra and missing whitespace', () => {
    expect(filterByQuery(catalogue, '  classic   red  ')).toHaveLength(1);
  });

  it('ignores surrounding punctuation', () => {
    expect(filterByQuery(catalogue, 'red!')).toHaveLength(1);
    expect(filterByQuery(catalogue, '"classic red"')).toHaveLength(1);
  });
});

describe('suggestions', () => {
  it('offers the match for "classic red"', () => {
    expect(buildSuggestions(catalogue, 'classic red')).toEqual(['Classic Shirt (Red)']);
  });

  it('offers nothing when nothing matches', () => {
    expect(buildSuggestions(catalogue, 'classic purple')).toEqual([]);
  });

  it('appends the colour when the shopper searched by colour', () => {
    // Two products share the name "Classic Shirt", so the colour is what tells
    // the shopper which one they are about to tap.
    expect(buildSuggestions(catalogue, 'red')).toEqual(['Classic Shirt (Red)']);
  });

  it('leaves the label alone when the colour was not the search term', () => {
    // Typing "classic" matches both shirts; the shopper has not asked about
    // colour, so neither is singled out and the shared name collapses to one row.
    expect(buildSuggestions(catalogue, 'classic')).toEqual(['Classic Shirt']);
  });

  it('de-duplicates identical labels', () => {
    const dupes = [
      { name: 'Classic Shirt', color: 'Red' },
      { name: 'Classic Shirt', color: 'Red' },
    ];

    expect(buildSuggestions(dupes, 'red')).toEqual(['Classic Shirt (Red)']);
  });

  it('respects the limit', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ name: `Kurta ${i}`, color: 'Red' }));

    expect(buildSuggestions(many, 'kurta', 6)).toHaveLength(6);
    expect(buildSuggestions(many, 'kurta')).toHaveLength(6);
  });

  it('labels a product that has no name at all', () => {
    expect(suggestionLabel({ name: '', color: 'Red' }, 'red')).toBe('Red');
  });
});

describe('tapping a suggestion keeps the results', () => {
  // The suggestion row writes its label straight back into the input, so the
  // label has to be a query that still matches. "Classic Shirt (Red)" contains
  // brackets the product does not have.
  it.each(catalogue)('label for $name is a self-matching query', product => {
    for (const query of ['classic', 'red', 'classic red', 'shirt', 'maroon']) {
      const label = suggestionLabel(product, query);
      if (!label) continue;
      expect(matchesQuery(product, label)).toBe(true);
    }
  });
});

describe('blank query', () => {
  it('returns everything', () => {
    expect(filterByQuery(catalogue, '')).toHaveLength(catalogue.length);
    expect(filterByQuery(catalogue, '   ')).toHaveLength(catalogue.length);
  });

  it('builds no suggestions, so the sheet stays closed', () => {
    expect(buildSuggestions(catalogue, '')).toEqual([]);
  });
});

describe('the haystack', () => {
  it('folds in every searchable field', () => {
    const hay = searchHaystack({
      name: 'Anarkali Suit',
      color: 'Maroon',
      tag: 'New Arrival',
      productCode: 'ANK-99',
      websiteCategory: 'Ethnic',
      categoryPath: ['Women', 'Ethnic Wear'],
    });

    for (const term of ['anarkali', 'maroon', 'new arrival', 'ank-99', 'ethnic', 'women']) {
      expect(hay).toContain(term);
    }
  });

  it('does not throw on a missing colour', () => {
    expect(() => searchHaystack({ name: 'Kurta' })).not.toThrow();
    expect(matchesQuery({ name: 'Kurta' }, 'kurta')).toBe(true);
  });

  it('keeps non-latin names searchable', () => {
    const items = [{ name: 'कुर्ता' }];

    expect(filterByQuery(items, 'कुर्ता')).toHaveLength(1);
  });
});

describe('the search-triggered catalogue request', () => {
  const at = (over: Partial<{ searchActive: boolean; requested: boolean; loading: boolean }> = {}) =>
    shouldRequestCatalogue({
      searchActive: false,
      requested: false,
      loading: false,
      ...over,
    });

  it('asks for the catalogue when a search starts', () => {
    // The regression: focusing search on the home feed left `products` empty,
    // so nothing could be filtered and nothing could be suggested.
    expect(at({ searchActive: true })).toBe(true);
  });

  it('stays quiet on the home feed', () => {
    expect(at()).toBe(false);
  });

  it('asks only once per search session', () => {
    // Keyed on a latch, not on the list being empty — otherwise a store whose
    // catalogue is empty re-requests on every keystroke.
    expect(at({ searchActive: true, requested: true })).toBe(false);
  });

  it('does not stack a second request while one is in flight', () => {
    expect(at({ searchActive: true, loading: true })).toBe(false);
  });

  it('asks again after a reset re-arms the latch', () => {
    const first = at({ searchActive: true });
    const afterReset = at({ searchActive: false });
    const second = at({ searchActive: true, requested: afterReset });

    expect(first).toBe(true);
    expect(afterReset).toBe(false);
    expect(second).toBe(true);
  });
});
