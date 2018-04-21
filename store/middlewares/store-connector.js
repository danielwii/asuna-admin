import { createLogger, lv } from '../../helpers';

const logger = createLogger('store:app', lv.warn);

export const storeConnector = {
  connect : (state) => {
    this.state = state;
  },
  getState: name => this.state[name],
  select  : cb => cb(this.state),
};

export const createStoreConnectorMiddleware = cb =>
  ({ getState }) => next => (action) => {
    storeConnector.connect(getState());
    if (cb) cb(action);
    logger.log(action.type, { action, state: getState() });
    return next(action);
  };
