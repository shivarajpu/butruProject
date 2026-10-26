declare module 'react-native-razorpay' {
  export interface RazorpayPrefill {
    name?: string;
    email?: string;
    contact?: string;
    method?: string;
  }

  export interface RazorpayTheme {
    color?: string;
    backdrop_color?: string;
    hide_topbar?: boolean;
  }

  export interface RazorpayModal {
    backdropcolor?: string;
    escape?: boolean;
    handleback?: boolean;
    confirm_close?: boolean;
    ondismiss?: () => void;
    animation?: boolean;
  }

  export interface RazorpayRetry {
    enabled?: boolean;
    max_count?: number;
  }

  export interface RazorpayMethod {
    netbanking?: boolean;
    card?: boolean;
    upi?: boolean;
    wallet?: boolean;
    emi?: boolean;
    paylater?: boolean;
  }

  export interface RazorpayOptions {
    key: string;
    amount: string | number;
    currency: string;
    name: string;
    description?: string;
    image?: string;
    order_id?: string;
    prefill?: RazorpayPrefill;
    notes?: Record<string, string>;
    theme?: RazorpayTheme;
    modal?: RazorpayModal;
    retry?: RazorpayRetry;
    method?: RazorpayMethod;
    send_sms_hash?: boolean;
    allow_rotation?: boolean;
    disable_watermark?: boolean;
    timeout?: number;
  }

  export interface RazorpaySuccess {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }

  export interface RazorpayFailure {
    code?: number | string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  }

  export default class RazorpayCheckout {
    static open(options: RazorpayOptions): Promise<RazorpaySuccess>;
    static onExternalWalletSelection(
      callback: (data: Record<string, unknown>) => void,
    ): void;
  }
}
