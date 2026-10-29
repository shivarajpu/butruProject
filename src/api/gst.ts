/**
 * GST verification API.
 *
 *   POST /api/gst/verify  { gstNo }
 *
 * The verified details are attached to the order payload as `gstDetails` so
 * B2B invoices can be generated from the same record the shopper confirmed.
 */

import { apiService } from './apiService';

export interface GstAddress {
  building?: string;
  street?: string;
  location?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  fullAddress?: string;
}

export interface GstDetails {
  gstin: string;
  legalName?: string;
  tradeName?: string;
  businessName?: string;
  status?: string;
  isActive?: boolean;
  pan?: string;
  stateCode?: string;
  stateName?: string;
  constitutionOfBusiness?: string;
  natureOfBusiness?: string;
  address?: GstAddress;
}

export interface GstVerifyResponse {
  success: boolean;
  message?: string;
  data?: GstDetails | null;
}

export interface OrderGstDetails {
  isB2B: boolean;
  gstin: string;
  businessName: string;
  tradeName: string;
  legalName: string;
  pan: string;
  stateCode: string;
  stateName: string;
  address: string;
}

export const verifyGst = (gstNo: string): Promise<GstVerifyResponse> =>
  apiService.post<GstVerifyResponse>('/api/gst/verify', {
    gstNo: gstNo.trim().toUpperCase(),
  });

const formatGstAddress = (details: GstDetails): string => {
  if (details.address?.fullAddress) {
    return details.address.fullAddress;
  }

  const cityState = [details.address?.city, details.address?.state]
    .filter(Boolean)
    .join(', ');
  const pincode = details.address?.pincode;

  if (cityState && pincode) {
    return `${cityState} - ${pincode}`;
  }

  return cityState || pincode || '';
};

/**
 * Builds the `gstDetails` block for the order payload. When no GST number was
 * verified the order stays B2C and every field is sent blank.
 */
export const toOrderGstDetails = (
  details?: GstDetails | null,
): OrderGstDetails => {
  if (!details?.gstin) {
    return {
      isB2B: false,
      gstin: '',
      businessName: '',
      tradeName: '',
      legalName: '',
      pan: '',
      stateCode: '',
      stateName: '',
      address: '',
    };
  }

  return {
    isB2B: true,
    gstin: details.gstin,
    businessName: details.businessName || details.legalName || '',
    tradeName: details.tradeName || details.businessName || details.legalName || '',
    legalName: details.legalName || details.businessName || '',
    pan: details.pan || '',
    stateCode: details.stateCode || '',
    stateName: details.stateName || '',
    address: formatGstAddress(details),
  };
};
