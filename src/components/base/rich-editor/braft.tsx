import { Input } from 'antd';
import { ContentUtils } from 'braft-utils';
import * as _ from 'lodash';
import * as React from 'react';
import { FoldingCube } from 'styled-spinkit';

import type { ExtendControlType } from 'braft-editor';

let BraftEditor;

interface IProps {
  validateFn;
  upload;
  host?: string;
  prefix?: string;
  urlHandler?: (res) => string;
  value?: string;
  onChange?: (value) => void;
}

interface IState {
  loading: boolean;
  editorState?: any;
}

function htmlEntities(unsafeHtml: string): string {
  return String(unsafeHtml).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export class BraftRichEditor extends React.Component<IProps, IState> {
  private editorInstance;

  state: IState = {
    loading: true,
  };

  componentDidMount() {
    // to avoid ·window is not defined· issue
    BraftEditor = require('braft-editor').default;
    const ColorPicker = require('braft-extensions/dist/color-picker').default;
    const { value } = this.props;
    const editorState = BraftEditor.createEditorState(value || '');
    BraftEditor.use(
      ColorPicker({
        includeEditors: ['editor-with-color-picker'],
        theme: 'light', // 支持dark和light两种主题，默认为dark
      }),
    );

    this.setState({ loading: false, editorState });
  }

  _handleEditorChange = (editorState) => {
    const { onChange } = this.props;
    if (onChange) onChange(editorState.toHTML());
    this.setState({ editorState });
  };

  _uploadFn = async (param) => {
    const { prefix, urlHandler, upload } = this.props;

    const response = await upload(
      param.file,
      { prefix },
      {
        onUploadProgress(progressEvent) {
          param.progress((progressEvent.loaded / progressEvent.total) * 100);
        },
      },
    );

    if (/^20\d$/.test(response.status as any)) {
      const image = urlHandler ? urlHandler(response.data[0]) : response.data[0];
      param.success({
        image,
        // url: join(prefix || '', `${image}`),
        url: image.fullpath,
      });
    } else {
      param.error({
        msg: 'unable to upload.',
      });
    }
  };

  render() {
    const { validateFn } = this.props;
    const { loading, editorState } = this.state;

    if (loading) return <FoldingCube />;

    const extendControls: ExtendControlType[] = [
      {
        key: 'custom-modal',
        type: 'modal',
        text: '锚标记',
        modal: {
          id: 'braft-model-01',
          title: '添加锚标记',
          children: (
            <div>
              <Input id="braft-modal-01-id" addonBefore="id" />
              <Input id="braft-modal-01-input" addonBefore="text" />
            </div>
          ),
          confirmable: true,
          onConfirm: () => {
            const id = _.trim(_.get(document.getElementById('braft-modal-01-id'), 'value'));
            const text = _.trim(_.get(document.getElementById('braft-modal-01-input'), 'value'));
            if (id && text) {
              this.setState({
                editorState: ContentUtils.insertHTML(
                  this.state.editorState,
                  // language=html
                  `<p id="${id}" class="editor-anchor-mark">${htmlEntities(text)}</p>`,
                ),
              });
            }
          },
        },
      },
    ];

    return (
      <BraftEditor
        id="editor-with-color-picker"
        ref={(instance) => (this.editorInstance = instance)}
        value={editorState}
        defaultValue={editorState}
        onChange={this._handleEditorChange}
        extendControls={extendControls}
        media={{
          validateFn, // 指定本地校验函数
          uploadFn: this._uploadFn, // 指定上传函数
          externalMedias: { image: true, audio: true, video: true, embed: true },
        }}
      />
    );
  }
}
