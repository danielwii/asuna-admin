import App, { Container } from 'next/app';
import nextReduxSaga from 'next-redux-saga';
import { Provider } from 'react-redux';
import { Layout } from 'antd';
import withRedux from 'next-redux-wrapper';
import { AsunaStore } from '@asuna-admin/store';

const asunaStore = AsunaStore.instance;

export const ReduxApp = withRedux(asunaStore.configureStore as any, { debug: false })(
  nextReduxSaga(
    class extends App {
      props: any;

      static async getInitialProps({ Component, ctx }) {
        // Keep in mind that this will be called twice on server, one for page and second for error page
        await new Promise(res => {
          setTimeout(() => {
            ctx.store.dispatch({ type: 'TOE', payload: { message: 'was set in _app' } });
            res();
          }, 200);
        });

        return {
          pageProps: {
            // Call page-level getInitialProps
            ...(Component.getInitialProps ? await Component.getInitialProps(ctx) : {}),
            // Some custom thing for all pages
            pathname: ctx.pathname,
          },
        };
      }

      render() {
        const { Component, pageProps, store } = this.props;
        return (
          <Container>
            <Provider store={store}>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </Provider>
          </Container>
        );
      }
    },
  ),
);
