import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import * as R from 'ramda';

import { Form, Modal, message } from 'antd';

import { createLogger, toFormErrors } from '@asuna-admin/helpers';

import { DynamicForm2 } from '../src/components/DynamicForm/index';

const logger = createLogger('components:form-modal', 'warn');

const LightForm = Form.create({
  mapPropsToFields({ fields }) {
    return _.mapValues(fields, field => Form.createFormField({ ...field }));
  },
  onFieldsChange(props, changedFields) {
    const { onChange } = props;
    onChange(changedFields);
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
    const { fields } = this.props;
    this.setState({ fields: { ...fields } });
  }

  showModal = () => {
    this.setState({
      visible: true,
    });
  };

  handleOk = () => {
    const { onSubmit } = this.props;
    const { fields } = this.state;
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
            fields: R.map(field => ({ ...field, value: undefined }))(fields),
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
    const { fields } = this.state;
    logger.log('[handleFormChange]', { fields, changedFields });
    this.setState({ fields: R.mergeDeepRight(fields, changedFields) });
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
