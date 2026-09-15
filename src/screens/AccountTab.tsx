import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  StatusBar,
  Image,
  Switch,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { BACK_ARROW_SVG ,EDIT_PENCIL_SVG , CHEVRON_RIGHT_SVG , CHEVRON_RIGHT_PINK_SVG , BOX_ICON_SVG , PROFILE_USER_SVG , LOCATION_PIN_SVGACOU , PAYMENT_CARD_SVG , BELL_ICON_SVG , DOCUMENT_SVG , TRUCK_SVG , RETURN_REFUND_SVG , PRIVACY_SHIELD_SVG , HELP_QUESTION_SVG , ABOUT_INFO_SVG , LOGOUT_ICON_SVG, ARROW_BACK_ICON, CHEVRON_DOWN_SVG, LOCATION_PIN_SVG, cameraicon} from '../assets/svg';
import BagIconButton from '../components/BagIconButton';
import { useNavigation } from '@react-navigation/native'; // 1. Hook import karein
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';
import AppIconButton from '../components/AppIconButton';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';

// ─── Pure SVG Icons ────────────────────────────────────────────────────────────
const CLOSE_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
const SHARE_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z" stroke="#1A1A1A" stroke-width="2"/><path d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.6569 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z" stroke="#1A1A1A" stroke-width="2"/><path d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z" stroke="#1A1A1A" stroke-width="2"/><path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke="#1A1A1A" stroke-width="2"/></svg>`;
const LOGOUT_WHITE_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="#FFFFFF" stroke-width="2"/><polyline points="16 17 21 12 16 7" stroke="#FFFFFF" stroke-width="2"/><line x1="21" y1="12" x2="9" y2="12" stroke="#FFFFFF" stroke-width="2"/></svg>`;
const CHECK_GREEN_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#2E7D32" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CHECK_ROUND_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="#B12B5B"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5" stroke="#FFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const LOGOUT_MODAL_SVG = `<svg width="24" height="22" viewBox="0 0 24 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17.6167 15.2834L22.2833 10.6168M22.2833 10.6168L17.6167 5.95011M22.2833 10.6168H5.94999M12.95 15.2834V16.4501C12.95 18.3818 11.3817 19.9501 9.44999 19.9501H4.78333C2.85162 19.9501 1.28333 18.3818 1.28333 16.4501V4.78345C1.28333 2.85174 2.85162 1.28345 4.78332 1.28345H9.44999C11.3817 1.28345 12.95 2.85174 12.95 4.78345V5.95011" stroke="white" stroke-width="2.56667" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`
// Dynamic Address Type Icons
const getHomeIconSvg = (color: string) => `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2 5.99992L8 1.33325L14 5.99992V13.3333C14 14.0691 13.4026 14.6666 12.6667 14.6666H3.33333C2.59745 14.6666 2 14.0691 2 13.3333V5.99992" stroke="#BE185D" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="6" y="8" width="4" height="6.66667" stroke="#BE185D" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;
const getWorkIconSvg = (color: string) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`;
const getOtherLocationSvg = (color: string) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>`;

