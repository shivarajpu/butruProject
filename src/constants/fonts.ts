import { Platform } from 'react-native';

/**
 * Cross-platform font family mapping:
 * - iOS requires the font's PostScript name (e.g. 'MomoSignature-Regular', 'Inter28pt-Bold')
 * - Android requires the TTF filename without extension (e.g. 'MomoSignature', 'Inter_28pt-Bold')
 */
export const FONTS = {
  // Momo Signature (Script/Signature font)
  momoSignature: Platform.select({
    ios: 'MomoSignature-Regular',
    android: 'MomoSignature',
    default: 'MomoSignature',
  }),

  // Inter Fonts
  inter28Bold: Platform.select({
    ios: 'Inter28pt-Bold',
    android: 'Inter_28pt-Bold',
    default: 'Inter_28pt-Bold',
  }),
  inter24Bold: Platform.select({
    ios: 'Inter24pt-Bold',
    android: 'Inter_24pt-Bold',
    default: 'Inter_24pt-Bold',
  }),
  inter18Bold: Platform.select({
    ios: 'Inter18pt-Bold',
    android: 'Inter_18pt-Bold',
    default: 'Inter_18pt-Bold',
  }),
  inter18SemiBold: Platform.select({
    ios: 'Inter18pt-SemiBold',
    android: 'Inter_18pt-SemiBold',
    default: 'Inter_18pt-SemiBold',
  }),
  inter28LightItalic: Platform.select({
    ios: 'Inter28pt-LightItalic',
    android: 'Inter_28pt-LightItalic',
    default: 'Inter_28pt-LightItalic',
  }),
  poppinsMedium: Platform.select({
    ios: 'Poppins-Medium',
    android: 'Poppins-Medium',
    default: 'Poppins-Medium',
  }),
  poppinsBold: Platform.select({
    ios: 'Poppins-Bold',
    android: 'Poppins-Bold',
    default: 'Poppins-Bold',
  }),

  // Arimo Fonts (same name on both iOS & Android)
  arimoBold: 'Arimo-Bold',
  arimoRegular: 'Arimo-Regular',
};
