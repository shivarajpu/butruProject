/**
 * BagIconButton — Standard header bag icon button.
 *
 * Same visual size on every screen. Tapping it navigates to CartScreen.
 * Shows a badge with the total number of items saved in the global cart.
 */

import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SvgXml } from 'react-native-svg';
import { useSelector } from 'react-redux';
import { BAG_SVG } from '../assets/svg';
import { selectCartCount } from '../store/slices/cartSlice';
import type { RootState } from '../store';
import { useAppTheme } from '../theme/useAppTheme';

const BagIconButton = () => {
  const navigation = useNavigation<any>();
  const theme = useAppTheme();
  const count = useSelector((state: RootState) => selectCartCount(state));

  return (
    <TouchableOpacity
      style={styles.bagBtn}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('CartScreen')}>
      <SvgXml xml={BAG_SVG} width={22} height={22} />
      {count > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.badgeText, { color: theme.colors.textOnPrimary }]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bagBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
});

export default BagIconButton;