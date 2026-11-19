/**
 * Storefront OTP authentication API.
 *
 *   POST /api/auth/otp/send    { phone, storeName }  → send a login code
 *   POST /api/auth/otp/verify  { phone, otp } → verify + get session
 *
 * `storeName` is the tenant slug resolved from EXPO_PUBLIC_STORE_SLUG (or the
 * value baked into the binary), so one app build always talks to its own store.
 */

import { apiService } from './apiService';
import { STORE_SLUG } from '../config/storeIdentity';
import { getAuthFcmToken } from '../services/push';

const OTP_ENDPOINT = '/api/auth/otp';

export interface OtpUser {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface OtpSendResponse {
  success: boolean;
  message?: string;
  isNewUser?: boolean;
}

export interface OtpVerifyResponse {
  success: boolean;
  message?: string;
  isNewUser?: boolean;
  token?: string;
  data?: OtpUser;
  user?: OtpUser;
}

/** Keep the payload in the 10-digit form the auth API expects. */
export const normalizePhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91')
    ? digits.slice(2)
    : digits;
};

export const otpApi = {
  sendPhoneOtp: (phone: string): Promise<OtpSendResponse> =>
    apiService.post<OtpSendResponse>(`${OTP_ENDPOINT}/send`, {
      phone: normalizePhone(phone),
      storeName: STORE_SLUG,
    }),

  verifyPhoneOtp: async (phone: string, otp: string): Promise<OtpVerifyResponse> =>
    apiService.post<OtpVerifyResponse>(`${OTP_ENDPOINT}/verify`, {
      phone: normalizePhone(phone),
      otp,
      fcmToken: await getAuthFcmToken(),
    }),
};
