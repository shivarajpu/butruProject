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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { BAG_SVG  , BACK_ARROW_SVG ,EDIT_PENCIL_SVG , CHEVRON_RIGHT_SVG , CHEVRON_RIGHT_PINK_SVG , BOX_ICON_SVG , PROFILE_USER_SVG , LOCATION_PIN_SVGACOU , PAYMENT_CARD_SVG , BELL_ICON_SVG , DOCUMENT_SVG , TRUCK_SVG , RETURN_REFUND_SVG , PRIVACY_SHIELD_SVG , HELP_QUESTION_SVG , ABOUT_INFO_SVG , LOGOUT_ICON_SVG, ARROW_BACK_ICON, CHEVRON_DOWN_SVG, LOCATION_PIN_SVG} from '../assets/svg';
import { FONTS } from '../constants/fonts';
import { useNavigation } from '@react-navigation/native'; // 1. Hook import karein

// ─── Pure SVG Icons ────────────────────────────────────────────────────────────

// ─── Component Implementation ──────────────────────────────────────────────────

const AccountTab = () => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const isTablet = width >= 768;
  const hPad = Math.max(width * 0.04, 16);
  const avatarSize = Math.min(width * 0.16, 68);
  const navigation = useNavigation(); 

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack(); 
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>

      {/* App Header */}
      <View style={styles.headerContainer}>
               <View style={styles.headerLeft}>
                 <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7} onPress={() => handleBackPress()}>
                   <SvgXml xml={ARROW_BACK_ICON} width={15} height={15} />
                 </TouchableOpacity>
     
                 <View style={styles.headerTitleContainer}>
                   <Text style={styles.headerTitle}>Account Setting</Text>
                   <View style={styles.deliveryRow}>
                     <SvgXml xml={LOCATION_PIN_SVG} width={12} height={12} />
                     <Text style={styles.deliveryText}> Delivering to Home </Text>
                     <SvgXml xml={CHEVRON_DOWN_SVG} width={15} height={15} />
                   </View>
                 </View>
               </View>
     
               <TouchableOpacity  activeOpacity={0.7}>
                 <SvgXml xml={BAG_SVG} width={22} height={22} />
               </TouchableOpacity>
             </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: hPad },
          isTablet && { maxWidth: 600, alignSelf: 'center', width: '100%' },
        ]}>
        
        {/* User Profile Info Header */}
        <TouchableOpacity style={styles.profileHeaderCard} activeOpacity={0.8}>
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
                <SvgXml xml={EDIT_PENCIL_SVG} width={9} height={9} />
              </View>
            </View>

            <View style={styles.profileInfoText}>
              <Text style={styles.userNameText}>Gautam Chaudhary</Text>
              <Text style={styles.userEmailText}>gautam@example.com</Text>
            </View>
          </View>

          <SvgXml xml={CHEVRON_RIGHT_SVG} width={18} height={18} />
        </TouchableOpacity>

        {/* Section: My Orders Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>My Orders</Text>
          <TouchableOpacity style={styles.viewAllBtn} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View All</Text>
            <SvgXml xml={CHEVRON_RIGHT_PINK_SVG} width={12} height={12} />
          </TouchableOpacity>
        </View>

        {/* Track Orders Sub-Card */}
        <TouchableOpacity style={styles.trackOrderCard} activeOpacity={0.8}>
          <View style={styles.optionRowLeft}>
            <View style={styles.iconBoxPink}>
              <SvgXml xml={BOX_ICON_SVG} width={18} height={18} />
            </View>
            <View>
              <Text style={styles.optionTitle}>Track your orders</Text>
              <Text style={styles.optionSubtitle}>View delivery status & history</Text>
            </View>
          </View>
          <SvgXml xml={CHEVRON_RIGHT_SVG} width={18} height={18} />
        </TouchableOpacity>

        {/* Section: Main Account Settings Block */}
        <View style={styles.groupedCard}>
          <TouchableOpacity style={styles.optionItem} activeOpacity={0.7}>
            <View style={styles.optionRowLeft}>
              <View style={styles.iconBoxPink}>
                <SvgXml xml={PROFILE_USER_SVG} width={18} height={18} />
              </View>
              <Text style={styles.optionTitle}>My Profile</Text>
            </View>
            <SvgXml xml={CHEVRON_RIGHT_SVG} width={18} height={18} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem} activeOpacity={0.7}>
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
              trackColor={{ false: '#E5E5EA', true: '#E8006F' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Section: Policies Block */}
        <View style={styles.groupedCard}>
          <TouchableOpacity style={styles.optionItem} activeOpacity={0.7}>
            <View style={styles.optionRowLeft}>
              <View style={styles.iconBoxPink}>
                <SvgXml xml={DOCUMENT_SVG} width={18} height={18} />
              </View>
              <Text style={styles.optionTitle}>Terms and Conditions</Text>
            </View>
            <SvgXml xml={CHEVRON_RIGHT_SVG} width={18} height={18} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem} activeOpacity={0.7}>
            <View style={styles.optionRowLeft}>
              <View style={styles.iconBoxPink}>
                <SvgXml xml={TRUCK_SVG} width={18} height={18} />
              </View>
              <Text style={styles.optionTitle}>Shipping Policy</Text>
            </View>
            <SvgXml xml={CHEVRON_RIGHT_SVG} width={18} height={18} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem} activeOpacity={0.7}>
            <View style={styles.optionRowLeft}>
              <View style={styles.iconBoxPink}>
                <SvgXml xml={RETURN_REFUND_SVG} width={18} height={18} />
              </View>
              <Text style={styles.optionTitle}>Returns, Refunds & Exchange</Text>
            </View>
            <SvgXml xml={CHEVRON_RIGHT_SVG} width={18} height={18} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.optionItem, { borderBottomWidth: 0 }]} activeOpacity={0.7}>
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
          <TouchableOpacity style={styles.optionItem} activeOpacity={0.7}>
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

          <TouchableOpacity style={[styles.optionItem, { borderBottomWidth: 0 }]} activeOpacity={0.7}>
            <View style={styles.optionRowLeft}>
              <View style={styles.iconBoxPink}>
                <SvgXml xml={LOGOUT_ICON_SVG} width={18} height={18} />
              </View>
              <Text style={styles.optionTitle}>Logout</Text>
            </View>
            <SvgXml xml={CHEVRON_RIGHT_SVG} width={18} height={18} />
          </TouchableOpacity>
        </View>

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Stylesheet ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF7F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    backgroundColor: '#FAF7F7',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
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
    color: '#767575',
    fontFamily: FONTS.poppinsMedium,
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#666666',
    marginLeft: 2,
  },
  headerTitleContainer: {
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONTS.inter28Bold,
    color: '#1A1A1A',
  },
 
  scrollContent: {
    paddingTop: 8,
  },

  /* Top User Banner */
  profileHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 16,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarImg: {
    backgroundColor: '#E1E1E1',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#E8006F',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfoText: {
    gap: 2,
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  userEmailText: {
    fontSize: 12,
    color: '#8E8E93',
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
    color: '#1A1A1A',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E8006F',
  },

  /* Single Option Box */
  trackOrderCard: {
    backgroundColor: '#FFF0F5',
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
    backgroundColor: '#FFF0F5',
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
    backgroundColor: '#FDE6ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
    fontFamily: "Poppins-Bold",
  },
  optionSubtitle: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
});

export default AccountTab;