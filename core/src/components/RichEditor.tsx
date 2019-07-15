import { apiProxy } from '@asuna-admin/adapters';
import { AppContext } from '@asuna-admin/core';
import { validateFile } from '@asuna-admin/helpers/upload';
import { createLogger } from '@asuna-admin/logger';
import { Asuna } from '@asuna-admin/types';

import 'braft-editor/dist/index.css';
import * as React from 'react';

const logger = createLogger('components:rich-editor');

let BraftEditor;

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
  private editorInstance;

  state: IState = {
    loading: true,
  };

  componentDidMount() {
    // to avoid ·window is not defined· issue
    BraftEditor = require('braft-editor').default;
    logger.debug('[componentDidMount]', { state: this.state, props: this.props });
    const { value } = this.props;
    const editorState = BraftEditor.createEditorState(value || '');
    this.setState({ loading: false, editorState });
  }

  _handleEditorChange = editorState => {
    const { onChange } = this.props;
    if (onChange) onChange(editorState.toHTML());
    this.setState({ editorState });
  };

  _uploadFn = async param => {
    const { prefix, urlHandler } = this.props;
    logger.debug('[uploadFn]', { prefix, param });

    const response = await apiProxy.upload(param.file, {
      prefix,
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
        // url: join(prefix || '', `${image}`),
        url: image,
      });
    } else {
      param.error({
        msg: 'unable to upload.',
      });
    }
  };

  render() {
    const { host } = this.props;
    const { loading, editorState } = this.state;

    if (loading) return <p>loading editor...</p>;

    if (AppContext.isServer) {
      return <div />;
    }

    return (
      <BraftEditor
        ref={instance => (this.editorInstance = instance)}
        value={editorState}
        defaultValue={editorState}
        onChange={this._handleEditorChange}
        media={{
          validateFn: validateFile, // 指定本地校验函数
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
