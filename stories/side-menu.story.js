import React        from 'react';
import { Provider } from 'react-redux';

import { storiesOf } from "@storybook/react";

import SideMenuContainer  from '../containers/SideMenu';
import { configureStore } from '../store';
import { getMenus }       from '../services/menu';

const initialState = getMenus();

storiesOf('SideMenu', module)
  .addDecorator((getStory) => (
    <Provider store={configureStore({ menu: initialState })}>
      {getStory()}
    </Provider>
  ))
  .add('container', () => (
    <SideMenuContainer />
  ));
