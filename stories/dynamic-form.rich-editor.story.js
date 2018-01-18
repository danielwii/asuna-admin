import React from 'react';

import { storiesOf } from "@storybook/react";

import { LzRichEditor } from '../components/DynamicForm/rich-editor';

storiesOf('DynamicForm', module)
  .add('rich-editor', () => <LzRichEditor />);
