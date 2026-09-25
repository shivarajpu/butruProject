import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';
import type { Address } from '../hooks/useProfile';

const CLOSE_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
const EDIT_PENCIL_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B12B5B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`;
const TRASH_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C0392B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;

const getHomeIconSvg = (_color: string) => `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2 5.99992L8 1.33325L14 5.99992V13.3333C14 14.0691 13.4026 14.6666 12.6667 14.6666H3.33333C2.59745 14.6666 2 14.0691 2 13.3333V5.99992" stroke="#BE185D" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="6" y="8" width="4" height="6.66667" stroke="#BE185D" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;
const getWorkIconSvg = (color: string) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`;
const getOtherLocationSvg = (color: string) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>`;

type Props = {
  visible: boolean;
  addresses: Address[];
  selectedAddressId?: string | null;
  onSelect: (address: Address) => void;
  onClose: () => void;
  onAddAddress: () => void;
  onEditAddress?: (address: Address) => void;
  onDeleteAddress?: (address: Address) => void;
};

const getAddressType = (address: Address): 'home' | 'work' | 'other' => {
  const type = (address.type || '').toLowerCase();
  if (type.includes('home')) return 'home';
  if (type.includes('work')) return 'work';
  return 'other';
};

const AddressSelectionModal = ({
  visible,
  addresses,
  selectedAddressId,
  onSelect,
  onClose,
  onAddAddress,
  onEditAddress,
  onDeleteAddress,
}: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  const handleSelect = (address: Address) => {
    onSelect(address);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.dragHandle} />

              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Address</Text>
                  <Text style={styles.modalSubTitle}>Select delivery address</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <SvgXml xml={CLOSE_SVG} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {addresses.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>
                      No saved addresses yet. Add one to start delivering.
                    </Text>
                  </View>
                ) : (
                  addresses.map((address, index) => {
                    const id = address._id || String(index);
                    const isSelected = selectedAddressId === id;
                    const type = getAddressType(address);

                    const addressText =
                      address.fullAddress ||
                      [address.street, address.locality, address.city, address.state]
                        .filter(Boolean)
                        .join(', ') +
                        (address.pincode ? ` - ${address.pincode}` : '');

                    return (
                      <TouchableOpacity
                        key={id}
                        style={[
                          styles.addressCard,
                          isSelected && styles.selectedAddressCard,
                        ]}
                        onPress={() => handleSelect(address)}
                        activeOpacity={0.8}>
                        <View style={styles.addressHeaderRow}>
                          <View style={styles.addressTypeBadge}>
                            <SvgXml
                              xml={
                                type === 'home'
                                  ? getHomeIconSvg(theme.colors.primary)
                                  : type === 'work'
                                  ? getWorkIconSvg(theme.colors.textSecondary)
                                  : getOtherLocationSvg(theme.colors.textSecondary)
                              }
                            />
                            <Text
                              style={[
                                styles.addressTypeText,
                                !isSelected && { color: theme.colors.text },
                              ]}>
                              {address.type || 'Address'}
                            </Text>
                            {address.isDefault && (
                              <View style={styles.defaultBadge}>
                                <Text style={styles.defaultText}>DEFAULT</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.radioOuter}>
                            {isSelected && <View style={styles.radioInner} />}
                          </View>
                        </View>
                        <Text style={styles.addressDetailsText}>
                          {addressText}
                        </Text>
                        {(onEditAddress || onDeleteAddress) && (
                          <View style={styles.cardActionsRow}>
                            {onEditAddress && (
                              <TouchableOpacity
                                style={styles.cardActionBtn}
                                activeOpacity={0.7}
                                onPress={() => onEditAddress(address)}>
                                <SvgXml xml={EDIT_PENCIL_SVG} width={12} height={12} />
                                <Text style={styles.cardActionText}>Edit</Text>
                              </TouchableOpacity>
                            )}
                            {onDeleteAddress && (
                              <TouchableOpacity
                                style={styles.cardActionBtn}
                                activeOpacity={0.7}
                                onPress={() => onDeleteAddress(address)}>
                                <SvgXml xml={TRASH_SVG} width={12} height={12} />
                                <Text style={[styles.cardActionText, styles.cardActionDeleteText]}>
                                  Delete
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}

                <TouchableOpacity
                  style={styles.addNewAddressBtn}
                  activeOpacity={0.7}
                  onPress={onAddAddress}>
                  <Text style={styles.addNewAddressText}>+ Add New Address</Text>
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
  const { colors } = theme;

  return StyleSheet.create({
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
    cardActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 10,
    },
    cardActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    cardActionText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    cardActionDeleteText: {
      color: colors.error,
    },
    emptyState: {
      paddingVertical: 24,
      paddingHorizontal: 12,
      alignItems: 'center',
      borderRadius: 10,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.border,
      marginBottom: 12,
    },
    emptyText: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
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
  });
};

export default AddressSelectionModal;