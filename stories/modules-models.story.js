import React from 'react';
import { Provider } from 'react-redux';

import { storiesOf } from '@storybook/react';

import ModelsIndex from '../modules/models';
import ModelsSetup from '../modules/models/setup';

import { configureStore } from '@asuna-admin/store';

const initialState = {};

storiesOf('Modules::Models', module)
  .addDecorator(getStory => (
    <Provider store={configureStore({ menu: initialState })}>{getStory()}</Provider>
  ))
  .add('index', () => <ModelsIndex />)
  .add('setup', () => <ModelsSetup />);
