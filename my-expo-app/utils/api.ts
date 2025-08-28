import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import { getAccessToken, getRefreshToken, getDeviceId, saveTokens, saveUser, clearAuth } from './authStorage';
import { ENV } from '../config/environment';

// Configure your backend host via env or fallback suitable for real devices/emulators
function resolveBaseUrl(): string {
  // Use environment config first
  if (ENV.BACKEND_HOST) return ENV.BACKEND_HOST;
  
  // Production fallback
  if (process.env.NODE_ENV === 'production') {
    return 'https://your-production-domain.com'; // Update this with your actual production domain
  }
  
  // Prefer emulator loopback for Android emulators
  if (Platform.OS === 'android') return 'http://10.0.2.2:8000';
  
  // iOS simulator fallback
  if (Platform.OS === 'ios') return 'http://localhost:8000';
  
  return 'http://localhost:8000';
}

export const API_BASE_URL = resolveBaseUrl();

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL.replace(/\/$/, ''),
  withCredentials: true,
  timeout: 30000, // Increased timeout for production
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Request interceptor for better error handling
api.interceptors.request.use(async (config) => {
  try {
    const refreshToken = await getRefreshToken();
    const accessToken = await getAccessToken();
    const deviceId = await getDeviceId();

    if (!config.headers) config.headers = {} as any;
    
    if (refreshToken) (config.headers as any)['x-refresh-token'] = refreshToken;
    if (accessToken) (config.headers as any)['authorization'] = `Bearer ${accessToken}`;
    if (deviceId) (config.headers as any)['deviceId'] = deviceId;
    
    // Ensure no stray trailing slashes in URL
    if (config.url) config.url = config.url.replace(/^\/+/, '/');
    
    // Add request timestamp for debugging
    (config.headers as any)['X-Request-Timestamp'] = new Date().toISOString();
    
    return config;
  } catch (error) {
    console.error('Request interceptor error:', error);
    return config;
  }
}, (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Response interceptor with better error handling
api.interceptors.response.use(
  (res) => {
    // Log successful responses in development
    if (__DEV__) {
      console.log(`✅ API Response [${res.config.method?.toUpperCase()}] ${res.config.url}:`, res.status);
    }
    return res;
  },
  async (error) => {
    // Log error details
    if (error.response) {
      console.error(`❌ API Error [${error.config?.method?.toUpperCase()}] ${error.config?.url}:`, {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      console.error('❌ API Request Error:', error.request);
    } else {
      console.error('❌ API Error:', error.message);
    }

    // Handle specific error cases
    if (error.response?.status === 401) {
      console.log('🔄 Unauthorized, clearing auth...');
      await clearAuth();
    } else if (error.response?.status === 503) {
      console.log('⚠️ Service unavailable, database connection issue');
    } else if (error.code === 'ECONNABORTED') {
      console.log('⏰ Request timeout');
    } else if (error.code === 'NETWORK_ERROR') {
      console.log('🌐 Network error, check internet connection');
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
  try {
    const deviceId = await getDeviceId();
    const payload = { ...values, deviceId };
    
    const res = await api.post<LoginResponse>('/api/login', payload);
    return res.data;
  } catch (error: any) {
    console.error('Login API error:', error);
    throw error;
  }
}

export async function refreshAccessToken(): Promise<LoginResponse> {
  try {
    const deviceId = await getDeviceId();
    const res = await api.post<LoginResponse>(
      '/api/refresh-token',
      { deviceId },
    );
    return res.data;
  } catch (error: any) {
    console.error('Refresh token API error:', error);
    throw error;
  }
}

export async function getMe(): Promise<{ status: boolean; user: any }> {
  try {
    const res = await api.get('/api/me');
    return res.data;
  } catch (error: any) {
    console.error('Get me API error:', error);
    throw error;
  }
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
  try {
    const res = await api.put('/api/me', payload);
    return res.data;
  } catch (error: any) {
    console.error('Update me API error:', error);
    throw error;
  }
}

export async function uploadAvatar(formData: FormData): Promise<{ status: boolean; user: any }> {
  try {
    // Let axios set Content-Type with boundary automatically
    const res = await api.post('/api/me/avatar', formData);
    return res.data;
  } catch (error: any) {
    console.error('Upload avatar API error:', error);
    throw error;
  }
}

export async function persistFromLogin(data: LoginResponse): Promise<void> {
  try {
    const { token, user } = data;
    await saveTokens({
      accessToken: token.accessToken,
      accessTokenExpiresIn: token.accessTokenExpiresIn,
      refreshToken: token.refreshToken,
      refreshTokenExpiresIn: token.refreshTokenExpiresIn,
    });
    await saveUser(user);
  } catch (error: any) {
    console.error('Persist from login error:', error);
    throw error;
  }
}

export default api;


