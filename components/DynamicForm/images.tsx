import React from 'react';
import _ from 'lodash';
import { join } from 'path';

import { Icon, message, Modal, Upload } from 'antd';
import { RcFile, UploadChangeParam, UploadFile } from 'antd/es/upload/interface';

import { apiProxy } from '../../adapters/api';
import { diff } from '../../helpers';
import { createLogger, lv } from '../../helpers/logger';
import { AuthState } from '../../store/auth.redux';

const logger = createLogger('components:dynamic-form:images', lv.warn);

// --------------------------------------------------------------
// Functions
// --------------------------------------------------------------

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
}

function beforeUpload(file: RcFile, FileList: RcFile[]) {
  const isImage = ['image/jpeg', 'image/png'].indexOf(file.type) > -1;
  logger.log('[beforeUpload]', file);
  if (!isImage) {
    message.error('You can only upload JPG/PNG file!');
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('Image must smaller than 2MB!');
  }
  return isImage && isLt2M;
}

async function upload(auth, option: any): Promise<Asuna.Schema.UploadResponse[] | undefined> {
  logger.log('[upload]', { option });
  const response = await apiProxy.upload(auth, option.file);
  logger.log('[upload]', { response });

  if (/^20\d$/.test(response.status as any)) {
    message.success('upload successfully.');

    option.onSuccess();
    return response.data;
  } else {
    message.error('upload failed.');
    option.onError();
  }
}

// --------------------------------------------------------------
// Uploader
// --------------------------------------------------------------

interface IProps {
  auth: AuthState;
  host: string;
  prefix: string;
  urlHandler: (res: Asuna.Schema.UploadResponse) => string;
  value?: string;
  onChange?: (value: any) => void;
}

export class ImageUploader extends React.Component<IProps> {
  state: {
    loading: boolean;
  } = { loading: false };

  shouldComponentUpdate(nextProps, nextState) {
    const propsDiff = diff(this.props, nextProps);
    const stateDiff = diff(this.state, nextState);
    const shouldUpdate = propsDiff.isDifferent || stateDiff.isDifferent;
    if (shouldUpdate) {
      logger.info(
        '[ImageUploader][shouldComponentUpdate]',
        {
          nextProps,
          nextState,
          propsDiff,
          stateDiff,
        },
        shouldUpdate,
      );
    }
    return shouldUpdate;
  }

  handleChange = (info: UploadChangeParam): void => {
    logger.log('[ImageUploader][handleChange]', info);
    if (info.file.status === 'uploading') {
      this.setState({ loading: true });
      return;
    }
    if (info.file.status === 'done') {
      getBase64(info.file.originFileObj, () => this.setState({ loading: false }));
    }
  };

  customRequest = async (option: any): Promise<void> => {
    const { auth, onChange, prefix, urlHandler } = this.props;
    const uploaded = await upload(auth, option);
    if (uploaded) {
      const image = join(prefix, urlHandler(uploaded[0]));
      logger.log('[ImageUploader][render]', { uploaded, image });
      onChange!(image);
    }
  };

  render() {
    const { value: image, host } = this.props;

    logger.log('[ImageUploader][render]', { image });

    const uploadButton = (
      <div>
        <Icon type={this.state.loading ? 'loading' : 'plus'} />
        <div className="ant-upload-text">Upload</div>
      </div>
    );

    return (
      <div className="clearfix">
        <Upload
          name="avatar"
          listType="picture-card"
          className="avatar-uploader"
          showUploadList={false}
          supportServerRender
          customRequest={this.customRequest}
          beforeUpload={beforeUpload}
          onChange={this.handleChange}
        >
          {image ? <img style={{ width: '100%' }} src={join(host, image)} alt="" /> : uploadButton}
        </Upload>
      </div>
    );
  }
}

export class ImagesUploader extends React.Component<IProps> {
  state: {
    previewVisible: boolean;
    previewImage: string;
    fileList: UploadFile[];
    // images: Asuna.Schema.UploadResponse[];
  };

  constructor(props) {
    super(props);
    this.state = {
      previewVisible: false,
      previewImage: '',
      fileList: [],
      // images: props.value,
    };
  }

  /**
   * set fileList for Uploader at first time
   */
  UNSAFE_componentWillMount() {
    logger.info('[componentWillMount]', this.props);
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
  UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
    logger.info('[componentWillReceiveProps]', nextProps, nextContext);
    const { value: images } = nextProps;
    this.wrapImagesToFileList(images);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const TAG = '[shouldComponentUpdate]';
    const propsDiff = diff(this.props, nextProps);
    const stateDiff = diff(this.state, nextState);
    const shouldUpdate = propsDiff.isDifferent || stateDiff.isDifferent;
    if (shouldUpdate) {
      logger.info(TAG, { nextProps, nextState, propsDiff, stateDiff }, shouldUpdate);
    }
    return shouldUpdate;
  }

  wrapImagesToFileList = (imagesStr: string): void => {
    const { host } = this.props;
    const images = imagesStr ? _.compact(imagesStr.split(',')) : [];
    logger.info('[wrapImagesToFileList]', { images });
    const fileList = _.map(images, (image, index) => ({
      uid: index,
      status: 'done',
      url: join(host, image),
    }));
    logger.info('[wrapImagesToFileList]', 'fileList is', fileList);
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

  customRequest = async (option: any): Promise<void> => {
    const { auth, onChange, urlHandler, prefix, value } = this.props;
    const uploaded = await upload(auth, option);
    if (uploaded) {
      logger.log('[ImagesUploader][customRequest]', { props: this.props, state: this.state });
      const image = join(prefix, urlHandler(uploaded[0]));
      const uploadedImages = value;
      const images = _.compact([uploadedImages, image]).join(',');
      logger.log('[ImagesUploader][customRequest]', { uploaded, image, images, uploadedImages });
      onChange!(images);
    }
  };

  render() {
    const { previewVisible, previewImage, fileList } = this.state;

    logger.info('[render]', { fileList });

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
          fileList={fileList}
          supportServerRender
          customRequest={this.customRequest}
          beforeUpload={beforeUpload}
          onPreview={this.handlePreview}
          onChange={this.handleChange}
        >
          {fileList && fileList.length >= 3 ? null : uploadButton}
        </Upload>
        <Modal visible={previewVisible} footer={null} onCancel={this.handleCancel}>
          <img style={{ width: '100%' }} src={previewImage} alt="" />
        </Modal>
      </div>
    );
  }
}
