import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import request from "../../../service/AxiosInstance";
import { handleApiError } from "../../../utils/Api";
import { removeAuthCookies } from "../../../utils/AuthLib";
import { hexToString } from "../../../utils/Lib";
import { getCookie, setCookie } from "../../../utils/Storage";

interface AuthState {
  isLoading: boolean;
  isError: boolean;
  user: any | null;
  error: string | null;
}

const initialState: AuthState = {
  isLoading: false,
  isError: false,
  user: null,
  error: null,
};

export const authUser = createAsyncThunk("get/user", async (_, { rejectWithValue }) => {
  try {
    const refreshTokenFromCookie = getCookie("rt");

    const deviceId = getCookie("dvcid");
    const headerData = {
      deviceId: deviceId || null,
    };

    if (refreshTokenFromCookie === null) {
      return null;
    }

    const refreshToken = hexToString(refreshTokenFromCookie as string);
    const res = await request.post("/api/refresh-token", headerData, {
      headers: {
        "x-refresh-token": refreshToken,
      },
    });

    if (res.status !== 200) {
      removeAuthCookies();
      return rejectWithValue("Failed to authenticate user");
    }

    if (res.data.token !== null) {
      const accessToken = res.data.token.accessToken;
      const expiresInAccessToken = res.data.token.accessTokenExpiresIn;
      setCookie("at_", accessToken, expiresInAccessToken);
    }

    return res.data.user;
  } catch (err: unknown) {
    handleApiError(err);
    if (err instanceof AxiosError) {
      removeAuthCookies();
      return rejectWithValue(err.response?.data || "Failed to authenticate user");
    }
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<any>) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(authUser.pending, (state) => {
        state.isError = false;
        state.isLoading = true;
        state.error = null;
      })
      .addCase(authUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(authUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.error = action.payload as string;
      });
  },
});

export default authSlice.reducer;
export const { setUser, logout } = authSlice.actions;
