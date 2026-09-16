/**
 * Redux Toolkit — Auth Slice
 *
 * Keeps the login session in global state so the user stays signed in
 * when the app is killed, backgrounded or reloaded. State is mirrored
 * to AsyncStorage so it survives app restarts until explicit logout.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@butru_auth_session';

interface AuthUser {
  name?: string;
  email?: string;
  phone?: string;
}

interface LoginPayload {
  user: AuthUser;
  token?: string;
}

interface AuthState {
  isLoggedIn: boolean;
  isHydrated: boolean;
  user: AuthUser | null;
  token?: string;
}

const initialState: AuthState = {
  isLoggedIn: false,
  isHydrated: false,
  user: null,
  token: undefined,
};

export const loadAuthState = async (): Promise<AuthState> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as AuthState;
    }
  } catch {
    // Ignore — fall back to logged-out state.
  }
  return initialState;
};

export const persistAuthState = async (state: AuthState) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage write failures.
  }
};

export const clearAuthState = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage write failures.
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action: PayloadAction<LoginPayload>) {
      state.isLoggedIn = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      persistAuthState(state);
    },
    logout(state) {
      state.isLoggedIn = false;
      state.user = null;
      state.token = undefined;
      clearAuthState();
    },
    hydrate(state, action: PayloadAction<AuthState>) {
      state.isLoggedIn = action.payload.isLoggedIn;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isHydrated = true;
    },
  },
});

export const { login, logout, hydrate } = authSlice.actions;
export default authSlice.reducer;