import localForage from 'localforage';
import * as R from 'ramda';
import { AnyAction, applyMiddleware, combineReducers, createStore, DeepPartial, Store } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { createLogger as createReduxLogger } from 'redux-logger';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { persistReducer, persistStore } from 'redux-persist';
import createSagaMiddleware from 'redux-saga';
import { all } from 'redux-saga/effects';

import { AppContext } from '../core/context';
import { createLogger } from '../logger';
import { actionTypes } from './actions';
import { appEpics, appReducer, appSagas } from './app.redux';
import { authReducer, authSagas } from './auth.redux';
import { menuReducer, menuSagas } from './menu.redux';
import { createStoreConnectorMiddleware } from './middlewares/store-connector';
import { modelsCleaner, modelsReducer, modelsSagas } from './models.redux';
import { securityReducer, securitySagas } from './security.redux';

import type { MakeStore } from 'next-redux-wrapper';
import type { RootState } from './types';

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

  private rootEpics = combineEpics(...appEpics);
  private persistConfig = {
    key: 'root',
    storage: localForage,
    debug: true,
    timeout: 1000,
    blacklist: ['app', 'router' /* , 'auth' */],
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
    yield all([...authSagas, ...menuSagas, ...modelsSagas, ...securitySagas, ...appSagas]);
  }

  private rootReducers = (preloadedState, action) => {
    const reducers: { [key in keyof RootState]: any } = {
      auth: authReducer,
      menu: menuReducer,
      models: modelsReducer,
      security: securityReducer,
      app: appReducer,
      global: (previousState = this.initialState, action) => ({ ...previousState, ...action }),
    };

    const combinedReducers = combineReducers(reducers);

    const crossSliceReducer = (preloadedState, action) => {
      if (action.type === actionTypes.CLEAN) {
        const cleanedState = R.compose(modelsCleaner /* , panesCleaner */)(preloadedState);
        logger.log('[crossSliceReducer]', { preloadedState, action, cleanedState });
        return cleanedState;
      }
      return preloadedState;
    };

    const intermediateState = combinedReducers(preloadedState, action);
    return crossSliceReducer(intermediateState, action);
  };

  // public configureStore: MakeStore = (preloadedState = this.initialState, opts: MakeStoreOptions): Store => {
  //   logger.log('configureStore', opts);
  //   // AppContext.isServer = (opts as any).isServer ?? typeof window === 'undefined';
  //   let store;
  //   if (typeof window === 'undefined') {
  //     store = createStore<RootState, AnyAction, any, any>(
  //       this.rootReducers,
  //       preloadedState,
  //       applyMiddleware(this.sagaMiddleware, /* this.epicMiddleware, */ this.storeConnectorMiddleware),
  //     );
  //   } else {
  //     // enable persistence in client side
  //     const persistedReducer = persistReducer(this.persistConfig, this.rootReducers);
  //
  //     // 在开发模式时开启日志
  //     if (process.env.NODE_ENV === 'development') {
  //       if (typeof localStorage !== 'undefined') {
  //         localStorage.setItem('debug', '*,-socket.io*,-engine.io*');
  //       }
  //     } else {
  //       if (typeof localStorage !== 'undefined') {
  //         localStorage.removeItem('debug');
  //       }
  //     }
  //     store = createStore<RootState, AnyAction, any, any>(
  //       persistedReducer,
  //       preloadedState,
  //       composeWithDevTools({ trace: true, traceLimit: 25 })(
  //         applyMiddleware(
  //           this.sagaMiddleware,
  //           this.epicMiddleware,
  //           this.loggerMiddleware,
  //           this.storeConnectorMiddleware,
  //         ),
  //       ),
  //     );
  //
  //     store.__persistor = persistStore(store);
  //
  //     this.epicMiddleware.run(this.rootEpics);
  //   }
  //
  //   /**
  //    * next-redux-saga depends on `runSagaTask` and `sagaTask` being attached to the store.
  //    *
  //    *   `runSagaTask` is used to rerun the rootSaga on the client when in sync mode (default)
  //    *   `sagaTask` is used to await the rootSaga task before sending results to the client
  //    *
  //    */
  //   store.runSagaTask = () => {
  //     store.sagaTask = this.sagaMiddleware.run(this.rootSagas);
  //   };
  //
  //   // run the rootSaga initially
  //   store.runSagaTask();
  //
  //   return store;
  // };
}

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------
