/**
 * Order invoice download.
 *
 *   GET /api-proxy/api/storefront/orders/{orderId}/invoice.pdf
 *
 * The backend renders the PDF, so the app no longer builds an invoice locally:
 * it downloads the file with the tenant/auth headers, then hands the local path
 * to the platform viewer.
 */

import BlobUtil from 'react-native-blob-util';
import type { FetchBlobResponse } from 'react-native-blob-util';
import APP_CONFIG from '../config/clients';
import { getRequestHeaders } from './apiService';

export const getOrderInvoiceUrl = (orderId: string): string => {
  const domain = APP_CONFIG.api.storeDomain
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');
  const id = encodeURIComponent(orderId);

  return `https://${domain}/api-proxy/api/storefront/orders/${id}/invoice.pdf`;
};

const errorMessageFrom = async (
  response: FetchBlobResponse,
  status: number,
): Promise<string> => {
  try {
    const text = await response.text();
    const body = JSON.parse(text);
    if (body && typeof body.message === 'string' && body.message.trim()) {
      return body.message;
    }
  } catch {
    // Response was not the JSON error envelope — keep the status message.
  }

  return `Invoice download failed (${status})`;
};

/**
 * Downloads the invoice and resolves with the local PDF path.
 * Rejects when the API does not answer 200 so the caller can surface the
 * backend's message instead of opening an error body as a PDF.
 */
export const downloadOrderInvoice = async (orderId: string): Promise<string> => {
  const headers = getRequestHeaders();
  headers.Accept = 'application/pdf';
  delete headers['Content-Type'];

  const response = await BlobUtil.config({
    fileCache: true,
    appendExt: 'pdf',
  }).fetch('GET', getOrderInvoiceUrl(orderId), headers);

  const status = response.info().status;
  if (status !== 200) {
    const message = await errorMessageFrom(response, status);
    response.flush();
    throw new Error(message);
  }

  return response.path();
};
