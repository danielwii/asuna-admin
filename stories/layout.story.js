import React from 'react';

import { storiesOf } from "@storybook/react";

import { MainLayout } from '../layout';

storiesOf('MainLayout', module)
  .add('default', () => (
    <MainLayout>
      <div>^_^</div>
    </MainLayout>
  ));
