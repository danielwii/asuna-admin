import * as React from 'react';

import { storiesOf } from '@storybook/react';

import { Form } from 'antd';

import DynamicForm, { buildForm, generateInput } from '../src/components/DynamicForm/index';

storiesOf('DynamicForm', module)
  .add('Component Input', () => {
    const WrappedInput = Form.create()(({ form }) =>
      generateInput(form, {
        name: 'Title',
      }),
    );
    const WrappedRequiredInput = Form.create()(({ form }) =>
      generateInput(form, {
        name: 'Title required',
        required: true,
      }),
    );
    const WrappedWithPlaceholderInput = Form.create()(({ form }) =>
      generateInput(
        form,
        {
          name: 'Title with placeholder',
          placeholder: 'type title here.',
        },
        { labelCol: { span: 6 }, wrapperCol: { span: 18 } },
      ),
    );
    const WrappedWithOffsetInput = Form.create()(({ form }) =>
      generateInput(
        form,
        {
          name: 'Title with offset',
          placeholder: 'type title here.',
        },
        { labelCol: { span: 4, offset: 4 }, wrapperCol: { span: 12 } },
      ),
    );
    return (
      <div>
        <WrappedInput />
        <WrappedRequiredInput />
        <WrappedWithPlaceholderInput />
        <WrappedWithOffsetInput />
      </div>
    );
  })
  .add('Dynamic Component Input', () => {
    const definitions = [{ type: 'Input', config: { name: 'Title' } }];
    const DynamicInput = Form.create()(({ form }) => buildForm(form, definitions));
    return <DynamicInput />;
  })
  .add('default', () => <DynamicForm />);
