import React, { useCallback, useEffect, useMemo } from 'react';
import { FONTS } from '../constants/fonts';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';
import type { RootStackParamList } from '../navigation/types';
import type { AppDispatch, RootState } from '../store';
import {
  loadMoreNotifications,
  loadNotifications,
  readAllNotifications,
  readNotification,
  selectUnreadCount,
  selectVisibleNotifications,
  setFilter,
  type NotificationFilter,
} from '../store/slices/notificationSlice';
import type { AppNotification } from '../api/notifications';
import { navigateFromNotification } from '../services/push';

// --- Icon Builders (Theme-aware) ---
const backArrowIcon = (color: string) =>
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

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

const FILTER_TABS: NotificationFilter[] = ['All', 'Orders', 'Offers', 'Updates'];

export default function NotificationScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const dispatch = useDispatch<AppDispatch>();

  const notifications = useSelector(selectVisibleNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const activeFilter = useSelector((state: RootState) => state.notifications.activeFilter);
  const status = useSelector((state: RootState) => state.notifications.status);
  const refreshing = useSelector((state: RootState) => state.notifications.refreshing);
  const loadingMore = useSelector((state: RootState) => state.notifications.loadingMore);
  const hasMore = useSelector((state: RootState) => state.notifications.hasMore);
  const error = useSelector((state: RootState) => state.notifications.error);

  // The feed is fetched on mount. `loadNotifications` tolerates a missing
  // backend (it resolves to an empty page), so this never leaves the screen
  // stuck on a spinner.
  useEffect(() => {
    dispatch(loadNotifications({ refresh: true }));
  }, [dispatch]);

  const onRefresh = useCallback(() => {
    dispatch(loadNotifications({ refresh: true }));
  }, [dispatch]);

  const onEndReached = useCallback(() => {
    if (!hasMore || loadingMore) return;
    dispatch(loadMoreNotifications());
  }, [dispatch, hasMore, loadingMore]);

  const handleFilter = (filter: NotificationFilter) => {
    dispatch(setFilter(filter));
  };

  /**
   * Opens a notification.
   *
   * The tap marks it as read and then follows the link the server attached —
   * the same resolver the storefront widgets use, so `/orders` lands on the
   * orders screen and an external URL opens in the browser.
   */
  const handlePress = (item: AppNotification) => {
    if (!item.isRead) {
      dispatch(readNotification(item.id));
    }
    if (item.link) {
      navigateFromNotification({ link: item.link });
    }
  };

  const isInitialLoad = status === 'loading' && notifications.length === 0;

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.canGoBack() && navigation.goBack()}>
          <SvgXml xml={backArrowIcon(colors.text)} width={20} height={20} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0
              ? `${unreadCount} unread · offers, orders & styles`
              : 'Offers, orders & styles.'}
          </Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllBtn}
            activeOpacity={0.7}
            onPress={() => dispatch(readAllNotifications())}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>
    ),
    [colors.text, dispatch, navigation, styles, unreadCount],
  );

  const renderNotificationIcon = (item: AppNotification) => {
    if (item.iconType === 'image' && item.imageUri) {
      return <Image source={{ uri: item.imageUri }} style={styles.cardImage} />;
    }

    const iconConfig =
      item.iconType === 'order'
        ? { bg: `${colors.success}1A`, stroke: colors.success }
        : item.iconType === 'coupon'
          ? { bg: colors.coupanBackroun, stroke: colors.primary }
          : { bg: colors.primaryLight, stroke: colors.primary };

    return (
      <View style={[styles.iconBox, { backgroundColor: iconConfig.bg }]}>
        {item.iconType === 'order' ? (
          <SvgXml xml={orderIcon(iconConfig.stroke)} width={22} height={22} />
        ) : item.iconType === 'coupon' ? (
          <SvgXml xml={couponIcon(iconConfig.stroke)} width={22} height={22} />
        ) : (
          <SvgXml xml={megaphoneIcon(iconConfig.stroke)} width={22} height={22} />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />

      {header}

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.chip, isActive ? styles.activeChip : styles.inactiveChip]}
              onPress={() => handleFilter(tab)}
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
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, !item.isRead && styles.cardUnread]}
              activeOpacity={0.9}
              onPress={() => handlePress(item)}>
              {renderNotificationIcon(item)}

              <View style={styles.cardContent}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardTime}>{item.time}</Text>
                </View>
                {!!item.description && (
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
              </View>

              {!item.isRead && <View style={styles.unreadDot} />}

              <View style={styles.arrowContainer}>
                <SvgXml xml={arrowRightIcon(colors.textMuted)} width={16} height={16} />
              </View>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : undefined
          }
        />
      ) : isInitialLoad ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <SvgXml xml={bellOffIcon(colors.textMuted)} width={36} height={36} />
          </View>
          <Text style={styles.emptyTitle}>No Notification yet</Text>
          <Text style={styles.emptySubtitle}>
            {error
              ? error
              : "When you get updates about your orders, offer and more, they'll appear here"}
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
    markAllBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
      backgroundColor: colors.primaryLight,
    },
    markAllText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
      fontFamily: fontFamily.medium,
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
      fontFamily: FONTS.poppinsBold,
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
    cardUnread: {
      borderColor: colors.primary,
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
      fontFamily: FONTS.poppinsBold,
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
    unreadDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.error,
      marginRight: 6,
    },
    arrowContainer: {
      paddingLeft: 4,
    },
    footerLoader: {
      paddingVertical: 16,
      alignItems: 'center',
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
      fontFamily: FONTS.poppinsBold,
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
