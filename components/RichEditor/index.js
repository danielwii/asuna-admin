import React     from 'react';
import PropTypes from 'prop-types';

import { apiProxy }         from '../../adapters/api';
import { createLogger, lv } from '../../helpers';

const logger = createLogger('components:rich-editor', lv.warn);

let BraftEditor;

// eslint-disable-next-line import/prefer-default-export
export class BraftRichEditor extends React.Component {
  static propTypes = {
    value   : PropTypes.string,
    onChange: PropTypes.func,
  };

  state = {
    loading: true,
  };

  componentDidMount() {
    // eslint-disable-next-line global-require
    BraftEditor = require('braft-editor').default;
    logger.info('[componentDidMount]', { state: this.state, props: this.props });
    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState({ loading: false });
  }

  handleChange = (content) => {
    logger.info('[handleChange]', 'content is', content);
  };

  handleHTMLChange = (html) => {
    logger.info('[handleHTMLChange]', 'html is', html);
    const { onChange } = this.props;
    onChange(html);
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

  validateFn = (file) => {
    logger.info('[validateFn]', 'validate file', file);
    if (file.size > 1000 * 1000 * 2) {
      logger.warn('[validateFn]', 'file size must less than 2_000_000', file);
      return false;
    }
    return true;
  };

  uploadFn = async (param) => {
    const { auth } = this.props;
    logger.info('[uploadFn]', 'param is', param);

    const response = await apiProxy.upload(auth, param.file, {
      onUploadProgress(progressEvent) {
        logger.info('[uploadFn][progressFn]', 'event is', progressEvent);
        param.progress((progressEvent.loaded / progressEvent.total) * 100);
      },
    });

    logger.info('[uploadFn]', 'response is', response);

    if (response.status === 200) {
      // TODO 返回值的结构应该在未来包含于 adapter 中由异构系统自定义
      const image = response.data[0];
      param.success({
        image,
        url: `${image.prefix}/${image.filename}`,
      });
    } else {
      param.error({
        msg: 'unable to upload.',
      });
    }
  };

  render() {
    const { loading } = this.state;
    const { value }   = this.props;

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
      height        : 500,
      contentFormat : 'html',
      initialContent: value || '',
      onChange      : this.handleChange,
      onHTMLChange  : this.handleHTMLChange,
      media         : {
        validateFn: this.validateFn, // 指定本地校验函数，说明见下文
        uploadFn  : this.uploadFn, // 指定上传函数，说明见下文
      },
      // extendControls,
    };

    return <BraftEditor {...editorProps} />;
  }
}
