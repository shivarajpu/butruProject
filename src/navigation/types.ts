import type { NavigatorScreenParams } from '@react-navigation/native';
import type { SupportConfig } from '../theme/types';
import type { PolicyKey } from '../api/policies';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Otp: undefined;
  OtpVarify: { phoneNumber?: string; email?: string; token?: string } | undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  Home: NavigatorScreenParams<TabParamList> | undefined;
  ProductDetails: {
    product: any;
    /**
     * Prices carried by a `product_details` notification. When present the
     * screen shows these instead of the catalogue price.
     */
    priceOverride?: { newPrice?: number; oldPrice?: number };
    /** Set when the notification only carries an id. */
    productId?: string;
  };
  CartScreen: { mode?: 'buyNow'; filterProductId?: string } | undefined;
  MyOrders:
    | {
        /** Which internal view to open once the orders are loaded. */
        view?: 'list' | 'track' | 'details';
        orderId?: string;
        orderNumber?: string;
        productId?: string;
        trackingNumber?: string;
        /** `add_review` notifications open the review form straight away. */
        openReview?: boolean;
      }
    | undefined;
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
  /**
   * `navNonce` is stamped on by `useWidgetActions.pushTab` so that re-navigating
   * with the same `category` still counts as a change. Widgets pass params as a
   * loose record, so it has to be part of the declared shape.
   */
  HomeTab: { category?: string; navNonce?: number } | undefined;
  CategoryTab: undefined;
  WishlistTab: { filterProductId?: string; navNonce?: number } | undefined;
  AccountTab: undefined;
};
