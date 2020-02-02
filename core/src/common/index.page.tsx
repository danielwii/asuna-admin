import { Config } from '@asuna-admin/config';
import { AppContext, IIndexRegister, ILoginRegister, INextConfig } from '@asuna-admin/core';
import { MainLayout } from '@asuna-admin/layout';
import { createLogger } from '@asuna-admin/logger';
import { appActions, AppState, AuthState, RootState } from '@asuna-admin/store';

import ApolloClient, { gql } from 'apollo-boost';
import { changeAntdTheme, getThemeColor } from 'dynamic-antd-theme';
import * as _ from 'lodash';
import 'moment/locale/zh-cn';
import fetch from 'node-fetch';
import * as R from 'ramda';
import * as React from 'react';
import { connect } from 'react-redux';

const logger = createLogger('pages:index');

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
}

export class IndexPage extends React.Component<IIndexPageProps> {
  constructor(props) {
    super(props);

    const { dispatch, register, site } = this.props;
    AppContext.setup({ register, module: 'index' });
    AppContext.regDispatch(dispatch);
    dispatch(appActions.init());

    if (site?.primaryColor) {
      const themeColor = getThemeColor(site?.primaryColor.hex);
      changeAntdTheme(themeColor);
    }
  }

  static async getInitialProps({ req }) {
    const userAgent = req ? req.headers['user-agent'] : navigator.userAgent;
    const appInfo = {
      userAgent,
      environments: { production: process.env.NODE_ENV === 'production' },
    };

    try {
      // const tempId = shortid.generate();
      // const userAgent = req ? req.headers['user-agent'] : navigator.userAgent;
      const host = Config.get('GRAPHQL_HOST') || 'localhost';
      const port = process.env.PORT || 3000;
      logger.log(`call http://${host}:${port}/s-graphql`);
      const client = new ApolloClient({
        uri: `http://${host}:${port}/s-graphql`,
        headers: { 'X-ApiKey': 'todo:app-key-001' }, // todo temp auth
        fetch: fetch as any,
      });
      const { data } = await client.query({
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
      });

      const site = _.get(data, 'site.value');
      // console.log({ appInfo, site });
      return { appInfo, site };
    } catch (e) {
      console.error(e);
    }
  }

  render() {
    const {
      auth,
      app: { loading, heartbeat },
      appInfo,
      hideCharacteristics,
    } = this.props;
    logger.debug('[render]', this.props);

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
  return connect(R.compose(R.merge(props), mapStateToProps))(IndexPage);
};
