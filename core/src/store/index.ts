import * as R from 'ramda';
import { reduxAction } from 'node-buffs';

import {
  AnyAction,
  applyMiddleware,
  combineReducers,
  createStore,
  DeepPartial,
  Store,
} from 'redux';

import { persistReducer, persistStore } from 'redux-persist';
import createSagaMiddleware from 'redux-saga';
import { MakeStoreOptions } from 'next-redux-wrapper';
import { all } from 'redux-saga/effects';

import { composeWithDevTools } from 'redux-devtools-extension';
import { createLogger as createReduxLogger } from 'redux-logger';
import { combineEpics, createEpicMiddleware } from 'redux-observable';

import localForage from 'localforage';

import { appEpics, appReducer, appSagas, AppState } from './app.redux';
import { authReducer, authSagas, AuthState } from './auth.redux';
import { routerReducer, routerSagas } from './router.redux';
import { menuReducer, menuSagas } from './menu.redux';
import { modelsCleaner, modelsReducer, modelsSagas, ModelsState } from './models.redux';
import { contentReducer, contentSagas } from './content.redux';
import { securityReducer, securitySagas } from './security.redux';
import { panesCleaner, panesReducer, panesSagas } from './panes.redux';
import { createStoreConnectorMiddleware, storeConnector } from './middlewares';

import { AppContext } from '@asuna-admin/core';
import { createLogger } from '@asuna-admin/logger';

export { storeConnector };

export * from './panes.redux';
export * from './panes.actions';
export * from './app.redux';
export * from './app.actions';
export * from './auth.redux';
export * from './auth.actions';
export * from './models.redux';
export * from './content.redux';
export * from './middlewares';

export interface RootState {
  auth: AuthState;
  router: object;
  panes: object;
  menu: object;
  models: ModelsState;
  content: object;
  security: object;
  app: AppState;
  global: object;
}

const logger = createLogger('store');

export class AsunaStore {
  private static INSTANCE = new AsunaStore();

  public static get instance() {
    return AsunaStore.INSTANCE;
  }

  private storeConnectorMiddleware;
  private epicMiddleware;
  private sagaMiddleware;
  private loggerMiddleware;

  private initialState: DeepPartial<RootState>;
  private persistConfig = {
    key: 'root',
    storage: localForage,
    debug: true,
    timeout: 10000,
    blacklist: ['app', 'router', 'auth'],
  };

  private constructor() {
    if (!this.storeConnectorMiddleware) {
      this.storeConnectorMiddleware = createStoreConnectorMiddleware(action =>
        AppContext.actionHandler(action),
      );
    }
    if (!this.epicMiddleware) {
      this.epicMiddleware = createEpicMiddleware();
    }
    if (!this.sagaMiddleware) {
      this.sagaMiddleware = createSagaMiddleware();
    }
    if (!this.loggerMiddleware) {
      this.loggerMiddleware = createReduxLogger({ collapsed: true });
    }
    if (this.initialState === null) {
      this.initialState = {};
    }
  }

  private *rootSagas() {
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

  private rootReducers = (preloadedState, action) => {
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
      global: (previousState = this.initialState, action) => ({ ...previousState, ...action }),
    };

    const combinedReducers = combineReducers(reducers);

    const crossSliceReducer = (preloadedState, action) => {
      if (action.type === actionTypes.CLEAN) {
        const cleanedState = R.compose(
          modelsCleaner,
          panesCleaner,
        )(preloadedState);
        logger.log('[crossSliceReducer]', { preloadedState, action, cleanedState });
        return cleanedState;
      }
      return preloadedState;
    };

    const intermediateState = combinedReducers(preloadedState, action);
    return crossSliceReducer(intermediateState, action);
  };

  private rootEpics = combineEpics(...appEpics);

  public configureStore = (preloadedState = this.initialState, opts: MakeStoreOptions): Store => {
    logger.log('configureStore', opts);
    AppContext.isServer = opts.isServer;
    let store;
    if (opts.isServer) {
      store = createStore<RootState, AnyAction, any, any>(
        this.rootReducers,
        preloadedState,
        applyMiddleware(
          this.sagaMiddleware,
          /*this.epicMiddleware, */ this.storeConnectorMiddleware,
        ),
      );
    } else {
      // enable persistence in client side
      const persistedReducer = persistReducer(this.persistConfig, this.rootReducers);

      // 在开发模式时开启日志
      if (process.env.NODE_ENV === 'development') {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('debug', '*,-socket.io*,-engine.io*');
        }
      } else {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('debug');
        }
      }
      store = createStore<RootState, AnyAction, any, any>(
        persistedReducer,
        preloadedState,
        composeWithDevTools(
          applyMiddleware(
            this.sagaMiddleware,
            this.epicMiddleware,
            this.loggerMiddleware,
            this.storeConnectorMiddleware,
          ),
        ),
      );

      store.__persistor = persistStore(store);

      this.epicMiddleware.run(this.rootEpics);
    }

    /**
     * next-redux-saga depends on `runSagaTask` and `sagaTask` being attached to the store.
     *
     *   `runSagaTask` is used to rerun the rootSaga on the client when in sync mode (default)
     *   `sagaTask` is used to await the rootSaga task before sending results to the client
     *
     */
    store.runSagaTask = () => {
      store.sagaTask = this.sagaMiddleware.run(this.rootSagas);
    };

    // run the rootSaga initially
    store.runSagaTask();

    return store;
  };
}

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export const actionTypes = {
  CLEAN: 'sys::clean',
};

export const actions = {
  clean: () => reduxAction(actionTypes.CLEAN),
};
