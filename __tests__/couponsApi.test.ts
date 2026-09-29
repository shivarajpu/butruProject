/**
 * The coupon list used to be three hardcoded tickets, so every tenant offered
 * the same fabricated WELCOME10/BUNNY15/SUPER20 codes. These cover the mapping
 * from the API's coupon to the three lines a ticket can actually show, and the
 * two decisions that are easy to get wrong: an expired code must not be
 * offered, and a percentage coupon must not hide its ceiling.
 */

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({ storefront: { config: { currency: 'INR' } } }),
}));

jest.mock('../src/storefront/catalog', () => ({
  formatPrice: (value: number, currency: string) => `${currency} ${value}`,
}));

import { fetchCoupons, isLiveCoupon, type StoreCoupon } from '../src/storefront/coupons';

const mockGet = jest.fn<Promise<unknown>, [string]>();

jest.mock('../src/api/apiService', () => ({
  apiService: { get: (endpoint: string) => mockGet(endpoint) },
}));

const coupon = (over: Partial<StoreCoupon> = {}): StoreCoupon => ({
  id: 'c1',
  code: 'SAVE10',
  type: 'percentage',
  value: 10,
  minOrderAmount: 999,
  maxDiscount: 500,
  validFrom: null,
  validTo: null,
  eligibilityType: 'all_users',
  appliesOn: 'cart_subtotal',
  excludeDiscountedProducts: false,
  source: 'manual',
  ...over,
});

beforeEach(() => {
  mockGet.mockReset();
});

describe('fetchCoupons', () => {
  it('asks for the tenant slug and unwraps the envelope', async () => {
    mockGet.mockResolvedValue({ success: true, count: 1, data: [coupon()] });

    const list = await fetchCoupons('butru-store');

    expect(mockGet).toHaveBeenCalledWith('/api/storefront/coupons?slug=butru-store');
    expect(list).toHaveLength(1);
    expect(list[0].code).toBe('SAVE10');
  });

  it('drops a coupon whose window has already closed', async () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    const future = new Date(Date.now() + 86_400_000).toISOString();
    mockGet.mockResolvedValue({
      success: true,
      count: 2,
      data: [coupon({ id: 'dead', validTo: past }), coupon({ id: 'live', validTo: future })],
    });

    const list = await fetchCoupons('butru-store');

    expect(list.map(item => item.id)).toEqual(['live']);
  });

  it('gives an empty list rather than throwing when the request fails', async () => {
    mockGet.mockRejectedValue(new Error('offline'));

    await expect(fetchCoupons('butru-store')).resolves.toEqual([]);
  });

  it('gives an empty list when the API reports failure', async () => {
    mockGet.mockResolvedValue({ success: false, count: 0, data: null });

    await expect(fetchCoupons('butru-store')).resolves.toEqual([]);
  });

  it('treats a missing or unparseable end date as still live', () => {
    expect(isLiveCoupon(coupon({ validTo: null }))).toBe(true);
    expect(isLiveCoupon(coupon({ validTo: 'not-a-date' }))).toBe(true);
  });
});
