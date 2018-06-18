import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import * as R from 'ramda';

import { Form, Modal, message } from 'antd';

import { DynamicForm2 } from './DynamicForm';
import { createLogger } from '../helpers/logger';
import { toFormErrors } from '../helpers/error';

const logger = createLogger('components:form-modal', 'warn');

const LightForm = Form.create({
  mapPropsToFields({ fields }) {
    return _.mapValues(fields, field => Form.createFormField({ ...field }));
  },
  onFieldsChange(props, changedFields) {
    props.onChange(changedFields);
  },
})(DynamicForm2);

// eslint-disable-next-line import/prefer-default-export
export class FormModal extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    fields: PropTypes.shape({}),
    openButton: PropTypes.func,
    onSubmit: PropTypes.func,
  };

  state = {
    visible: false,
    confirmLoading: false,
  };

  componentWillMount() {
    this.setState({ fields: { ...this.props.fields } });
  }

  showModal = () => {
    this.setState({
      visible: true,
    });
  };

  handleOk = () => {
    const { onSubmit } = this.props;
    this.form.validateFields(async (err, values) => {
      if (err) {
        logger.error('[FormModal][handleOk]', 'error occurred in form', { values, err });
      } else {
        this.setState({
          confirmLoading: true,
        });
        try {
          const response = await onSubmit(values);
          logger.log('response is', response);
          this.setState({
            visible: false,
            confirmLoading: false,
            fields: R.map(field => ({ ...field, value: undefined }))(this.state.fields),
          });
        } catch (e) {
          const errors = toFormErrors(e.response);
          logger.error('[FormModal][handleOk]', { e, errors });
          if (_.isString(errors)) {
            message.error(errors);
          } else {
            this.handleFormChange(errors);
          }
          this.setState({
            confirmLoading: false,
          });
        }
      }
    });
  };

  handleFormChange = changedFields => {
    logger.log('[handleFormChange]', { fields: this.state.fields, changedFields });
    this.setState({ fields: R.mergeDeepRight(this.state.fields, changedFields) });
  };

  handleCancel = () => {
    this.setState({
      visible: false,
    });
  };

  render() {
    const { title, openButton } = this.props;

    const { fields, visible, confirmLoading } = this.state;

    return (
      <React.Fragment>
        {openButton(this.showModal)}
        <Modal
          title={title}
          visible={visible}
          onOk={this.handleOk}
          confirmLoading={confirmLoading}
          onCancel={this.handleCancel}
        >
          <LightForm
            ref={form => {
              this.form = form;
            }}
            delegate
            fields={fields}
            onSubmit={this.handleOk}
            onChange={this.handleFormChange}
          />
        </Modal>
      </React.Fragment>
    );
  }
}
