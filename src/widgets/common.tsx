/**
 * Shared building blocks for dynamic widgets.
 *
 * Everything here is brand-agnostic: colours and fonts come from the resolved
 * app theme (which the storefront config re-skins at runtime), and all copy
 * comes from the widget `config` — no hardcoded headings or prices.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FONTS } from '../constants/fonts';
import {
  ImageBackground,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useDispatch } from 'react-redux';
import { addItem as addCartItem } from '../store/slices/cartSlice';
import type { AppDispatch } from '../store';
import { heartFilledSvg, heartOutlineSvg, STAR_FILLED_SVG } from '../assets/svg';
import { BRAND } from '../assets/svg/brand';
import BrandIcon from '../components/BrandIcon';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';
import type { RootStackParamList } from '../navigation/types';
import { useStoreConfig } from '../storefront/useStorefront';
import { isExternalLink, resolveLink, type WidgetAction } from '../storefront/links';
import type { StoreProduct } from '../storefront/catalog';
import type { StoreWidget } from '../storefront/types';

// ─── Async data helper ─────────────────────────────────────────────────────────

export type AsyncState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
};

/**
 * Runs `loader` whenever `deps` change, with a guard against setting state
 * after unmount. Widgets that resolve to nothing simply render `null`.
 */
export function useWidgetData<T>(
  loader: () => Promise<T>,
  deps: React.DependencyList,
  initial: T,
): AsyncState<T> & { reload: () => void } {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    loader()
      .then(result => {
        if (active) setData(result);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Something went wrong.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce(value => value + 1), []);

  return { data, loading, error, reload };
}

// ─── Navigation ────────────────────────────────────────────────────────────────

type Navigation = NativeStackNavigationProp<RootStackParamList>;

/**
 * Screens are addressed by name here, so a single loose signature keeps the
 * resolver independent from the exact navigator generics.
 */
type LooseNavigator = {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
  getState?: () => { routeNames?: string[] } | undefined;
  getParent?: () => LooseNavigator | undefined;
};

const TAB_SCREENS = new Set(['HomeTab', 'CategoryTab', 'WishlistTab', 'AccountTab']);

/**
 * Monotonic counter stamped onto every tab push (see `pushTab`). Module scope
 * so it keeps climbing across widget instances within a session.
 */
let navNonce = 0;

/** Stack screen that hosts the bottom tab navigator. */
const TAB_HOST_SCREEN = 'Home';

/**
 * Executes a `WidgetAction` from anywhere in the tree. Tab targets stay inside
 * the tab navigator, stack targets bubble up to the root stack.
 */
export function useWidgetActions() {
  const navigation = useNavigation<Navigation>();
  const config = useStoreConfig();

  const run = useCallback(
    (action: WidgetAction) => {
      const parent = navigation.getParent() as unknown as LooseNavigator | undefined;
      const self = navigation as unknown as LooseNavigator;
      const root = (parent ?? self) as LooseNavigator;

      // `HomeTab` & friends are routes of the tab navigator, not of the root
      // stack. Handing a tab name to the stack is what produced
      // "The action 'NAVIGATE' with payload {name:'HomeTab'} was not handled
      // by any navigator".
      //
      // The same hook is used from two different depths — inside `HomeTab`
      // (where the tab navigator is the current one) and from stack screens
      // such as ProductDetails (where it isn't). So walk up to whichever
      // navigator actually owns the route, and only fall back to addressing
      // the tab navigator through its host stack screen when none does.
      // React Navigation treats `navigate` to the screen you are already on
      // with identical params as a no-op, and the destination's
      // `useEffect([route.params.x])` would not re-run either — so tapping
      // "View all" twice for the same category did nothing at all. A per-call
      // nonce makes each push a distinct navigation.
      const pushTab = (screen: string, params?: Record<string, unknown>) => {
        const payload = { ...(params ?? {}), navNonce: ++navNonce };
        let nav: LooseNavigator | undefined = self;
        while (nav) {
          const owns = nav.getState?.()?.routeNames?.includes(screen);
          if (owns) {
            nav.navigate(screen, payload);
            return;
          }
          nav = nav.getParent?.();
        }
        root.navigate(TAB_HOST_SCREEN, { screen, params: payload });
      };

      switch (action.type) {
        case 'tab':
          if (TAB_SCREENS.has(action.screen)) pushTab(action.screen, action.params);
          else root.navigate(action.screen, action.params);
          return;
        case 'stack':
          root.navigate(action.screen, action.params);
          return;
        case 'category':
          pushTab('HomeTab', { category: action.category });
          return;
        case 'collection':
          pushTab('CategoryTab', { collectionId: action.collectionId });
          return;
        case 'none':
        default:
          return;
      }
    },
    [navigation],
  );

  const onLink = useCallback(
    (link?: string) => {
      if (!link) return;
      if (isExternalLink(link)) {
        Linking.openURL(link).catch(() => undefined);
        return;
      }
      run(resolveLink(link, { config }));
    },
    [config, run],
  );

  const onCategory = useCallback(
    (category?: string) => {
      if (category) run({ type: 'category', category });
    },
    [run],
  );

  return { run, onLink, onCategory };
}

// ─── Layout helpers ────────────────────────────────────────────────────────────

/** Column gap every grid in the widget layer shares. */
export const GRID_GAP = 12;

/**
 * Width of a tile in a `count`-column grid inside `gutter` padding.
 *
 * Tiles are measured instead of given a percentage so a last row that isn't
 * full keeps the *same* gaps as the rows above it. Percentages plus
 * `justifyContent: 'space-between'` push that row's two tiles to opposite
 * edges, leaving a hole in the middle of the section.
 */
export const gridTileWidth = (width: number, gutter: number, count: number) =>
  (width - gutter * 2 - GRID_GAP * (count - 1)) / count;

export const useWidgetLayout = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const gutter = isTablet ? 24 : width * 0.04;
  /** Two columns on phones, four on tablets — same source for every grid. */
  const columns = isTablet ? 4 : 2;
  const tileWidth = gridTileWidth(width, gutter, columns);
  /** Tiles for a grid of any other column count, on the same gutters. */
  const tileWidthFor = (count: number) => gridTileWidth(width, gutter, count);

  return { width, isTablet, gutter, columns, tileWidth, tileWidthFor };
};

