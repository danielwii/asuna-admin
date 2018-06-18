import React from 'react';
import { message } from 'antd';
import { join } from 'path';

import { apiProxy } from '../adapters/api';
import { createLogger, lv } from '../helpers/logger';

import { AuthState } from '../store/auth.redux';

const logger = createLogger('components:rich-editor', lv.warn);

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
    // eslint-disable-next-line global-require
    BraftEditor = require('braft-editor').default;
    logger.info('[componentDidMount]', { state: this.state, props: this.props });
    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState({ loading: false });
  }

  handleChange = content => {
    logger.info('[handleChange]', 'content is', content);
  };

  handleHTMLChange = html => {
    logger.info('[handleHTMLChange]', 'html is', html);
    const { onChange } = this.props;
    onChange!(html);
  };

  /*
  buildRawDraftContentState = () => {
    const { value } = this.props;
    logger.info('render by props', this.props);

    if (R.isEmpty(value)) {
      return null;
    }

    const blocksFromHTML = convertFromHTML(value);
    logger.info('blocksFromHTML is', blocksFromHTML);

    // eslint-disable-next-line function-paren-newline
    const contentState = ContentState.createFromBlockArray(
      blocksFromHTML.contentBlocks, blocksFromHTML.entityMap);
    logger.info('contentState is', contentState);
    return convertToRaw(contentState);
  };
*/

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
    logger.info('[uploadFn]', 'param is', param);

    const response = await apiProxy.upload(auth, param.file, {
      onUploadProgress(progressEvent) {
        logger.info('[uploadFn][progressFn]', 'event is', progressEvent);
        param.progress((progressEvent.loaded / progressEvent.total) * 100);
      },
    });

    logger.info('[uploadFn]', 'response is', response);

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

    /*
    const extendControls = [
      {
        type: 'split',
      }, {
        type     : 'button',
        text     : '预览',
        className: 'preview-button',
        onClick  : this.preview,
      }, {
        type     : 'dropdown',
        width    : 80,
        text     : <span>下拉菜单</span>,
        component: <h1 style={{
          width: 200, color: '#ffffff', padding: 10, margin: 0,
        }}
        >Hello World!
        </h1>,
      }, {
        type     : 'modal',
        text     : '弹出框',
        className: 'modal-button',
        modal    : {
          title      : '这是一个弹出框',
          showClose  : true,
          showCancel : true,
          showConfirm: true,
          confirmable: true,
          onConfirm  : () => console.log(1),
          onCancel   : () => console.log(2),
          onClose    : () => console.log(3),
          children   : (
            <div style={{ width: 480, height: 320, padding: 30 }}>
              <span>Hello World！</span>
            </div>
          ),
        },
      },
    ];
*/

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
