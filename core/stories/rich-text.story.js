import React from 'react';

import { storiesOf } from '@storybook/react';

// import { DraftRichEditor } from '../src/components/RichEditor/rich-editor';
import { BraftRichEditor } from '../src/components/RichEditor';

import 'draft-js/dist/Draft.css';
// import 'braft-editor/dist/index.css';

storiesOf('RichText', module)
  // .add('default', () => <DraftRichEditor />)
  .add('braft', () => <BraftRichEditor />);
