import { all } from 'redux-saga/effects';
import { watchThemeSaga } from './themeSaga';

export default function* rootSaga() {
  yield all([watchThemeSaga()]);
}
