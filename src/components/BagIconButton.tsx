/**
 * BagIconButton — Standard header bag icon button.
 *
 * Same visual size on every screen. Tapping it navigates to CartScreen.
 */

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SvgXml } from 'react-native-svg';
import { BAG_SVG } from '../assets/svg';

const BagIconButton = () => {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      style={styles.bagBtn}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('CartScreen')}>
      <SvgXml xml={BAG_SVG} width={22} height={22} />
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
});

export default BagIconButton;