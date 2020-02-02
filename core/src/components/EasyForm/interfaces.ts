import * as React from 'react';

export enum FormFieldType {
  string = 'string',
  color = 'color',
  number = 'number',
  image = 'image',
  text = 'text',
  boolean = 'boolean',
  wxTmplData = 'wx-tmpl-data',
  wxSubscribeData = 'wx-subscribe-data',
}

export type FormField = {
  name: string;
  type: FormFieldType;
  validate?: (value) => string | null;
  help?: React.ReactChild;
  required?: boolean;
  defaultValue?: boolean | number | string;
};

export type FormFields = { [key: string]: FormField };
export type FormFieldDef = { name: string; field: FormField };
export type FormFieldsGroup = { name?: string; fields: FormFieldDef[] };
