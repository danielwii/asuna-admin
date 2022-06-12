import { FormInstance, message, Modal } from 'antd';
import * as R from 'ramda';
import React, { useState } from 'react';

import { toErrorMessage, toFormErrors } from '../helpers/error';
import { createLogger } from '../logger';
import { DynamicForm } from './DynamicForm';

import type { DynamicFormField } from './DynamicForm/render';

const logger = createLogger('components:form-modal-button');

interface ILightForm {
  form;
  fields;
  onChange: (value) => void;
  onSubmit: (fn: (e: Error) => void) => void;
}

/*
const LightForm = Form.create<ILightForm>({
  mapPropsToFields({ fields }) {
    return _.mapValues(fields, (field) => Form.createFormField({ ...field }));
  },
  onFieldsChange({ onChange }, changedFields) {
    onChange(changedFields);
  },
})(DynamicForm) as any;
*/

const LightForm = ({ fields, ...props }) => {
  // const convertedFields = _.mapValues(fields, (field) => Form.createFormField({ ...field }));
  return <DynamicForm fields={fields} {...(props as any)} />;
};

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

export const FormModalButton: React.VFC<IFormModalProps> = ({
  fields,
  openButton,
  title,
  footer,
  body,
  onOperations,
  onRefresh,
  onSubmit,
  onChange,
}) => {
  let formRef;
  const [state, setState] = useState<IState>(() => ({ visible: false, loading: false, fields: fields }));

  const func = {
    handleOk: () => {
      formRef
        .validateFields()
        .then(async (values) => {
          setState({ ...state, loading: true });
          try {
            const response = await onSubmit!(values).finally(() => onRefresh && onRefresh());
            logger.log('response is', response);
            setState({
              visible: false,
              loading: false,
              fields: R.map<any, any>((field) => ({ ...field, value: undefined }))(state.fields as any) as any,
            });
          } catch (e) {
            const errors = toFormErrors(e.response);
            logger.error('[FormModal][handleOk]', { e, errors });
            message.error(toErrorMessage(errors));
            func.handleFormChange(errors);
            setState({ ...state, loading: false });
          }
        })
        .catch((reason) => {
          logger.error('[FormModal][handleOk]', 'error occurred in form', reason);
        });
    },
    handleFormChange: (changedFields) => {
      const merged = R.mergeDeepRight(state.fields as any, changedFields);
      logger.log('[handleFormChange]', { fields: state.fields, changedFields, merged });
      setState({ ...state, fields: merged });
    },
  };

  const extraOperations =
    onOperations != null
      ? onOperations({
          loading: state.loading,
          updateState: (state: Partial<IState>) => setState(state as IState),
          handleCancel: () => setState({ ...state, visible: false }),
        })
      : {};

  // show default footer when custom footer is undefined
  const renderFooterOpts =
    footer != null
      ? {
          footer: footer({
            loading: state.loading,
            params: state.params,
            operations: {
              handleOk: func.handleOk,
              handleCancel: () => setState({ ...state, visible: false }),
              ...extraOperations,
            },
          }),
        }
      : null;

  return (
    <>
      {openButton(() => setState({ ...state, visible: true }))}
      <Modal
        title={title}
        visible={state.visible}
        onOk={func.handleOk}
        confirmLoading={state.loading}
        onCancel={() => setState({ ...state, visible: false })}
        {...renderFooterOpts}
      >
        {body}
        {fields && (
          <LightForm
            formRef={(form) => (formRef = form)}
            /*
            wrappedComponentRef={inst => {
              console.log('wrappedComponentRef', inst);
              return (this.form = inst?.props?.form);
            }}
*/
            delegate
            fields={fields}
            onSubmit={func.handleOk}
            onChange={func.handleFormChange}
          />
        )}
      </Modal>
    </>
  );
};
