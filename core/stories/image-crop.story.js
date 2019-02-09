import React from 'react';

import { storiesOf } from '@storybook/react';
import { ImageCrop } from '../src/components/DynamicForm/ImageCrop';
import { ImageTrivia } from '../src/components/DynamicForm/ImageTrivia';

storiesOf('ImageHandler', module)
  .add('Crop', () => <ImageCrop />)
  .add('Trivia', () => <ImageTrivia />);
