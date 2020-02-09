import { createLogger } from '@asuna-admin/logger';
import { WrappedFormUtils } from 'antd/es/form/Form';
import { StringArray } from 'asuna-components';
import * as React from 'react';

import { generateComponent, horizontalFormItemLayout, IFormItemLayout } from '.';

const logger = createLogger('components:dynamic-form:string-array');

export type StringArrayOptions = {
  key: string;
  name: string;
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  mode?: 'input' | 'tag';
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
    <StringArray mode={mode} items={items || []} onChange={onChange} />,
    formItemLayout,
  );
}
