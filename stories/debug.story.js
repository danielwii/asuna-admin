import React from 'react';

import { storiesOf } from '@storybook/react';
import { Button } from '@storybook/react/demo';
import * as util from 'util';

import { DebugSettings } from '../src/components/Debug';
import { createLogger, modules } from '../src/logger';

storiesOf('Debug', module)
  //
  .add('DebugSettings', () => {
    const logger = createLogger('log');
    return (
      <div>
        <DebugSettings modules={modules} />
        <hr />
        <Button
          onClick={() => {
            logger.trace('test-trace');
            logger.debug('test-debug');
            logger.log('test-log');
            logger.warn('test-warn');
            logger.error('test-error');
          }}
        >
          test logger
        </Button>
        <pre>{util.inspect({ modules })}</pre>
      </div>
    );
  });
