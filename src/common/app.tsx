import App, { Container } from 'next/app';
import { Provider } from 'react-redux';
import withRedux from 'next-redux-wrapper';
import withReduxSaga from 'next-redux-saga';
import { AsunaStore } from '@asuna-admin/store';
import { PersistGate } from 'redux-persist/integration/react';

const asunaStore = AsunaStore.instance;

export const ReduxApp = withRedux(asunaStore.configureStore as any, { debug: false })(
  withReduxSaga({ async: true })(
    class extends App {
      props: any;

      render() {
        const { Component, pageProps, store } = this.props;

        return (
          <Container>
            <Provider store={store}>
              <PersistGate loading={null} persistor={store.__persistor}>
                <Component {...pageProps} />
              </PersistGate>
            </Provider>
          </Container>
        );
      }
    },
  ),
);
