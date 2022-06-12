import React from 'react';

import type { IUploaderProps } from '../uploader/uploader';
import type { AsunaSelectProps } from '../select/select';

export enum FormFieldType {
  string = 'string',
  color = 'color',
  number = 'number',
  image = 'image',
  images = 'images',
  json = 'json',
  text = 'text',
  select = 'select',
  stringArray = 'stringArray',
  boolean = 'boolean',
  stringTmpl = 'stringTmpl',
  wxTmplData = 'wxTmplData',
  emailTmplData = 'emailTmplData',
  wxSubscribeData = 'wxSubscribeData',
}

interface BasicFormField<ExtraProps = undefined> {
  name: string;
  type: keyof typeof FormFieldType;
  validate?: (value) => string | null;
  help?: React.ReactChild;
  required?: boolean;
  defaultValue?: boolean | number | string;
  extra?: ExtraProps;
}

export type UploadFormField = { type: 'image' } & BasicFormField<
  Pick<IUploaderProps, 'adapter' | 'multiple' | 'enableDragMode'>
>;

export type SelectFormField = { type: 'select' } & BasicFormField<AsunaSelectProps>;

export type FormField = BasicFormField | SelectFormField | UploadFormField;

export type FormFields = Record<string, FormField>;
export interface FormFieldDef {
  name: string;
  field: FormField;
}
export interface FormFieldsGroup {
  name?: string;
  fields: FormFieldDef[];
}
