import React from 'react';
import { connect, Provider } from 'react-redux';
import { bindActionCreators } from 'redux';

import { storiesOf } from '@storybook/react';
import styled from 'styled-components';
import { Button } from 'antd';

import Panes from '../components/Panes';
import PanesContainer from '../containers/Panes';

import { configureStore, panesReducer, panesActions, panesActionTypes } from '@asuna-admin/store';

const StyledButtonsDiv = styled.div`
  margin-bottom: 16px;
`;

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

storiesOf('Panes', module)
  .addDecorator(getStory => (
    <Provider store={configureStore({ panes: initialState })}>{getStory()}</Provider>
  ))
  .add('container', () => {
    let counter = 4;

    class PanesContainerWrapper extends React.Component {
      constructor(props) {
        super(props);

        this.add = this.add.bind(this);
      }

      add() {
        const { add } = this.props;
        const current = counter++;
        const key = `t-${current}`;

        add({
          key,
          title: `t-title-${current}`,
          composed: { component: current },
        });
      }

      render() {
        return (
          <div>
            <StyledButtonsDiv>
              <Button onClick={this.add}>ADD</Button>
            </StyledButtonsDiv>
            <PanesContainer />
          </div>
        );
      }
    }

    const PanesContainerWrapperConnector = connect(
      state => state,
      dispatch => bindActionCreators(panesActions, dispatch),
    )(PanesContainerWrapper);

    return <PanesContainerWrapperConnector />;
  })
  .add('component', () => {
    let counter = 4;

    class PanesWrapper extends React.Component {
      constructor(props) {
        super(props);

        this.state = initialState;

        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.add = this.add.bind(this);
      }

      open(activeKey) {
        this.setState({ activeKey });
      }

      close(targetKey) {
        this.setState(
          panesReducer(this.state, {
            type: panesActionTypes.CLOSE,
            payload: { key: targetKey },
          }),
        );
      }

      add() {
        const index = counter++;
        const key = `t-${index}`;
        this.setState(
          panesReducer(this.state, {
            type: panesActionTypes.OPEN,
            payload: {
              pane: {
                key,
                title: `t-title-${index}`,
                composed: { component: index },
              },
            },
          }),
        );
        this.open(key);
      }

      render() {
        const { activeKey, panes } = this.state;
        return (
          <div>
            <StyledButtonsDiv>
              <Button onClick={this.add}>ADD</Button>
            </StyledButtonsDiv>
            <Panes activeKey={activeKey} panes={panes} open={this.open} close={this.close} />
          </div>
        );
      }
    }

    return <PanesWrapper />;
  });
