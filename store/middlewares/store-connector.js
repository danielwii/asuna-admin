export const storeConnector = {
  connect : (state) => { this.state = state; },
  getState: name => this.state[name],
};

export const createStoreConnectorMiddleware = () =>
  ({ getState }) => next => (action) => {
    storeConnector.connect(getState());
    return next(action);
  };
