import React from 'react';

import { storiesOf } from '@storybook/react';

import { DebugSettings } from '../src/components/Debug';

storiesOf('Debug', module)
  //
  .add('DebugSettings', () => <DebugSettings modules={['test:a', 'test:b', 'no-test']} />);
