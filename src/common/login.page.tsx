import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import useLogger from '@asuna-stack/asuna-sdk/dist/next/hooks/logger';
import styled from '@emotion/styled';

import { changeAntdTheme } from 'dynamic-antd-theme';
import * as _ from 'lodash';
import { nanoid } from 'nanoid';
import * as React from 'react';
import useAsync from 'react-use/lib/useAsync';
import useMount from 'react-use/lib/useMount';

import { Func } from '../adapters/func';
import { LivingLoading } from '../components/base/living-loading';
import { Snow } from '../components/base/weather/weather';
import { LoginContainer } from '../containers/Login';
import { AppContext, IIndexRegister, ILoginRegister, INextConfig } from '../core/context';
import { WithStyles } from '../layout';
import { createLogger } from '../logger';

import type { NextPageContext } from 'next';

const logger = createLogger('common:login');

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const StyledFullFlexContainerSC = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const StyledLogoWrapper = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
`;

export type LoginInitialProps = Partial<{
  weChatLoginEnable: boolean;
  tempId: string;
  userAgent: string;
  site: { logo?: string; title?: string; primaryColor?: { hex: string } };
}>;

export type ILoginPageProps = {
  // app: AppState;
  register: ILoginRegister & IIndexRegister;
  hideCharacteristics?: boolean;
  customLogin?: (site, enableWeChat) => React.ReactElement;
} & LoginInitialProps;

export const LoginPageView: React.FC<ILoginPageProps> = (props) => {
  const { register, site } = props;
  const state = useAsync(async () => {
    await AppContext.setup(register, Func);
  });

  useMount(() => {
    if (site?.primaryColor) {
      changeAntdTheme(site?.primaryColor);
    }
  });

  useLogger('<[LoginPageView]>', props, state);

  const { hideCharacteristics, weChatLoginEnable, customLogin } = props;

  if (state.loading) {
    return <LivingLoading heartbeat={true} />;
  }

  return (
    <WithStyles hideCharacteristics>
      <StyledFullFlexContainerSC>
        {!hideCharacteristics && (
          <React.Fragment>
            <Snow color={site?.primaryColor?.hex} />
            {/*
              <Sun />
              <StyledLogoWrapper>
                <LogoCanvas />
              </StyledLogoWrapper>
*/}
          </React.Fragment>
        )}
        {customLogin ? customLogin(site, weChatLoginEnable) : <LoginContainer {...props} />}
      </StyledFullFlexContainerSC>
    </WithStyles>
  );
};

export const wechatLoginGetInitial = async (ctx: NextPageContext): Promise<LoginInitialProps> => {
  if ((process as any).browser) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line no-undef
    return __NEXT_DATA__.props.pageProps;
  }

  try {
    const tempId = nanoid();
    const userAgent = ctx.req ? ctx.req.headers['user-agent'] : navigator.userAgent;
    // const host = Config.get('GRAPHQL_HOST') || 'localhost';
    // const port = process.env.PORT || 3000;
    // logger.log(`call http://${host}:${port}/s-graphql`);

    const uri = `${process.env.API_ENDPOINT ?? ''}/graphql`;
    logger.log(`call ${uri}`);
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      // uri: `http://${host}:${port}/s-graphql`,
      uri,
      headers: { 'X-ApiKey': 'todo:app-key-001' }, // todo temp auth
    });
    const { data } = await client.query({
      query: gql`
        {
          wechat: kv(collection: "system.wechat", key: "config") {
            key
            name
            type
            value
          }
          site: kv(collection: "app.settings", key: "site") {
            key
            name
            type
            value
          }
        }
      `,
    });

    const weChatLoginEnable = _.get(data, 'wechat.value.values.wechat.login');
    const site = _.get(data, 'site.value');
    logger.log({ userAgent, weChatLoginEnable, tempId, site });
    return { userAgent, weChatLoginEnable, tempId, site };
  } catch (reason) {
    logger.error('error occurred', reason);
    return {};
  }
};

export const LoginPageRender: React.FC<Omit<ILoginPageProps, 'app'> & { nextConfig: INextConfig }> = (props) => {
  AppContext.init(props.nextConfig);

  useLogger('<[LoginPageRender]>', props);

  return <LoginPageView {...props} /*app={appState}*/ />;
};
