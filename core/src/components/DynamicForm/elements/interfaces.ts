import { GetFieldDecoratorOptions } from '@ant-design/compatible/es/form/Form';
import { FIELD_DATA_PROP, FIELD_META_PROP } from '@ant-design/compatible/es/form/constants';

export type FormComponentProps<T = any, FieldOptions = any> = {
  value: T;
  id: string;
  onChange: (...args) => void;
  [FIELD_META_PROP]: GetFieldDecoratorOptions;
  [FIELD_DATA_PROP]: { name: string; ref: string; type: string; options: FieldOptions; value: T };
};
