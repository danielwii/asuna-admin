import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';

import useLogger from '@danielwii/asuna-helper/dist/logger/hooks';

import 'moment/locale/zh-cn';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import * as React from 'react';
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

const queryClient = new QueryClient();

export interface IIndexPageProps {
  register: ILoginRegister & IIndexRegister;
  hideCharacteristics?: boolean;
  appInfo: { userAgent: string; environments: object };
  site: { logo?: string; title?: string; primaryColor?: { hex: string } };
  error?: object;
}

const client = new ApolloClient({
  cache: new InMemoryCache(),
  uri: '/proxy/graphql',
  headers: { 'X-ApiKey': 'todo:app-key-001' }, // todo temp auth
  queryDeduplication: false,
  defaultOptions: { watchQuery: { fetchPolicy: 'network-only' } },
});

const theme = createTheme();

export const IndexPageView: React.FC<{ register: ILoginRegister & IIndexRegister; hideCharacteristics?: boolean }> = ({
  register,
  hideCharacteristics,
}) => {
  const state = useAsync(async () => {
    logger.info('setup app context ...');
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
    <ThemeProvider theme={theme}>
      <ApolloProvider client={client}>
        <QueryClientProvider client={queryClient}>
          <MainLayout
            // loading={loading}
            // heartbeat={heartbeat}
            // auth={auth}
            // appInfo={appInfo}
            hideCharacteristics={hideCharacteristics}
          />
        </QueryClientProvider>
      </ApolloProvider>
    </ThemeProvider>
  );
};
