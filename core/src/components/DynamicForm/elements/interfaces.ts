import { GetFieldDecoratorOptions } from 'antd/es/form/Form';
import { FIELD_DATA_PROP, FIELD_META_PROP } from 'antd/lib/form/constants';

export type FormComponentProps<T = any, FieldOptions = any> = {
  value: T;
  id: string;
  onChange: (...args) => void;
  [FIELD_META_PROP]: GetFieldDecoratorOptions;
  [FIELD_DATA_PROP]: { name: string; ref: string; type: string; options: FieldOptions; value: T };
};
