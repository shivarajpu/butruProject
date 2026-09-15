import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  useWindowDimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';

// Theme Imports
import { useAppTheme } from '../theme/useAppTheme';
import AppInput from '../components/AppInput';
import type { AppTheme } from '../theme/types';

// Asset Imports
import { ARROW_BACK_ICON } from '../assets/svg';
import BagIconButton from '../components/BagIconButton';

// Dynamic SVGs Factory
const getSearchIconSvg = (color: string) => 
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 21L16.65 16.65" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const getArrowRightSvg = (color: string) => 
  `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const getHeartSvg = (color: string) => 
  `<svg width="14" height="14" viewBox="0 0 24 24" fill="${color}"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;

// Mock Categories
const CATEGORIES = [
  {
    id: '1',
    title: 'Clothing',
    subtitle: 'Trendy outfits\nfor every\noccasion',
    image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: '2',
    title: 'Shoes',
    subtitle: 'Stylish & comfy\nfootwear for\nlittle steps',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: '3',
    title: 'Accessories',
    subtitle: 'Complete\ntheir look with\ncute essentials',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: '4',
    title: 'Toys',
    subtitle: 'Fun, learning &\nplaytime\nfavorites',
    image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?q=80&w=600&auto=format&fit=crop',
  },
];

const createStyles = (theme: AppTheme) => {
  const { colors, fontFamily } = theme;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },

    /* Header */
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
      shadowColor: colors.text,
      shadowOpacity: 0.1,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },
    headerTitle: {
      fontSize: 16,
      fontFamily: fontFamily.bold,
      color: colors.text,
    },
    headerBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },

    /* Search Bar */
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 25,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      height: 46,
      marginTop: 6,
      marginBottom: 16,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      fontFamily: fontFamily.regular,
    },

    /* Grid & Category Card */
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    categoryCard: {
      borderRadius: 16,
      padding: 12,
      height: 140,
      flexDirection: 'row',
      justifyContent: 'space-between',
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardInfo: {
      justifyContent: 'space-between',
      flex: 1,
      zIndex: 2,
    },
    catTitle: {
      fontSize: 15,
      fontFamily: fontFamily.bold,
      color: colors.primary,
    },
    catSubtitle: {
      fontSize: 10,
      color: colors.textSecondary,
      fontFamily: fontFamily.regular,
      lineHeight: 14,
      marginTop: 2,
    },
    arrowCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 6,
    },
    cardImage: {
      width: '55%',
      height: '100%',
      position: 'absolute',
      right: 0,
      bottom: 0,
    },

    /* Promo Banner */
    promoBanner: {
      backgroundColor: colors.primaryLight,
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 6,
      marginBottom: 16,
      overflow: 'hidden',
    },
    promoLeft: {
      flex: 1,
    },
    promoTag: {
      fontSize: 11,
      color: colors.primary,
      fontFamily: fontFamily.medium,
      marginBottom: 4,
    },
    promoTitle: {
      fontSize: 14,
      fontFamily: fontFamily.bold,
      color: colors.text,
      lineHeight: 18,
      marginBottom: 10,
    },
    promoBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
    },
    promoBtnText: {
      color: colors.textOnPrimary,
      fontSize: 10,
      fontFamily: fontFamily.bold,
    },
    promoImage: {
      width: 120,
      height: 100,
      borderRadius: 12,
    },

    /* Bottom Grid Items */
    bottomGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    smallCard: {
      borderRadius: 12,
      height: 150,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      position: 'relative',
      borderWidth: 1,
      borderColor: colors.border,
    },
    smallBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: colors.text,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      zIndex: 2,
    },
    smallBadgeText: {
      color: colors.surface,
      fontSize: 8,
      fontFamily: fontFamily.medium,
    },
    smallImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    heartBtn: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: colors.surface,
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
      shadowColor: colors.text,
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
  });
};

const CategoryTab = () => {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const hPad = 16;
  const gap = 12;
  const numCols = isTablet ? 3 : 2;
  const cardW = (width - hPad * 2 - gap * (numCols - 1)) / numCols;
  const dynamicTopPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
  
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={[styles.container, { paddingTop: dynamicTopPadding }]}>

        {/* Top Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={handleBackPress}>
              <SvgXml xml={ARROW_BACK_ICON} width={15} height={15} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Product Categories</Text>
          </View>

          <BagIconButton />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Search Input Box */}
          <AppInput
            containerStyle={{ marginHorizontal: hPad, marginBottom: 0 }}
            inputContainerStyle={styles.searchBox}
            leftIcon={<SvgXml xml={getSearchIconSvg(theme.colors.textMuted)} width={18} height={18} />}
            style={styles.searchInput}
            placeholder="Search for styles, clothes & more"
          />

          {/* Category Cards Grid */}
          <View style={[styles.grid, { paddingHorizontal: hPad }]}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard, { width: cardW, marginBottom: gap }]}
                activeOpacity={0.9}>

                {/* Left Info Column */}
                <View style={styles.cardInfo}>
                  <Text style={styles.catTitle}>{cat.title}</Text>
                  <Text style={styles.catSubtitle}>{cat.subtitle}</Text>

                  <View style={styles.arrowCircle}>
                    <SvgXml xml={getArrowRightSvg(theme.colors.textOnPrimary)} width={12} height={12} />
                  </View>
                </View>

                {/* Right Image */}
                <Image source={{ uri: cat.image }} style={styles.cardImage} resizeMode="contain" />
              </TouchableOpacity>
            ))}
          </View>

          {/* New Arrivals Promo Banner */}
          <View style={[styles.promoBanner, { marginHorizontal: hPad }]}>
            <View style={styles.promoLeft}>
              <Text style={styles.promoTag}>New Arrivals</Text>
              <Text style={styles.promoTitle}>{'Fresh Styles Just\nFor Your Little Ones'}</Text>
              <TouchableOpacity style={styles.promoBtn} activeOpacity={0.85}>
                <Text style={styles.promoBtnText}>New Arrivals</Text>
                <SvgXml xml={getArrowRightSvg(theme.colors.textOnPrimary)} width={10} height={10} />
              </TouchableOpacity>
            </View>

            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?q=80&w=600&auto=format&fit=crop' }}
              style={styles.promoImage}
              resizeMode="cover"
            />
          </View>

          {/* Bottom Grid / Small Items Below Banner */}
          <View style={[styles.bottomGrid, { paddingHorizontal: hPad }]}>
            <View style={[styles.smallCard, { width: cardW }]}>
              <View style={styles.smallBadge}>
                <Text style={styles.smallBadgeText}>New Arrival</Text>
              </View>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?q=80&w=600&auto=format&fit=crop' }}
                style={styles.smallImage}
              />
              <TouchableOpacity style={styles.heartBtn}>
                <SvgXml xml={getHeartSvg(theme.colors.primary)} width={14} height={14} />
              </TouchableOpacity>
            </View>

            <View style={[styles.smallCard, { width: cardW }]}>
              <View style={styles.smallBadge}>
                <Text style={styles.smallBadgeText}>New Arrival</Text>
              </View>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=80&w=600&auto=format&fit=crop' }}
                style={styles.smallImage}
              />
              <TouchableOpacity style={styles.heartBtn}>
                <SvgXml xml={getHeartSvg(theme.colors.primary)} width={14} height={14} />
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default CategoryTab;
