/** @jsxRuntime classic */

/** @jsx jsx */
// noinspection ES6UnusedImports
import { jsx } from '@emotion/react';

import ApolloClient, { gql } from 'apollo-boost';
import { Snow } from 'asuna-components';
import { changeAntdTheme } from 'dynamic-antd-theme';
import * as _ from 'lodash';
import fetch from 'node-fetch';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Subscription } from 'rxjs';
import * as shortid from 'shortid';
import styled from 'styled-components';

import { Config } from '../config';
import { LoginContainer } from '../containers';
import { AppContext, IIndexRegister, ILoginRegister, INextConfig } from '../core';
import { diff } from '../helpers';
import { WithStyles } from '../layout';
import { createLogger } from '../logger';

import type { NextPageContext } from 'next';
import type { AppState, RootState } from '../store';

const logger = createLogger('common:login');

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const StyledFullFlexContainer = styled.div`
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

export type ILoginPageProps = ReduxProps & {
  app: AppState;
  register: ILoginRegister & IIndexRegister;
  hideCharacteristics?: boolean;
  customLogin?: (site, enableWeChat) => React.ReactElement;
} & LoginInitialProps;

export class LoginPage extends React.Component<ILoginPageProps> {
  constructor(props) {
    super(props);

    const { dispatch, register, site } = this.props;
    AppContext.setup(register);
    AppContext.regDispatch(dispatch);

    if (site?.primaryColor) {
      changeAntdTheme(site?.primaryColor);
    }
  }

  componentWillUnmount() {
    // logger.log('[componentWillUnmount]', 'destroy subscriptions');
    // this.state.subscription?.unsubscribe();
  }

  shouldComponentUpdate(
    nextProps: Readonly<ILoginPageProps>,
    nextState: Readonly<{ subscription: Subscription; message?: string }>,
    nextContext: any,
  ): boolean {
    // 通过 userAgent 判断 getInitialProps 有效性。
    return !!nextProps.userAgent || diff(this.state, nextState).isDifferent;
  }

  componentDidCatch(error, info) {
    logger.error('componentDidCatch...', error, { error, info });
  }

  render() {
    const { hideCharacteristics, weChatLoginEnable, dispatch, site, customLogin } = this.props;

    logger.log(`render ...`, this.props, this.state);

    return (
      <WithStyles hideCharacteristics>
        <StyledFullFlexContainer>
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

          {customLogin ? customLogin(site, weChatLoginEnable) : <LoginContainer {...this.props} />}
        </StyledFullFlexContainer>
      </WithStyles>
    );
  }
}

export const wechatLoginGetInitial = async (ctx: NextPageContext): Promise<LoginInitialProps> => {
  if ((process as any).browser) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return __NEXT_DATA__.props.pageProps;
  }

  try {
    const tempId = shortid.generate();
    const userAgent = ctx.req ? ctx.req.headers['user-agent'] : navigator.userAgent;
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

export const LoginPageRender: React.FC<
  Omit<ILoginPageProps, 'app' | 'dispatch'> & {
    nextConfig: INextConfig;
  }
> = (props) => {
  AppContext.init(props.nextConfig);
  const appState = useSelector<RootState, AppState>((state) => state.app);
  const dispatch = useDispatch();

  return <LoginPage {...props} app={appState} dispatch={dispatch} />;
};
