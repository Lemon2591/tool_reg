import createSagaMiddleware from 'redux-saga';
import { configureStore } from '@reduxjs/toolkit';
import rootSaga from './saga/rootSaga';
import rootReducer from './reducer/rootReducer';

const sagaMiddleware = createSagaMiddleware();
interface RootState {
  theme: any;
}

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false, serializableCheck: false }).concat(
      sagaMiddleware
    ),
});

sagaMiddleware.run(rootSaga);

// Type for RootState
export type { RootState };
