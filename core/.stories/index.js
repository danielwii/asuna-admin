import * as React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';

import 'antd/dist/antd.css';

import { Button, Welcome } from '@storybook/react/demo';

import './login.story';
// import './layout.story';
// import './panes.story';
import './side-menu.story';
// import './dynamic-form.story';
// import './dynamic-form.rich-editor.story';
import './dynamic-form.select.story';
// import './dynamic-property.story';
// import './modules-models.story';
import './rich-text.story';
import './image-crop.story';
import './debug-settings.story';
import './2-factor-auth.story';

storiesOf('Welcome', module).add('to Storybook', () => <Welcome showApp={linkTo('Button')} />);

storiesOf('Button Examples', module)
  .add('with text', () => <Button onClick={action('clicked')}>Hello Button</Button>)
  .add('with some emoji', () => <Button onClick={action('clicked')}>😀 😎 👍 💯</Button>);
