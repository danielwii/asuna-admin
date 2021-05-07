import { LivingLoading } from '@danielwii/asuna-components/dist/living-loading';

import ApolloClient, { gql } from 'apollo-boost';
import { changeAntdTheme } from 'dynamic-antd-theme';
import _ from 'lodash';
import 'moment/locale/zh-cn';
import fetch from 'node-fetch';
import * as R from 'ramda';
import * as React from 'react';
import { connect } from 'react-redux';

import { AppContext, IIndexRegister, ILoginRegister, INextConfig } from '../core';
import { MainLayout } from '../layout';
import { createLogger } from '../logger';
import { appActions, AppState, AuthState, RootState } from '../store';

const logger = createLogger('pages:index', 'debug');

// --------------------------------------------------------------
// Index Component
// --------------------------------------------------------------

export interface IIndexPageProps extends ReduxProps {
  auth: AuthState;
  app: AppState;
  register: ILoginRegister & IIndexRegister;
  hideCharacteristics?: boolean;
  appInfo: { userAgent: string; environments: object };
  site: { logo?: string; title?: string; primaryColor?: { hex: string } };
  error?: object;
}

export class IndexPage extends React.Component<IIndexPageProps> {
  constructor(props) {
    super(props);

    const { dispatch, register, site } = this.props;
    AppContext.setup({ register, module: 'index' }).then(() => dispatch(appActions.init()));
    AppContext.regDispatch(dispatch);

    if (site?.primaryColor) {
      changeAntdTheme(site?.primaryColor);
    }
  }

  static async getInitialProps({ req }) {
    const userAgent = req ? req.headers['user-agent'] : navigator.userAgent;
    const appInfo = {
      userAgent,
      environments: { production: process.env.NODE_ENV === 'production' },
    };

    // const tempId = shortid.generate();
    // const userAgent = req ? req.headers['user-agent'] : navigator.userAgent;
    // const host = Config.get('GRAPHQL_HOST') || 'localhost';
    // const port = process.env.PORT || 3000;
    // logger.log(`call http://${host}:${port}/s-graphql`);

    const uri = `${process.env.API_ENDPOINT ?? ''}/graphql`;
    logger.log(`call ${uri}`);
    const client = new ApolloClient({
      // uri: `http://${host}:${port}/s-graphql`,
      uri,
      headers: { 'X-ApiKey': 'todo:app-key-001' }, // todo temp auth
      fetch: fetch as any,
    });
    const { data } = await client
      .query({
        query: gql`
          {
            site: kv(collection: "app.settings", key: "site") {
              key
              name
              type
              value
            }
          }
        `,
      })
      .catch((reason) => {
        logger.error('error occurred', reason);
        return { data: { error: reason } };
      });

    const site = _.get(data, 'site.value');
    return { appInfo, site, error: data.error };
  }

  render() {
    const {
      auth,
      app: { loading, heartbeat },
      appInfo,
      hideCharacteristics,
      error,
    } = this.props;
    logger.debug('[render]', this.props);

    if (error) {
      return <LivingLoading heartbeat />;
    }

    return (
      <MainLayout
        loading={loading}
        heartbeat={heartbeat}
        auth={auth}
        appInfo={appInfo}
        hideCharacteristics={hideCharacteristics}
      />
    );
  }
}

const mapStateToProps = (state: RootState): { auth: AuthState; app: AppState } => ({
  auth: state.auth,
  app: state.app,
});

export const renderIndexPage = (props: Partial<IIndexPageProps>, nextConfig: INextConfig) => {
  AppContext.init(nextConfig);
  return connect(R.compose(R.merge(props), mapStateToProps))(IndexPage) as any;
};
