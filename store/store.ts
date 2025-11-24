// store/store.ts

import { configureStore, combineSlices } from '@reduxjs/toolkit';
import enterAccountSlice from './slices/enterAccountSlice';


const rootReducer = combineSlices({
  enterAccountSlice,

});

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;