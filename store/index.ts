import withRedux, { NextReduxWrappedComponent } from 'next-redux-wrapper';
import nextReduxSaga from 'next-redux-saga';
import getConfig from 'next/config';
import * as R from 'ramda';
import { reduxAction } from 'node-buffs';

import { applyMiddleware, combineReducers, createStore } from 'redux';

import createSagaMiddleware from 'redux-saga';
import { all } from 'redux-saga/effects';

import { composeWithDevTools } from 'redux-devtools-extension';
import { createLogger as createReduxLogger } from 'redux-logger';
import { autoRehydrate, persistStore } from 'redux-persist';
import { combineEpics, createEpicMiddleware } from 'redux-observable';

import localForage from 'localforage';

import { appEpics, appReducer, appSagas, AppState } from './app.redux';
import { authReducer, authSagas, AuthState } from './auth.redux';
import { routerReducer, routerSagas } from './router.redux';
import { menuReducer, menuSagas } from './menu.redux';
import { modelsCleaner, modelsReducer, modelsSagas } from './model.redux';
import { contentReducer, contentSagas } from './content.redux';
import { securityReducer, securitySagas } from './security.redux';
import { panesCleaner, panesReducer, panesSagas } from './panes.redux';

import { createStoreConnectorMiddleware, storeConnector } from './middlewares';

import { createLogger } from '@asuna-admin/helpers';
import { appContext } from '@asuna-admin/core';

export { storeConnector };

export * from './panes.redux';
export * from './panes.actions';
export * from './app.redux';
export * from './app.actions';
export * from './auth.redux';
export * from './auth.actions';
export * from './model.redux';
export * from './content.redux';
export * from './middlewares';

const { serverRuntimeConfig = {} } = getConfig() || {};

// --------------------------------------------------------------
// Init
// --------------------------------------------------------------

const logger = createLogger('store');

const initialState = {};

const persistConfig = {
  key: 'root',
  storage: localForage,
  debug: true,
  timeout: 30000,
  blacklist: ['app'],
};

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

export interface RootState {
  auth: AuthState;
  router: object;
  panes: object;
  menu: object;
  models: object;
  content: object;
  security: object;
  app: AppState;
  global: object;
}

const reducers: { [key in keyof RootState]: any } = {
  auth: authReducer,
  router: routerReducer,
  panes: panesReducer,
  menu: menuReducer,
  models: modelsReducer,
  content: contentReducer,
  // mod_models   : modModelsReducer,
  security: securityReducer,
  app: appReducer,
  // form         : formReducer,
  global: (previousState = initialState, action) => ({ ...previousState, ...action }),
};

const combinedReducers = combineReducers(reducers);

const crossSliceReducer = (state, action) => {
  if (action.type === actionTypes.CLEAN) {
    const cleanedState = R.compose(
      modelsCleaner,
      panesCleaner,
    )(state);
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
// Root epics
// --------------------------------------------------------------

export const rootEpic = combineEpics(...appEpics);

// --------------------------------------------------------------
// Setup store with redux-saga
// --------------------------------------------------------------

const storeConnectorMiddleware = createStoreConnectorMiddleware(action =>
  appContext.actionHandler(action),
);
const epicMiddleware = createEpicMiddleware();
const sagaMiddleware = createSagaMiddleware();
const loggerMiddleware = createReduxLogger({ collapsed: true });

export const configureStore = (state = initialState) => {
  let store;
  if (serverRuntimeConfig.isServer) {
    store = createStore(
      rootReducers,
      state,
      applyMiddleware(sagaMiddleware, epicMiddleware, storeConnectorMiddleware),
    );
  } else {
    // 在开发模式时开启日志
    if (process.env.NODE_ENV === 'development') {
      localStorage.setItem('debug', '*,-socket.io*,-engine.io*');
    } else {
      localStorage.removeItem('debug');
    }
    store = createStore(
      rootReducers,
      state,
      composeWithDevTools(
        applyMiddleware(sagaMiddleware, epicMiddleware, loggerMiddleware, storeConnectorMiddleware),
        autoRehydrate(),
      ),
    );

    persistStore(store, persistConfig);
  }

  store.sagaTask = sagaMiddleware.run(rootSaga);
  epicMiddleware.run(rootEpic);

  return store;
};

export function withReduxSaga(BaseComponent): NextReduxWrappedComponent<any> {
  return withRedux(configureStore)(nextReduxSaga(BaseComponent));
}
