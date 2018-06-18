import React from 'react';
import { message } from 'antd';
import { join } from 'path';

import { apiProxy } from '../adapters/api';
import { createLogger } from '../helpers/logger';

import { AuthState } from '../store/auth.redux';

const logger = createLogger('components:rich-editor', 'warn');

let BraftEditor;

interface IProps {
  // FIXME 在调用 apiProxy 时需要使用 auth，但不应该在组件中感知到 auth
  auth: AuthState;
  host?: string;
  prefix?: string;
  urlHandler?: (res: Asuna.Schema.UploadResponse) => string;
  value?: string;
  onChange?: (value) => void;
}

interface IState {
  loading: boolean;
}

export class BraftRichEditor extends React.Component<IProps, IState> {
  state: IState = {
    loading: true,
  };

  componentDidMount() {
    BraftEditor = require('braft-editor').default;
    logger.debug('[componentDidMount]', { state: this.state, props: this.props });
    this.setState({ loading: false });
  }

  handleChange = content => {
    logger.debug('[handleChange]', 'content is', content);
  };

  handleHTMLChange = html => {
    logger.debug('[handleHTMLChange]', 'html is', html);
    const { onChange } = this.props;
    onChange!(html);
  };

  beforeUpload = file => {
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
  };

  uploadFn = async param => {
    const { auth, prefix, urlHandler } = this.props;
    logger.debug('[uploadFn]', 'param is', param);

    const response = await apiProxy.upload(auth, param.file, {
      onUploadProgress(progressEvent) {
        logger.debug('[uploadFn][progressFn]', 'event is', progressEvent);
        param.progress((progressEvent.loaded / progressEvent.total) * 100);
      },
    });

    logger.debug('[uploadFn]', 'response is', response);

    if (/^20\d$/.test(response.status as any)) {
      const image = urlHandler ? urlHandler(response.data[0]) : response.data[0];
      param.success({
        image,
        url: join(prefix || '', '' + image),
      });
    } else {
      param.error({
        msg: 'unable to upload.',
      });
    }
  };

  render() {
    const { loading } = this.state;
    const { value } = this.props;

    if (loading) return <p>loading editor...</p>;

    const editorProps = {
      height: 500,
      contentFormat: 'html',
      initialContent: value || '',
      onChange: this.handleChange,
      onHTMLChange: this.handleHTMLChange,
      media: {
        validateFn: this.beforeUpload, // 指定本地校验函数
        uploadFn: this.uploadFn, // 指定上传函数
        externalMedias: {
          image: true,
          audio: false,
          video: false,
          embed: true,
        },
      },
      // extendControls,
    };

    return <BraftEditor {...editorProps} />;
  }
}
