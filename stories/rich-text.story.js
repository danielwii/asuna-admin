import React from 'react';

import { storiesOf } from "@storybook/react";

import { DraftRichEditor } from '../components/RichEditor/rich-editor';
import { BraftRichEditor } from '../components/RichEditor';

storiesOf('RichText', module)
  .add('default', () => <DraftRichEditor />)
  .add('braft', () => <BraftRichEditor />);
