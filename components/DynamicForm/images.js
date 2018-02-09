import React     from 'react';
import PropTypes from 'prop-types';

import { Icon, message, Modal, Upload } from 'antd';

import { createLogger } from '../../adapters/logger';
import { apiProxy }     from '../../adapters/api';

const logger = createLogger('components:dynamic-form:images');

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

export class ImageUploader extends React.Component {
  static propTypes = {
    auth : PropTypes.shape({}), // auth token object
    value: PropTypes.string,    // image urls in db
  };

  state = {
    imageUrl: '',
    loading : false,
  };

  componentWillMount(): void {
    logger.log('[ImageUploader][componentWillMount]', this.props);
    const { value } = this.props;
    this.setState({ imageUrl: value });
  }

  handleChange = (info) => {
    logger.log('[ImageUploader][handleChange]', info);
    if (info.file.status === 'uploading') {
      this.setState({ loading: true });
      return;
    }
    if (info.file.status === 'done') {
      // Get this url from response in real world.
      getBase64(info.file.originFileObj, imageUrl => this.setState({
        imageUrl,
        loading: false,
      }));
    }
  };

  upload = async (auth, args) => {
    logger.log('[upload]', args);
    const response = await apiProxy.upload(auth, args.file);
    logger.log('[upload]', 'response is', response);

    if (response.status === 200) {
      message.success('upload successfully.');
      args.onSuccess();
      const { onChange } = this.props;
      // onChange(R.join(',', response.data));
      onChange(response.data);
    } else {
      message.error('upload failed.');
      args.onError();
    }
  };

  render() {
    const { imageUrl } = this.state;
    const { auth }     = this.props;
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
          customRequest={(...args) => this.upload(auth, ...args)}
          beforeUpload={beforeUpload}
          onChange={this.handleChange}
        >
          {imageUrl ? <img style={{ width: '100%' }} src={imageUrl} alt="" /> : uploadButton}
        </Upload>
      </div>
    );
  }
}

export class ImagesUploader extends React.Component {
  state = {
    previewVisible: false,
    previewImage  : '',
    fileList      : [{
      uid   : -1,
      name  : 'xxx.png',
      status: 'done',
      url   : 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    }],
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
    const uploadButton                               = (
      <div>
        <Icon type="plus" />
        <div className="ant-upload-text">Upload</div>
      </div>
    );
    return (
      <div className="clearfix">
        <Upload
          action="//jsonplaceholder.typicode.com/posts/"
          listType="picture-card"
          fileList={fileList}
          onPreview={this.handlePreview}
          onChange={this.handleChange}
        >
          {fileList.length >= 3 ? null : uploadButton}
        </Upload>
        <Modal visible={previewVisible} footer={null} onCancel={this.handleCancel}>
          <img style={{ width: '100%' }} src={previewImage} alt="" />
        </Modal>
      </div>
    );
  }
}
