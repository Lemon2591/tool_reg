import { call, put, takeEvery } from 'redux-saga/effects';
import { setThemeReducer } from '../reducer/themeReducer';
import constants from '../action/index';
import { createAction } from '@reduxjs/toolkit';

export const themeAction = createAction(constants.ACTION_THEME);
export function* themeSaga(action: any) {
  try {
    yield put(setThemeReducer(action.payload));
  } catch (error) {
    console.log(error);
  }
}

export function* watchThemeSaga() {
  yield takeEvery(themeAction, themeSaga);
}
