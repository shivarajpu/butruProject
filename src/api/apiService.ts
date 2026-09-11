import { BASE_URL } from '@env';
import { navigationRef } from '../navigation/rootNavigation';
import APP_CONFIG from '../config/app_config';

type RequestHeaders = Record<string, string>;
type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type RequestOptions = {
  method: RequestMethod;
  headers: RequestHeaders;
  body?: string | FormData;
};

export const handleUnauthorized = () => {
  console.log('401 Unauthorized - Logging out...');

  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  }
};

/**
 * All store-tenant headers are now sourced from app_config.ts.
 * To white-label for a new client, change api.* in app_config.ts.
 */
const getHeaders = (token?: string, isFormData = false): RequestHeaders => {
  const { api } = APP_CONFIG;

  const headers: RequestHeaders = {
    Accept: 'application/json',
    'x-store-slug': api.storeSlug,
    'x-store-domain': api.storeDomain,
    'x-forwarded-host': api.storeDomain,
    'x-store-id': api.storeId,
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const getFullUrl = (endpoint: string): string => {
  const base = (BASE_URL || '').replace(/\/+$/, '');
  const path = `/${(endpoint || '').replace(/^\/+/, '')}`;

  return `${base}${path}`.replace(/([^:/])\/+/g, '$1/');
};

const getErrorMessage = (data: unknown, status: number): string => {
  if (
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof data.message === 'string'
  ) {
    return data.message;
  }

  return `Request failed with status ${status}`;
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok && typeof data === 'string') {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return data as T;
};

const request = async <T>(
  endpoint: string,
  options: RequestOptions,
): Promise<T> => {
  const response = await fetch(getFullUrl(endpoint), options);

  if (response.status === 401) {
    handleUnauthorized();
  }

  return parseResponse<T>(response);
};

export const apiService = {
  get: <T = unknown>(endpoint: string, token?: string) =>
    request<T>(endpoint, {
      method: 'GET',
      headers: getHeaders(token),
    }),

  post: <T = unknown>(
    endpoint: string,
    body: unknown,
    token?: string,
    isFormData = false,
  ) =>
    request<T>(endpoint, {
      method: 'POST',
      headers: getHeaders(token, isFormData),
      body: isFormData ? (body as FormData) : JSON.stringify(body),
    }),

  update: <T = unknown>(
    endpoint: string,
    body: unknown,
    token?: string,
    method: 'PUT' | 'PATCH' = 'PUT',
  ) =>
    request<T>(endpoint, {
      method,
      headers: getHeaders(token),
      body: JSON.stringify(body),
    }),

  delete: <T = unknown>(endpoint: string, token?: string) =>
    request<T>(endpoint, {
      method: 'DELETE',
      headers: getHeaders(token),
    }),
};
