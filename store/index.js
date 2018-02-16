/* eslint-disable spaced-comment,no-unused-vars */
import withRedux     from 'next-redux-wrapper';
import nextReduxSaga from 'next-redux-saga';

import { applyMiddleware, combineReducers, createStore } from 'redux';

import createSagaMiddleware       from 'redux-saga';
import { composeWithDevTools }    from 'redux-devtools-extension';
import logger                     from 'redux-logger';
import { reducer as formReducer } from 'redux-form';
import { all }                    from 'redux-saga/effects';

import {
  notificationsActionTypes,
  notificationsReducer,
  notificationsSagas,
} from './notifications.redux';

import { appActionTypes, appReducer, appSagas }                from './app.redux';
import { authActionTypes, authReducer, authSagas }             from './auth.redux';
import { routerActionTypes, routerReducer, routerSagas }       from './router.redux';
import { panesActionTypes, panesReducer, panesSagas }          from './panes.redux';
import { menuActionTypes, menuReducer, menuSagas }             from './menu.redux';
import { modelsActionTypes, modelsReducer, modelsSagas }       from './models.redux';
import { contentActionTypes, contentReducer, contentSagas }    from './content.redux';
import { securityActionTypes, securityReducer, securitySagas } from './security.redux';

const initialState = {};

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export const actionTypes = {
  auth         : authActionTypes,
  notifications: notificationsActionTypes,
  router       : routerActionTypes,
  panes        : panesActionTypes,
  menu         : menuActionTypes,
  models       : modelsActionTypes,
  content      : contentActionTypes,
  // mod_models   : modModelsActionTypes,
  security     : securityActionTypes,
  app          : appActionTypes,
};

// --------------------------------------------------------------
// Root reducers
// --------------------------------------------------------------

const rootReducers = combineReducers({
  auth         : authReducer,
  notifications: notificationsReducer,
  router       : routerReducer,
  panes        : panesReducer,
  menu         : menuReducer,
  models       : modelsReducer,
  content      : contentReducer,
  // mod_models   : modModelsReducer,
  security     : securityReducer,
  app          : appReducer,
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
    ...authSagas,
    ...notificationsSagas,
    ...routerSagas,
    ...panesSagas,
    ...menuSagas,
    ...modelsSagas,
    ...contentSagas,
    // ...modModelsSagas,
    ...securitySagas,
    ...appSagas,
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
