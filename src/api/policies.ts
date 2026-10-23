import { apiService } from './apiService';

export type PolicyKey =
  // Disabled: the store does not offer a return/refund/exchange policy.
  // Uncomment `'returns'` to bring the policy screen entry back.
  // | 'returns'
  | 'shipping'
  | 'terms'
  | 'privacy'
  | 'about';

export type Policy = {
  key: string;
  title: string;
  path: string;
  storeId: string;
  storeSlug: string;
  storeName: string;
  hasContent: boolean;
  mode: string;
  editor: string;
  content: string;
  fileUrl: string;
  fileName: string;
  filePath: string;
};

export type PolicyResponse = {
  success: boolean;
  message?: string;
  data?: Policy | null;
};

const POLICY_LABELS: Record<PolicyKey, string> = {
  // Disabled with the return policy module; uncomment together with the
  // `'returns'` PolicyKey member to restore it.
  // returns: 'Returns, Refunds & Exchange',
  shipping: 'Shipping Policy',
  terms: 'Terms and Conditions',
  privacy: 'Privacy Policy',
  about: 'About Us',
};

export const POLICY_KEYS: PolicyKey[] = [
  'about',
  'terms',
  'shipping',
  // Disabled: no return policy from our end.
  // 'returns',
  'privacy',
];

export const policyTitle = (key: PolicyKey): string => POLICY_LABELS[key] ?? key;

export const getPolicy = (key: PolicyKey) =>
  apiService.get<PolicyResponse>(`/api/storefront/policies/${key}`);

export const policyHasContent = (policy?: Policy | null): boolean =>
  !!policy &&
  policy.hasContent === true &&
  typeof policy.content === 'string' &&
  policy.content.replace(/<[^>]+>/g, '').trim().length > 0;