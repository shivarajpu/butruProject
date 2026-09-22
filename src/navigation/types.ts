import type { SupportConfig } from '../theme/types';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Otp: undefined;
  OtpVarify: { phoneNumber?: string; email?: string } | undefined;
  SignUp: undefined;
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
  Terms: undefined;
  ShippingPolicy: undefined;
  ReturnsRefunds: undefined;
  PrivacyPolicy: undefined;
};

export type TabParamList = {
  HomeTab: { category?: string } | undefined;
  CategoryTab: undefined;
  WishlistTab: undefined;
  AccountTab: undefined;
};
