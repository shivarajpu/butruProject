import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import Geolocation, {
  type GeolocationResponse,
} from '@react-native-community/geolocation';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';
import { apiService } from '../api/apiService';
import type { Address } from '../hooks/useProfile';

type UpdateAddressResponse = {
  success: boolean;
  message?: string;
  data?: Address[];
};

const UPDATE_ADDRESS_API = '/api/auth/profile/address';
const CHECK_PINCODE_API = '/api/storefront/shipping/check-pincode';

type CheckPincodeResponse = {
  success: boolean;
  message?: string;
  data?: {
    pincode?: string;
    serviceable?: boolean;
    message?: string;
    estimatedDelivery?: string;
    shippingOption?: {
      id: string;
      name: string;
      price: number;
      tag: string;
      estimatedDays: string;
      carrier: string;
    };
  };
};

const CLOSE_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
const CHECK_GREEN_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#2E7D32" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CHECK_ROUND_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="#B12B5B"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5" stroke="#FFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const getHomeIconSvg = (_color: string) => `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2 5.99992L8 1.33325L14 5.99992V13.3333C14 14.0691 13.4026 14.6666 12.6667 14.6666H3.33333C2.59745 14.6666 2 14.0691 2 13.3333V5.99992" stroke="#BE185D" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="6" y="8" width="4" height="6.66667" stroke="#BE185D" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;
const getWorkIconSvg = (color: string) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`;
const getOtherLocationSvg = (color: string) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>`;

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
const CHEVRON_DOWN_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>`;
const LOCATION_PIN_SVG_LOCAL = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#B12B5B"/></svg>`;

type Props = {
  visible: boolean;
  editingAddress?: Address | null;
  onClose: () => void;
  onSaved: () => void;
};

