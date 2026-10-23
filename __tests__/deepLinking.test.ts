import { parseDeepLink } from '../src/navigation/deepLink';

describe('parseDeepLink', () => {
  it('routes the custom scheme order tracking path', () => {
    expect(parseDeepLink('butru://orders/track/order-1')).toEqual({
      screen: 'track_shipment',
      orderId: 'order-1',
      orderNumber: undefined,
      trackingNumber: 'order-1',
    });
  });

  it('routes the storefront CTA used by notifications', () => {
    expect(
      parseDeepLink('https://butru.in/Orders/Track/6adaf66f178102698701001d'),
    ).toEqual({
      screen: 'track_shipment',
      orderId: '6adaf66f178102698701001d',
      orderNumber: undefined,
      trackingNumber: '6adaf66f178102698701001d',
    });
  });

  it('carries product price overrides from the query string', () => {
    expect(
      parseDeepLink('https://butru.in/product/product-1?newPrice=499&oldPrice=799'),
    ).toEqual({
      screen: 'product_details',
      productId: 'product-1',
      newPrice: 499,
      oldPrice: 799,
    });
  });

  it('routes cart and wishlist links with their product filter', () => {
    expect(parseDeepLink('butru://cart?productId=product-1')).toEqual({
      screen: 'cart',
      productId: 'product-1',
    });
    expect(parseDeepLink('https://butru.in/wishlist?productId=product-1')).toEqual({
      screen: 'wishlist',
      productId: 'product-1',
    });
  });

  it('routes order details and add-review links', () => {
    expect(parseDeepLink('butru://orders/order-1?orderNumber=ORD-1')).toEqual({
      screen: 'order_details',
      orderId: 'order-1',
      orderNumber: 'ORD-1',
      productId: undefined,
    });
    expect(parseDeepLink('butru://add-review/product-1?orderNumber=ORD-1')).toEqual({
      screen: 'add_review',
      productId: 'product-1',
      orderNumber: 'ORD-1',
      orderId: undefined,
    });
  });

  it('keeps bare /orders on the link resolver', () => {
    expect(parseDeepLink('butru://orders')).toEqual({ link: '/orders' });
    expect(parseDeepLink('/orders')).toEqual({ link: '/orders' });
  });

  it('maps the root to home', () => {
    expect(parseDeepLink('butru://')).toEqual({ screen: 'home' });
    expect(parseDeepLink('https://butru.in/')).toEqual({ screen: 'home' });
  });

  it('leaves third-party https links to the browser', () => {
    expect(parseDeepLink('https://example.com/orders/track/1')).toBeNull();
    expect(parseDeepLink(undefined)).toBeNull();
  });

  it('returns the path for unknown internal links so the fallback can run', () => {
    expect(parseDeepLink('butru://new-arrivals')).toEqual({ link: '/new-arrivals' });
  });
});
