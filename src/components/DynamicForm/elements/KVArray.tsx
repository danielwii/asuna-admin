import React from 'react';

import { generateComponent, horizontalFormItemLayout, IFormItemLayout } from '.';
import { createLogger } from '../../../logger';
import { WithVariable } from '../../base/helper/helper';
import { KvArray, KvArrayItem, KvArrayProps } from '../../base/kv-array';

import type { FormInstance } from 'antd';

const logger = createLogger('components:dynamic-form:kv-array');

export type KVArrayOptions = {
  key: string;
  name: string;
  label: string;
  items: KvArrayItem[];
  onChange: (items: KvArrayItem[]) => void;
  mode?: 'input' | 'tag';
};

const KVArrayHOC: React.FC<Partial<KvArrayProps>> = (props) => {
  // useLogger(`KvArray(key=${KVArrayHOC.name})`, props);
  return (
    <WithVariable variable={props as KvArrayProps}>
      {(props) => <KvArray {...props} onChange={(items) => props.onChange(items)} />}
    </WithVariable>
  );
};

export function generateKVArray(
  form: FormInstance,
  { key, name, label, items, onChange, mode }: KVArrayOptions,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) {
  const fieldName = key || name;
  const labelName = label || name || key;
  logger.debug('[generateKVArray]', { items });

  return generateComponent(
    form,
    { fieldName, labelName },
    (props) => <KVArrayHOC items={[...(items ?? [])]} {...props} />,
    formItemLayout,
  );
}
