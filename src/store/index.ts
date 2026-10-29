import { configureStore } from '@reduxjs/toolkit';
import roomReducer from './roomSlice';
export const createAppStore = () =>
  configureStore({ reducer: { room: roomReducer } });
export const store = createAppStore();
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
