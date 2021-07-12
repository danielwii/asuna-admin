import localForage from 'localforage';
import { reduxAction } from 'node-buffs';
import * as R from 'ramda';
import { AnyAction, applyMiddleware, combineReducers, createStore, DeepPartial, Store } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { createLogger as createReduxLogger } from 'redux-logger';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { persistReducer, persistStore } from 'redux-persist';
import createSagaMiddleware from 'redux-saga';
import { all } from 'redux-saga/effects';

import { AppContext } from '../core';
import { createLogger } from '../logger';
import { appEpics, appReducer, appSagas, AppState } from './app.redux';
import { authReducer, authSagas, AuthState } from './auth.redux';
import { menuReducer, menuSagas, MenuState } from './menu.redux';
import { createStoreConnectorMiddleware, storeConnector } from './middlewares';
import { modelsCleaner, modelsReducer, modelsSagas, ModelsState } from './models.redux';
import { routerReducer, routerSagas, RouterState } from './router.redux';
import { securityReducer, securitySagas, SecurityState } from './security.redux';

import type { MakeStore, MakeStoreOptions } from 'next-redux-wrapper';

export { storeConnector };

export * from './panes.global';
export * from './app.redux';
export * from './app.actions';
export * from './auth.redux';
export * from './auth.actions';
export * from './models.redux';
export * from './router.redux';
// export * from './content.redux';
export * from './middlewares';

interface GlobalState {
  type: string;
  payload: object;
  key: string;
}

export interface RootState {
  auth: AuthState;
  router: RouterState;
  menu: MenuState;
  models: ModelsState;
  // content: ContentState;
  security: SecurityState;
  app: AppState;
  global: GlobalState;
}

const logger = createLogger('store');

export class AsunaStore {
  private static INSTANCE = new AsunaStore();

  public static get instance() {
    return AsunaStore.INSTANCE;
  }

  private readonly storeConnectorMiddleware;
  private readonly epicMiddleware;
  private readonly sagaMiddleware;
  private readonly loggerMiddleware;

  private readonly initialState: DeepPartial<RootState>;
  private persistConfig = {
    key: 'root',
    storage: localForage,
    debug: true,
    timeout: 1000,
    blacklist: ['app', 'router' /*, 'auth'*/],
  };

  private constructor() {
    if (!this.storeConnectorMiddleware) {
      this.storeConnectorMiddleware = createStoreConnectorMiddleware((action) => AppContext.actionHandler(action));
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
      ...menuSagas,
      ...modelsSagas,
      // ...contentSagas,
      // ...modModelsSagas,
      ...securitySagas,
      ...appSagas,
    ]);
  }

  private rootReducers = (preloadedState, action) => {
    const reducers: { [key in keyof RootState]: any } = {
      auth: authReducer,
      router: routerReducer,
      menu: menuReducer,
      models: modelsReducer,
      // content: contentReducer,
      // mod_models   : modModelsReducer,
      security: securityReducer,
      app: appReducer,
      // form         : formReducer,
      global: (previousState = this.initialState, action) => ({ ...previousState, ...action }),
    };

    const combinedReducers = combineReducers(reducers);

    const crossSliceReducer = (preloadedState, action) => {
      if (action.type === actionTypes.CLEAN) {
        const cleanedState = R.compose(modelsCleaner/*, panesCleaner*/)(preloadedState);
        logger.log('[crossSliceReducer]', { preloadedState, action, cleanedState });
        return cleanedState;
      }
      return preloadedState;
    };

    const intermediateState = combinedReducers(preloadedState, action);
    return crossSliceReducer(intermediateState, action);
  };

  private rootEpics = combineEpics(...appEpics);

  public configureStore: MakeStore = (preloadedState = this.initialState, opts: MakeStoreOptions): Store => {
    logger.log('configureStore', opts);
    AppContext.isServer = (opts as any).isServer ?? typeof window === "undefined";
    let store;
    if (AppContext.isServer) {
      store = createStore<RootState, AnyAction, any, any>(
        this.rootReducers,
        preloadedState,
        applyMiddleware(this.sagaMiddleware, /*this.epicMiddleware, */ this.storeConnectorMiddleware),
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
        composeWithDevTools({ trace: true, traceLimit: 25 })(
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
