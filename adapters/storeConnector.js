export const storeConnectorProxy = {
  connect : state => global.context.storeConnector.connect(state),
  getState: name => global.context.storeConnector.getState(name),
};

export const createStoreConnectorMiddleware = () =>
  ({ getState }) => next => (action) => {
    storeConnectorProxy.connect(getState());
    return next(action);
  };

export class StoreConnectorAdapter {
  connect = (state) => {
    this.state = state;
  };

  getState = name => this.state[name];
}
