import { UploadOutlined } from '@ant-design/icons';

import { Button, Input, Modal, Upload } from 'antd';
import { UploadProps, RcFile, UploadChangeParam, UploadFile, UploadFileStatus } from 'antd/es/upload/interface';
import * as _ from 'lodash';
import * as React from 'react';

import { valueToArrays, valueToUrl } from '../../core/url-rewriter';
import { diff } from '../../helpers';
import { upload, validateFile } from '../../helpers/upload';
import { createLogger } from '../../logger';
import { Asuna } from '../../types';

const logger = createLogger('components:dynamic-form:images');

// --------------------------------------------------------------
// Uploader
// --------------------------------------------------------------

interface IProps {
  // FIXME 目前从 url-rewriter 中获取附件前缀，未来考虑单独传入图片地址解析器，而无需从属性中获取相关知识
  // host?: string;
  key?: string;
  bucket?: string;
  urlHandler?: (res: Asuna.Schema.UploadResponse) => string;
  value?: string;
  onChange?: (value: any) => void;
  many?: boolean;
  fileSize?: number;
  jsonMode?: boolean;
}

interface IState {
  fileList: UploadFile[];
  many: boolean;
  fileSize: number;
  previewImage?: string;
  previewVisible?: boolean;
}

export class ImageUploader extends React.Component<IProps, IState> {
  state = {
    previewVisible: false,
    previewImage: '',
    fileList: ImageUploader.wrapImagesToFileList(this.props.value),
    many: !!this.props.many,
    fileSize: this.props.many ? this.props.fileSize || 50 : 1,
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.value) {
      logger.debug('[getDerivedStateFromProps]', { nextProps, prevState }, nextProps.value);
      return { fileList: ImageUploader.wrapImagesToFileList(nextProps.value) };
    }

    // Return null to indicate no change to state.
    return null;
  }

  /*
  getSnapshotBeforeUpdate(prevProps, prevState) {
    logger.debug('[getSnapshotBeforeUpdate]', { prevProps, prevState });
  }
*/

  shouldComponentUpdate(nextProps, nextState) {
    const TAG = '[shouldComponentUpdate]';
    const propsDiff = diff(this.props.value, nextProps.value);
    const stateDiff = diff(this.state, nextState);
    const shouldUpdate = propsDiff.isDifferent || stateDiff.isDifferent;
    if (shouldUpdate) {
      logger.debug(TAG, { nextProps, nextState }, propsDiff, stateDiff, shouldUpdate);
    }
    return shouldUpdate;
  }

  static wrapImagesToFileList = (imagesInfo?: string | string[]): UploadFile[] => {
    const images = valueToArrays(imagesInfo);
    const fileList = _.map<any, Partial<UploadFile>>(images, (image, index) => ({
      uid: `${index}`,
      status: 'done' as UploadFileStatus,
      name: valueToUrl(image, { type: 'image', thumbnail: {} }),
      url: valueToUrl(image, { type: 'image', thumbnail: {} }),
      thumbUrl: valueToUrl(image, { type: 'image', thumbnail: { width: 200, height: 200 } }),
    })) as any;
    logger.debug('[wrapImagesToFileList]', 'fileList is', fileList);
    return fileList;
  };

  handleCancel = () => {
    logger.log('[ImageUploader][handleCancel]', { props: this.props, state: this.state });
    this.setState({ previewVisible: false });
  };

  handlePreview = (file: UploadFile) => {
    this.setState({
      previewImage: file.url || file.thumbUrl,
      previewVisible: true,
    });
  };

  // updated file status will received here, maybe will handled later
  handleChange = (info: UploadChangeParam): void => {
    logger.log('[ImageUploader][handleChange]', { info });
    const { onChange, jsonMode } = this.props;
    // const images = _.compact(info.fileList.map(file => file.url)).join(',');
    // 这里只有 status 为 done 的 image 包含 url
    let images: string | string[] = _.compact(_.flatten(info.fileList.map((file) => file.url)));
    if (!jsonMode) {
      images = images.join(',');
    }
    logger.log('[ImageUploader][handleChange]', { images });
    onChange!(images);
    this.setState({ fileList: info.fileList });
  };

  valueToSubmit = (value?: string | string[], extra?: string): string | string[] => {
    const uploadedImages = valueToArrays(value);
    let images: string | string[] = _.compact(_.flattenDeep([uploadedImages, extra]));
    if (!this.props.jsonMode && _.isArray(images)) {
      images = images.join(',');
    }
    logger.log('[ImageUploader][valueToSubmit]', { images, uploadedImages });
    return images;
  };

  customRequest = ((option) => {
    logger.log('[ImageUploader][customRequest]', option, this.props);

    const { onChange, urlHandler, bucket, jsonMode } = this.props;
    const uploadOpts = _.get(this.props, 'data-__field.options.uploadOpts');
    upload(option.file, uploadOpts ?? { bucket }, { bucket }).then((uploaded) => {
      if (uploaded) {
        logger.log('[ImageUploader][customRequest]', { props: this.props, state: this.state });
        const resolvedUrl = urlHandler ? urlHandler(uploaded[0]) : `${uploaded[0]}`;
        const images = this.valueToSubmit(this.props.value, resolvedUrl);
        logger.log('[ImageUploader][customRequest]', { uploaded, images });
        onChange!(images);
        this.setState({ fileList: ImageUploader.wrapImagesToFileList(images) });
      }
    });
  }) as UploadProps['customRequest'];

  render() {
    const { key, value } = this.props;
    const { previewVisible, previewImage, fileList, fileSize } = this.state;

    logger.debug('[render]', { fileList, value });

    const uploadButton = (
      <Button>
        <UploadOutlined /> upload
      </Button>
    );

    // 多文件上传在使用 customRequest 时第二次只会上传第一个文件。
    // 发现增加了 onStart 方法后依然可以上传多个，目前暂时没有找到原因
    const eventHandler = {
      onStart(file) {
        logger.debug('[uploader] onStart', file, file.name);
      },
    };

    return (
      <div className="clearfix" key={key}>
        <Upload
          {...eventHandler}
          multiple
          supportServerRender
          listType="picture"
          fileList={fileList}
          customRequest={this.customRequest}
          beforeUpload={(file: RcFile, rcFiles: RcFile[]) => validateFile(file)}
          onPreview={this.handlePreview}
          onChange={this.handleChange}
        >
          {fileList && fileList.length >= fileSize ? null : uploadButton}
        </Upload>
        <Modal visible={previewVisible} footer={null} onCancel={this.handleCancel}>
          <img style={{ width: '100%' }} src={previewImage} alt="" />
        </Modal>
        <Input.TextArea
          value={typeof value === 'string' ? value : value ? JSON.stringify(value) : ''}
          autoSize={{ minRows: 2, maxRows: 6 }}
          onChange={(event) => {
            logger.debug('[onChange]', event);
            this.props.onChange!(this.valueToSubmit(event.target.value));
            this.setState({ fileList: ImageUploader.wrapImagesToFileList(event.target.value) });
          }}
        />
      </div>
    );
  }
}
