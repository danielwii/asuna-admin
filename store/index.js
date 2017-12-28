import withRedux     from 'next-redux-wrapper';
import nextReduxSaga from 'next-redux-saga';

import { applyMiddleware, combineReducers, createStore } from 'redux';

import createSagaMiddleware       from 'redux-saga';
import { composeWithDevTools }    from 'redux-devtools-extension';
import logger                     from 'redux-logger';
import { reducer as formReducer } from 'redux-form';
import { all }                    from 'redux-saga/effects';
import PropTypes                  from 'prop-types';

import { loginActionTypes, loginReducer, loginSagas } from './login.redux';

import {
  notificationsActionTypes, notificationsReducer,
  notificationsSagas,
} from './notifications.redux';

const initialState = {
  message: 'hello world',
};

export const globalShape = PropTypes.shape({});

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export const actionTypes = {
  login        : loginActionTypes,
  notifications: notificationsActionTypes,
};

// --------------------------------------------------------------
// Root reducers
// --------------------------------------------------------------

const rootReducers = combineReducers({
  notifications: notificationsReducer,
  login        : loginReducer,
  form         : formReducer,
  global       : (previousState = initialState, action) => (
    { ...previousState, ...action }
  ),
});

// --------------------------------------------------------------
// Root sagas
// --------------------------------------------------------------

function* rootSaga() {
  yield all([
    ...loginSagas,
    ...notificationsSagas,
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
