import type { SupportConfig } from '../theme/types';
import type { PolicyKey } from '../api/policies';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Otp: undefined;
  OtpVarify: { phoneNumber?: string; email?: string } | undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  Home: undefined;
  ProductDetails: { product: any };
  CartScreen: undefined;
  MyOrders: undefined;
  Notification: undefined;
  HelpSupport:
    | {
        config?: Partial<SupportConfig>;
        title?: string;
      }
    | undefined;
  Policy: { policyKey: PolicyKey; title?: string };
  PaymentMethods: undefined;
};

export type TabParamList = {
  HomeTab: { category?: string } | undefined;
  CategoryTab: undefined;
  WishlistTab: undefined;
  AccountTab: undefined;
};
