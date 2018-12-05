import React from 'react';
import * as R from 'ramda';

import { storiesOf } from '@storybook/react';
import { Form } from 'antd/lib/index';

import { generateSelect } from '../src/components/DynamicForm/elements/select';

storiesOf('DynamicForm', module).add('select', () => {
  const Selector = Form.create()(({ form }) =>
    generateSelect(form, {
      // ...options,
      key: 'Selector',
      items: [
        { key: 'test-1', value: 'test-value-1' },
        { key: 'test-2', value: 'test-value-2' },
        { key: 'test-3', value: 'test-value-3' },
      ],
      mode: 'multiple',
      withSortTree: true,
      getName: R.prop('key'),
    }),
  );
  return (
    <div>
      Hello kitty.
      <Selector value={[1]} />
    </div>
  );
});
