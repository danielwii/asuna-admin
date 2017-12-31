import React        from 'react';
import { Provider } from 'react-redux';

import { storiesOf } from "@storybook/react";

import ModelsIndex        from '../modules/models'
import ModelsCreate       from '../modules/models/create'
import { configureStore } from '../store';

const initialState = {};

storiesOf('Modules::Models', module)
  .addDecorator((getStory) => (
    <Provider store={configureStore({ menu: initialState })}>
      {getStory()}
    </Provider>
  ))
  .add('create', () => (
    <ModelsCreate />
  ))
  .add('setup', () => (
    <ModelsIndex />
  ));
