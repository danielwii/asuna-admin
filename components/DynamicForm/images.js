/* eslint-disable camelcase,react/sort-comp */
import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import { Icon, message, Modal, Upload } from 'antd';

import { apiProxy } from '../../adapters/api';
import { diff } from '../../helpers';
import { createLogger, lv } from '../../helpers/logger';

const logger = createLogger('components:dynamic-form:images', lv.warn);

// --------------------------------------------------------------
// Functions
// --------------------------------------------------------------

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
}

function beforeUpload(file) {
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

async function upload(auth, onChange, files, args) {
  logger.log('[upload]', { files, args });
  const response = await apiProxy.upload(auth, args.file);
  logger.log('[upload]', { response });

  if (/^20\d$/.test(response.status)) {
    message.success('upload successfully.');

    const images = [...(files || []), ...response.data];
    logger.log('[upload]', { images });

    onChange(images);
    args.onSuccess();
  } else {
    message.error('upload failed.');
    args.onError();
  }
}

// --------------------------------------------------------------
// Uploader
// --------------------------------------------------------------

export class ImageUploader extends React.Component {
  static propTypes = {
    auth: PropTypes.shape({}), // auth token object
    api: PropTypes.string.isRequired,
    value: PropTypes.arrayOf(
      PropTypes.shape({
        bucket: PropTypes.string,
        filename: PropTypes.string,
        mode: PropTypes.string,
        prefix: PropTypes.string,
      }),
    ),
    onChange: PropTypes.func,
  };

  state = { loading: false };

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

  handleChange = info => {
    logger.log('[ImageUploader][handleChange]', info);
    if (info.file.status === 'uploading') {
      this.setState({ loading: true });
      return;
    }
    if (info.file.status === 'done') {
      // Get this url from response in real world.
      // eslint-disable-next-line no-unused-vars
      getBase64(info.file.originFileObj, () => this.setState({ loading: false }));
    }
  };

  render() {
    const { auth, onChange, value: images, api } = this.props;

    const image = images ? images[0] : null;
    logger.log('[ImageUploader][render]', { images, image });

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
          customRequest={(...args) => upload(auth, onChange, [], ...args)}
          beforeUpload={beforeUpload}
          onChange={this.handleChange}
        >
          {image ? (
            <img
              style={{ width: '100%' }}
              src={`${api}/${image.filename}?prefix=${image.prefix}`}
              alt=""
            />
          ) : (
            uploadButton
          )}
        </Upload>
      </div>
    );
  }
}

// eslint-disable-next-line react/no-multi-comp
export class ImagesUploader extends React.Component {
  static propTypes = {
    auth: PropTypes.shape({}), // auth token object
    api: PropTypes.string.isRequired,
    value: PropTypes.arrayOf(
      PropTypes.shape({
        bucket: PropTypes.string,
        filename: PropTypes.string,
        mode: PropTypes.string,
        prefix: PropTypes.string,
      }),
    ),
    onChange: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = {
      previewVisible: false,
      previewImage: '',
      fileList: [],
      images: props.value,
    };
  }

  /**
   * set fileList for Uploader at first time
   */
  UNSAFE_componentWillMount() {
    logger.info('[componentWillMount]', this.props);
    const { value: images } = this.props;
    this.wrapImagesToFileList(images);
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
    const propsDiff = diff(this.props, nextProps);
    const stateDiff = diff(this.state, nextState);
    const shouldUpdate = propsDiff.isDifferent || stateDiff.isDifferent;
    if (shouldUpdate) {
      logger.info(
        '[shouldComponentUpdate]',
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

  wrapImagesToFileList = images => {
    const { api } = this.props;
    logger.info('[wrapImagesToFileList]', 'images is', images);
    const fileList = _.map(images, (image, index) => ({
      uid: index,
      status: 'done',
      url: `${api}/${image.filename}?prefix=${image.prefix}`,
    }));
    logger.info('[wrapImagesToFileList]', 'fileList is', fileList);
    this.setState({ fileList });
  };

  handleCancel = () => this.setState({ previewVisible: false });

  handlePreview = file => {
    this.setState({
      previewImage: file.url || file.thumbUrl,
      previewVisible: true,
    });
  };

  handleChange = ({ fileList }) => this.setState({ fileList });

  render() {
    const { auth, onChange } = this.props;

    const { previewVisible, previewImage, fileList, images } = this.state;

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
          customRequest={(...args) => upload(auth, onChange, images, ...args)}
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
