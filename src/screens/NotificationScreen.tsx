import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';
import type { RootStackParamList } from '../navigation/types';

// --- Types ---
type FilterType = 'All' | 'Orders' | 'Offers' | 'Updates';

interface NotificationItem {
  id: string;
  type: FilterType;
  title: string;
  description: string;
  time: string;
  iconType: 'offer' | 'image' | 'order' | 'coupon';
  imageUri?: string;
}

// --- Dummy Data ---
const NOTIFICATIONS_DATA: NotificationItem[] = [
  {
    id: '1',
    type: 'Offers',
    title: 'Special Offer Just for You!',
    description: "Get up to 50% OFF on your favorite kids' fashion. Limited time only!",
    time: '2h ago',
    iconType: 'offer',
  },
  {
    id: '2',
    type: 'Updates',
    title: 'New Collection Alert!',
    description: 'Explore trendy new arrivals for boys and girls. Be the first to shop!',
    time: '5h ago',
    iconType: 'image',
    imageUri: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=150',
  },
  {
    id: '3',
    type: 'Orders',
    title: 'Order Shipped',
    description: 'Your order #BK12345 has been shipped and is on its way!',
    time: 'Yesterday',
    iconType: 'order',
  },
  {
    id: '4',
    type: 'Updates',
    title: 'Back in Stock!',
    description: "Your favorite dress is back in stock. Shop now before it's gone",
    time: 'Yesterday',
    iconType: 'image',
    imageUri: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=150',
  },
  {
    id: '5',
    type: 'Offers',
    title: 'Coupon Code Unlo...',
    description: 'Use code KIDS20 for an extra 20% off on your next purchase.',
    time: '2 days ago',
    iconType: 'coupon',
  },
  {
    id: '6',
    type: 'Updates',
    title: 'Exclusive Looks for...',
    description: 'Check out our latest collection made for every little moment.',
    time: '3 days ago',
    iconType: 'image',
    imageUri: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=150',
  },
];

// --- Icon Builders (Theme-aware) ---
const backArrowIcon = (color: string) =>
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const bagIcon = (color: string) =>
  `<svg width="19" height="21" viewBox="0 0 19 21" fill="none"><path d="M1.51894 8.19807C1.55715 7.72193 1.7733 7.27766 2.12435 6.95373C2.47539 6.6298 2.93557 6.44998 3.41323 6.45007H14.8683C15.346 6.44998 15.8061 6.6298 16.1572 6.95373C16.5082 7.27766 16.7244 7.72193 16.7626 8.19807L17.5254 17.698C17.5464 17.9595 17.5131 18.2224 17.4274 18.4703C17.3418 18.7182 17.2058 18.9457 17.0279 19.1385C16.8501 19.3312 16.6342 19.4851 16.394 19.5903C16.1538 19.6956 15.8944 19.75 15.6321 19.75H2.64943C2.38716 19.75 2.12774 19.6956 1.88752 19.5903C1.64729 19.4851 1.43145 19.3312 1.2536 19.1385C1.07575 18.9457 0.939725 18.7182 0.854102 18.4703C0.768479 18.2224 0.735108 17.9595 0.75609 17.698L1.51894 8.19807Z" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12.9407 9.29997V4.54999C12.9407 3.54217 12.5403 2.57563 11.8277 1.86299C11.115 1.15035 10.1485 0.75 9.14069 0.75C8.13287 0.75 7.16632 1.15035 6.45369 1.86299C5.74105 2.57563 5.3407 3.54217 5.3407 4.54999V9.29997" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const arrowRightIcon = (color: string) =>
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 18l6-6-6-6" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const megaphoneIcon = (color: string) =>
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 11l18-5v12L3 13v-2zM11.6 16.8a3 3 0 11-5.8-1.6" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const orderIcon = (color: string) =>
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 4L12 14.01l-3-3" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const couponIcon = (color: string) =>
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="7" r="1.5" fill="${color}"/></svg>`;

