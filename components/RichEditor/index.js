import React     from 'react';
import PropTypes from 'prop-types';

import { ContentState, convertFromHTML, convertToRaw } from 'draft-js';

import { createLogger } from '../../adapters/logger';

const logger = createLogger('components:rich-editor');

let BraftEditor;

export class BraftRichEditor extends React.Component {
  static propTypes = {
    value   : PropTypes.string,
    onChange: PropTypes.func,
  };

  state = {
    loading: true,
  };

  componentDidMount(): void {
    // eslint-disable-next-line global-require
    BraftEditor = require('braft-editor').default;
    logger.info('[componentDidMount] loaded braft editor');
    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState({ loading: false });
  }

  handleChange = (content) => {
    logger.info('content is', content);
  };

  handleHTMLChange = (html) => {
    logger.info('html is', html);
    const { onChange } = this.props;
    onChange(html);
  };

  render() {
    const { value } = this.props;
    logger.info('render by props', this.props);

    const blocksFromHTML = convertFromHTML(value);
    logger.info('blocksFromHTML is', blocksFromHTML);

    // eslint-disable-next-line function-paren-newline
    const contentState = ContentState.createFromBlockArray(
      blocksFromHTML.contentBlocks, blocksFromHTML.entityMap);
    logger.info('contentState is', contentState);

    const rawDraftContentState = convertToRaw(contentState);

    const editorProps = {
      height        : 500,
      initialContent: rawDraftContentState,
      onChange      : this.handleChange,
      onHTMLChange  : this.handleHTMLChange,
    };

    const { loading } = this.state;

    if (loading) return <p>loading editor...</p>;

    return <BraftEditor {...editorProps} />;
  }
}
