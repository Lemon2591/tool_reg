import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sys_theme: 'light',
};

export const themeReducer = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeReducer(state, action) {
      state.sys_theme = action.payload;
    },
  },
});

export const { setThemeReducer } = themeReducer.actions;

export default themeReducer.reducer;
