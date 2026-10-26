import RazorpayCheckout from 'react-native-razorpay';
import type { RazorpayOptions, RazorpayPrefill } from 'react-native-razorpay';
import { RAZORPAY_KEY_ID } from '@env';
import APP_CONFIG from '../config/clients';

export interface RazorpayCustomer {
  name?: string;
  email?: string;
  phone?: string;
}

export type RazorpayPaymentMethod = 'upi' | 'card';

export interface OpenRazorpayCheckoutOptions {
  amount: number;
  customer: RazorpayCustomer;
  description?: string;
  themeColor?: string;
  method?: RazorpayPaymentMethod;
  orderId?: string;
  notes?: Record<string, string>;
}

export interface RazorpayPaymentResult {
  paymentId: string;
  orderId?: string;
  signature?: string;
}

export class RazorpayPaymentError extends Error {
  readonly cancelled: boolean;
  readonly code?: string;

  constructor(message: string, cancelled = false, code?: string) {
    super(message);
    this.name = 'RazorpayPaymentError';
    this.cancelled = cancelled;
    this.code = code;
  }
}

const razorpayKeyId = (): string => String(RAZORPAY_KEY_ID || '').trim();

export const isRazorpayConfigured = (): boolean => razorpayKeyId().length > 0;

const toPaise = (amount: number): number => {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new RazorpayPaymentError('Invalid payment amount.');
  }
  return Math.round(amount * 100);
};

const buildPrefill = (customer: RazorpayCustomer): RazorpayPrefill => {
  const prefill: RazorpayPrefill = {};
  if (customer.name) prefill.name = customer.name;
  if (customer.email) prefill.email = customer.email;
  if (customer.phone) prefill.contact = customer.phone;
  return prefill;
};

const buildMethod = (method?: RazorpayPaymentMethod) => {
  if (!method) return undefined;
  return {
    upi: method === 'upi',
    card: method === 'card',
    netbanking: false,
    wallet: false,
    emi: false,
    paylater: false,
  };
};

const normalizeError = (error: unknown): RazorpayPaymentError => {
  if (error instanceof RazorpayPaymentError) {
    return error;
  }

  if (typeof error === 'string') {
    return new RazorpayPaymentError(error, /cancel/i.test(error));
  }

  const raw = (error ?? {}) as Record<string, unknown>;
  const description = String(
    raw.description || raw.message || 'Payment could not be completed.',
  );
  const rawCode = raw.code ?? raw.error_code;
  const code =
    rawCode === undefined || rawCode === null ? undefined : String(rawCode);
  const cancelled =
    code === '2' ||
    code === 'PAYMENT_CANCELLED' ||
    code === 'PAYMENT_CANCELED' ||
    /cancel/i.test(description);

  return new RazorpayPaymentError(description, cancelled, code);
};

/**
 * Opens Razorpay's native checkout and resolves with the payment reference.
 *
 * The secret key must never reach the app. Only the public `key` id is sent to
 * the SDK. For a production-safe capture the backend must create the order
 * server-side and verify `razorpay_signature`; pass that order id here when the
 * backend starts returning one, otherwise checkout still works in test mode.
 */
export const openRazorpayCheckout = async (
  options: OpenRazorpayCheckoutOptions,
): Promise<RazorpayPaymentResult> => {
  const key = razorpayKeyId();
  if (!key) {
    throw new RazorpayPaymentError(
      'Online payments are not configured for this app. Please choose Cash on Delivery.',
    );
  }

  const fallbackTheme =
    APP_CONFIG.defaultMode === 'dark'
      ? APP_CONFIG.colors.dark.primary
      : APP_CONFIG.colors.light.primary;

  const checkoutOptions: RazorpayOptions = {
    key,
    amount: String(toPaise(options.amount)),
    currency: 'INR',
    name: APP_CONFIG.appName,
    description: options.description || `Order from ${APP_CONFIG.appName}`,
    ...(options.orderId ? { order_id: options.orderId } : {}),
    prefill: buildPrefill(options.customer),
    notes: {
      ...(options.notes || {}),
      app: APP_CONFIG.appName,
    },
    theme: {
      color: options.themeColor || fallbackTheme,
    },
    method: buildMethod(options.method),
    modal: {
      confirm_close: true,
    },
    retry: {
      enabled: true,
      max_count: 3,
    },
  };

  try {
    const result = await RazorpayCheckout.open(checkoutOptions);
    if (!result?.razorpay_payment_id) {
      throw new RazorpayPaymentError(
        'Payment succeeded but no payment id was returned. Please contact support.',
      );
    }
    return {
      paymentId: result.razorpay_payment_id,
      orderId: result.razorpay_order_id,
      signature: result.razorpay_signature,
    };
  } catch (error) {
    throw normalizeError(error);
  }
};
