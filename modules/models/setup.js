import React       from 'react';
import PropTypes   from 'prop-types';
import { connect } from 'react-redux';

import { Form, Divider } from 'antd';

import { DynamicForm2, DynamicFormTypes } from '../../components/DynamicForm';
import { generatePlain }                  from '../../components/DynamicForm/elements';

// eslint-disable-next-line react/prefer-stateless-function
class ModelsSetup extends React.Component {
  static propTypes = {
    pane: PropTypes.shape({}),
  };

  render() {
    const { pane } = this.props;

    // --------------------------------------------------------------

    const basicFormFields = model => ({
      name: { name: 'Name', type: DynamicFormTypes.Input, value: model.name },
    });

    const BasicForm = Form.create({
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
        <BasicForm fields={basicFormFields(pane.data)} />

        <Divider dashed>Properties</Divider>
      </div>
    );
  }
}

// 通过 module 从 store 中拉取当前的 pane。
// 当前的 module 和 panes 中的 activeKey 是一样的。
const mapStateToProps = (state, ownProps) => ({ pane: state.panes.panes[ownProps.module] });

export default connect(mapStateToProps)(ModelsSetup);
