import * as React from 'react';

export enum FormFieldType {
  string = 'string',
  color = 'color',
  number = 'number',
  image = 'image',
  text = 'text',
  boolean = 'boolean',
  stringTmpl = 'string-tmpl',
  wxTmplData = 'wx-tmpl-data',
  wxSubscribeData = 'wx-subscribe-data',
}

export type FormField<ExtraProps = any> = {
  name: string;
  type: FormFieldType;
  validate?: (value) => string | null;
  help?: React.ReactChild;
  required?: boolean;
  defaultValue?: boolean | number | string;
  extra?: ExtraProps
};

export type FormFields<ExtraProps = any> = { [key: string]: FormField<ExtraProps> };
export type FormFieldDef<ExtraProps = any> = { name: string; field: FormField<ExtraProps> };
export type FormFieldsGroup<ExtraProps = any> = { name?: string; fields: FormFieldDef<ExtraProps>[] };
