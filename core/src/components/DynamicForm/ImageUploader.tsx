import { valueToArrays, valueToUrl } from '@asuna-admin/core/url-rewriter';
import { diff } from '@asuna-admin/helpers';
import { upload, validateFile } from '@asuna-admin/helpers/upload';
import { createLogger } from '@asuna-admin/logger';
import { Asuna } from '@asuna-admin/types';

import { Icon, Modal, Upload } from 'antd';
import { RcFile, UploadChangeParam, UploadFile, UploadFileStatus } from 'antd/es/upload/interface';
import _ from 'lodash';
import React from 'react';

const logger = createLogger('components:dynamic-form:images');

// --------------------------------------------------------------
// Uploader
// --------------------------------------------------------------

interface IProps {
  // FIXME 目前从 url-rewriter 中获取附件前缀，未来考虑单独传入图片地址解析器，而无需从属性中获取相关知识
  // host?: string;
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
  constructor(props) {
    super(props);
    this.state = {
      previewVisible: false,
      previewImage: '',
      fileList: [],
      many: props.many,
      fileSize: props.many ? props.fileSize || 50 : 1,
    };
  }

  /**
   * set fileList for Uploader at first time
   */
  componentWillMount() {
    logger.debug('[componentWillMount]', this.props);
    const { value: images } = this.props;
    if (images) {
      this.wrapImagesToFileList(images);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const TAG = '[shouldComponentUpdate]';
    const propsDiff = diff(this.props, nextProps);
    const stateDiff = diff(this.state, nextState);
    const shouldUpdate = propsDiff.isDifferent || stateDiff.isDifferent;
    if (shouldUpdate) {
      logger.debug(TAG, { nextProps, nextState, propsDiff, stateDiff }, shouldUpdate);
    }
    return shouldUpdate;
  }

  wrapImagesToFileList = (imagesInfo: string | string[]): void => {
    const images = valueToArrays(imagesInfo);
    const fileList = _.map<any, Partial<UploadFile>>(images, (image, index) => ({
      uid: `${index}`,
      status: 'done' as UploadFileStatus,
      url: valueToUrl(image, { type: 'image', thumbnail: {} }),
      thumbUrl: valueToUrl(image, { type: 'image', thumbnail: { width: 200, height: 200 } }),
    })) as any;
    logger.debug('[wrapImagesToFileList]', 'fileList is', fileList);
    this.setState({ fileList });
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
    let images: string | string[] = _.compact(_.flatten(info.fileList.map(file => file.url)));
    if (!jsonMode) {
      images = images.join(',');
    }
    logger.log('[ImageUploader][handleChange]', { images });
    onChange!(images);
    this.wrapImagesToFileList(images);
  };

  customRequest = (option: any): void => {
    logger.log('[ImageUploader][customRequest]', option);
    const { onChange, urlHandler, bucket, jsonMode } = this.props;
    upload(option.file, {}, { bucket }).then(uploaded => {
      if (uploaded) {
        logger.log('[ImageUploader][customRequest]', { props: this.props, state: this.state });
        const resolvedUrl = urlHandler ? urlHandler(uploaded[0]) : `${uploaded[0]}`;
        let image = resolvedUrl;
        // if (!resolvedUrl.startsWith('http') && !resolvedUrl.startsWith(prefix || '')) {
        //   image = join(prefix || '', resolvedUrl);
        // }
        logger.log('[ImageUploader][customRequest]', { image, bucket, resolvedUrl });
        const uploadedImages = valueToArrays(this.props.value);
        console.log({ uploadedImages, image }, _.flattenDeep([uploadedImages, image]));
        let images: string | string[] = _.compact(_.flattenDeep([uploadedImages, image]));
        if (!jsonMode) {
          images = images.join(',');
        }
        logger.log('[ImageUploader][customRequest]', { uploaded, images, uploadedImages });
        onChange!(images);
        this.wrapImagesToFileList(images);
      }
    });
  };

  render() {
    const { value } = this.props;
    const { previewVisible, previewImage, fileList, fileSize } = this.state;

    logger.debug('[render]', { fileList, value });

    const uploadButton = (
      <div>
        <Icon type="plus" />
        <div className="ant-upload-text">Upload</div>
      </div>
    );

    // 多文件上传在使用 customRequest 时第二次只会上传第一个文件。
    // 发现增加了 onStart 方法后依然可以上传多个，目前暂时没有找到原因
    const eventHandler = {
      onStart(file) {
        logger.debug('[uploader] onStart', file, file.name);
      },
    };

    return (
      <div className="clearfix" key={value}>
        <Upload
          {...eventHandler}
          multiple
          supportServerRender
          listType="picture-card"
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
      </div>
    );
  }
}
