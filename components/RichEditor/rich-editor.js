import React                              from 'react';
import { Editor, EditorState, RichUtils } from 'draft-js';
import FontAwesomeIcon                    from '@fortawesome/react-fontawesome';

import {
  faAlignCenter,
  faAlignJustify,
  faAlignLeft,
  faAlignRight,
} from '@fortawesome/fontawesome-free-solid';

import { createLogger } from '../../adapters/logger';

const logger = createLogger('components:dynamic-form:rich-editor', 1);

class TextAlign extends React.Component {
  state = {
    currentAlignment: undefined,
  };

  componentWillReceiveProps(next) {
    // this.setState({
    //   currentAlignment: next.editor.getSelectionBlockData('textAlign'),
    // });
  }

  setAlignment = (e) => {
    console.log(e.currentTarget.dataset);
    // this.props.editor.toggleSelectionAlignment(e.currentTarget.dataset.alignment);
  };

  render() {
    const { currentAlignment } = this.state;
    return (
      <div>
        <span>TextAlign</span>
        <button onClick={this.setAlignment}><FontAwesomeIcon icon={faAlignLeft} /></button>
        <button onClick={this.setAlignment}><FontAwesomeIcon icon={faAlignCenter} /></button>
        <button onClick={this.setAlignment}><FontAwesomeIcon icon={faAlignRight} /></button>
        <button onClick={this.setAlignment}><FontAwesomeIcon icon={faAlignJustify} /></button>
        <hr />
        <pre>{JSON.stringify(currentAlignment, null, 2)}</pre>
      </div>
    );
  }
}

class ToolBar extends React.Component {
  render() {
    return (
      <div>
        <TextAlign />
      </div>
    );
  }
}

export class DraftRichEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = { editorState: EditorState.createEmpty() };
  }

  onChange = (editorState) => {
    logger.info('[onChange]', editorState);
    this.setState({ editorState });
  };

  onBoldClick = () => {
    this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, 'BOLD'));
  };

  handleKeyCommand(command, editorState) {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return 'handled';
    }
    return 'not-handled';
  }

  render() {
    const { editorState } = this.state;
    return (
      <div>
        <div className="editor-container">
          <ToolBar />
          <button onClick={this.onBoldClick}>Bold</button>
          <div className="divider" />
          <Editor
            className="editor"
            editorState={editorState}
            handleKeyCommand={this.handleKeyCommand}
            onChange={this.onChange}
          />
        </div>
        {/* language=CSS */}
        <style jsx>{`
          .editor-container {
            box-shadow: 0 0 .5rem lightgrey;
            padding: .5rem;
            border-radius: .25rem;
          }

          .divider {
            height: .075rem;
            background-color: lightgray;
            margin: .2rem 0;
          }
        `}
        </style>
      </div>
    );
  }
}
