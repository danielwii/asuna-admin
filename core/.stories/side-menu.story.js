import * as React from 'react';
import { Provider } from 'react-redux';

import { storiesOf } from '@storybook/react';

import SideMenuContainer from '../src/containers/SideMenu';
import { AsunaStore } from '../src/store';

const store = AsunaStore.instance;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error, info) {
    // Display fallback UI
    this.setState({ hasError: true });
    // You can also log the error to an error reporting service
    console.log(error, info);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}

const initialState = {
  menus: [
    {
      key: 'models',
      title: '模型系统',
      subMenus: [
        { key: 'models::index', title: '模型列表', linkTo: '/models-index' },
        // { key: 'models::setup', title: '模型配置', linkTo: '/models-setup' },
      ],
    },
  ],
};

storiesOf('SideMenu', module)
  .addDecorator(getStory => <Provider store={store.configureStore({ menu: initialState }, {})}>{getStory()}</Provider>)
  .add('container', () => <SideMenuContainer />);
