import React from 'react';

import { storiesOf } from '@storybook/react';
import { action }    from '@storybook/addon-actions';
import { linkTo }    from '@storybook/addon-links';

import 'antd/dist/antd.css';

import { Button, Welcome } from '@storybook/react/demo';
import Login               from '../components/Login';
import { MainLayout }      from '../layout';

storiesOf('Welcome', module).add('to Storybook', () => <Welcome showApp={linkTo('Button')} />);

storiesOf('Button', module)
  .add('with text', () => <Button onClick={action('clicked')}>Hello Button</Button>)
  .add('with some emoji', () => <Button onClick={action('clicked')}>😀 😎 👍 💯</Button>);

storiesOf('Login', module)
  .add('default', () => <Login />);

storiesOf('MainLayout', module)
  .add('default', () => (
    <MainLayout>
      <div>^_^</div>
    </MainLayout>
  ));
