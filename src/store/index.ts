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

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    // Add more slices here as the app grows:
    // auth: authReducer,
    // cart: cartReducer,
  },
});

// Infer RootState and AppDispatch from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
