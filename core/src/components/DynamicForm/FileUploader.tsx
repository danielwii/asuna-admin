import { valueToArrays, valueToUrl } from '@asuna-admin/core/url-rewriter';
import { upload } from '@asuna-admin/helpers/upload';
import { createLogger } from '@asuna-admin/logger';
import { Asuna } from '@asuna-admin/types';

import { Button, Icon, Input, message, Upload } from 'antd';
import { UploadFile, UploadFileStatus } from 'antd/es/upload/interface';
import { UploadChangeParam, UploadProps } from 'antd/lib/upload';
import * as _ from 'lodash';
import React, { useState } from 'react';

const logger = createLogger('components:dynamic-form:files');

export interface IFilesUploaderProps {
  key?: string;
  // host?: string;
  bucket?: string;
  urlHandler?: (res: Asuna.Schema.UploadResponse) => string;
  value?: string | string[];
  onChange?: (value: any) => void;
  many?: boolean;
  fileSize?: number;
  jsonMode?: boolean;
}

interface IState {
  uploadFiles: UploadFile[];
}

const urlToUploadFile = (url, index) => ({
  uid: `${index}`,
  name: valueToUrl(url, { type: 'file' }),
  status: 'done' as UploadFileStatus,
  url: valueToUrl(url, { type: 'file' }),
  size: 0,
  type: '',
});

function transformToUploadFiles(value?: string | string[]): UploadFile[] {
  return valueToArrays(value).map(urlToUploadFile);
}

export const FileUploader = (props: IFilesUploaderProps) => {
  const [state, setState] = useState<IState>({
    uploadFiles: transformToUploadFiles(props.value),
  });

  logger.log('render', { props, state });

  const valueToSubmit = (value?: string | string[], extra?: string): string | string[] => {
    const uploadedFiles = valueToArrays(value);
    logger.log('[FileUploader][customRequest]', { uploadedFiles });
    // 构造一个已上传文件的列表，最新的放在最后面
    let files: string | string[] = _.compact(_.flattenDeep([uploadedFiles, extra]));
    // 当当前模式是单文件上传模式时，取最后一个文件为当前文件
    files = props.many ? files : [_.last(files) || ''];
    if (!props.jsonMode) {
      // cast to string
      files = files.join(',');
    }
    return files;
  };

  const uploadProps: UploadProps = {
    customRequest(option) {
      logger.log('[FileUploader][customRequest]', option);
      const { onChange, urlHandler, bucket, jsonMode } = props;

      upload(
        option.file,
        {
          onUploadProgress: ({ total, loaded }) => {
            option.onProgress({ percent: +Math.round((loaded / total) * 100).toFixed(2) }, option.file);
          },
        },
        { bucket },
      )
        .then(uploaded => {
          logger.log('[FileUploader][customRequest]', { uploaded });
          if (uploaded) {
            logger.log('[FileUploader][customRequest]', { props, state });
            const resolvedUrl = urlHandler ? urlHandler(uploaded[0]) : `${uploaded[0]}`;
            let fileUrl = resolvedUrl;
            // FIXME set uploads to the uploads endpoint in the global environment
            // if (!resolvedUrl.startsWith('http') && !resolvedUrl.startsWith('uploads' || '')) {
            //   fileUrl = join('uploads' || '', resolvedUrl);
            // }
            // logger.log('[FileUploader][customRequest]', { file: fileUrl, bucket, resolvedUrl });

            const files = valueToSubmit(props.value, fileUrl);
            logger.log('[FileUploader][customRequest]', { files });
            onChange!(files);
            option.onSuccess(uploaded, option.file);
            // wrapFilesToFileList(option.file, files);
          }
        })
        .catch(option.onError);
    },
    multiple: false,
    supportServerRender: true,
    onChange(info: UploadChangeParam) {
      setState({ uploadFiles: [...info.fileList] });
      if (info.file.status !== 'uploading') {
        logger.log('[FileUploader][onChange]', info.file, info.fileList);
      }
      if (info.file.status === 'done') {
        logger.log('[FileUploader][onChange]', info.file, info.fileList);
        setState({
          uploadFiles: _.compact(props.many ? info.fileList : [_.last(info.fileList)]),
        });
        message.success(`${info.file.name} file uploaded successfully`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  return (
    <div key={props.key}>
      <Upload {...uploadProps} fileList={state.uploadFiles as UploadFile[]}>
        <Button>
          <Icon type="upload" /> Click to Upload
        </Button>
      </Upload>
      <Input.TextArea
        value={_.isString(props.value) ? props.value : JSON.stringify(props.value)}
        autoSize={{ minRows: 2, maxRows: 6 }}
        onChange={event => {
          props.onChange!(JSON.parse(event.target.value));
          setState({ uploadFiles: transformToUploadFiles(event.target.value) });
        }}
      />
    </div>
  );
};
