import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';

import useLogger from '@danielwii/asuna-helper/dist/logger/hooks';

import 'moment/locale/zh-cn';

import getConfig from 'next/config';
import * as React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import useAsync from 'react-use/lib/useAsync';

import { Func } from '../adapters/func';
import { LivingLoading } from '../components/base/living-loading';
import { AppContext, IIndexRegister, ILoginRegister } from '../core/context';
import { MainLayout } from '../layout';
import { createLogger } from '../logger';

const logger = createLogger('pages:index');

// --------------------------------------------------------------
// Index Component
// --------------------------------------------------------------

export interface IIndexPageProps {
  register: ILoginRegister & IIndexRegister;
  hideCharacteristics?: boolean;
  appInfo: { userAgent: string; environments: object };
  site: { logo?: string; title?: string; primaryColor?: { hex: string } };
  error?: object;
}

const uri = `${process.env.API_ENDPOINT ?? ''}/graphql`;
const client = new ApolloClient({
  cache: new InMemoryCache(),
  uri,
  headers: { 'X-ApiKey': 'todo:app-key-001' }, // todo temp auth
  queryDeduplication: false,
  defaultOptions: { watchQuery: { fetchPolicy: 'network-only' } },
});

export const IndexPageView: React.FC<{ register: ILoginRegister & IIndexRegister; hideCharacteristics?: boolean }> = ({
  register,
  hideCharacteristics,
}) => {
  const state = useAsync(async () => {
    logger.info('setup app context ...', getConfig());
    try {
      await AppContext.setup({ register, module: 'index' }, Func);
    } catch (e) {
      logger.error('setup context error', e);
    }
  }, [true]);

  useLogger('<[IndexPageView]>', state);

  if (state.loading) {
    return <LivingLoading heartbeat={true} />;
  }

  return (
    <ApolloProvider client={client}>
      <QueryClientProvider client={new QueryClient()}>
        <MainLayout
          // loading={loading}
          // heartbeat={heartbeat}
          // auth={auth}
          // appInfo={appInfo}
          hideCharacteristics={hideCharacteristics}
        />
      </QueryClientProvider>
    </ApolloProvider>
  );
};
