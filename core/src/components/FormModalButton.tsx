import { toFormErrors } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';

import { Form, Modal } from 'antd';
import { WrappedFormUtils } from 'antd/es/form/Form';
import { AxiosResponse } from 'axios';
import idx from 'idx';
import _ from 'lodash';
import * as R from 'ramda';
import React from 'react';

import { DynamicForm, DynamicFormField } from './DynamicForm';

const logger = createLogger('components:form-modal');

interface ILightForm {
  form;
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
})(DynamicForm) as any;

export interface IFormModalProps {
  title: string;
  openButton;
  fields?: { [key: string]: DynamicFormField };
  body?: React.ReactNode;
  footer?: ({ loading, operations, params }) => React.ReactNode;
  onChange?: (value) => void;
  onSubmit?: (value?: any) => Promise<AxiosResponse>;
  onOperations?: ({ loading, updateState, handleCancel }) => any;
}

interface IState {
  fields?: { [key: string]: DynamicFormField };
  params?: any;
  visible: boolean;
  loading: boolean;
}

export class FormModalButton extends React.Component<IFormModalProps, IState> {
  form: WrappedFormUtils;

  state: IState = {
    visible: false,
    loading: false,
  };

  static getDerivedStateFromProps(props, state) {
    return { fields: { ...props.fields } };
  }

  showModal = () => {
    this.setState({ visible: true });
  };

  handleOk = () => {
    const { onSubmit } = this.props;
    const { fields } = this.state;
    this.form.validateFields(async (err, values) => {
      if (err) {
        logger.error('[FormModal][handleOk]', 'error occurred in form', { values, err });
      } else {
        this.setState({
          loading: true,
        });
        try {
          const response = await onSubmit!(values);
          logger.log('response is', response);
          this.setState({
            visible: false,
            loading: false,
            fields: R.map(field => ({ ...field, value: undefined }))(fields),
          });
        } catch (e) {
          const errors = toFormErrors(e.response);
          logger.error('[FormModal][handleOk]', { e, errors });
          // if (_.isString(errors)) {
          //   message.error(toErrorMessage(errors));
          // } else {
          // }
          this.handleFormChange(errors);
          this.setState({
            loading: false,
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

  updateState = (state: Partial<IState>) => {
    this.setState(state as any);
  };

  render() {
    const { title, openButton, footer, body, onOperations } = this.props;

    const { fields, visible, loading, params } = this.state;
    const extraOperations =
      onOperations != null
        ? onOperations({
            loading,
            updateState: this.updateState,
            handleCancel: this.handleCancel,
          })
        : {};

    // show default footer when custom footer is undefined
    const renderFooterOpts =
      footer != null
        ? {
            footer: footer({
              loading,
              params,
              operations: {
                handleOk: this.handleOk,
                handleCancel: this.handleCancel,
                ...extraOperations,
              },
            }),
          }
        : null;
    return (
      <React.Fragment>
        {openButton(this.showModal)}
        <Modal
          title={title}
          visible={visible}
          onOk={this.handleOk}
          confirmLoading={loading}
          onCancel={this.handleCancel}
          {...renderFooterOpts}
        >
          {body}
          <LightForm
            wrappedComponentRef={inst => (this.form = idx(inst, _ => _.props.form) as any)}
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
