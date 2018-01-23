import React from 'react';

import { storiesOf } from "@storybook/react";

import { LzRichEditor } from '../components/RichEditor/rich-editor';

storiesOf('DynamicForm', module)
  .add('rich-editor', () => <LzRichEditor />);
