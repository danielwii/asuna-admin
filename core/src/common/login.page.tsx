import { WsAdapter, NextSocketType } from '@asuna-admin/adapters';
import { LogoCanvas, Snow, Sun } from '@asuna-admin/components';
import { Config } from '@asuna-admin/config';
import { LoginContainer } from '@asuna-admin/containers';
import { AppContext, IIndexRegister, ILoginRegister, INextConfig } from '@asuna-admin/core';
import { diff } from '@asuna-admin/helpers';
import { WithStyles } from '@asuna-admin/layout';
import { createLogger } from '@asuna-admin/logger';
import { AppState, authActions, RootState } from '@asuna-admin/store';
import { routerActions } from '@asuna-admin/store/router.redux';
import { Divider, Icon } from 'antd';
import ApolloClient, { gql } from 'apollo-boost';
import * as _ from 'lodash';
import { NextPageContext } from 'next';
import fetch from 'node-fetch';
import QRCode from 'qrcode.react';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PacmanLoader } from 'react-spinners';
import { Subscription } from 'rxjs';
import styled from 'styled-components';
import * as uuid from 'uuid';

const logger = createLogger('pages:login');

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

const StyledLoginWrapper = styled.div`
  width: 20rem;
`;

const StyledLogoWrapper = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
`;

export type LoginInitialProps = Partial<{
  weChatLoginEnable: boolean;
  clientId: string;
  userAgent: string;
}>;

export type ILoginPageProps = ReduxProps & {
  app: AppState;
  register: ILoginRegister & IIndexRegister;
  hideCharacteristics: boolean;
} & LoginInitialProps;

const WeChatQrCodeFuture = React.lazy(
  () =>
    new Promise(resolve => {
      const subscription = WsAdapter.subject.subscribe(async ({ id, socket }) => {
        const body = { type: 'admin-login', value: id };
        logger.log('generate ticket', body, { id, socket });
        const { url } = await fetch(`/api/v1/wx/ticket`, {
          method: 'post',
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
        }).then(response => response.json());
        subscription.unsubscribe();
        resolve({
          default: () => (
            <div>
              <div>
                <QRCode value={url} />
              </div>
              <div>
                <Icon type="qrcode" />
                微信扫码登录
              </div>
            </div>
          ),
        } as any);
      });
    }),
);

type AdminLoginEvent =
  | { type: 'activated'; token: { accessToken: string }; username: string }
  | { type: 'unactivated' }
  | { type: 'invalid' };

export class LoginPage extends React.Component<
  ILoginPageProps,
  { subscription: Subscription; message?: string; weChatLoginEnable?: boolean }
> {
  constructor(props) {
    super(props);

    const { dispatch, register, weChatLoginEnable } = this.props;
    AppContext.setup(register);
    AppContext.regDispatch(dispatch);

    const subscription = WsAdapter.subject.subscribe(({ socket }: NextSocketType) => {
      socket.on('admin-login', value => {
        const event = JSON.parse(value) as AdminLoginEvent;
        let message;
        logger.log(`[admin-login]`, event);
        if (event.type === 'invalid') {
          message = '请先关注服务号';
        } else if (event.type === 'unactivated') {
          message = '请先关注服务号或联系管理员查询对应的权限';
        } else {
          subscription.unsubscribe();
          dispatch(authActions.loginSuccess(event.username, event.token.accessToken));
          dispatch(routerActions.toIndex());
        }
        this.setState({ weChatLoginEnable: this.state.weChatLoginEnable || weChatLoginEnable, message });
      });
    });
    this.state = { subscription };
  }

  componentWillUnmount() {
    logger.log('[componentWillUnmount]', 'destroy subscriptions');
    this.state.subscription?.unsubscribe();
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
    const { hideCharacteristics, weChatLoginEnable } = this.props;
    const { message } = this.state;

    logger.log(`render ...`, this.props, this.state);

    return (
      <WithStyles hideCharacteristics>
        <StyledFullFlexContainer>
          {!hideCharacteristics && (
            <>
              <Snow />
              <Sun />
              <StyledLogoWrapper>
                <LogoCanvas />
              </StyledLogoWrapper>
            </>
          )}
          {/*<pre>{util.inspect({ clientId })}</pre>*/}
          {weChatLoginEnable || this.state.weChatLoginEnable ? (
            <StyledLoginWrapper
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40rem',
              }}
            >
              <LoginContainer {...this.props} />
              <Divider type="vertical" />
              <React.Suspense fallback={<PacmanLoader />}>
                <WeChatQrCodeFuture />
              </React.Suspense>
              {message}
            </StyledLoginWrapper>
          ) : (
            <StyledLoginWrapper>
              <LoginContainer {...this.props} />
            </StyledLoginWrapper>
          )}
        </StyledFullFlexContainer>
      </WithStyles>
    );
  }
}

export const wechatLoginGetInitial = async (ctx: NextPageContext): Promise<LoginInitialProps> => {
  if (Config.isServer) {
    const clientId = uuid.v4();

    try {
      const userAgent = ctx.req ? ctx.req.headers['user-agent'] : navigator.userAgent;
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
            kv(collection: "wechat.settings", key: "config") {
              key
              name
              type
              value
            }
          }
        `,
      });

      const weChatLoginEnable = _.get(data, 'kv.value.values.wechat.login');
      return { userAgent, weChatLoginEnable, clientId };
    } catch (e) {
      console.error(e);
    }
  }
  return {};
};

export const LoginPageRender: React.FC<Omit<ILoginPageProps, 'app' | 'dispatch'> & {
  nextConfig: INextConfig;
}> = props => {
  AppContext.init(props.nextConfig);
  const appState = useSelector<RootState, AppState>(state => state.app);
  const dispatch = useDispatch();

  return <LoginPage {...props} app={appState} dispatch={dispatch} />;
};
