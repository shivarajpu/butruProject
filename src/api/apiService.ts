import { BASE_URL } from '@env';
import { navigationRef } from '../navigation/rootNavigation';
import APP_CONFIG from '../config/app_config';
import { store } from '../store';

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
  } else {
    const storedToken = store.getState().auth.token;
    if (storedToken) {
      headers.Authorization = `Bearer ${storedToken}`;
    }
  }

  return headers;
};

export const getFullUrl = (endpoint: string): string => {
  const base = (BASE_URL || '').replace(/\/+$/, '');
  const path = `/${(endpoint || '').replace(/^\/+/, '')}`;

  return `${base}${path}`.replace(/([^:/])\/+/g, '$1/');
};

const getErrorMessage = (data: unknown, status: number): string => {
  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof data.message === 'string' &&
    data.message.trim()
  ) {
    return data.message;
  }

  return `Request failed with status ${status}`;
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(getErrorMessage(data, response.status));
  }

  return data as T;
};

const request = async <T>(
  endpoint: string,
  options: RequestOptions,
): Promise<{ status: number; data: T }> => {
  const response = await fetch(getFullUrl(endpoint), options);

  if (response.status === 401) {
    handleUnauthorized();
  }

  const data = await parseResponse<T>(response);

  return { status: response.status, data };
};

const unwrap = async <T>(
  result: Promise<{ status: number; data: T }>,
): Promise<T> => (await result).data;

export const apiService = {
  get: <T = unknown>(endpoint: string, token?: string) =>
    unwrap<T>(
      request<T>(endpoint, {
        method: 'GET',
        headers: getHeaders(token),
      }),
    ),

  post: <T = unknown>(
    endpoint: string,
    body: unknown,
    token?: string,
    isFormData = false,
  ) =>
    unwrap<T>(
      request<T>(endpoint, {
        method: 'POST',
        headers: getHeaders(token, isFormData),
        body: isFormData ? (body as FormData) : JSON.stringify(body),
      }),
    ),

  update: <T = unknown>(
    endpoint: string,
    body: unknown,
    token?: string,
    method: 'PUT' | 'PATCH' = 'PUT',
  ) =>
    unwrap<T>(
      request<T>(endpoint, {
        method,
        headers: getHeaders(token),
        body: JSON.stringify(body),
      }),
    ),

  delete: <T = unknown>(endpoint: string, token?: string) =>
    unwrap<T>(
      request<T>(endpoint, {
        method: 'DELETE',
        headers: getHeaders(token),
      }),
    ),

  /** Status-aware POST — returns { status, data } for flows that need the HTTP status (e.g. 204 No Content). */
  postWithStatus: <T = unknown>(
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
};
