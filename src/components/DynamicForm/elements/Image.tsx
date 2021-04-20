import { WrappedFormUtils } from '@ant-design/compatible/es/form/Form';

import { IUploadedFile, IUploaderProps, Uploader, UploaderAdapter, WithVariable } from '@danielwii/asuna-components';
import { AxiosRequestConfig } from 'axios';
import * as _ from 'lodash';
import * as React from 'react';
import { useLogger } from 'react-use';

import { generateComponent, horizontalFormItemLayout, IFormItemLayout } from '.';
import { Config } from '../../../config';
import { upload, validateFile } from '../../../helpers/upload';
import { createLogger } from '../../../logger';
import { ImageTrivia } from '../ImageTrivia';
import { FormComponentProps } from './interfaces';

const logger = createLogger('components:dynamic-form:image');

const UploaderHOC: React.FC<Partial<FormComponentProps> & Partial<IUploaderProps>> = (props) => {
  useLogger(`Images(key=${UploaderHOC.name})`, props);
  return (
    <WithVariable key={props.id} variable={props as FormComponentProps & Partial<IUploaderProps>}>
      {(props) => {
        useLogger('generateImages', props);
        const uploadOpts = _.get(props, 'data-__field.options.uploadOpts');
        return <Uploader adapter={new FileUploaderAdapterImpl(uploadOpts)} {...props} />;
      }}
    </WithVariable>
  );
};

export const generateImages = (
  form: WrappedFormUtils,
  options,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    <UploaderHOC multiple jsonMode />,
    formItemLayout,
  );
};

export class FileUploaderAdapterImpl implements UploaderAdapter {
  constructor(private params?: { bucket?: string; prefix?: string }) {}
  upload(file: File, requestConfig?: AxiosRequestConfig): Promise<IUploadedFile[]> {
    return upload(file, requestConfig, this.params) as any;
  }

  validate(file: File): boolean {
    return validateFile(file);
  }
}

export const generateImage = (
  form: WrappedFormUtils,
  options,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(form, { fieldName, labelName, ...options }, <UploaderHOC />, formItemLayout);
};

export function generateRichImage(
  form: WrappedFormUtils,
  fields: FormField[],
  options,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
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