export const createWidgetStyles = (theme: AppTheme) => {
  const { colors, fontFamily } = theme;

  return StyleSheet.create({
    section: {
      marginBottom: 22,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    sectionTitle: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      fontFamily: FONTS.inter28Bold,
    },
    sectionSubtitle: {
      marginTop: 3,
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: fontFamily.regular,
    },
    viewAll: {
      fontSize: 12,
      color: colors.primary,
      fontFamily: fontFamily.medium,
    },
    ctaButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: 20,
      alignSelf: 'flex-start',
    },
    ctaText: {
      color: colors.textOnPrimary,
      fontSize: 13,
      fontFamily: FONTS.poppinsBold,
    },
    loaderBox: {
      paddingVertical: 28,
      alignItems: 'center',
    },
    emptyBox: {
      paddingVertical: 22,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: fontFamily.regular,
    },
  });
};

// ─── Header ────────────────────────────────────────────────────────────────────

type WidgetHeaderProps = {
  widget: StoreWidget;
  title?: string;
  subtitle?: string;
  onViewAll?: () => void;
  viewAllLabel?: string;
};

export const WidgetHeader = ({
  widget,
  title,
  subtitle,
  onViewAll,
  viewAllLabel = 'View all',
}: WidgetHeaderProps) => {
  const theme = useAppTheme();
  const styles = createWidgetStyles(theme);
  const { config } = widget;

  const visible = config.showTitle === true;
  const heading = title ?? config.heading ?? '';
  const subheading = subtitle ?? config.subheading ?? '';

  if (!visible && !heading && !subheading) return null;

  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{heading}</Text>
        {!!subheading && <Text style={styles.sectionSubtitle}>{subheading}</Text>}
      </View>
      {onViewAll && (
        <TouchableOpacity activeOpacity={0.7} onPress={onViewAll} hitSlop={8}>
          <Text style={styles.viewAll}>{viewAllLabel} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Stars ─────────────────────────────────────────────────────────────────────

export const Stars = ({ rating, size = 10 }: { rating: number; size?: number }) => {
  const theme = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(index => (
        <Text
          key={index}
          style={{
            fontSize: size,
            color: index <= Math.round(rating) ? theme.colors.star : theme.colors.border,
          }}>
          ★
        </Text>
      ))}
    </View>
  );
};

// ─── Product tile ──────────────────────────────────────────────────────────────

type ProductTileProps = {
  product: StoreProduct;
  width: number;
  onPress: () => void;
  onToggleWishlist?: () => void;
  wished?: boolean;
  showRating?: boolean;
};

export const ProductTile = ({
  product,
  width,
  onPress,
  onToggleWishlist,
  wished = false,
  showRating = true,
}: ProductTileProps) => {
  const theme = useAppTheme();
  const { colors } = theme;
  const dispatch = useDispatch<AppDispatch>();
  const imageHeight = width * 1.15;

  // Size chips + Add to Cart mirror the home tab's original product card, so a
  // tile looks and behaves the same wherever the storefront config drops it.
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState(false);
  const addTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (addTimer.current) clearTimeout(addTimer.current);
    },
    [],
  );

  const handleAddToCart = () => {
    if (product.sizes.length > 0 && !selectedSize) {
      setSizeError(true);
      return;
    }
    dispatch(
      addCartItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        size: selectedSize ?? '',
        color: product.color ?? '',
        productCode: product.productCode,
      }),
    );
    setAdded(true);
    if (addTimer.current) clearTimeout(addTimer.current);
    addTimer.current = setTimeout(() => setAdded(false), 1200);
  };

  return (
    <View style={[stylesLocal.productCard, { width }]}>
      <TouchableOpacity style={{ position: 'relative' }} activeOpacity={0.8} onPress={onPress}>
        <ImageBackground
          source={{ uri: product.image }}
          style={[stylesLocal.productImgArea, { height: imageHeight }]}
          imageStyle={{ borderRadius: 12 }}>
          <View
            style={[
              stylesLocal.tagBadge,
              { backgroundColor: product.isOutOfStock ? colors.error : colors.text },
            ]}>
            <Text style={stylesLocal.tagText}>
              {product.isOutOfStock ? 'Out of stock' : product.tag}
            </Text>
          </View>
        </ImageBackground>
        {onToggleWishlist ? (
          <TouchableOpacity
            style={stylesLocal.heartBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={(e) => { e.stopPropagation(); onToggleWishlist?.(); }}>
            <SvgXml
              xml={wished ? heartFilledSvg(colors.primary) : heartOutlineSvg(colors.textMuted)}
              width={16}
              height={16}
            />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>

      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <View style={stylesLocal.productInfo}>
          <Text style={[stylesLocal.productName, { color: colors.text }]} numberOfLines={1}>
            {product.name}
          </Text>
          <View style={stylesLocal.priceRow}>
            <Text
              style={[stylesLocal.price, { color: colors.primary, fontFamily: FONTS.poppinsBold }]}>
              ₹ {product.price}
            </Text>
            <Text style={[stylesLocal.originalPrice, { color: colors.textMuted }]}>
              ₹{product.originalPrice}
            </Text>
            <Text style={[stylesLocal.discountText, { color: colors.discount }]}>
              {product.discount}% OFF
            </Text>
          </View>
          {showRating && (
            <View style={stylesLocal.ratingRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <SvgXml
                  key={star}
                  xml={STAR_FILLED_SVG}
                  width={10}
                  height={10}
                  style={star <= Math.round(product.rating) ? undefined : { opacity: 0.25 }}
                />
              ))}
              <Text style={[stylesLocal.reviewCount, { color: colors.textMuted }]}>
                ({product.reviews})
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {product.sizes.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 8 }}>
          <View style={stylesLocal.sizeContainer}>
            {product.sizes.map((sz, idx) => {
              const isSelected = selectedSize === sz;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setSelectedSize(sz);
                    setSizeError(false);
                  }}
                  style={[
                    stylesLocal.sizeChip,
                    isSelected && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primaryLight,
                    },
                  ]}>
                  <Text
                    style={[
                      stylesLocal.sizeText,
                      isSelected && { color: colors.primary, fontWeight: '700' },
                    ]}>
                    {sz}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {sizeError ? (
        <Text style={[stylesLocal.sizeErrorText, { color: colors.error }]}>
          Please select a size
        </Text>
      ) : null}

      <TouchableOpacity
        style={[
          stylesLocal.addToCartBtn,
          { backgroundColor: added ? colors.success : colors.primary },
          added && stylesLocal.addToCartBtnAdded,
        ]}
        activeOpacity={0.8}
        onPress={handleAddToCart}>
        <BrandIcon icon={BRAND.cart} width={13} height={13} />
        <Text
          style={[stylesLocal.addToCartText, { color: colors.textOnPrimary, fontFamily: FONTS.poppinsBold }]}>
          {added ? 'Added' : 'Add to Cart'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const stylesLocal = StyleSheet.create({
  productCard: {
    backgroundColor: '#FFFFFF',
    // Vertical rhythm between stacked cards. The grid has no `rowGap`, so this
    // is what keeps the next row off the Add to Cart button.
    marginBottom: 14,
  },
  productImgArea: {
    width: '100%',
    position: 'relative',
  },
  tagBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '600',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    zIndex: 999,
  },
  productInfo: {
    paddingVertical: 6,
  },
  productName: {
    fontSize: 12,
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginVertical: 2,
  },
  price: {
    fontSize: 13,
  },
  originalPrice: {
    fontSize: 10,
    textDecorationLine: 'line-through',
  },
  discountText: {
    fontSize: 9,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  reviewCount: {
    fontSize: 10,
  },
  sizeContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  sizeChip: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 3,
    backgroundColor: '#FFFFFF',
  },
  sizeText: {
    fontSize: 9,
    color: '#666666',
    fontWeight: '500',
  },
  sizeErrorText: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 6,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 6,
    gap: 6,
    // The size-chip row only renders for products that have sizes, so the gap
    // below the info block has to come from the button itself.
    marginTop: 8,
  },
  addToCartBtnAdded: {
    opacity: 0.9,
  },
  addToCartText: {
    fontSize: 11,
  },
  heart: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 12,
    marginTop: 6,
  },
  mrp: {
    fontSize: 10,
    textDecorationLine: 'line-through',
  },
  reviews: {
    fontSize: 10,
  },
});

// ─── Widget frame ──────────────────────────────────────────────────────────────

export const WidgetFrame = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) => <View style={style}>{children}</View>;
