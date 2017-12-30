import React            from 'react';
import { connect }      from 'react-redux';
import PropTypes        from 'prop-types';
import { notification } from 'antd';
import _                from 'lodash';

import AntdLayout        from '../layout/antd';
import Login             from '../components/Login';
import { withReduxSaga } from '../store';

import { notificationsActions, notificationTypes } from '../store/notifications.redux';

class LoginPage extends React.Component {
  static propTypes = {
    global       : PropTypes.shape(),
    notifications: {
      message: PropTypes.string,
      type   : PropTypes.oneOf(_.values(notificationTypes)),
    },
  };

  // --------------------------------------------------------------
  // 1. Mounting：已插入真實的 DOM
  // --------------------------------------------------------------

  /**
   * componentWillMount会在组件render之前执行，并且永远都只执行一次。
   * 由于这个方法始终只执行一次，所以如果在这里定义了setState方法之后，页面永远都只会在加载前更新一次。
   */
  componentWillMount() {
    console.log('componentWillMount...');
  }

  /**
   * 在组件加载完毕之后立即执行。
   * 在这个时候之后组件已经生成了对应的DOM结构，可以通过this.getDOMNode()来进行访问。
   */
  componentDidMount() {
    console.log('componentDidMount...');
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
    console.log('componentWillReceiveProps::nextProps is', nextProps, 'nextContext is', nextContext);
    if (nextProps.notifications && nextProps.notifications.message) {
      notification[nextProps.notifications.type]({
        message    : nextProps.notifications.message,
        description: JSON.stringify(nextProps.notifications),
      });
      notificationsActions(nextProps.dispatch).notifyDone();
    }
  }

  /**
   * 返回一个布尔值。在组件接收到新的 props 或者 state 时被执行。在初始化时或者使用 forceUpdate 时不被执行。
   * 可以在你确认不需要更新组件时使用。
   * 如果 shouldComponentUpdate 返回 false, render() 则会在下一个 state change 之前被完全跳过。
   * (另外 componentWillUpdate 和 componentDidUpdate 也不会被执行)
   * @param nextProps
   * @param nextState
   */
  shouldComponentUpdate(nextProps, nextState, nextContext) {
    console.log('shouldComponentUpdate::nextProps is', nextProps, 'nextState is', nextState, 'nextContext is', nextContext);
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
    console.log('componentWillUpdate::nextProps is', nextProps, 'nextState is', nextState, 'nextContext is', nextContext);
  }

  /**
   * 在组件完成更新后立即执行。在初始化时不会被执行。一般会在组件完成更新后被使用。
   * 例如清除 notification 文字等操作。
   * @param prevProps
   * @param prevState
   * @param prevContext
   */
  componentDidUpdate(prevProps, prevState, prevContext) {
    console.log('componentDidUpdate::prevProps is', prevProps, 'prevState is', prevState, 'prevContext is', prevContext);
  }

  // --------------------------------------------------------------
  // 3.Unmounting：已移出真實的 DOM
  // --------------------------------------------------------------

  /**
   * 在组件从 DOM unmount 后立即执行.
   */
  componentWillUnmount() {
    console.log('componentWillUnmount...');
  }

  componentDidCatch(error, errorInfo) {
    console.log('componentDidCatch...', error, errorInfo);
  }

  render() {
    return (
      <AntdLayout>
        <Login {...this.props} />
      </AntdLayout>
    );
  }
}

const mapStateToProps = state => ({
  global       : state.global,
  notifications: state.notifications,
});

export default withReduxSaga(connect(mapStateToProps)(LoginPage));
