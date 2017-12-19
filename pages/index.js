/* eslint-disable key-spacing */
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import withAppLayout from '../components/app-layout';
import { actionTypes, withReduxSaga } from '../store';

class Home extends React.Component {
  static propTypes = {
    message: PropTypes.string.isRequired,
  };

  static async getInitialProps({ store }) {
  }

  render() {
    const { message, dispatch } = this.props;
    return (
      <div>
        <h1>- Home -</h1>
        <hr />
        <div>Message: {message}</div>
        <hr />
        <div>
          <button onClick={() => dispatch({ type: actionTypes.login.LOGIN })}>hello2</button>
        </div>
      </div>
    );
  }
}

const HomeConnector = connect(state => ({ ...state.global }))(Home);

export default withReduxSaga(withAppLayout(HomeConnector));
