import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import HomeTab from '../home/HomeTab';
import CategoryTab from '../screens/CategoryTab';
import WishlistTab from '../screens/WishlistTab';
import AccountTab from '../screens/AccountTab';

const Tab = createBottomTabNavigator();

// ─── SVG Tab Icons ─────────────────────────────────────────────────────────────

const HOME_SVG_FILLED = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#C0185A"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`;
const HOME_SVG_OUTLINE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#555555" stroke-width="2"><path d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10"/></svg>`;
const GRID_SVG_OUTLINE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#555555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>`;
const GRID_SVG_FILLED = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#C0185A"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>`;
const HEART_SVG_OUTLINE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#555555" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
const HEART_SVG_FILLED = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#C0185A"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
const PERSON_SVG_OUTLINE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#555555" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const PERSON_SVG_FILLED = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#C0185A"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

// ─── Tab Icon Component ────────────────────────────────────────────────────────

type TabIconProps = {
  focused: boolean;
  label: string;
  iconFocused: string;
  iconUnfocused: string;
  size: number;
  fontSize: number;
};

const TabBarIcon = ({
  focused,
  label,
  iconFocused,
  iconUnfocused,
  size,
  fontSize,
}: TabIconProps) => {
  const activeColor = COLORS.tabActive || '#B12B5B';
  const inactiveColor = COLORS.tabInactive || '#555555';

  return (
    <View style={tabStyles.iconWrapper}>
      <SvgXml
        xml={focused ? iconFocused : iconUnfocused}
        width={size}
        height={size}
      />
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[
          tabStyles.label,
          {
            fontSize: fontSize,
            color: focused ? activeColor : inactiveColor,
            fontFamily: focused ? FONTS.inter18SemiBold : FONTS.arimoRegular,
            fontWeight: focused ? '600' : '400',
          },
        ]}>
        {label}
      </Text>
      {focused && <View style={[tabStyles.activeIndicator, { backgroundColor: activeColor }]} />}
    </View>
  );
};

// ─── Main Tab Navigator ────────────────────────────────────────────────────────

const MainTabNavigator = () => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Dynamic responsive sizing calculations
  const tabBarHeight = Math.min(width * 0.15, 68);
  const iconSize = Math.min(width * 0.055, 22);
  const labelSize = Math.min(width * 0.03, 12);

  // FIX: base the gap below the pill on the device's real safe-area inset
  // (home indicator / gesture bar) instead of a hardcoded 16/20. This keeps
  // the space above and below the pill visually equal on every device.
  const tabBarBottom = (insets.bottom > 0 ? insets.bottom : 12) + 8;
  const tabBarSide = Math.min(width * 0.05, 20);

  return (
   <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [
          tabStyles.tabBar,
          {
            left: tabBarSide,
            right: tabBarSide,
            bottom: tabBarBottom,
            height: tabBarHeight,
            borderRadius: tabBarHeight / 2, // Perfect Pill shape dynamically
            marginBottom: Platform.OS === 'android' ? Math.max(insets.bottom + 10, 25) : 15,
          },
        ],
        tabBarItemStyle: tabStyles.tabBarItem,
      }}>
      <Tab.Screen
        name="HomeTab"
        component={HomeTab}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              label="Home"
              iconFocused={HOME_SVG_FILLED}
              iconUnfocused={HOME_SVG_OUTLINE}
              size={iconSize}
              fontSize={labelSize}
            />
          ),
        }}
      />
      <Tab.Screen
        name="CategoryTab"
        component={CategoryTab}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              label="Category"
              iconFocused={GRID_SVG_FILLED}
              iconUnfocused={GRID_SVG_OUTLINE}
              size={iconSize}
              fontSize={labelSize}
            />
          ),
        }}
      />
      <Tab.Screen
        name="WishlistTab"
        component={WishlistTab}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              label="Wishlist"
              iconFocused={HEART_SVG_FILLED}
              iconUnfocused={HEART_SVG_OUTLINE}
              size={iconSize}
              fontSize={labelSize}
            />
          ),
        }}
      />
      <Tab.Screen
        name="AccountTab"
        component={AccountTab}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              label="Account"
              iconFocused={PERSON_SVG_FILLED}
              iconUnfocused={PERSON_SVG_OUTLINE}
              size={iconSize}
              fontSize={labelSize}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// ─── Tab Bar Styles ───────────────────────────────────────────────────────────

const tabStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    // FIX: removed `width: '90%'` and `alignSelf: 'center'` — these
    // conflict with `left`/`right` (set inline in MainTabNavigator).
    // When `position: 'absolute'` has both `left` and `right` set,
    // React Native derives the width from them and ignores `width`/
    // `alignSelf`. Keeping both caused the confusing behavior where
    // switching position changed centering unpredictably.
    borderTopWidth: 0,
    elevation: 12, // FIX: raised so it renders above screen content on Android
    zIndex: 999, // FIX: ensures it stacks above the scene on iOS too
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width:'90%',
    alignSelf:'center',
    top:0,
    marginTop:15,
    marginBottom:15,
  },
  tabBarItem: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
    marginTop: 7,
  },
  iconWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingTop: 4,
  },
  label: {
    marginTop: 2,
    textAlign: 'center',
    includeFontPadding: false,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 24,
    height: 3,
    borderRadius: 2,
  },
});

export default MainTabNavigator;