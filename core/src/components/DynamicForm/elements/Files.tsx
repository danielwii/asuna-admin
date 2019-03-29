import React from 'react';
import { WrappedFormUtils } from 'antd/es/form/Form';

import { FilesUploader } from '../FilesUploader';
import { defaultFormItemLayout, generateComponent, IFormItemLayout } from '.';

import { Config } from '@asuna-admin/config';
import { createLogger } from '@asuna-admin/logger';

const logger = createLogger('components:dynamic-form:files');

export const generateFile = (
  form: WrappedFormUtils,
  options,
  formItemLayout: IFormItemLayout = defaultFormItemLayout,
) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  const host = Config.get('FILE_HOST');
  const prefix = Config.get('FILE_PREFIX');
  const handler = Config.get('FILE_RES_HANDLER');
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    // TODO jsonMode need to setup dynamically later
    <FilesUploader many={false} host={host} prefix={prefix} urlHandler={handler} jsonMode />,
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
  const host = Config.get('FILE_HOST');
  const prefix = Config.get('FILE_PREFIX');
  const handler = Config.get('FILE_RES_HANDLER');
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    // TODO jsonMode need to setup dynamically later
    <FilesUploader many={true} host={host} prefix={prefix} urlHandler={handler} jsonMode />,
    formItemLayout,
  );
};
