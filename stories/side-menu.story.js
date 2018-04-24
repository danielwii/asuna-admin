import React        from 'react';
import { Provider } from 'react-redux';

import { storiesOf } from "@storybook/react";

import SideMenuContainer  from '../containers/SideMenu';
import { configureStore } from '../store/index';

const initialState = {
  menus: [
    {
      key     : 'models',
      title   : '模型系统',
      subMenus: [
        { key: 'models::index', title: '模型列表', linkTo: '/models-index' },
        // { key: 'models::setup', title: '模型配置', linkTo: '/models-setup' },
      ],
    },
  ],
};

storiesOf('SideMenu', module)
  .addDecorator((getStory) => (
    <Provider store={configureStore({ menu: initialState })}>
      {getStory()}
    </Provider>
  ))
  .add('container', () => (
    <SideMenuContainer />
  ));
