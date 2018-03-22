import React     from 'react';
import PropTypes from 'prop-types';
import _         from 'lodash';
import * as R    from 'ramda';

import { Button, Divider, Tabs } from 'antd';

import { createLogger } from '../adapters/logger';
import ModulesLoader    from '../modules';

const logger = createLogger('components:panes');

const { TabPane } = Tabs;

class Panes extends React.Component {
  static propTypes = {
    activeKey     : PropTypes.string,
    onActive      : PropTypes.func.isRequired,
    onClose       : PropTypes.func.isRequired,
    onCloseWithout: PropTypes.func.isRequired,
    panes         : PropTypes.shape({
      key: PropTypes.shape({
        title   : PropTypes.string,
        composed: PropTypes.shape({
          component: PropTypes.any,
          state    : PropTypes.object,
        }),
      }),
    }),
  };

  constructor(props) {
    super(props);
    this.state = {
      titles: {},
    };
  }

  onEdit = (targetKey, action) => {
    const { onClose } = this.props;
    logger.log('targetKey is', targetKey, 'action is', action);
    if (action === 'remove') {
      onClose(targetKey);
    }
  };

  onTitleChange = (key, newTitle) => {
    logger.log('onTitleChange', key, newTitle);
    if (key && newTitle) {
      this.setState(R.mergeDeepRight(this.state, { titles: { [key]: newTitle } }));
    }
  };

  render() {
    const { titles } = this.state;

    const { activeKey, panes, onActive, onCloseWithout } = this.props;

    if (!activeKey) {
      return <div>^_^ - Hello kitty.</div>;
    }

    const title = titles[activeKey];

    const operations = (
      <React.Fragment>
        {panes && <Button icon="close-square" onClick={() => onCloseWithout()} />}
        {panes && R.keys(panes).length > 1 && (
          <React.Fragment>
            <Divider type="vertical" />
            <Button icon="minus-square" onClick={() => onCloseWithout(activeKey)} />
          </React.Fragment>
        )}
      </React.Fragment>
    );

    return (
      <Tabs
        hideAdd
        tabBarExtraContent={operations}
        onChange={onActive}
        activeKey={activeKey}
        type="editable-card"
        onEdit={this.onEdit}
      >
        {_.map(panes, pane => (
          <TabPane tab={pane.title} key={pane.key}>
            {activeKey} - {pane.key} - {title}
            <ModulesLoader
              module={pane.linkTo || pane.key}
              activeKey={activeKey}
              onClose={() => this.onEdit(activeKey, 'remove')}
              basis={{ pane }}
              onTitleChange={newTitle => this.onTitleChange(activeKey, newTitle)}
            />
          </TabPane>
        ))}
      </Tabs>
    );
  }
}

export default Panes;
