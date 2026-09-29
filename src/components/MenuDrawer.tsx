/**
 * MenuDrawer — side menu whose category list comes from the storefront config.
 *
 * Categories + labels are fully server driven (`website.navigation`); the
 * account-level entries (Wishlist / Orders / Account / Help) are app routes
 * and are appended after them, so a merchant can reorder or rename the shop
 * menu without a release.
 *
 * Usage:
 *   const [open, setOpen] = useState(false);
 *   <MenuDrawer
 *     visible={open}
 *     onClose={() => setOpen(false)}
 *     onSelect={action => handleMenuAction(action)}
 *     activeCategory="Home"
 *     logoWidth={90}
 *     logoHeight={36}
 *   />
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useSelector } from 'react-redux';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';
import { FONTS } from '../constants/fonts';
import { Sidebaarimage } from '../assets/svg';
import { BRAND, type BrandIconDef } from '../assets/svg/brand';
import BrandIcon from './BrandIcon';
import StoreLogo from './StoreLogo';
import { selectNavigation } from '../storefront/selectors';
import { categoryIcon } from '../storefront/categoryIcons';
import { resolveLink, type WidgetAction } from '../storefront/links';
import { useStoreConfig } from '../storefront/useStorefront';
import type { NavItem, StoreConfig } from '../storefront/types';

// ─── Drawer Menu Config ────────────────────────────────────────────────────────

export type DrawerItem = {
  id: string;
  name: string;
  icon: BrandIconDef;
  action: WidgetAction;
  /** Category this item highlights when active. */
  category?: string;
};

/** Builds the drawer list from the storefront config + app routes. */
export const buildDrawerItems = (
  navItems: NavItem[],
  config: StoreConfig | null,
): DrawerItem[] => {
  const configCategories = navItems
    .filter(item => !item.children?.length)
    .map((item, index) => {
      const action = resolveLink(item.link, { config });
      return {
        id: item.id || `nav-${index}`,
        name: item.title,
        icon: categoryIcon(item.title),
        action,
        category: action.type === 'category' ? action.category : item.title,
      };
    });

  return [
    { id: 'home', name: 'Home', icon: BRAND.home, action: { type: 'none' }, category: 'Home' },
    ...configCategories,
  ];
};

// ─── StyleSheet Factory ────────────────────────────────────────────────────────

const createStyles = (theme: AppTheme) => {
  const { colors, fontFamily } = theme;

  return StyleSheet.create({
    drawerOverlay: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: colors.overlay,
    },
    drawerBackdrop: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },
    drawerContent: {
      width: '82%',
      height: '100%',
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingBottom: 20,
      elevation: 10,
      shadowColor: colors.text,
      shadowOffset: { width: 4, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
    },
    drawerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      marginBottom: 8,
    },
    closeBtn: {
      padding: 6,
    },
    logoFallback: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
      fontFamily: fontFamily.heading,
    },
    drawerList: {
      gap: 4,
      marginBottom: 20,
    },
    drawerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: 12,
      gap: 14,
    },
    drawerItemActive: {
      backgroundColor: colors.primaryLight,
    },
    drawerItemText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      fontFamily: FONTS.poppinsBold,
    },
    drawerItemTextActive: {
      color: colors.primary,
      fontWeight: '700',
      fontFamily: FONTS.poppinsBold,
    },
    shopNowBtn: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      alignSelf: 'flex-start',
      zIndex: 999,
      position: 'absolute',
      bottom: 24,
      left: 13,
    },
    shopNowText: {
      color: colors.primary,
      fontSize: 9,
      fontFamily: FONTS.poppinsBold,
    },
  });
};

// ─── MenuDrawer Component ──────────────────────────────────────────────────────

interface MenuDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (action: WidgetAction, item: DrawerItem) => void;
  activeCategory: string;
  logoWidth: number;
  logoHeight: number;
  /** Bottom promo button — opens the full product listing. */
  onShopNow: () => void;
}

const MenuDrawer: React.FC<MenuDrawerProps> = ({
  visible,
  onClose,
  onSelect,
  activeCategory,
  logoWidth,
  logoHeight,
  onShopNow,
}) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  const navItems = useSelector(selectNavigation);
  const config = useStoreConfig();
  const items = buildDrawerItems(navItems, config);

  const handleItemPress = (item: DrawerItem) => {
    onSelect(item.action, item);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.drawerOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.drawerBackdrop} />
        </TouchableWithoutFeedback>

        <View style={[styles.drawerContent, { paddingTop: insets.top + 10 }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header with Logo and Close Button */}
            <View style={styles.drawerHeader}>
              <StoreLogo
                width={logoWidth * 1.1}
                height={logoHeight * 1.1}
                textStyle={styles.logoFallback}
              />
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <BrandIcon icon={BRAND.close} width={18} height={18} />
              </TouchableOpacity>
            </View>

            {/* Menu Items List */}
            <View style={styles.drawerList}>
              {items.map(item => {
                const isActive =
                  !!item.category &&
                  (item.category === activeCategory ||
                    item.name.toLowerCase() === activeCategory.toLowerCase());

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.drawerItem, isActive && styles.drawerItemActive]}
                    activeOpacity={0.7}
                    onPress={() => handleItemPress(item)}>
                    <BrandIcon icon={item.icon} width={21} height={21} />
                    <Text
                      style={[
                        styles.drawerItemText,
                        isActive && styles.drawerItemTextActive,
                      ]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Bottom Promo Banner */}
            <View>
              <TouchableOpacity
                style={styles.shopNowBtn}
                activeOpacity={0.8}
                onPress={() => {
                  onClose();
                  onShopNow();
                }}>
                <Text style={styles.shopNowText}>Shop Now →</Text>
              </TouchableOpacity>
              <SvgXml xml={Sidebaarimage} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default MenuDrawer;