import { UploadOutlined } from '@ant-design/icons';

import { parseJSONIfCould } from '@danielwii/asuna-helper/dist/utils';

import { Button, Input, message, Upload } from 'antd';
import * as _ from 'lodash';
import React from 'react';

import { valueToArrays, valueToUrl } from '../../core/url-rewriter';
import { upload } from '../../helpers/upload';
import { createLogger } from '../../logger';

import type { Asuna } from '../../types';
import type { UploadFile, UploadFileStatus, UploadProps } from 'antd/es/upload/interface';

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

const urlToUploadFile = (url, index): UploadFile => ({
  originFileObj: {
    /*FIXME*/
  } as any,
  uid: `${index}`,
  name: valueToUrl(url, { type: 'file' }),
  status: 'done' as UploadFileStatus,
  url: valueToUrl(url, { type: 'file' }),
  size: 0,
  type: '',
});

const transformToUploadFiles = (value?: string | string[]): UploadFile[] => valueToArrays(value).map(urlToUploadFile);

export class FileUploader extends React.Component<IFilesUploaderProps> {
  state = {
    uploadFiles: transformToUploadFiles(this.props.value),
  };

  valueToSubmit(value?: string | string[], extra?: string): string | string[] {
    const uploadedFiles = valueToArrays(value);
    logger.log('[FileUploader][customRequest]', { uploadedFiles });
    // 构造一个已上传文件的列表，最新的放在最后面
    let files: string | string[] = _.compact(_.flattenDeep([uploadedFiles, extra]));
    // 当当前模式是单文件上传模式时，取最后一个文件为当前文件
    files = this.props.many ? files : _.takeRight(files);
    if (!this.props.jsonMode && _.isArray(files)) {
      // cast to string
      files = files.join(',');
    }
    return files;
  }

  render() {
    const { uploadFiles } = this.state;

    const uploadOpts = _.get(this.props, 'data-__field.options.uploadOpts');
    logger.log('render', this.props, this.state, uploadOpts);

    const uploadProps: UploadProps = {
      customRequest: (option) => {
        logger.log('[FileUploader][customRequest]', option);
        const { onChange, urlHandler, bucket, jsonMode } = this.props;

        upload(
          option.file,
          {
            onUploadProgress: ({ total, loaded }) => {
              (option.onProgress as any)(
                { percent: total ? +Math.round((loaded / total) * 100).toFixed(2) : 0 },
                option.file,
              );
            },
          },
          uploadOpts ?? { bucket },
        )
          .then((uploaded) => {
            logger.log('[FileUploader][customRequest]', { uploaded });
            if (uploaded) {
              logger.log('[FileUploader][customRequest]', this.props, this.state);
              const resolvedUrl = urlHandler ? urlHandler(uploaded[0]) : `${uploaded[0]}`;
              let fileUrl = resolvedUrl;
              // FIXME set uploads to the uploads endpoint in the global environment
              // if (!resolvedUrl.startsWith('http') && !resolvedUrl.startsWith('uploads' || '')) {
              //   fileUrl = join('uploads' || '', resolvedUrl);
              // }
              // logger.log('[FileUploader][customRequest]', { file: fileUrl, bucket, resolvedUrl });

              const files = this.valueToSubmit(this.props.value, fileUrl);
              logger.log('[FileUploader][customRequest]', { files });
              onChange!(files);
              (option.onSuccess as any)(uploaded, option.file);
              // wrapFilesToFileList(option.file, files);
            }
          })
          .catch(option.onError);
      },
      multiple: false,
      supportServerRender: true,
      onChange: (info) => {
        this.setState({ uploadFiles: [...info.fileList] });
        if (info.file.status !== 'uploading') {
          logger.log('[FileUploader][onChange]', info.file, info.fileList);
        }
        if (info.file.status === 'done') {
          logger.log('[FileUploader][onChange]', info.file, info.fileList);
          this.setState({
            uploadFiles: _.compact(this.props.many ? info.fileList : [_.last(info.fileList)]),
          });
          message.success(`${info.file.name} file uploaded successfully`);
        } else if (info.file.status === 'error') {
          message.error(`${info.file.name} file upload failed.`);
        }
      },
      fileList: uploadFiles,
    };

    return (
      <div key={this.props.key}>
        <Upload {...uploadProps}>
          <Button>
            <UploadOutlined /> upload
          </Button>
        </Upload>
        <Input.TextArea
          value={_.isString(this.props.value) ? this.props.value : JSON.stringify(this.props.value)}
          autoSize={{ minRows: 2, maxRows: 6 }}
          onChange={(event) => {
            this.props.onChange!(parseJSONIfCould(event.target.value));
            this.setState({ uploadFiles: transformToUploadFiles(event.target.value) });
          }}
        />
      </div>
    );
  }
}
