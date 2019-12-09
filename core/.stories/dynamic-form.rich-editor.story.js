import * as React from 'react';

import { storiesOf } from '@storybook/react';

import { LzRichEditor } from '../src/components/RichEditor/rich-editor';

storiesOf('DynamicForm', module).add('rich-editor', () => <LzRichEditor />);
