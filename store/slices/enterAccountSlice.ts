// store/slices/enterAccountSlice.ts

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit'; 

interface EnterAccountSliceState {
  isEnterAccount: boolean;
}

const initialState: EnterAccountSliceState = {
  isEnterAccount: false,
};

export const enterAccountSlice = createSlice({
  name: 'enter-account',
  initialState,
  reducers: {
    setEnterAccountState: (state, action: PayloadAction<boolean>) => {
      state.isEnterAccount = action.payload;
    },
  },
});

export const { setEnterAccountState } = enterAccountSlice.actions;
export default enterAccountSlice.reducer;