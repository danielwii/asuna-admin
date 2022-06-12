import { createLogger } from '../../logger';

import type { RootState } from '../types';
import type { DeepPartial } from 'redux';

const logger = createLogger('store:connector');

export interface IStoreConnector<T> {
  connect(state: DeepPartial<T>): void;

  getState<K extends keyof T>(name: K): T[K];

  select<S>(cb: (state: T) => S): S;
}

let stateRef: RootState = {} as any;

export const storeConnector: IStoreConnector<RootState> = {
  connect: (state: RootState) => (stateRef = state),
  getState: (name) => stateRef[name],
  select: (cb) => cb(stateRef),
};

export const createStoreConnectorMiddleware =
  (cb) =>
  ({ getState }) =>
  (next) =>
  (action) => {
    storeConnector.connect(getState());
    if (cb) cb(action);
    logger.log(action.type, { action, state: getState() });
    return next(action);
  };