// Input Field Icons
const USER_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const PHONE_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
const PINCODE_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const MAP_BUILDING_SVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0.833344 5.00008V18.3334L6.66668 15.0001L13.3333 18.3334L19.1667 15.0001V1.66675L13.3333 5.00008L6.66668 1.66675L0.833344 5.00008V5.00008" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M6.66666 1.66675V15.0001" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M13.3333 5V18.3333" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
const FLAG_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/></svg>`;
const CITY_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.99999 1.33325H12C12.7359 1.33325 13.3333 1.9307 13.3333 2.66659V13.3333C13.3333 14.0691 12.7359 14.6666 12 14.6666H3.99999C3.2641 14.6666 2.66666 14.0691 2.66666 13.3333V2.66659C2.66666 1.9307 3.2641 1.33325 3.99999 1.33325V1.33325" stroke="#9CA3AF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M6 14.6667V12H10V14.6667" stroke="#9CA3AF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M5.33334 4H5.34001" stroke="#9CA3AF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10.6667 4H10.6733" stroke="#9CA3AF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8 4H8.00667" stroke="#9CA3AF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8 6.66675H8.00667" stroke="#9CA3AF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8 9.33325H8.00667" stroke="#9CA3AF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10.6667 6.66675H10.6733" stroke="#9CA3AF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10.6667 9.33325H10.6733" stroke="#9CA3AF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M5.33334 6.66675H5.34001" stroke="#9CA3AF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M5.33334 9.33325H5.34001" stroke="#9CA3AF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// ─── Component Implementation ──────────────────────────────────────────────────

const AccountTab = () => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Address modals state
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [isAddAddressModalVisible, setIsAddAddressModalVisible] = useState(false);
  const [selectedAddressType, setSelectedAddressType] = useState('Home');
  const [selectedAddressId, setSelectedAddressId] = useState('1');
  const [isDefaultAddress, setIsDefaultAddress] = useState(false);
// New Modals State
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  // Profile Form States
  const [firstName, setFirstName] = useState('Goutam');
  const [lastName, setLastName] = useState('Chaudhary');
  const [email, setEmail] = useState('goutam@example.com');
  const [mobileNumber, setMobileNumber] = useState('9988776655');
  const handleOpenAddAddress = () => {
    setIsAddressModalVisible(false);
    setTimeout(() => {
      setIsAddAddressModalVisible(true);
    }, 250);
  };

  const isTablet = width >= 768;
  const hPad = Math.max(width * 0.04, 16);
  const avatarSize = Math.min(width * 0.16, 68);
  const navigation = useNavigation<any>(); 
  const dispatch = useDispatch();

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack(); 
    }
  };

  const handleLogout = () => {
   setIsLogoutModalVisible(false);
    dispatch(logout());
    navigation
      .getParent()
      ?.reset({ index: 0, routes: [{ name: 'Login' as never }] });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>

      {/* App Header */}
      <View style={styles.headerContainer}>
               <View style={styles.headerLeft}>
                 <AppIconButton
                   style={styles.headerBtn}
                   icon={<SvgXml xml={ARROW_BACK_ICON} width={15} height={15} />}
                   accessibilityLabel="Go back"
                   onPress={handleBackPress}
                 />
     
                 <View style={styles.headerTitleContainer}>
                   <Text style={styles.headerTitle}>Account Setting</Text>
                   <TouchableOpacity
                     style={styles.deliveryRow}
                     activeOpacity={0.7}
                     onPress={() => setIsAddressModalVisible(true)}>
                     <SvgXml xml={LOCATION_PIN_SVG} width={12} height={12} />
                     <Text style={styles.deliveryText}> Delivering to Home </Text>
                     <SvgXml xml={CHEVRON_DOWN_SVG} width={15} height={15} />
                   </TouchableOpacity>
                 </View>
               </View>
     
               <View style={styles.headerRightGroup}>
                
<BagIconButton />
               </View>
             </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: hPad },
          isTablet && { maxWidth: 600, alignSelf: 'center', width: '100%' },
        ]}>
        
        {/* User Profile Info Header */}
        <View style={styles.profileHeaderCard} >
          <View style={styles.profileLeft}>
            <View style={{ position: 'relative' }}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
                }}
                style={[
                  styles.avatarImg,
                  { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
                ]}
              />
              <View style={styles.editBadge}>
                <SvgXml xml={cameraicon} width={12} height={12} />
              </View>
            </View>

            <View style={styles.profileInfoText}>
              <Text style={styles.userNameText}>Gautam Chaudhary</Text>
              <Text style={styles.userEmailText}>gautam@example.com</Text>
            </View>
          </View>

        </View>

        {/* Section: My Orders Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>My Orders</Text>
          <TouchableOpacity
            style={styles.viewAllBtn}
            activeOpacity={0.7}
            onPress={() => navigation.getParent()?.navigate('MyOrders' as never)}>
            <Text style={styles.viewAllText}>View All</Text>
            <SvgXml xml={CHEVRON_RIGHT_PINK_SVG} width={12} height={12} />
          </TouchableOpacity>
        </View>

        {/* Track Orders Sub-Card */}
        <TouchableOpacity
          style={styles.trackOrderCard}
          activeOpacity={0.8}
          onPress={() => navigation.getParent()?.navigate('MyOrders' as never)}>
          <View style={styles.optionRowLeft}>
            <View style={styles.iconBoxPink}>
              <SvgXml xml={BOX_ICON_SVG} width={18} height={18} />
            </View>
            <View>
              <Text style={styles.optionTitle}>My Orders</Text>
              <Text style={styles.optionSubtitle}>View delivery status & history</Text>
            </View>
          </View>
          <SvgXml xml={CHEVRON_RIGHT_SVG} width={18} height={18} />
        </TouchableOpacity>

        {/* Section: Main Account Settings Block */}
        <View style={styles.groupedCard}>
          <TouchableOpacity
            style={styles.optionItem}
            activeOpacity={0.7}
            onPress={() => setIsProfileModalVisible(true)}>
            <View style={styles.optionRowLeft}>
              <View style={styles.iconBoxPink}>
                <SvgXml xml={PROFILE_USER_SVG} width={18} height={18} />
              </View>
              <Text style={styles.optionTitle}>My Profile</Text>
            </View>
            <SvgXml xml={CHEVRON_RIGHT_SVG} width={18} height={18} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionItem}
            activeOpacity={0.7}
            onPress={() => setIsAddressModalVisible(true)}>
            <View style={styles.optionRowLeft}>
              <View style={styles.iconBoxPink}>
                <SvgXml xml={LOCATION_PIN_SVGACOU} width={18} height={18} />
              </View>
              <Text style={styles.optionTitle}>Address</Text>
            </View>
            <SvgXml xml={CHEVRON_RIGHT_SVG} width={18} height={18} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem} activeOpacity={0.7}>
            <View style={styles.optionRowLeft}>
              <View style={styles.iconBoxPink}>
                <SvgXml xml={PAYMENT_CARD_SVG} width={18} height={18} />
              </View>
              <Text style={styles.optionTitle}>Payment Methods</Text>
            </View>
            <SvgXml xml={CHEVRON_RIGHT_SVG} width={18} height={18} />
          </TouchableOpacity>

          {/* Toggle Item */}
          <View style={[styles.optionItem, { borderBottomWidth: 0 }]}>
            <View style={styles.optionRowLeft}>
              <View style={styles.iconBoxPink}>
                <SvgXml xml={BELL_ICON_SVG} width={18} height={18} />
              </View>
              <Text style={styles.optionTitle}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.textOnPrimary}
            />
          </View>
        </View>

        {/* Section: Policies Block */}
        <View style={styles.groupedCard}>
          <TouchableOpacity
            style={styles.optionItem}
            activeOpacity={0.7}
            onPress={() => navigation.getParent()?.navigate('Terms' as never)}>
            <View style={styles.optionRowLeft}>
              <View style={styles.iconBoxPink}>
                <SvgXml xml={DOCUMENT_SVG} width={18} height={18} />
              </View>
              <Text style={styles.optionTitle}>Terms and Conditions</Text>
            </View>
            <SvgXml xml={CHEVRON_RIGHT_SVG} width={18} height={18} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionItem}
            activeOpacity={0.7}
            onPress={() => navigation.getParent()?.navigate('ShippingPolicy' as never)}>
            <View style={styles.optionRowLeft}>
              <View style={styles.iconBoxPink}>
                <SvgXml xml={TRUCK_SVG} width={18} height={18} />
              </View>
              <Text style={styles.optionTitle}>Shipping Policy</Text>
            </View>
            <SvgXml xml={CHEVRON_RIGHT_SVG} width={18} height={18} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionItem}
            activeOpacity={0.7}
            onPress={() => navigation.getParent()?.navigate('ReturnsRefunds' as never)}>
            <View style={styles.optionRowLeft}>
              <View style={styles.iconBoxPink}>
                <SvgXml xml={RETURN_REFUND_SVG} width={18} height={18} />
              </View>
              <Text style={styles.optionTitle}>Returns, Refunds & Exchange</Text>
            </View>
            <SvgXml xml={CHEVRON_RIGHT_SVG} width={18} height={18} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionItem, { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
            onPress={() => navigation.getParent()?.navigate('PrivacyPolicy' as never)}>
            <View style={styles.optionRowLeft}>
              <View style={styles.iconBoxPink}>
                <SvgXml xml={PRIVACY_SHIELD_SVG} width={18} height={18} />
              </View>
              <Text style={styles.optionTitle}>Privacy Policy</Text>
            </View>
            <SvgXml xml={CHEVRON_RIGHT_SVG} width={18} height={18} />
          </TouchableOpacity>
        </View>

        {/* Section: Support & Logout Block */}
        <View style={[styles.groupedCard, { marginBottom: 30 }]}>
          <TouchableOpacity
            style={styles.optionItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('HelpSupport')}>
            <View style={styles.optionRowLeft}>
              <View style={styles.iconBoxPink}>
                <SvgXml xml={HELP_QUESTION_SVG} width={18} height={18} />
              </View>
              <Text style={styles.optionTitle}>Help & Support</Text>
            </View>
            <SvgXml xml={CHEVRON_RIGHT_SVG} width={18} height={18} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem} activeOpacity={0.7}>
            <View style={styles.optionRowLeft}>
              <View style={styles.iconBoxPink}>
                <SvgXml xml={ABOUT_INFO_SVG} width={18} height={18} />
              </View>
              <Text style={styles.optionTitle}>About Us</Text>
            </View>
            <SvgXml xml={CHEVRON_RIGHT_SVG} width={18} height={18} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionItem, { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
            onPress={() => setIsLogoutModalVisible(true)}>
            <View style={styles.optionRowLeft}>
              <View style={[styles.iconBoxPink, styles.iconBoxGradient]}>
                <Svg style={styles.iconBoxGradientFill} width="100%" height="100%">
                  <Defs>
                    <LinearGradient id="gradLogoutIcon" x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0" stopColor="#FFF0F5" />
                      <Stop offset="1" stopColor="#FDF2F8" />
                    </LinearGradient>
                  </Defs>
                  <Rect width="100%" height="100%" fill="url(#gradLogoutIcon)" rx={10} />
                </Svg>
                <SvgXml xml={LOGOUT_ICON_SVG} width={18} height={18} />
              </View>
              <Text style={styles.optionTitle}>Logout</Text>
            </View>
            <SvgXml xml={CHEVRON_RIGHT_SVG} width={18} height={18} />
          </TouchableOpacity>
        </View>

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>

      {/* 1. ADDRESS SELECTION MODAL */}
      <Modal
        visible={isAddressModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddressModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setIsAddressModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.dragHandle} />

                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Address</Text>
                    <Text style={styles.modalSubTitle}>Select delivery address</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setIsAddressModalVisible(false)}>
                    <SvgXml xml={CLOSE_SVG} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[
                      styles.addressCard,
                      selectedAddressId === '1' && styles.selectedAddressCard,
                    ]}
                    onPress={() => setSelectedAddressId('1')}
                    activeOpacity={0.8}>
                    <View style={styles.addressHeaderRow}>
                      <View style={styles.addressTypeBadge}>
                        <SvgXml xml={getHomeIconSvg(theme.colors.primary)} />
                        <Text
                          style={[
                            styles.addressTypeText,
                            selectedAddressId !== '1' && { color: theme.colors.text },
                          ]}>
                          Home
                        </Text>
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultText}>DEFAULT</Text>
                        </View>
                      </View>
                      <View style={styles.radioOuter}>
                        {selectedAddressId === '1' && <View style={styles.radioInner} />}
                      </View>
                    </View>
                    <Text style={styles.addressDetailsText}>
                      123, Green Park, Near City Mall,{'\n'}Indore, Madhya Pradesh - 452001
                    </Text>
                    <Text style={styles.addressPhoneText}>+91 98765 43210</Text>
                  </TouchableOpacity>

                  <Text style={styles.otherAddressTitle}>Other Addresses</Text>

                  <TouchableOpacity
                    style={[
                      styles.addressCard,
                      selectedAddressId === '2' && styles.selectedAddressCard,
                    ]}
                    onPress={() => setSelectedAddressId('2')}
                    activeOpacity={0.8}>
                    <View style={styles.addressHeaderRow}>
                      <View style={styles.addressTypeBadge}>
                        <SvgXml xml={getWorkIconSvg(theme.colors.textSecondary)} />
                        <Text
                          style={[
                            styles.addressTypeText,
                            selectedAddressId === '2'
                              ? { color: theme.colors.primary }
                              : { color: theme.colors.text },
                          ]}>
                          Work
                        </Text>
                      </View>
                      <View style={styles.radioOuter}>
                        {selectedAddressId === '2' && <View style={styles.radioInner} />}
                      </View>
                    </View>
                    <Text style={styles.addressDetailsText}>
                      456, Business Tower, MG Road,{'\n'}Indore, Madhya Pradesh - 452001
                    </Text>
                    <Text style={styles.addressPhoneText}>+91 98765 43211</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.addNewAddressBtn}
                    activeOpacity={0.7}
                    onPress={handleOpenAddAddress}>
                    <Text style={styles.addNewAddressText}>+ Add New Address</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 2. ADD NEW ADDRESS MODAL */}
      <Modal
        visible={isAddAddressModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddAddressModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setIsAddAddressModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { maxHeight: '90%' }]}>
                <View style={styles.dragHandle} />

                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Add New Address</Text>
                    <Text style={styles.modalSubTitle}>Enter your address details</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setIsAddAddressModalVisible(false)}>
                    <SvgXml xml={CLOSE_SVG} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.fieldLabel}>Address Type</Text>
                  <View style={styles.typeSelectorRow}>
                    {[
                      { type: 'Home', getIcon: getHomeIconSvg },
                      { type: 'Work', getIcon: getWorkIconSvg },
                      { type: 'Other', getIcon: getOtherLocationSvg },
                    ].map(item => {
                      const isSel = selectedAddressType === item.type;
                      const iconColor = isSel ? theme.colors.primary : theme.colors.textSecondary;

                      return (
                        <TouchableOpacity
                          key={item.type}
                          style={[styles.typeChip, isSel && styles.typeChipSelected]}
                          onPress={() => setSelectedAddressType(item.type)}>
                          <View style={styles.typeChipContent}>
                            <SvgXml xml={item.getIcon(iconColor)} width={14} height={14} />
                            <Text
                              style={[
                                styles.typeChipText,
                                isSel && styles.typeChipTextSelected,
                              ]}>
                              {item.type}
                            </Text>
                          </View>
                          {isSel && (
                            <View style={styles.chipCheckBadge}>
                              <SvgXml xml={CHECK_ROUND_SVG} width={16} height={16} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={styles.fieldLabel}>Full Name</Text>
                  <View style={styles.inputContainer}>
                    <SvgXml xml={USER_ICON_SVG} style={styles.inputLeftIcon} />
                    <TextInput
                      style={styles.formInputWithIcon}
                      placeholder="Enter full name"
                      placeholderTextColor={theme.colors.textMuted}
                    />
                  </View>

                  <Text style={styles.fieldLabel}>Mobile Number</Text>
                  <View style={styles.inputContainer}>
                    <SvgXml xml={PHONE_ICON_SVG} style={styles.inputLeftIcon} />
                    <TextInput
                      style={styles.formInputWithIcon}
                      placeholder="Enter mobile number"
                      keyboardType="phone-pad"
                      placeholderTextColor={theme.colors.textMuted}
                    />
                  </View>

                  <Text style={styles.fieldLabel}>Pincode</Text>
                  <View style={styles.pinRow}>
                    <View style={[styles.inputContainer, { flex: 1 }]}>
                      <SvgXml xml={PINCODE_ICON_SVG} style={styles.inputLeftIcon} />
                      <TextInput
                        style={styles.formInputWithIcon}
                        placeholder="Enter 6-digit pincode"
                        keyboardType="number-pad"
                        placeholderTextColor={theme.colors.textMuted}
                      />
                    </View>
                    <TouchableOpacity style={styles.pinCheckBtn}>
                      <Text style={styles.pinCheckText}>Check Pincode</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.fieldLabel}>Address</Text>
                  <View style={styles.inputContainer}>
                    <SvgXml xml={MAP_BUILDING_SVG} style={styles.inputLeftIcon} width={15} height={15} />
                    <TextInput
                      style={styles.formInputWithIcon}
                      placeholder="House No., Building, Street, Area"
                      placeholderTextColor={theme.colors.textMuted}
                    />
                  </View>

                  <Text style={styles.fieldLabel}>Landmark (Optional)</Text>
                  <View style={styles.inputContainer}>
                    <SvgXml xml={FLAG_ICON_SVG} style={styles.inputLeftIcon} />
                    <TextInput
                      style={styles.formInputWithIcon}
                      placeholder="Enter landmark"
                      placeholderTextColor={theme.colors.textMuted}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>City</Text>
                      <View style={styles.inputContainer}>
                        <SvgXml xml={CITY_ICON_SVG} style={styles.inputLeftIcon} />
                        <TextInput
                          style={styles.formInputWithIcon}
                          placeholder="Enter city"
                          placeholderTextColor={theme.colors.textMuted}
                        />
                      </View>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>State</Text>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={[styles.formInputWithIcon, { paddingLeft: 12 }]}
                          placeholder="Select state"
                          placeholderTextColor={theme.colors.textMuted}
                        />
                        <SvgXml
                          xml={CHEVRON_DOWN_SVG}
                          width={14}
                          height={14}
                          style={{ marginRight: 10 }}
                        />
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.defaultCheckboxRow}
                    activeOpacity={0.7}
                    onPress={() => setIsDefaultAddress(!isDefaultAddress)}>
                    <View
                      style={[
                        styles.checkboxBox,
                        isDefaultAddress && styles.checkboxBoxSelected,
                      ]}>
                      {isDefaultAddress && (
                        <SvgXml xml={CHECK_GREEN_SVG} width={10} height={10} />
                      )}
                    </View>
                    <Text style={styles.defaultCheckboxLabel}>Set as default address</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveBtn}
                    activeOpacity={0.8}
                    onPress={() => setIsAddAddressModalVisible(false)}>
                    <Text style={styles.saveBtnText}>Save Address</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 3. PROFILE MODAL */}
      <Modal
        visible={isProfileModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsProfileModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setIsProfileModalVisible(false)}>
          <View style={styles.modalOverlay1}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent1}>
                <View style={styles.dragHandle1} />

                <View style={styles.modalHeader1}>
                  <View>
                    <Text style={styles.modalTitle1}>My Profile</Text>
                    <Text style={styles.modalSubTitle1}>Manage your personal information</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeBtnCircle}
                    onPress={() => setIsProfileModalVisible(false)}>
                    <SvgXml xml={CLOSE_SVG} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.profileSectionTitle}>Personal Information</Text>

                  <View style={styles.nameRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel1}>First Name</Text>
                      <TextInput
                        style={styles.sheetInput}
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="First name"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel1}>Last Name</Text>
                      <TextInput
                        style={styles.sheetInput}
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Last name"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>

                  <Text style={[styles.fieldLabel1, { marginTop: 14 }]}>Email Address</Text>
                  <View style={styles.emailInputWrapper}>
                    <TextInput
                      style={styles.emailInput}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter email"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="email-address"
                    />
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  </View>

                  <Text style={[styles.fieldLabel1, { marginTop: 14 }]}>Mobile Number</Text>
                  <View style={styles.phoneInputWrapper}>
                    <View style={styles.countryPickerBox}>
                      <Text style={styles.countryCodeText}>+91</Text>
                    </View>
                    <TextInput
                      style={styles.phoneInput}
                      value={mobileNumber}
                      onChangeText={setMobileNumber}
                      placeholder="Enter phone number"
                      keyboardType="phone-pad"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={styles.modalFooterRow}>
                    <TouchableOpacity
                      style={styles.cancelOutlineBtn}
                      activeOpacity={0.7}
                      onPress={() => setIsProfileModalVisible(false)}>
                      <Text style={styles.cancelOutlineBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveSolidBtn}
                      activeOpacity={0.8}
                      onPress={() => setIsProfileModalVisible(false)}>
                      <Text style={styles.saveSolidBtnText}>Save Changes</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 4. LOGOUT CONFIRMATION MODAL */}
      <Modal
        visible={isLogoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLogoutModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setIsLogoutModalVisible(false)}>
          <View style={styles.modalOverlay1}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent1, { maxHeight: '50%' }]}>
                <View style={styles.dragHandle1} />

                <View style={styles.logoutCenterContent}>
                  <View style={styles.logoutIconCircle}>
                    <Svg style={styles.logoutIconCircleFill} width="100%" height="100%">
                      <Defs>
                        <LinearGradient id="gradLogoutModal" x1="0" y1="0" x2="1" y2="1">
                          <Stop offset="0" stopColor="#FF377F" />
                          <Stop offset="1" stopColor="#B12B5B" />
                        </LinearGradient>
                      </Defs>
                      <Rect width="100%" height="100%" fill="url(#gradLogoutModal)" rx={28} />
                    </Svg>
                    <SvgXml xml={LOGOUT_MODAL_SVG} width={26} height={26} />
                  </View>
                  <Text style={styles.logoutTitle}>Log Out of Butru ?</Text>
                  <Text style={styles.logoutSubtitle}>
                    Are you sure you want to logout from your account?
                  </Text>
                </View>

                <View style={styles.modalFooterRow}>
                  <TouchableOpacity
                    style={styles.cancelOutlineBtn}
                    activeOpacity={0.7}
                    onPress={() => setIsLogoutModalVisible(false)}>
                    <Text style={styles.cancelOutlineBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveSolidBtn}
                    activeOpacity={0.8}
                    onPress={handleLogout}>
                    <Text style={styles.saveSolidBtnText}>Yes, Log out</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
};

// ─── Stylesheet ────────────────────────────────────────────────────────────────

const createStyles = (theme: AppTheme) => {
  const { colors, fontFamily } = theme;

  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    backgroundColor: colors.backgroundColor,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 45,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex:999,
    shadowOpacity:0.1,
    shadowRadius:3,
    shadowOffset:{width:0,height:1},
    elevation:2,
  },
   deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  deliveryText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
  },
  dropdownArrow: {
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  headerTitleContainer: {
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fontFamily.heading,
    color: colors.text,
  },
 
  scrollContent: {
    paddingTop: 8,
    backgroundColor:colors.backgroundColor,
  },

  /* Top User Banner */
  profileHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius:15,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor:'#B12B5B'
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  avatarImg: {
    backgroundColor: colors.surfaceVariant,
    left:10
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: -15,
    backgroundColor: colors.surface,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfoText: {
    gap: 2,
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface,
  },
  userEmailText: {
    fontSize: 12,
    color: colors.surface,
  },

  /* My Orders Row */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },

  /* Single Option Box */
  trackOrderCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  /* Grouped Options Container */
  groupedCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },

  /* Option Shared Layouts */
  optionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBoxPink: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FADFE8",
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxGradient: {
    position: 'relative',
    overflow: 'hidden',
  },
  iconBoxGradientFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  optionTitle: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    fontFamily: fontFamily.bold,
  },
  optionSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.shimmer,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  modalSubTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
    backgroundColor: colors.surface,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: colors.text,
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },

  /* Address Cards Inside Modal */
  addressCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceVariant,
    marginBottom: 12,
  },
  selectedAddressCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressTypeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  defaultBadge: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  defaultText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.success,
  },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  addressDetailsText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 16,
  },
  addressPhoneText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  otherAddressTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginVertical: 8,
  },
  addNewAddressBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    alignItems: 'center',
    marginTop: 4,
  },
  addNewAddressText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    marginTop: 10,
    marginBottom: 4,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceVariant,
  },
  typeChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  typeChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  typeChipTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  chipCheckBadge: {
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
  },
  inputLeftIcon: {
    marginLeft: 10,
  },
  formInputWithIcon: {
    flex: 1,
    height: 40,
    paddingHorizontal: 8,
    fontSize: 12,
    color: colors.text,
  },
  pinRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  pinCheckBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 16,
    justifyContent: 'center',
        borderColor: colors.primary,
        borderWidth:1

  },
  pinCheckText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  defaultCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  checkboxBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxSelected: {
    borderColor: colors.success,
    backgroundColor: colors.surfaceVariant,
  },
  defaultCheckboxLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  modalOverlay1: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'flex-end',
    },
    modalContent1: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingBottom: 24,
      paddingTop: 10,
    },
    dragHandle1: {
      width: 40,
      height: 4,
      backgroundColor: '#E5E7EB',
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 16,
    },
    modalHeader1: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    modalTitle1: {
      fontSize: 18,
      fontWeight: '700',
      color: '#111827',
    },
    modalSubTitle1: {
      fontSize: 12,
      color: '#6B7280',
      marginTop: 2,
    },
    closeBtnCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      elevation:0.9,
      shadowOpacity:0.1,
      shadowRadius:1,
    },

    /* My Profile Specific */
    profileSectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: '#1F2937',
      marginBottom: 12,
    },
    fieldLabel1: {
      fontSize: 12,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 6,
    },
    nameRow: {
      flexDirection: 'row',
      gap: 12,
    },
    sheetInput: {
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 14,
      color: '#111827',
      backgroundColor: '#FFFFFF',
    },
    readOnlyText: {
      fontSize: 11,
      color: '#9CA3AF',
    },
    emailInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 46,
      backgroundColor: '#FAFAFA',
    },
    emailInput: {
      flex: 1,
      fontSize: 14,
      color: '#111827',
    },
    verifiedBadge: {
      backgroundColor: '#ECFDF5',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#A7F3D0',
    },
    verifiedText: {
      fontSize: 10,
      color: '#059669',
      fontWeight: '600',
    },
    phoneInputWrapper: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 12,
      height: 46,
      overflow: 'hidden',
    },
    countryPickerBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F9FAFB',
      paddingHorizontal: 12,
      borderRightWidth: 1,
      borderRightColor: '#E5E7EB',
      gap: 6,
    },
    countryCodeText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#374151',
    },
    phoneInput: {
      flex: 1,
      paddingHorizontal: 12,
      fontSize: 14,
      color: '#111827',
    },

    /* Footer Buttons */
    modalFooterRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
      paddingTop: 12,
    },
    cancelOutlineBtn: {
      flex: 1,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: '#D1D5DB',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
    },
    cancelOutlineBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#374151',
    },
    saveSolidBtn: {
      flex: 1,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#B12B5B',
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveSolidBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },

    /* Logout Specific */
    logoutCenterContent: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    logoutIconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#B12B5B',
      position: 'relative',
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    logoutIconCircleFill: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    logoutTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 6,
    },
    logoutSubtitle: {
      fontSize: 12,
      color: '#6B7280',
      textAlign: 'center',
      lineHeight: 18,
    },
  });
};

export default AccountTab;
