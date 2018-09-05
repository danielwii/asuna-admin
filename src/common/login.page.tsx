import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { Login, LivingLoading, Snow, LogoCanvas } from '@asuna-admin/components';

import { RootState, AsunaStore, AppState } from '@asuna-admin/store';
import { createLogger } from '@asuna-admin/logger';
import { AppContext, IIndexRegister, ILoginRegister } from '@asuna-admin/core';
import { AntdLayout } from '@asuna-admin/layout';

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

interface IProps extends ReduxProps {
  app: AppState;
  register: ILoginRegister & IIndexRegister;
}

class LoginPage extends React.Component<IProps> {
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
      <AntdLayout>
        {heartbeat ? (
          <StyledFullFlexContainer>
            <Snow />
            <StyledLogoWrapper>
              <LogoCanvas />
            </StyledLogoWrapper>
            <StyledLoginWrapper>
              <Login {...this.props as any} />
            </StyledLoginWrapper>
          </StyledFullFlexContainer>
        ) : (
          <LivingLoading heartbeat={heartbeat} />
        )}
      </AntdLayout>
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  global: state.global,
  app: state.app,
});

export const renderLoginPage = nextGetConfig => {
  const store = new AsunaStore(nextGetConfig);
  return store.withReduxSaga(connect(mapStateToProps)(LoginPage));
};
