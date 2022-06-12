import * as React from 'react';

import { generateComponent, horizontalFormItemLayout, IFormItemLayout } from '.';
import { createLogger } from '../../../logger';
import { WithVariable } from '../../base/helper/helper';
import { IStringArrayProps, StringArray } from '../../base/string-array';

import type { FormInstance } from 'antd';

const logger = createLogger('components:dynamic-form:string-array');

export type StringArrayOptions = {
  key: string;
  name: string;
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  mode?: 'input' | 'tag';
};

const StringArrayHOC: React.FC<Partial<IStringArrayProps>> = (props) => {
  // useLogger(`StringArray(key=${StringArrayHOC.name})`, props);
  return (
    <WithVariable /*key={props.id}*/ variable={props as IStringArrayProps}>
      {(props) => <StringArray {...props} onChange={(items) => props.onChange(items)} />}
    </WithVariable>
  );
};

export function generateStringArray(
  form: FormInstance,
  { key, name, label, items, onChange, mode }: StringArrayOptions,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) {
  const fieldName = key || name;
  const labelName = label || name || key;
  logger.debug('[generateStringArray]', { items });

  return generateComponent(
    form,
    { fieldName, labelName },
    (props) => <StringArrayHOC mode={mode} items={[...(items ?? [])]} {...props} />, // todo
    formItemLayout,
  );
}
