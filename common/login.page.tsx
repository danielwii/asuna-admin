import React       from 'react';
import { connect } from 'react-redux';
import styled      from 'styled-components';

import AntdLayout                   from '../layout/antd';
import Login                        from '../containers/Login';
import Loading                      from '../components/LivingLoading';
import Snow                         from '../components/Snow';
import LogoCanvas                   from '../components/LogoCanvas';
import { RootState, withReduxSaga } from '../store';

import { register }     from '../services/register';
import { createLogger } from '../helpers';
import { appContext }   from '../app/context';
import { ReduxProps }   from 'index';

const logger = createLogger('pages:login');

// --------------------------------------------------------------
// Setup context
// --------------------------------------------------------------

appContext.setup({ module: 'login', register });

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
  app: RootState['app'];
}

class LoginPage extends React.Component<IProps> {

  // --------------------------------------------------------------
  // 1. Mounting：已插入真實的 DOM
  // --------------------------------------------------------------

  /**
   * componentWillMount 会在组件 render 之前执行，并且永远都只执行一次。
   * 由于这个方法始终只执行一次，所以如果在这里定义了 setState 方法之后，页面永远都只会在加载前更新一次。
   */
  componentWillMount() {
    logger.log('componentWillMount...');
    const { dispatch } = this.props;
    appContext.regDispatch(dispatch);
  }

  /**
   * 在组件加载完毕之后立即执行。
   * 在这个时候之后组件已经生成了对应的DOM结构，可以通过this.getDOMNode()来进行访问。
   */
  componentDidMount() {
    logger.log('componentDidMount...');
  }

  // --------------------------------------------------------------
  // 2. Updating：正在被重新渲染
  // --------------------------------------------------------------

  /**
   * 在组件接收到一个新的 prop 时被执行。这个方法在初始化 render 时不会被调用。
   * 旧的 props 可以通过 this.props 来获取。在这个函数内调用 this.setState() 方法不会增加一次新的 render。
   * @param nextProps
   * @param nextContext
   */
  componentWillReceiveProps(nextProps, nextContext) {
    logger.log('componentWillReceiveProps::nextProps is', nextProps, 'nextContext is', nextContext);
  }

  /**
   * 返回一个布尔值。在组件接收到新的 props 或者 state 时被执行。在初始化时或者使用 forceUpdate 时不被执行。
   * 可以在你确认不需要更新组件时使用。
   * 如果 shouldComponentUpdate 返回 false, render() 则会在下一个 state change 之前被完全跳过。
   * (另外 componentWillUpdate 和 componentDidUpdate 也不会被执行)
   * @param nextProps
   * @param nextState
   * @param nextContext
   */
  shouldComponentUpdate(nextProps, nextState, nextContext) {
    logger.log('shouldComponentUpdate::nextProps is', nextProps, 'nextState is', nextState, 'nextContext is', nextContext);
    return true;
  }

  /**
   * 在组件接收到新的 props 或者 state 但还没有 render 时被执行。在初始化时不会被执行。
   * 一般用在组件发生更新之前。
   * @param nextProps
   * @param nextState
   * @param nextContext
   */
  componentWillUpdate(nextProps, nextState, nextContext) {
    logger.log('componentWillUpdate::nextProps is', nextProps, 'nextState is', nextState, 'nextContext is', nextContext);
  }

  /**
   * 在组件完成更新后立即执行。在初始化时不会被执行。一般会在组件完成更新后被使用。
   * 例如清除 notification 文字等操作。
   * @param prevProps
   * @param prevState
   * @param prevContext
   */
  componentDidUpdate(prevProps, prevState, prevContext) {
    logger.log('componentDidUpdate::prevProps is', prevProps, 'prevState is', prevState, 'prevContext is', prevContext);
  }

  // --------------------------------------------------------------
  // 3.Unmounting：已移出真實的 DOM
  // --------------------------------------------------------------

  /**
   * 在组件从 DOM unmount 后立即执行.
   */
  componentWillUnmount() {
    logger.log('componentWillUnmount...');
  }

  componentDidCatch(error, errorInfo) {
    logger.log('componentDidCatch...', error, errorInfo);
  }

  render() {
    const { app: { heartbeat } } = this.props;
    return (
      <AntdLayout>
        {
          heartbeat
            ? (
              <StyledFullFlexContainer>
                <Snow />
                <StyledLogoWrapper>
                  <LogoCanvas />
                </StyledLogoWrapper>
                <StyledLoginWrapper>
                  <Login {...this.props} />
                </StyledLoginWrapper>
              </StyledFullFlexContainer>)
            : <Loading heartbeat={heartbeat} />
        }
      </AntdLayout>
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  global: state.global,
  app   : state.app,
});

export const DefaultLoginPage = withReduxSaga(connect(mapStateToProps)(LoginPage as any));
