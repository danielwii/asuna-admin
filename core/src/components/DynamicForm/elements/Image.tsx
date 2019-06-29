import React from 'react';
import { WrappedFormUtils } from 'antd/es/form/Form';

import { ImageUploader } from '../ImageUploader';
import { defaultFormItemLayout, generateComponent, IFormItemLayout } from '.';
import { ImageTrivia } from '../ImageTrivia';

import { Config } from '@asuna-admin/config';
import { createLogger } from '@asuna-admin/logger';

const logger = createLogger('components:dynamic-form:image');

export const generateImages = (
  form: WrappedFormUtils,
  options,
  formItemLayout: IFormItemLayout = defaultFormItemLayout,
) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  // const host = Config.get('IMAGE_HOST');
  const handler = Config.get('IMAGE_RES_HANDLER');
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    // TODO jsonMode need to setup dynamically later
    <ImageUploader many={true} urlHandler={handler} jsonMode />,
    formItemLayout,
  );
};

export const generateImage = (
  form: WrappedFormUtils,
  options,
  formItemLayout: IFormItemLayout = defaultFormItemLayout,
) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  // const host = Config.get('IMAGE_HOST');
  const handler = Config.get('IMAGE_RES_HANDLER');
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    <ImageUploader many={false} urlHandler={handler} />,
    formItemLayout,
  );
};

export function generateRichImage(
  form: WrappedFormUtils,
  fields: FormField[],
  options,
  formItemLayout: IFormItemLayout = defaultFormItemLayout,
) {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  // const host = Config.get('IMAGE_HOST');
  const handler = Config.get('IMAGE_RES_HANDLER');

  logger.log('[generateRichImage]', { fields, options });

  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    <ImageTrivia urlHandler={handler} />,
    formItemLayout,
  );
}
