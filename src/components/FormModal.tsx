import React from 'react';
import _ from 'lodash';
import * as R from 'ramda';

import { AxiosResponse } from 'axios';
import { Form, message, Modal } from 'antd';
import { WrappedFormUtils } from 'antd/es/form/Form';

import { DynamicForm } from './DynamicForm';

import { toFormErrors } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';

const logger = createLogger('components:form-modal', 'warn');

interface ILightForm {
  fields;
  onChange: (value) => void;
  onSubmit: (fn: (e: Error) => void) => void;
}

const LightForm = Form.create<ILightForm>({
  mapPropsToFields({ fields }) {
    return _.mapValues(fields, field => Form.createFormField({ ...field }));
  },
  onFieldsChange(props, changedFields) {
    const { onChange } = props;
    onChange(changedFields);
  },
})(DynamicForm);

export interface IProps {
  title: string;
  openButton;
  fields;
  onChange?: (value) => void;
  onSubmit: (value: any) => Promise<AxiosResponse>;
}

export interface IState {
  fields?;
  visible: boolean;
  confirmLoading: boolean;
}

export class FormModal extends React.Component<IProps, IState> {
  form: WrappedFormUtils;

  state: IState = {
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
      // prettier-ignore
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
              this.form = form as any;
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