const bellOffIcon = (color: string) =>
  `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.73 21a2 2 0 01-3.46 0M18.63 13A17.89 17.89 0 0118 8M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14M18 8a6 6 0 00-9.33-5M1 1l22 22" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// --- Component ---
type Props = NativeStackScreenProps<RootStackParamList, 'Notification'>;

export default function NotificationScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');

  const filterTabs: FilterType[] = ['All', 'Orders', 'Offers', 'Updates'];

  const filteredNotifications = NOTIFICATIONS_DATA.filter((item) => {
    if (activeFilter === 'All') return true;
    return item.type === activeFilter;
  });

  const renderNotificationIcon = (item: NotificationItem) => {
    if (item.iconType === 'image' && item.imageUri) {
      return <Image source={{ uri: item.imageUri }} style={styles.cardImage} />;
    }

    const iconConfig =
      item.iconType === 'offer'
        ? { bg: colors.primaryLight, stroke: colors.primary }
        : item.iconType === 'order'
        ? { bg: `${colors.success}1A`, stroke: colors.success }
        : { bg: colors.coupanBackroun, stroke: colors.primary };

    return (
      <View style={[styles.iconBox, { backgroundColor: iconConfig.bg }]}>
        {item.iconType === 'offer' && (
          <SvgXml xml={megaphoneIcon(iconConfig.stroke)} width={22} height={22} />
        )}
        {item.iconType === 'order' && (
          <SvgXml xml={orderIcon(iconConfig.stroke)} width={22} height={22} />
        )}
        {item.iconType === 'coupon' && (
          <SvgXml xml={couponIcon(iconConfig.stroke)} width={22} height={22} />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.canGoBack() && navigation.goBack()}>
          <SvgXml xml={backArrowIcon(colors.text)} width={20} height={20} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>Offers, orders & styles.</Text>
        </View>
        <TouchableOpacity
          style={styles.bagBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('CartScreen')}>
          <SvgXml xml={bagIcon(colors.text)} width={19} height={21} />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.chip, isActive ? styles.activeChip : styles.inactiveChip]}
              onPress={() => setActiveFilter(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, isActive ? styles.activeChipText : styles.inactiveChipText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List or Empty State */}
      {filteredNotifications.length > 0 ? (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.9}>
              {renderNotificationIcon(item)}

              <View style={styles.cardContent}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardTime}>{item.time}</Text>
                </View>
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>

              <View style={styles.arrowContainer}>
                <SvgXml xml={arrowRightIcon(colors.textMuted)} width={16} height={16} />
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <SvgXml xml={bellOffIcon(colors.textMuted)} width={36} height={36} />
          </View>
          <Text style={styles.emptyTitle}>No Notification yet</Text>
          <Text style={styles.emptySubtitle}>
            When you get updates about your orders, offer and more, they'll appear here
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// --- Styles ---
const createStyles = (theme: AppTheme) => {
  const { colors, fontFamily } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitleContainer: {
      flex: 1,
      marginLeft: 12,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      fontFamily: fontFamily.heading,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: fontFamily.regular,
    },
    bagBtn: {
      padding: 4,
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      marginVertical: 12,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 10,
    },
    activeChip: {
      backgroundColor: colors.primary,
    },
    inactiveChip: {
      backgroundColor: colors.primaryLight,
    },
    chipText: {
      fontSize: 13,
      fontFamily: fontFamily.medium,
    },
    activeChipText: {
      color: colors.textOnPrimary,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
    },
    inactiveChipText: {
      color: colors.text,
    },
    listContainer: {
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.divider,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
    },
    iconBox: {
      width: 52,
      height: 52,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardImage: {
      width: 52,
      height: 52,
      borderRadius: 14,
      resizeMode: 'cover',
    },
    cardContent: {
      flex: 1,
      marginLeft: 12,
      marginRight: 6,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      fontFamily: fontFamily.bold,
      flex: 1,
      marginRight: 6,
    },
    cardTime: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: fontFamily.regular,
    },
    cardDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: fontFamily.regular,
      lineHeight: 17,
    },
    arrowContainer: {
      paddingLeft: 4,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      marginTop: -40,
    },
    emptyIconCircle: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      fontFamily: fontFamily.bold,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: fontFamily.regular,
      textAlign: 'center',
      lineHeight: 18,
    },
  });
};