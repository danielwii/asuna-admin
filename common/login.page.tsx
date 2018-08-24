import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import AntdLayout from '../layout/antd';
import Login from '../containers/Login';
import Loading from '../components/LivingLoading';
import Snow from '../components/Snow';
import LogoCanvas from '../components/LogoCanvas';

import { register } from '../services/register';
import { appContext } from '../core/context';
import { createLogger } from '../helpers';

import { RootState, withReduxSaga, AppState } from '@asuna-admin/store';

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
}

class LoginPage extends React.Component<IProps> {
  constructor(props) {
    super(props);
    appContext.setup(register);
    appContext.regDispatch(props.dispatch);
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
              <Login {...this.props} />
            </StyledLoginWrapper>
          </StyledFullFlexContainer>
        ) : (
          <Loading heartbeat={heartbeat} />
        )}
      </AntdLayout>
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  global: state.global,
  app: state.app,
});

export const DefaultLoginPage = withReduxSaga(connect(mapStateToProps)(LoginPage as any));
