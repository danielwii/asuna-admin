import { createLogger } from '@asuna-admin/logger';

const logger = createLogger('store:connector', 'warn');

export interface IStoreConnector<T> {
  connect(state: T): void;

  getState<K extends keyof T>(name: K): T[K];

  select<S>(cb: (state: T) => S): S;
}

export const storeConnector: IStoreConnector<any> = {
  connect: state => {
    this.state = state;
  },
  getState: name => this.state[name],
  select: cb => cb(this.state),
};

export const createStoreConnectorMiddleware = cb => ({ getState }) => next => action => {
  storeConnector.connect(getState());
  if (cb) cb(action);
  logger.log(action.type, { action, state: getState() });
  return next(action);
};
