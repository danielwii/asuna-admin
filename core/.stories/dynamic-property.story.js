import * as React from 'react';
import { Provider } from 'react-redux';

import { storiesOf } from '@storybook/react';

import { DynamicProperty } from '../temp/DynamicProperty';

import { configureStore } from '@asuna-admin/store';

const initialState = {};

storiesOf('DynamicProperty', module)
  .addDecorator(getStory => <Provider store={configureStore(initialState)}>{getStory()}</Provider>)
  .add('default', () => {
    class Wrapper extends React.Component {
      constructor(props) {
        super(props);

        this.state = {
          properties: [],
        };
      }

      onAddProperty = property => {
        this.setState({
          properties: [...this.state.properties, property],
        });
      };

      onRemoveProperty = ({ key }) => {
        console.warn('remove', key);
        console.warn('properties is', this.state.properties);
        const [index] = key.split(/-/);
        const properties = [...this.state.properties];
        properties.splice(index, 1);
        this.setState({ properties });
      };

      render() {
        const { properties } = this.state;

        return (
          <DynamicProperty
            onAddProperty={this.onAddProperty}
            onRemoveProperty={this.onRemoveProperty}
            properties={properties}
          />
        );
      }
    }

    return <Wrapper />;
  });
