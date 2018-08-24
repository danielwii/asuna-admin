import React from 'react';
import { Provider } from 'react-redux';

import { storiesOf } from '@storybook/react';

import MainLayout from '../layout/main';

import { configureStore } from '@asuna-admin/store';

const initialState = {
  activeKey: 'test-1',
  panes: {
    'test-1': {
      key: 'test-1',
      title: 'test-title-1',
      composed: {
        component: <div>1 - ^_^</div>,
        state: { message: '~.~' },
      },
    },
    'test-2': {
      key: 'test-2',
      title: 'test-title-2',
      composed: {
        component: <div>2 - 0.0</div>,
        state: { message: '>_<' },
      },
    },
    'test-3': {
      key: 'test-3',
      title: 'test-title-3',
      composed: {
        component: <div>3 - *.*</div>,
        state: { message: 'o.o' },
      },
    },
  },
};

storiesOf('MainLayout', module)
  .addDecorator(getStory => (
    <Provider store={configureStore({ panes: initialState })}>{getStory()}</Provider>
  ))
  .add('default', () => (
    <MainLayout>
      <div>^_^</div>
    </MainLayout>
  ));
