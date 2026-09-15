import type { SupportConfig } from '../theme/types';

export type RootStackParamList = {
  Login: undefined;
  Otp: undefined;
  OtpVarify: { phoneNumber?: string; email?: string } | undefined;
  SignUp: undefined;
  Home: undefined;
  ProductDetails: { product: any };
  CartScreen: undefined;
  MyOrders: undefined;
  HelpSupport:
    | {
        config?: Partial<SupportConfig>;
        title?: string;
      }
    | undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  CategoryTab: undefined;
  WishlistTab: undefined;
  AccountTab: undefined;
};
