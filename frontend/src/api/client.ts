import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const STORAGE_KEY_TOKEN = 'pams_auth_token';
const STORAGE_KEY_API_URL = 'pams_api_base_url';

export const getDefaultApiBaseUrl = (): string => {
  return localStorage.getItem(STORAGE_KEY_API_URL) || '';
};

export const setApiBaseUrl = (url: string) => {
  if (url) {
    localStorage.setItem(STORAGE_KEY_API_URL, url.trim().replace(/\/$/, ''));
    apiClient.defaults.baseURL = url.trim().replace(/\/$/, '');
  } else {
    localStorage.removeItem(STORAGE_KEY_API_URL);
    apiClient.defaults.baseURL = '';
  }
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEY_TOKEN);
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
  } else {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  }
};

/**
 * Decode a JWT payload to extract user information.
 * This is used because the backend's login response contains a token
 * but the user object must be decoded from the token itself.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

export const apiClient = axios.create({
  baseURL: getDefaultApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor: attach Bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthorized & extract backend error messages
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      setAuthToken(null);
      window.dispatchEvent(
        new CustomEvent('pams:unauthorized', {
          detail: {
            message: 'Session expired or authentication invalid. Please sign in again.',
          },
        })
      );
    }

    // Extract the backend error message from response data
    const data = error.response?.data as Record<string, unknown> | undefined;
    if (data && typeof data === 'object') {
      const backendMsg = (data.message as string) || (data.error as string);
      if (backendMsg) {
        // Attach the backend message so catch blocks can use (error as AxiosError).message
        (error as unknown as { displayMessage: string }).displayMessage = backendMsg;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Extract a user-friendly error message from any error (AxiosError, Error, etc).
 * Use this in catch blocks instead of relying on error.message which may be generic.
 */
export function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    // Check for displayMessage set by our interceptor
    const withDisplay = err as { displayMessage?: string; response?: { data?: { message?: string; error?: string } }; message?: string };
    if (withDisplay.displayMessage) return withDisplay.displayMessage;
    if (withDisplay.response?.data?.message) return withDisplay.response.data.message;
    if (withDisplay.response?.data?.error) return withDisplay.response.data.error;
    if (withDisplay.message) return withDisplay.message;
  }
  return 'An unexpected error occurred.';
}

export async function checkBackendHealth(): Promise<{
  connected: boolean;
  status: number | null;
  message: string;
  url: string;
}> {
  const currentUrl = apiClient.defaults.baseURL || getDefaultApiBaseUrl() || 'http://localhost:8080';
  try {
    const response = await axios.get(`${currentUrl}/api/health`, {
      timeout: 3000,
      validateStatus: () => true,
    });
    return {
      connected: response.status >= 200 && response.status < 400,
      status: response.status,
      message: response.status === 200 ? 'Connected' : `Responded with status ${response.status}`,
      url: currentUrl,
    };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      connected: false,
      status: null,
      message: error.message || 'Cannot reach Spring Boot server at ' + currentUrl,
      url: currentUrl,
    };
  }
}
