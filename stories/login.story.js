import React from 'react';

import { storiesOf } from "@storybook/react";

import Login from '../components/Login';

storiesOf('Login', module)
  .add('default', () => <Login />);
