import { toErrorMessage, toFormErrors } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';

import { Form, message, Modal } from 'antd';
import { WrappedFormUtils } from 'antd/es/form/Form';
import * as _ from 'lodash';
import * as R from 'ramda';
import * as React from 'react';

import { DynamicForm, DynamicFormField } from './DynamicForm';

const logger = createLogger('components:form-modal-button');

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
  onFieldsChange({ onChange }, changedFields) {
    onChange(changedFields);
  },
})(DynamicForm) as any;

export interface IFormModalProps {
  title: React.ReactNode;
  openButton: (showModal: () => void) => React.ReactChild;
  fields?: { [key: string]: DynamicFormField };
  body?: React.ReactNode;
  footer?: ({ loading, operations, params }) => React.ReactNode;
  onChange?: (value) => void;
  onSubmit?: (value?: any) => Promise<any>;
  onOperations?: ({ loading, updateState, handleCancel }) => any;
  onRefresh?: () => any;
}

interface IState {
  fields?: { [key: string]: DynamicFormField };
  params?: any;
  visible: boolean;
  loading: boolean;
}

export class FormModalButton extends React.Component<IFormModalProps, IState> {
  form: WrappedFormUtils;

  constructor(props: Readonly<IFormModalProps>) {
    super(props);

    this.state = {
      visible: false,
      loading: false,
      fields: props.fields,
    };
  }

  showModal = () => this.setState({ visible: true });

  handleOk = () => {
    const { onSubmit, onRefresh } = this.props;
    const { fields } = this.state;
    this.form.validateFields(async (err, values) => {
      if (err) {
        logger.error('[FormModal][handleOk]', 'error occurred in form', { values, err });
      } else {
        this.setState({ loading: true });
        try {
          const response = await onSubmit!(values).finally(() => onRefresh && onRefresh());
          logger.log('response is', response);
          this.setState({
            visible: false,
            loading: false,
            fields: R.map(field => ({ ...field, value: undefined }))(fields),
          });
        } catch (e) {
          const errors = toFormErrors(e.response);
          logger.error('[FormModal][handleOk]', { e, errors });
          message.error(toErrorMessage(errors));
          this.handleFormChange(errors);
          this.setState({ loading: false });
        }
      }
    });
  };

  handleFormChange = changedFields => {
    const { fields } = this.state;
    const merged = R.mergeDeepRight(fields, changedFields);
    logger.log('[handleFormChange]', { fields, changedFields, merged });
    this.setState({ fields: merged });
  };

  handleCancel = () => this.setState({ visible: false });

  render() {
    const { title, openButton, footer, body, onOperations } = this.props;
    const { fields, visible, loading, params } = this.state;

    const extraOperations =
      onOperations != null
        ? onOperations({
            loading,
            updateState: (state: Partial<IState>) => this.setState(state as IState),
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
          {fields && (
            <LightForm
              formRef={form => (this.form = form)}
              /*
              wrappedComponentRef={inst => {
                console.log('wrappedComponentRef', inst);
                return (this.form = inst?.props?.form);
              }}
*/
              delegate
              fields={fields}
              onSubmit={this.handleOk}
              onChange={this.handleFormChange}
            />
          )}
        </Modal>
      </React.Fragment>
    );
  }
}
