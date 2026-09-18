import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../api/apiService';

export type Address = {
  _id?: string;
  name?: string;
  phone?: string;
  street?: string;
  fullAddress?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  altPhone?: string;
  type?: string;
  country?: string;
  isDefault?: boolean;
};

export type ProfileData = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string | null;
  profileImage?: string | null;
  image?: string | null;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  addresses?: Address[];
};

type ProfileResponse = {
  success: boolean;
  data?: ProfileData;
  message?: string;
};

const PROFILE_ENDPOINT = '/api/auth/me';

/** Compact single-line address label shown next to the location pin in headers. */
export const formatAddressLabel = (
  address?: Address | null,
  fallback = 'Home',
): string => {
  if (!address) {
    return fallback;
  }
  const fields = [
    address.street,
    address.locality,
    address.landmark,
    address.city,
    address.state,
  ].filter(Boolean);
  let line = fields.join(', ');
  if (address.pincode) {
    line = line ? `${line} - ${address.pincode}` : address.pincode;
  }
  return line || address.fullAddress || fallback;
};

export const useProfile = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.get<ProfileResponse>(PROFILE_ENDPOINT);
      if (response?.success && response.data) {
        setProfile(response.data);
        setAddresses(response.data.addresses || []);
      }
    } catch (error) {
      console.log('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { profile, addresses, loading, refresh };
};