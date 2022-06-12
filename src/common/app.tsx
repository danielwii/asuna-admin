import withRedux from 'next-redux-wrapper';
import App from 'next/app';
import getConfig from 'next/config';
import Head from 'next/head';
import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { END } from 'redux-saga';

import { AsunaStore } from '../store';

const asunaStore = AsunaStore.instance;

function withReduxSaga(config) {
  return (BaseComponent) => {
    const componentName = BaseComponent.displayName || BaseComponent.name || 'BaseComponent';
    class WrappedComponent extends Component {
      static displayName = `withReduxSaga(${componentName})`;

      static async getInitialProps(props) {
        const { isServer, store } = props.ctx;

        let pageProps = {};
        if (BaseComponent.getInitialProps) {
          pageProps = await BaseComponent.getInitialProps(props);
        }

        // Keep saga running on the client (async mode)
        if (config.async && !isServer) {
          return pageProps;
        }

        // Force saga to end in all other cases
        store.dispatch(END);
        await store.sagaTask.done;

        // Restart saga on the client (sync mode)
        if (!isServer) {
          store.runSagaTask();
        }

        return pageProps;
      }

      render() {
        return <BaseComponent {...this.props} />;
      }
    }

    return WrappedComponent;
  };
}

export const ReduxApp = withRedux(asunaStore.configureStore, { debug: false })(
  withReduxSaga({ async: true })(
    class extends App {
      props: any;

      render() {
        const { Component, pageProps, store } = this.props;
        console.log('config is', getConfig());

        return (
          <>
            <Head>
              <link
                href="data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQEAYAAABPYyMiAAAABmJLR0T///////8JWPfcAAAACXBIWXMAAABIAAAASABGyWs+AAAAF0lEQVRIx2NgGAWjYBSMglEwCkbBSAcACBAAAeaR9cIAAAAASUVORK5CYII="
                rel="icon"
                type="image/x-icon"
              />
            </Head>
            <Provider store={store}>
              <PersistGate loading={null} persistor={store.__persistor}>
                <Component {...pageProps} />
              </PersistGate>
            </Provider>
          </>
        );
      }
    },
  ),
) as any;
