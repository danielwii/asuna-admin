import React from 'react';
import { message } from 'antd';
import { join } from 'path';

import { apiProxy } from '@asuna-admin/adapters';
import { AppContext } from '@asuna-admin/core';
import { createLogger } from '@asuna-admin/logger';

const logger = createLogger('components:rich-editor', 'warn');

let BraftEditor;
let EditorState;

interface IProps {
  host?: string;
  prefix?: string;
  urlHandler?: (res: Asuna.Schema.UploadResponse) => string;
  value?: string;
  onChange?: (value) => void;
}

interface IState {
  loading: boolean;
  editorState?: any;
}

export class BraftRichEditor extends React.Component<IProps, IState> {
  state: IState = {
    loading: true,
  };

  componentDidMount() {
    // to avoid ·window is not defined· issue
    BraftEditor = require('braft-editor').default;
    EditorState = require('braft-editor').EditorState;
    logger.debug('[componentDidMount]', { state: this.state, props: this.props });
    const { value } = this.props;
    this.setState({ loading: false, editorState: EditorState.createFrom(value || '') });
  }

  _handleEditorChange = editorState => {
    logger.debug('[handleEditorChange]', { editorState });
    const { onChange } = this.props;
    if (onChange) onChange(editorState.toHTML());
    this.setState({ editorState });
  };

  _beforeUpload = file => {
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

  _uploadFn = async param => {
    const { prefix, urlHandler } = this.props;
    logger.debug('[uploadFn]', 'param is', param);

    const response = await apiProxy.upload(param.file, {
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
        url: join(prefix || '', `${image}`),
      });
    } else {
      param.error({
        msg: 'unable to upload.',
      });
    }
  };

  render() {
    const { loading, editorState } = this.state;

    if (loading) return <p>loading editor...</p>;

    if (AppContext.isServer) {
      return <div />;
    }

    return (
      <BraftEditor
        value={editorState}
        defaultValue={editorState}
        onChange={this._handleEditorChange}
        media={{
          validateFn: this._beforeUpload, // 指定本地校验函数
          uploadFn: this._uploadFn, // 指定上传函数
          externalMedias: {
            image: true,
            audio: false,
            video: false,
            embed: true,
          },
        }}
      />
    );
  }
}
