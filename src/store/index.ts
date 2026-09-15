/**
 * Redux Store — Root Configuration
 *
 * To add a new slice:
 *   1. Import your reducer.
 *   2. Add it to `reducer` map below.
 *   3. RootState is inferred automatically — no manual typing needed.
 */

import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './slices/themeSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    auth: authReducer,
    // Add more slices here as the app grows:
    // cart: cartReducer,
  },
});

// Infer RootState and AppDispatch from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
