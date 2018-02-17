import React     from 'react';
import PropTypes from 'prop-types';
import * as R    from 'ramda';
import _         from 'lodash';

import { Icon, message, Modal, Upload } from 'antd';

import { createLogger } from '../../adapters/logger';
import { apiProxy }     from '../../adapters/api';

const logger = createLogger('components:dynamic-form:images');

// --------------------------------------------------------------
// Functions
// --------------------------------------------------------------

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
}

function beforeUpload(file) {
  const isJPG = file.type === 'image/jpeg';
  if (!isJPG) {
    message.error('You can only upload JPG file!');
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('Image must smaller than 2MB!');
  }
  return isJPG && isLt2M;
}

async function upload(auth, onChange, files, args) {
  logger.log('[upload]', args);
  const response = await apiProxy.upload(auth, args.file);
  logger.log('[upload]', 'response is', response);

  if (response.status === 200) {
    message.success('upload successfully.');
    args.onSuccess();

    const urls = R.compose(
      R.join(','),
      R.filter(R.identity),
      R.concat(files),
    )(response.data);
    logger.log('[upload]', urls);

    onChange(urls);
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
    auth    : PropTypes.shape({}), // auth token object
    value   : PropTypes.string,    // image url in db
    onChange: PropTypes.func,
  };

  state = { loading: false };

  handleChange = (info) => {
    logger.log('[ImageUploader][handleChange]', info);
    if (info.file.status === 'uploading') {
      this.setState({ loading: true });
      return;
    }
    if (info.file.status === 'done') {
      // Get this url from response in real world.
      // eslint-disable-next-line no-unused-vars
      getBase64(info.file.originFileObj, imageUrl => this.setState({ loading: false }));
    }
  };

  render() {
    const { auth, onChange, value: imageUrl } = this.props;

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
          {imageUrl ? <img style={{ width: '100%' }} src={imageUrl} alt="" /> : uploadButton}
        </Upload>
      </div>
    );
  }
}

// eslint-disable-next-line react/no-multi-comp
export class ImagesUploader extends React.Component {
  static propTypes = {
    auth    : PropTypes.shape({}), // auth token object
    value   : PropTypes.string,    // image url in db
    onChange: PropTypes.func,
  };

  state = {
    previewVisible: false,
    previewImage  : '',
    fileList      : [],
  };

  /**
   * set fileList for Uploader at first time
   */
  componentWillMount() {
    logger.info('[componentWillMount]', this.props);
    const { value: imageUrls } = this.props;
    this.wrapImageUrlsToFileList(imageUrls);
  }

  /**
   * set fileList for Uploader when new images uploaded
   * @param nextProps
   * @param nextContext
   */
  componentWillReceiveProps(nextProps, nextContext) {
    logger.info('[componentWillReceiveProps]', nextProps, nextContext);
    const { value: imageUrls } = nextProps;
    this.wrapImageUrlsToFileList(imageUrls);
  }

  wrapImageUrlsToFileList = (imageUrls) => {
    const files = _.compact(_.split(imageUrls, ','));
    logger.info('[wrapImageUrlsToFileList]', 'files is', files);
    const fileList = _.map(files, (file, index) => ({
      uid   : index,
      status: 'done',
      url   : file,
    }));
    logger.info('[wrapImageUrlsToFileList]', 'fileList is', fileList);
    this.setState({ fileList });
  };

  handleCancel = () => this.setState({ previewVisible: false });

  handlePreview = (file) => {
    this.setState({
      previewImage  : file.url || file.thumbUrl,
      previewVisible: true,
    });
  };

  handleChange = ({ fileList }) => this.setState({ fileList });

  render() {
    const { previewVisible, previewImage, fileList } = this.state;

    const { auth, onChange } = this.props;

    const files = R.map(R.prop('url')())(fileList);
    logger.info('[render]', 'files is', fileList, files);

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
          customRequest={(...args) => upload(auth, onChange, files, ...args)}
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
