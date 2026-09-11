/**
 * MenuDrawer — Reusable side menu drawer with brand header, nav items and promo.
 *
 * DRAWER_ITEMS config is kept here alongside the component so HomeTab (and any
 * future consumer) only needs to render <MenuDrawer />.
 *
 * Usage:
 *   const [open, setOpen] = useState(false);
 *   <MenuDrawer
 *     visible={open}
 *     onClose={() => setOpen(false)}
 *     onSelect={name => handleMenuItem(name)}
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
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';
import {
  Butruname,
  HOME_ACTIVE_SVG,
  CLOTHING_SVG,
  SHOES_SVG,
  ACCESSORIES_SVG,
  TOYS_SVG,
  WISHLIST_SVG,
  ORDERS_SVG,
  ACCOUNT_SVG,
  HELP_SVG,
  CLOSE_SVG,
  Sidebaarimage,
} from '../assets/svg';

// ─── Drawer Menu Config ────────────────────────────────────────────────────────

export const DRAWER_ITEMS = [
  { id: '1', name: 'Home', icon: HOME_ACTIVE_SVG },
  { id: '2', name: 'Clothing', icon: CLOTHING_SVG },
  { id: '3', name: 'Shoes', icon: SHOES_SVG },
  { id: '4', name: 'Accessories', icon: ACCESSORIES_SVG },
  { id: '5', name: 'Toys', icon: TOYS_SVG },
  { id: '6', name: 'Wishlist', icon: WISHLIST_SVG },
  { id: '7', name: 'My Orders', icon: ORDERS_SVG },
  { id: '8', name: 'Account', icon: ACCOUNT_SVG },
  { id: '9', name: 'Help & Support', icon: HELP_SVG },
];

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
      fontWeight: '500',
      color: colors.text,
      fontFamily: fontFamily.medium,
    },
    drawerItemTextActive: {
      color: colors.primary,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
    },
    shopNowBtn: {
      backgroundColor: colors.primary,
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
      color: colors.textOnPrimary,
      fontSize: 9,
      fontWeight: '700',
    },
  });
};

// ─── MenuDrawer Component ──────────────────────────────────────────────────────

interface MenuDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (name: string) => void;
  activeCategory: string;
  logoWidth: number;
  logoHeight: number;
}

const MenuDrawer: React.FC<MenuDrawerProps> = ({
  visible,
  onClose,
  onSelect,
  activeCategory,
  logoWidth,
  logoHeight,
}) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();

  const handleItemPress = (name: string) => {
    onSelect(name);
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
              {Butruname ? (
                <SvgXml xml={Butruname} width={logoWidth * 1.1} height={logoHeight * 1.1} />
              ) : (
                <Text style={styles.logoFallback}>{theme.appName}</Text>
              )}
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <SvgXml xml={CLOSE_SVG} width={18} height={18} />
              </TouchableOpacity>
            </View>

            {/* Menu Items List */}
            <View style={styles.drawerList}>
              {DRAWER_ITEMS.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.drawerItem,
                    item.name === activeCategory && styles.drawerItemActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleItemPress(item.name)}>
                  <SvgXml xml={item.icon} width={21} height={21} />
                  <Text
                    style={[
                      styles.drawerItemText,
                      item.name === activeCategory && styles.drawerItemTextActive,
                    ]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Bottom Promo Banner */}
            <View>
              <TouchableOpacity style={styles.shopNowBtn} activeOpacity={0.8}>
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