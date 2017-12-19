/* eslint-disable key-spacing,no-multi-spaces */
import { applyMiddleware, combineReducers, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';
import withRedux from 'next-redux-wrapper';
import nextReduxSaga from 'next-redux-saga';
import { composeWithDevTools } from 'redux-devtools-extension';
import logger from 'redux-logger';
import { reducer as formReducer } from 'redux-form';
import { all } from 'redux-saga/effects';

import { actionTypes as LoginActionTypes, reducer as LoginReducer, sagas as LoginSagas } from './module-login';

const initialState = {
  message: 'hello world',
};

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export const actionTypes = {
  login: LoginActionTypes,
};

// --------------------------------------------------------------
// Root reducers
// --------------------------------------------------------------

const rootReducers = combineReducers({
  login : LoginReducer,
  form  : formReducer,
  global: (previousState = initialState, action) => (
    { ...previousState, ...action }
  ),
});

// --------------------------------------------------------------
// Root sagas
// --------------------------------------------------------------


function* rootSaga() {
  yield all([
    ...LoginSagas,
  ]);
}

// --------------------------------------------------------------
// Setup store with redux-saga
// --------------------------------------------------------------

const sagaMiddleware = createSagaMiddleware();

export const configureStore = (state = initialState) => {
  const store = createStore(
    rootReducers,
    state,
    composeWithDevTools(applyMiddleware(sagaMiddleware, logger)),
  );

  store.sagaTask = sagaMiddleware.run(rootSaga);
  return store;
};

export function withReduxSaga(BaseComponent) {
  return withRedux(configureStore)(nextReduxSaga(BaseComponent));
}
