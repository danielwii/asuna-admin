import React from 'react';

import { storiesOf } from '@storybook/react';

import { DraftRichEditor } from '../src/components/RichEditor/rich-editor';
import { BraftRichEditor } from '../src/components/RichEditor';

storiesOf('RichText', module)
  .add('default', () => <DraftRichEditor />)
  .add('braft', () => <BraftRichEditor />);
