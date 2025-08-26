import AsyncStorage from '@react-native-async-storage/async-storage';
// Avoid native module dependency issues in Expo Go by using a simple UUID fallback
function simpleUuid(): string {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

const ACCESS_TOKEN_KEY = 'auth_access_token';
const ACCESS_TOKEN_EXP_KEY = 'auth_access_token_expires_in';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const REFRESH_TOKEN_EXP_KEY = 'auth_refresh_token_expires_in';
const USER_KEY = 'auth_user';
const DEVICE_ID_KEY = 'auth_device_id';

export type PersistedUser = {
  _id: string;
  name?: string;
  email?: string;
  roles?: any;
  permissions?: any;
  [key: string]: any;
};

export async function saveTokens(params: {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
}): Promise<void> {
  const { accessToken, accessTokenExpiresIn, refreshToken, refreshTokenExpiresIn } = params;
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, accessToken],
    [ACCESS_TOKEN_EXP_KEY, String(accessTokenExpiresIn)],
    [REFRESH_TOKEN_KEY, refreshToken],
    [REFRESH_TOKEN_EXP_KEY, String(refreshTokenExpiresIn)],
  ]);
}

export async function saveUser(user: PersistedUser): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function loadTokens(): Promise<{
  accessToken: string | null;
  accessTokenExpiresIn: number | null;
  refreshToken: string | null;
  refreshTokenExpiresIn: number | null;
}> {
  const entries = await AsyncStorage.multiGet([
    ACCESS_TOKEN_KEY,
    ACCESS_TOKEN_EXP_KEY,
    REFRESH_TOKEN_KEY,
    REFRESH_TOKEN_EXP_KEY,
  ]);
  const map = Object.fromEntries(entries);
  return {
    accessToken: map[ACCESS_TOKEN_KEY] ?? null,
    accessTokenExpiresIn: map[ACCESS_TOKEN_EXP_KEY] ? Number(map[ACCESS_TOKEN_EXP_KEY]) : null,
    refreshToken: map[REFRESH_TOKEN_KEY] ?? null,
    refreshTokenExpiresIn: map[REFRESH_TOKEN_EXP_KEY] ? Number(map[REFRESH_TOKEN_EXP_KEY]) : null,
  };
}

export async function loadUser(): Promise<PersistedUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.multiRemove([
    ACCESS_TOKEN_KEY,
    ACCESS_TOKEN_EXP_KEY,
    REFRESH_TOKEN_KEY,
    REFRESH_TOKEN_EXP_KEY,
    USER_KEY,
  ]);
}

export async function getDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = simpleUuid();
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

export async function getAccessToken(): Promise<string | null> {
  const { accessToken } = await loadTokens();
  return accessToken;
}

export async function getRefreshToken(): Promise<string | null> {
  const { refreshToken } = await loadTokens();
  return refreshToken;
}

// Add function specifically for socket authentication (following web app pattern)
export async function getSocketAuthToken(): Promise<string | null> {
  const { refreshToken } = await loadTokens();
  return refreshToken; // Use refresh token for socket auth like web app
}


