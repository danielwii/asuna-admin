import * as React from 'react';

import { horizontalFormItemLayout, generateComponent, IFormItemLayout } from '.';
import { Config } from '../../../config';
import { createLogger } from '../../../logger';
import { FileUploader } from '../FileUploader';

import type { FormInstance } from 'antd';

const logger = createLogger('components:dynamic-form:files');

export const generateFile = (
  form: FormInstance,
  options,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
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
    (props) => <FileUploader key={fieldName} many={false} urlHandler={handler} jsonMode {...props} />,
    formItemLayout,
  );
};

export const generateFiles = (
  form: FormInstance,
  options,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
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
    (props) => <FileUploader key={fieldName} many={true} urlHandler={handler} jsonMode {...props} />,
    formItemLayout,
  );
};
