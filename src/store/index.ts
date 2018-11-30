import withRedux, { NextReduxWrappedComponent } from 'next-redux-wrapper';
import nextReduxSaga from 'next-redux-saga';
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
  private static storeConnectorMiddleware;
  private static epicMiddleware;
  private static sagaMiddleware;
  private static loggerMiddleware;

  private initialState: DeepPartial<RootState>;
  private persistConfig = {
    key: 'root',
    storage: localForage,
    debug: true,
    timeout: 1000,
    blacklist: ['app'],
  };

  constructor(defaultInitialState?: RootState) {
    if (!AsunaStore.storeConnectorMiddleware) {
      AsunaStore.storeConnectorMiddleware = createStoreConnectorMiddleware(action =>
        AppContext.actionHandler(action),
      );
    }
    if (!AsunaStore.epicMiddleware) {
      AsunaStore.epicMiddleware = createEpicMiddleware();
    }
    if (!AsunaStore.sagaMiddleware) {
      AsunaStore.sagaMiddleware = createSagaMiddleware();
    }
    if (!AsunaStore.loggerMiddleware) {
      AsunaStore.loggerMiddleware = createReduxLogger({ collapsed: true });
    }
    if (this.initialState === null) {
      this.initialState = defaultInitialState || {};
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

  private rootReducers = (state, action) => {
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

    const intermediateState = combinedReducers(state, action);
    return crossSliceReducer(intermediateState, action);
  };

  private rootEpics = combineEpics(...appEpics);

  public configureStore = (state = this.initialState): Store => {
    let store;
    if (AppContext.isServer) {
      store = createStore<RootState, AnyAction, any, any>(
        this.rootReducers,
        state,
        applyMiddleware(
          AsunaStore.sagaMiddleware,
          AsunaStore.epicMiddleware,
          AsunaStore.storeConnectorMiddleware,
        ),
      );
    } else {
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
        this.rootReducers,
        state,
        composeWithDevTools(
          applyMiddleware(
            AsunaStore.sagaMiddleware,
            AsunaStore.epicMiddleware,
            AsunaStore.loggerMiddleware,
            AsunaStore.storeConnectorMiddleware,
          ),
          autoRehydrate(),
        ),
      );

      persistStore(store, this.persistConfig);
    }

    store.sagaTask = AsunaStore.sagaMiddleware.run(this.rootSagas);
    AsunaStore.epicMiddleware.run(this.rootEpics);

    return store;
  };

  public withReduxSaga = <T>(BaseComponent): NextReduxWrappedComponent => {
    return withRedux(this.configureStore)(nextReduxSaga(BaseComponent));
  };
}

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export { NextReduxWrappedComponent };

export const actionTypes = {
  CLEAN: 'sys::clean',
};

export const actions = {
  clean: () => reduxAction(actionTypes.CLEAN),
};
