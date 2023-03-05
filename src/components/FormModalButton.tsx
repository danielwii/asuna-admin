import { Button, Modal, message } from 'antd';
import * as R from 'ramda';
import React, { useState } from 'react';
import { useLogger } from 'react-use';
import useToggle from 'react-use/lib/useToggle';

import { toErrorMessage, toFormErrors } from '../helpers/error';
import { createLogger } from '../logger';
import { DynamicForm } from './DynamicForm';
import { WithSuspense } from './base/helper/helper';

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
  openButton: (showModal: () => void) => React.ReactElement;
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

export const AsyncModalButton: React.FC<
  Pick<IFormModalProps, 'title'> & { children: (props: { data; onClose: () => void }) => React.ReactElement } & {
    future;
  }
> = ({ title, future, children }) => {
  const [open, setOpen] = useToggle(false);

  useLogger('<[AsyncModalButton]>', { open });

  return (
    <Button size="small" type="dashed">
      <span onClick={() => setOpen(true)}>{title}</span>
      {open && (
        <WithSuspense future={future} fallback="...">
          {(data) => children({ data, onClose: () => setOpen(false) })}
        </WithSuspense>
      )}
    </Button>
  );
};

export const FormModalButton: React.FC<IFormModalProps> = ({ openButton, ...props }) => {
  const [state, setState] = useState({ visible: false });

  useLogger('<[FormModalButton]>', state);

  return (
    <>
      {openButton(() => setState({ visible: true }))}
      {state.visible && <FormModal onClose={() => setState({ visible: false })} {...props} />}
    </>
  );
};

export const FormModal: React.FC<Omit<IFormModalProps, 'openButton'> & { onClose: () => void }> = ({
  fields,
  title,
  footer,
  body,
  onOperations,
  onRefresh,
  onSubmit,
  onChange,
  onClose,
}) => {
  let formRef;
  const [state, setState] = useState<Omit<IState, 'visible'>>(() => ({ loading: false, fields: fields }));

  const func = {
    handleOk: () => {
      formRef
        .validateFields()
        .then(async (values) => {
          setState({ ...state, loading: true });
          try {
            const response = await onSubmit!(values).finally(() => {
              onRefresh && onRefresh();
              onClose && onClose();
            });
            logger.log('response is', response);
            setState({
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
          setState({ ...state, loading: false });
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
          handleCancel: () => {
            onClose();
            // setState({ ...state, visible: false });
          },
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
              handleCancel: () => {
                onClose();
                // setState({ ...state, visible: false });
              },
              ...extraOperations,
            },
          }),
        }
      : null;

  useLogger('<[FormModalButton]>', state, { onClose });

  return (
    <Modal
      open
      title={title}
      onOk={func.handleOk}
      confirmLoading={state.loading}
      onCancel={() => {
        onClose();
        // setState({ ...state, visible: false });
      }}
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
  );
};
