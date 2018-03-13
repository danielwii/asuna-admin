/* eslint-disable spaced-comment,no-unused-vars */
import withRedux       from 'next-redux-wrapper';
import nextReduxSaga   from 'next-redux-saga';
import * as R          from 'ramda';
import { reduxAction } from 'node-buffs/dist/index';

import { applyMiddleware, combineReducers, createStore } from 'redux';

import createSagaMiddleware from 'redux-saga';
import { all }              from 'redux-saga/effects';

import { composeWithDevTools }               from 'redux-devtools-extension';
import { createLogger as createReduxLogger } from 'redux-logger';
import { reducer as formReducer }            from 'redux-form';
import { autoRehydrate, persistStore }       from 'redux-persist';

import localForage from 'localforage';

import { notificationsReducer, notificationsSagas } from './notifications.redux';

import { appReducer, appSagas }                   from './app.redux';
import { authReducer, authSagas }                 from './auth.redux';
import { routerReducer, routerSagas }             from './router.redux';
import { menuReducer, menuSagas }                 from './menu.redux';
import { modelsReducer, modelsSagas }             from './models.redux';
import { contentReducer, contentSagas }           from './content.redux';
import { securityReducer, securitySagas }         from './security.redux';
import { panesCleaner, panesReducer, panesSagas } from './panes.redux';

import { createLogger } from '../adapters/logger';

// --------------------------------------------------------------
// Init
// --------------------------------------------------------------

const logger = createLogger('store');

const initialState = {};

const persistConfig = {
  key      : 'root',
  storage  : localForage,
  debug    : true,
  timeout  : 30000,
  blacklist: ['app'],
};

const loggerMiddleware = createReduxLogger({
  collapsed: true,
});

// TODO set in debug mode only
localForage.setItem('debug', '*');

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export const actionTypes = {
  CLEAN: 'sys::clean',
};

export const actions = {
  clean: () => reduxAction(actionTypes.CLEAN),
};

// --------------------------------------------------------------
// Root reducers
// --------------------------------------------------------------

const combinedReducers = combineReducers({
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

const crossSliceReducer = (state, action) => {
  if (action.type === actionTypes.CLEAN) {
    const cleanedState = R.compose(panesCleaner)(state);
    logger.log('[crossSliceReducer]', { state, action, cleanedState });
    return cleanedState;
  }
  return state;
};

const rootReducers = (state, action) => {
  const intermediateState = combinedReducers(state, action);
  return crossSliceReducer(intermediateState, action);
};

// const persistedReducer = persistReducer(persistConfig, rootReducers);

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
    composeWithDevTools(
      applyMiddleware(sagaMiddleware, loggerMiddleware),
      autoRehydrate(),
    ),
  );

  persistStore(store, persistConfig);

  store.sagaTask = sagaMiddleware.run(rootSaga);
  return store;
};

export function withReduxSaga(BaseComponent) {
  return withRedux(configureStore)(nextReduxSaga(BaseComponent));
}
