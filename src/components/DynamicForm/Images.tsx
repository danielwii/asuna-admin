import React from 'react';
import _ from 'lodash';
import { join } from 'path';

import { Icon, Modal, Upload } from 'antd';
import { RcFile, UploadChangeParam, UploadFile, UploadFileStatus } from 'antd/es/upload/interface';
import { diff } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { upload, validateFile } from '@asuna-admin/helpers/upload';

const logger = createLogger('components:dynamic-form:images', 'warn');

// --------------------------------------------------------------
// Uploader
// --------------------------------------------------------------

interface IProps {
  host?: string;
  prefix?: string;
  urlHandler?: (res: Asuna.Schema.UploadResponse) => string;
  value?: string;
  onChange?: (value: any) => void;
  many?: boolean;
  fileSize?: number;
}

interface IState {
  fileList: Partial<UploadFile>[];
  many: boolean;
  fileSize: number;
  previewImage?: string;
  previewVisible?: boolean;
}

export class ImagesUploader extends React.Component<IProps, IState> {
  constructor(props) {
    super(props);
    this.state = {
      previewVisible: false,
      previewImage: '',
      fileList: [],
      many: props.many,
      fileSize: props.many ? props.fileSize || 3 : 1,
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

  /**
   * set fileList for Uploader when new images uploaded
   * @param nextProps
   * @param nextContext
   */
  componentWillReceiveProps(nextProps, nextContext) {
    logger.debug('[componentWillReceiveProps]', nextProps, nextContext);
    const { value: images } = nextProps;
    this.wrapImagesToFileList(images);
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

  wrapImagesToFileList = (imagesStr: string): void => {
    const { host } = this.props;
    const images = imagesStr ? _.compact(imagesStr.split(',')) : [];
    logger.debug('[wrapImagesToFileList]', { images });
    const fileList = _.map(images, (image, index) => ({
      uid: `${index}`,
      status: 'done' as UploadFileStatus,
      url: join(host || '', image),
    }));
    logger.debug('[wrapImagesToFileList]', 'fileList is', fileList);
    this.setState({ fileList });
  };

  handleCancel = () => {
    logger.log('[ImagesUploader][handleCancel]', { props: this.props, state: this.state });
    this.setState({ previewVisible: false });
  };

  handlePreview = (file: UploadFile) => {
    this.setState({
      previewImage: file.url || file.thumbUrl,
      previewVisible: true,
    });
  };

  handleChange = (info: UploadChangeParam): void => {
    logger.log('[ImagesUploader][handleChange]', { info });
    const { onChange } = this.props;
    const images = _.compact(info.fileList.map(file => file.url)).join(',');
    logger.log('[ImagesUploader][handleChange]', { images });
    onChange!(images);
  };

  customRequest = (option: any): void => {
    const { onChange, urlHandler, prefix, value } = this.props;
    upload(option.file).then(uploaded => {
      if (uploaded) {
        logger.log('[ImagesUploader][customRequest]', { props: this.props, state: this.state });
        const image = join(prefix || '', urlHandler ? urlHandler(uploaded[0]) : `${uploaded[0]}`);
        const uploadedImages = value;
        const images = _.compact([uploadedImages, image]).join(',');
        logger.log('[ImagesUploader][customRequest]', { uploaded, image, images, uploadedImages });
        onChange!(images);
      }
    });
  };

  render() {
    const { previewVisible, previewImage, fileList, fileSize } = this.state;

    logger.debug('[render]', { fileList });

    const uploadButton = (
      <div>
        <Icon type="plus" />
        <div className="ant-upload-text">Upload</div>
      </div>
    );

    return (
      <div className="clearfix">
        <Upload
          listType="picture-card"
          fileList={fileList as UploadFile[]}
          supportServerRender
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
