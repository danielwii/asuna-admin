import React     from 'react';
import PropTypes from 'prop-types';
import _         from 'lodash';

import { Tabs } from 'antd';

import ModulesLoader from '../modules';

const { TabPane } = Tabs;

class Panes extends React.Component {
  static propTypes = {
    activeKey: PropTypes.string,
    onActive : PropTypes.func.isRequired,
    onClose  : PropTypes.func.isRequired,
    panes    : PropTypes.shape({
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

    this.onEdit = this.onEdit.bind(this);
  }

  onEdit = (targetKey, action) => {
    const { onClose } = this.props;
    console.log('targetKey is', targetKey, 'action is', action);
    if (action === 'remove') {
      onClose(targetKey);
    }
  };

  render() {
    const { activeKey, panes, onActive } = this.props;

    if (!activeKey) {
      return <div>^_^ - panes</div>;
    }

    return (
      <div>
        <Tabs
          hideAdd
          onChange={onActive}
          activeKey={activeKey}
          type="editable-card"
          onEdit={this.onEdit}
        >
          {_.map(panes, pane => (
            <TabPane tab={pane.title} key={pane.key}>
              {/*{activeKey} - {pane.key}*/}
              {/*<pre>{JSON.stringify(pane, null, 2)}</pre>*/}
            </TabPane>
          ))}
        </Tabs>
        <ModulesLoader module={activeKey} />
      </div>
    );
  }
}

export default Panes;
