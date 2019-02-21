import React from 'react';
import _ from 'lodash';
import { join } from 'path';

import { Icon, Modal, Upload } from 'antd';
import { RcFile, UploadChangeParam, UploadFile, UploadFileStatus } from 'antd/es/upload/interface';
import { diff } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { upload, validateFile } from '@asuna-admin/helpers/upload';

const logger = createLogger('components:dynamic-form:images');

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
  jsonMode?: boolean;
}

interface IState {
  fileList: UploadFile[];
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
    const { host } = this.props;
    const images = imagesInfo
      ? _.isArray(imagesInfo)
        ? imagesInfo
        : _.compact(imagesInfo.split(','))
      : [];
    logger.debug('[wrapImagesToFileList]', { images });
    const fileList = _.map<any, Partial<UploadFile>>(images, (image, index) => ({
      uid: `${index}`,
      status: 'done' as UploadFileStatus,
      url: host + `/${image}`.replace('//', '/').slice(1),
    })) as any;
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

  // updated file status will received here, maybe will handled later
  handleChange = (info: UploadChangeParam): void => {
    logger.log('[ImagesUploader][handleChange]', { info });
    const { onChange, jsonMode } = this.props;
    // const images = _.compact(info.fileList.map(file => file.url)).join(',');
    // 这里只有 status 为 done 的 image 包含 url
    let images: string | string[] = _.compact(_.flatten(info.fileList.map(file => file.url)));
    if (!jsonMode) {
      images = images.join(',');
    }
    logger.log('[ImagesUploader][handleChange]', { images });
    onChange!(images);
    this.wrapImagesToFileList(images);
  };

  customRequest = (option: any): void => {
    logger.log('[ImagesUploader][customRequest]', option);
    upload(option.file).then(uploaded => {
      const { onChange, urlHandler, prefix, jsonMode } = this.props;
      if (uploaded) {
        logger.log('[ImagesUploader][customRequest]', { props: this.props, state: this.state });
        const resolvedUrl = urlHandler ? urlHandler(uploaded[0]) : `${uploaded[0]}`;
        let image = resolvedUrl;
        if (!resolvedUrl.startsWith('http') && !resolvedUrl.startsWith(prefix || '')) {
          image = join(prefix || '', resolvedUrl);
        }
        logger.log('[ImagesUploader][customRequest]', { image, prefix, resolvedUrl });
        const uploadedImages = this.props.value;
        let images: string | string[] = _.compact(_.flatten([uploadedImages, image]));
        if (!jsonMode) {
          images = images.join(',');
        }
        logger.log('[ImagesUploader][customRequest]', { uploaded, images, uploadedImages });
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
      <div className="clearfix">
        <Upload
          {...eventHandler}
          multiple
          supportServerRender
          key={value}
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
