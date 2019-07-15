import { Config } from '@asuna-admin/config';
import { createLogger } from '@asuna-admin/logger';

import { WrappedFormUtils } from 'antd/es/form/Form';
import React from 'react';

import { defaultFormItemLayout, generateComponent, IFormItemLayout } from '.';
import { FileUploader } from '../FileUploader';

const logger = createLogger('components:dynamic-form:files');

export const generateFile = (
  form: WrappedFormUtils,
  options,
  formItemLayout: IFormItemLayout = defaultFormItemLayout,
) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  // const host = Config.get('FILE_HOST');
  const handler = Config.get('FILE_RES_HANDLER');
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    // TODO jsonMode need to setup dynamically later
    <FileUploader many={false} urlHandler={handler} jsonMode />,
    formItemLayout,
  );
};

export const generateFiles = (
  form: WrappedFormUtils,
  options,
  formItemLayout: IFormItemLayout = defaultFormItemLayout,
) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  // const host = Config.get('FILE_HOST');
  const handler = Config.get('FILE_RES_HANDLER');
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    // TODO jsonMode need to setup dynamically later
    <FileUploader many={true} urlHandler={handler} jsonMode />,
    formItemLayout,
  );
};
