import { ApolloClient, ApolloProvider, gql, InMemoryCache } from '@apollo/client';

import { changeAntdTheme } from 'dynamic-antd-theme';
import _ from 'lodash';
import 'moment/locale/zh-cn';
import * as R from 'ramda';
import * as React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { connect } from 'react-redux';

import { LivingLoading } from '../components/base/living-loading';
import { AppContext, IIndexRegister, ILoginRegister, INextConfig } from '../core/context';
import { Dispatcher } from '../core/dispatcher';
import { MainLayout } from '../layout';
import { createLogger } from '../logger';
import { appActions } from '../store/app.actions';

import type { RootState } from '../store/types';
import type { AppState } from '../store/app.redux';
import type { AuthState } from '../store/auth.redux';

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

/*
const IndexPage2: NextComponentType<NextPageContext, Promise<IIndexPageProps>, IIndexPageProps> = (props) => {
  const { dispatch, register, site } = props;
  AppContext.setup({ register, module: 'index' }).then(() => dispatch(appActions.init()));
  AppContext.regDispatch(dispatch);

  if (site?.primaryColor) {
    const themeColor = generateThemeColor(site?.primaryColor.hex);
    changeAntdTheme(themeColor);
  }

  const {
    auth,
    app: { loading, heartbeat },
    appInfo,
    hideCharacteristics,
    error,
  } = props;
  logger.debug('[render]', props);

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
};
*/

const uri = `${process.env.API_ENDPOINT ?? ''}/graphql`;
const client = new ApolloClient({
  cache: new InMemoryCache(),
  uri,
  headers: { 'X-ApiKey': 'todo:app-key-001' }, // todo temp auth
  queryDeduplication: false,
  defaultOptions: { watchQuery: { fetchPolicy: 'network-only' } },
});

export class IndexPage extends React.Component<IIndexPageProps> {
  constructor(props) {
    super(props);

    const { dispatch, register, site } = this.props;
    AppContext.setup({ register, module: 'index' }).then(() => dispatch(appActions.init()));
    Dispatcher.regDispatch(dispatch);

    if (site?.primaryColor) {
      changeAntdTheme(site?.primaryColor);
    }
  }

  componentDidMount() {
    (this.state as any).renderClientSideComponent = true;
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
      <ApolloProvider client={client}>
        <QueryClientProvider client={new QueryClient()}>
          <MainLayout
            loading={loading}
            heartbeat={heartbeat}
            auth={auth}
            appInfo={appInfo}
            hideCharacteristics={hideCharacteristics}
          />
        </QueryClientProvider>
      </ApolloProvider>
    );
  }
}

const mapStateToProps = (state: RootState): { auth: AuthState; app: AppState } => ({
  auth: state.auth,
  app: state.app,
});

const BrowserComponent: React.FC = ({ children }) => {
  if (typeof window === 'undefined') {
    return <div />;
  }
  return children as any;
};

export const renderIndexPage = (props: Partial<IIndexPageProps>, nextConfig: INextConfig) => {
  AppContext.init(nextConfig);
  return <BrowserComponent>{connect(R.compose(R.merge(props), mapStateToProps))(IndexPage)}</BrowserComponent>;
  // return connect(R.compose(R.merge(props), mapStateToProps))(IndexPage) as any;
};