const AddAddressModal = ({ visible, editingAddress, onClose, onSaved }: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  const [addressType, setAddressType] = useState('Home');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [pincode, setPincode] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const editType = (editingAddress?.type || '').toLowerCase();
    setAddressType(
      editType.includes('home')
        ? 'Home'
        : editType.includes('work')
        ? 'Work'
        : editType.includes('other')
        ? 'Other'
        : 'Home',
    );
    setFullName(editingAddress?.name || '');
    setMobile(editingAddress?.phone || '');
    setPincode(editingAddress?.pincode || '');
    setAddress(editingAddress?.street || '');
    setLandmark(editingAddress?.landmark || '');
    setCity(editingAddress?.city || '');
    setStateName(editingAddress?.state || '');
    setIsDefault(editingAddress?.isDefault || false);
  }, [visible, editingAddress]);

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const status = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return status === PermissionsAndroid.RESULTS.GRANTED;
    }
    return new Promise(resolve => {
      Geolocation.requestAuthorization(
        () => resolve(true),
        () => resolve(false),
      );
    });
  };

  const fetchCurrentLocation = async () => {
    if (locating) {
      return;
    }
    setLocating(true);

    let filledAddress = '';
    let filledCity = '';
    let filledState = '';
    let filledPincode = '';
    let filledColony = '';

    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Location Permission',
          'Location permission is needed to fetch your current address.',
        );
        return;
      }

      const position = await new Promise<GeolocationResponse>(
        (resolve, reject) => {
          Geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          });
        },
      );

      const { latitude, longitude } = position.coords;

      try {
        const reverseResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
          {
            headers: {
              Accept: 'application/json',
              'User-Agent': 'ButruApp/1.0',
              Referer: 'https://butru.in',
            },
          },
        );
        const reverse = await reverseResponse.json();
        const info = reverse?.address;
        if (info) {
          const streetFromGeo = [info.house_number, info.road, info.neighbourhood]
            .filter(Boolean)
            .join(', ');
          if (streetFromGeo) {
            filledAddress = streetFromGeo;
            setAddress(filledAddress);
          }
          if (info.city) {
            filledCity = String(info.city);
            setCity(filledCity);
          } else if (info.town) {
            filledCity = String(info.town);
            setCity(filledCity);
          } else if (info.village) {
            filledCity = String(info.village);
            setCity(filledCity);
          }
          if (info.state) {
            filledState = String(info.state);
            setStateName(filledState);
          }
          if (info.postcode) {
            filledPincode = String(info.postcode);
            setPincode(filledPincode);
          }
          if (info.neighbourhood) {
            filledColony = String(info.neighbourhood);
          }
          if (info.city_district) {
            filledColony = String(info.city_district);
          }
        }
      } catch (reverseError) {
        console.log('Reverse geocoding failed:', reverseError);
      }

      const summaryLines = [
        filledAddress ? `Address: ${filledAddress}` : '',
        filledColony ? `Area: ${filledColony}` : '',
        filledCity ? `City: ${filledCity}` : '',
        filledState ? `State: ${filledState}` : '',
        filledPincode ? `Pincode: ${filledPincode}` : '',
      ].filter(Boolean);

      Alert.alert(
        'Current Location Fetched',
        summaryLines.length
          ? `Fields filled from your current location:\n\n${summaryLines.join('\n')}`
          : 'Could not fetch location details. Please fill the fields manually.',
      );
    } catch (error) {
      Alert.alert(
        'Location Failed',
        error instanceof Error ? error.message : 'Unable to fetch current location.',
      );
    } finally {
      setLocating(false);
    }
  };

  const checkPincode = async () => {
    const code = pincode.trim();
    if (!code) {
      Alert.alert('Pincode', 'Please enter a pincode first.');
      return;
    }
    if (checkingPincode) {
      return;
    }
    setCheckingPincode(true);
    try {
      const response = await apiService.get<CheckPincodeResponse>(
        `${CHECK_PINCODE_API}?pincode=${encodeURIComponent(code)}&orderAmount=0`,
      );
      const data = response?.data;
      if (response?.success && data) {
        if (data.serviceable) {
          Alert.alert(
            'Pincode Serviceable',
            data.message ||
              `Delivery available. Estimated ${data.estimatedDelivery || '3-5 days'}.`,
          );
        } else {
          Alert.alert(
            'Not Serviceable',
            data.message || 'Delivery is not available for this pincode.',
          );
        }
      } else {
        Alert.alert(
          'Check Failed',
          response?.message || 'Unable to check this pincode. Please try again.',
        );
      }
    } catch (error) {
      Alert.alert(
        'Check Failed',
        error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setCheckingPincode(false);
    }
  };

  const handleSave = async () => {
    if (isSaving) {
      return;
    }
    if (
      !fullName.trim() ||
      !mobile.trim() ||
      !pincode.trim() ||
      !address.trim() ||
      !city.trim()
    ) {
      Alert.alert('Missing Details', 'Please fill all the required fields.');
      return;
    }

    setIsSaving(true);
    const trimmedState = stateName.trim();
    const fullAddress = `${address.trim()}, ${city.trim()}${
      trimmedState ? `, ${trimmedState}` : ''
    } - ${pincode.trim()}${
      landmark.trim() ? `, Landmark: ${landmark.trim()}` : ''
    }`;

    const payload = {
      name: fullName.trim(),
      phone: mobile.trim(),
      altPhone: mobile.trim(),
      street: address.trim(),
      fullAddress,
      locality: city.trim(),
      city: city.trim(),
      state: trimmedState,
      pincode: pincode.trim(),
      country: 'India',
      landmark: landmark.trim(),
      type:
        addressType === 'Home'
          ? 'Home Address'
          : addressType === 'Work'
          ? 'Work Address'
          : 'Other',
      isDefault,
    };

    console.log("it is the payload of update address" , payload)

    try {
      const response = editingAddress?._id
        ? await apiService.update<UpdateAddressResponse>(
            `${UPDATE_ADDRESS_API}/${editingAddress._id}`,
            payload,
            undefined,
            'PUT',
          )
        : await apiService.post<UpdateAddressResponse>(
            UPDATE_ADDRESS_API,
            payload,
          );
      if (response?.success) {
        Alert.alert(
          'Success',
          response.message ||
            (editingAddress?._id
              ? 'Address updated successfully'
              : 'Address added successfully'),
        );
        onSaved();
      } else {
        Alert.alert('Failed', response?.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      Alert.alert(
        'Failed',
        error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { maxHeight: '90%' }]}>
              <View style={styles.dragHandle} />

              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </Text>
                  <Text style={styles.modalSubTitle}>
                    {editingAddress
                      ? 'Update your address details'
                      : 'Enter your address details'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
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
                    const isSel = addressType === item.type;
                    const iconColor = isSel
                      ? theme.colors.primary
                      : theme.colors.textSecondary;

                    return (
                      <TouchableOpacity
                        key={item.type}
                        style={[styles.typeChip, isSel && styles.typeChipSelected]}
                        onPress={() => setAddressType(item.type)}>
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
                    value={fullName}
                    onChangeText={setFullName}
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
                    value={mobile}
                    onChangeText={setMobile}
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
                      value={pincode}
                      onChangeText={setPincode}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.pinCheckBtn}
                    disabled={checkingPincode}
                    onPress={checkPincode}>
                    {checkingPincode ? (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                      <Text style={styles.pinCheckText}>Check Pincode</Text>
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={styles.fieldLabel}>Address</Text>
                <View style={styles.inputContainer}>
                  <SvgXml xml={MAP_BUILDING_SVG} style={styles.inputLeftIcon} width={15} height={15} />
                  <TextInput
                    style={styles.formInputWithIcon}
                    placeholder="House No., Building, Street, Area"
                    placeholderTextColor={theme.colors.textMuted}
                    value={address}
                    onChangeText={setAddress}
                  />
                </View>

                <TouchableOpacity
                  style={styles.locateBtn}
                  activeOpacity={0.8}
                  disabled={locating}
                  onPress={fetchCurrentLocation}>
                  {locating ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <>
                      <SvgXml xml={LOCATION_PIN_SVG_LOCAL} width={15} height={15} />
                      <Text style={styles.locateBtnText}>Use Current Location</Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={styles.fieldLabel}>Landmark (Optional)</Text>
                <View style={styles.inputContainer}>
                  <SvgXml xml={FLAG_ICON_SVG} style={styles.inputLeftIcon} />
                  <TextInput
                    style={styles.formInputWithIcon}
                    placeholder="Enter landmark"
                    placeholderTextColor={theme.colors.textMuted}
                    value={landmark}
                    onChangeText={setLandmark}
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
                        value={city}
                        onChangeText={setCity}
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
                        value={stateName}
                        onChangeText={setStateName}
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
                  onPress={() => setIsDefault(!isDefault)}>
                  <View
                    style={[
                      styles.checkboxBox,
                      isDefault && styles.checkboxBoxSelected,
                    ]}>
                    {isDefault && <SvgXml xml={CHECK_GREEN_SVG} width={10} height={10} />}
                  </View>
                  <Text style={styles.defaultCheckboxLabel}>Set as default address</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
                  activeOpacity={0.8}
                  disabled={isSaving}
                  onPress={handleSave}>
                  {isSaving ? (
                    <ActivityIndicator color={theme.colors.textOnPrimary} />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {editingAddress ? 'Update Address' : 'Save Address'}
                    </Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const createStyles = (theme: AppTheme) => {
  const { colors, fontFamily } = theme;

  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 24,
    },
    dragHandle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: 12,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
    },
    modalSubTitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 1,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
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
      borderWidth: 1,
    },
    pinCheckText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primary,
    },
    locateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 8,
      height: 40,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary,
      borderStyle: 'dashed',
      backgroundColor: colors.primaryLight,
    },
    locateBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
      fontFamily: fontFamily.medium,
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
    saveBtnDisabled: {
      opacity: 0.6,
    },
    saveBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textOnPrimary,
    },
  });
};

export default AddAddressModal;