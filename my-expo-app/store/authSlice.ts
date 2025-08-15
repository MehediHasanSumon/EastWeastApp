import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { loginApi, persistFromLogin, refreshAccessToken } from '../utils/api';
import { PersistedUser, clearAuth, loadUser, loadTokens, saveUser, saveTokens } from '../utils/authStorage';

export type AuthState = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: PersistedUser | null;
  error: string | null;
  hydrated: boolean; // indicates persistence hydration done
};

const initialState: AuthState = {
  isLoading: false,
  isAuthenticated: false,
  user: null,
  error: null,
  hydrated: false,
};

export const hydrateAuth = createAsyncThunk('auth/hydrate', async () => {
  const [user, tokens] = await Promise.all([loadUser(), loadTokens()]);
  return { user, tokens } as const;
});

export const login = createAsyncThunk(
  'auth/login',
  async (values: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const data = await loginApi(values);
      await persistFromLogin(data);
      return data.user as PersistedUser;
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const refreshSession = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const data = await refreshAccessToken();
      // Only accessToken may change; persist both to be safe
      if (data.token) {
        await saveTokens({
          accessToken: data.token.accessToken,
          accessTokenExpiresIn: data.token.accessTokenExpiresIn,
          refreshToken: data.token.refreshToken,
          refreshTokenExpiresIn: data.token.refreshTokenExpiresIn,
        });
      }
      if (data.user) await saveUser(data.user);
      return data.user as PersistedUser;
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || 'Session refresh failed';
      return rejectWithValue({ status, message });
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logoutSuccess(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        const { user, tokens } = action.payload as any;
        state.hydrated = true;
        const hasValidRefresh = Boolean(tokens?.refreshToken);
        state.isAuthenticated = hasValidRefresh && Boolean(user);
        state.user = user ?? null;
      })
      .addCase(hydrateAuth.rejected, (state) => {
        state.hydrated = true;
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<PersistedUser>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Login failed';
      })
      .addCase(refreshSession.fulfilled, (state, action: PayloadAction<PersistedUser>) => {
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(refreshSession.rejected, (state, action: any) => {
        // Do NOT log out on transient/network errors. Only if backend explicitly says 401.
        if (action?.payload?.status === 401) {
          state.isAuthenticated = false;
          state.user = null;
        }
      });
  },
});

export const { logoutSuccess } = authSlice.actions;

export const logout = () => async (dispatch: any) => {
  await clearAuth();
  dispatch(logoutSuccess());
};

export default authSlice.reducer;


