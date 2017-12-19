import React from 'react';
import { Form } from 'antd';
import { connect } from 'react-redux';

import Login from '../components/Login';
import { withReduxSaga } from '../store';

const LoginPage = ({}) => (
  <Login />
);

export default withReduxSaga(connect()(LoginPage));
