import { WrappedFormUtils } from '@ant-design/compatible/es/form/Form';

import { IStringArrayProps, StringArray, WithVariable } from 'asuna-components';
import * as React from 'react';

import { generateComponent, horizontalFormItemLayout, IFormItemLayout } from '.';
import { FormComponentProps } from '../../../components/DynamicForm/elements/interfaces';
import { createLogger } from '../../../logger';

const logger = createLogger('components:dynamic-form:string-array');

export type StringArrayOptions = {
  key: string;
  name: string;
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  mode?: 'input' | 'tag';
};

const StringArrayHOC: React.FC<Partial<FormComponentProps> & Partial<IStringArrayProps>> = (props) => {
  // useLogger(`StringArray(key=${StringArrayHOC.name})`, props);
  return (
    <WithVariable key={props.id} variable={props as FormComponentProps & IStringArrayProps}>
      {(props) => <StringArray {...props} onChange={(items) => props.onChange(items)} />}
    </WithVariable>
  );
};

export function generateStringArray(
  form: WrappedFormUtils,
  { key, name, label, items, onChange, mode }: StringArrayOptions,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) {
  const fieldName = key || name;
  const labelName = label || name || key;
  logger.debug('[generateStringArray]', { items });

  return generateComponent(
    form,
    { fieldName, labelName },
    <StringArrayHOC mode={mode} items={[...(items ?? [])]} />, // todo
    formItemLayout,
  );
}
