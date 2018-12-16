import React from 'react';
import { connect } from 'react-redux';
import * as R from 'ramda';
import styled from 'styled-components';

import { LivingLoading, LogoCanvas, Snow } from '@asuna-admin/components';
import { LoginContainer } from '@asuna-admin/containers';

import { AppState, RootState } from '@asuna-admin/store';
import { AppContext, IIndexRegister, ILoginRegister, INextConfig } from '@asuna-admin/core';
import { WithStyles } from '@asuna-admin/layout';
import { createLogger } from '@asuna-admin/logger';

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

export interface ILoginPageProps extends ReduxProps {
  app: AppState;
  register: ILoginRegister & IIndexRegister;
}

export class LoginPage extends React.Component<ILoginPageProps> {
  constructor(props) {
    super(props);

    const { dispatch, register } = this.props;
    AppContext.setup(register);
    AppContext.regDispatch(dispatch);
  }

  componentDidCatch(error, info) {
    logger.error('componentDidCatch...', error, { error, info });
  }

  render() {
    const {
      app: { heartbeat },
    } = this.props;

    return (
      <WithStyles>
        {heartbeat ? (
          <StyledFullFlexContainer>
            <Snow />
            <StyledLogoWrapper>
              <LogoCanvas />
            </StyledLogoWrapper>
            <StyledLoginWrapper>
              <LoginContainer {...this.props} />
            </StyledLoginWrapper>
          </StyledFullFlexContainer>
        ) : (
          <LivingLoading heartbeat={heartbeat} />
        )}
      </WithStyles>
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  global: state.global,
  app: state.app,
});

// prettier-ignore
export const renderLoginPage = (props: Partial<ILoginPageProps>, nextConfig: INextConfig) => {
  AppContext.init(nextConfig);
  return connect(R.compose(R.merge(props), mapStateToProps))(LoginPage);
};
