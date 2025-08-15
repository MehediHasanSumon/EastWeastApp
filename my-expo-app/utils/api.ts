import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import { getAccessToken, getRefreshToken, getDeviceId, saveTokens, saveUser, clearAuth } from './authStorage';

// Configure your backend host via env or fallback suitable for real devices/emulators
function resolveBaseUrl(): string {
  const env = process.env.EXPO_PUBLIC_BACKEND_HOST || process.env.BACKEND_HOST;
  if (env) return env;
  // Prefer emulator loopback for Android emulators
  if (Platform.OS === 'android') return 'http://10.0.2.2:8000';
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require('expo-constants').default;
    const hostUri: string | undefined =
      Constants?.expoConfig?.hostUri ||
      (Constants as any)?.manifest?.debuggerHost ||
      (Constants as any)?.manifest2?.extra?.expoClient?.hostUri;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      return `http://${host}:8000`;
    }
  } catch {}
  return 'http://localhost:8000';
}

export const API_BASE_URL = resolveBaseUrl();

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL.replace(/\/$/, ''),
  withCredentials: true,
  timeout: 15000,
});

// Attach tokens and device id on each request
api.interceptors.request.use(async (config) => {
  const refreshToken = await getRefreshToken();
  const accessToken = await getAccessToken();
  const deviceId = await getDeviceId();

  if (!config.headers) config.headers = {} as any;
  (config.headers as any)['Accept'] = 'application/json';
  if (refreshToken) (config.headers as any)['x-refresh-token'] = refreshToken;
  if (accessToken) (config.headers as any)['authorization'] = `Bearer ${accessToken}`;
  if (deviceId) (config.headers as any)['deviceId'] = deviceId;
  // Ensure no stray trailing slashes in URL
  if (config.url) config.url = config.url.replace(/^\/+/, '/');

  return config;
});

// Handle 401 globally (optional)
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear local auth on unauthorized; the app will redirect to login
      await clearAuth();
    }
    return Promise.reject(error);
  }
);

export type LoginResponse = {
  status: boolean;
  user: any;
  token: {
    accessToken: string;
    accessTokenExpiresIn: number;
    refreshToken: string;
    refreshTokenExpiresIn: number;
  };
};

export async function loginApi(values: { email: string; password: string }): Promise<LoginResponse> {
  const deviceId = await getDeviceId();
  const res = await api.post<LoginResponse>('/api/login', { ...values, deviceId });
  return res.data;
}

export async function refreshAccessToken(): Promise<LoginResponse> {
  const deviceId = await getDeviceId();
  const res = await api.post<LoginResponse>(
    '/api/refresh-token',
    { deviceId },
  );
  return res.data;
}

export async function getMe(): Promise<{ status: boolean; user: any }> {
  const res = await api.get('/api/me');
  return res.data;
}

export async function updateMe(payload: {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  bio?: string;
  profession?: string;
  date_of_birth?: string; // ISO string
}): Promise<{ status: boolean; user: any }> {
  const res = await api.put('/api/me', payload);
  return res.data;
}

export async function uploadAvatar(formData: FormData): Promise<{ status: boolean; user: any }> {
  // Let axios set Content-Type with boundary automatically
  const res = await api.post('/api/me/avatar', formData);
  return res.data;
}

export async function persistFromLogin(data: LoginResponse): Promise<void> {
  const { token, user } = data;
  await saveTokens({
    accessToken: token.accessToken,
    accessTokenExpiresIn: token.accessTokenExpiresIn,
    refreshToken: token.refreshToken,
    refreshTokenExpiresIn: token.refreshTokenExpiresIn,
  });
  await saveUser(user);
}

export default api;


