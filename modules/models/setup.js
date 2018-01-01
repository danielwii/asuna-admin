import React       from 'react';
import PropTypes   from 'prop-types';
import { connect } from 'react-redux';

import { Form, Divider } from 'antd';

import { DynamicForm2, DynamicFormTypes, generatePlain } from '../../components/DynamicForm';

class ModelsSetup extends React.Component {
  static propTypes = {
    pane: PropTypes.shape({}),
  };

  componentWillMount() {
  }

  render() {
    const { pane } = this.props;

    // --------------------------------------------------------------

    const basicForm3Fields = model => ({
      name: { name: 'Name', type: DynamicFormTypes.Input, value: model.name },
    });

    const BasicForm3 = Form.create({
      mapPropsToFields({ fields }) {
        return {
          name: Form.createFormField({ ...fields.name }),
        };
      },
    })(DynamicForm2);

    // --------------------------------------------------------------

    return (
      <div>
        {generatePlain({ label: 'ID', text: pane.data.id })}

        <Divider dashed>Basic</Divider>
        <BasicForm3 fields={basicForm3Fields(pane.data)} />

        <Divider dashed>Properties</Divider>
      </div>
    );
  }
}

// 通过 module 从 store 中拉取当前的 pane。
// 当前的 module 和 panes 中的 activeKey 是一样的。
const mapStateToProps = (state, ownProps) => ({ pane: state.panes.panes[ownProps.module] });

export default connect(mapStateToProps)(ModelsSetup);
