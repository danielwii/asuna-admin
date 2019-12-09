import * as React from 'react';

import { storiesOf } from '@storybook/react';

import { TwoFactorAuthentication } from '../src/components/TwoFactorAuthentication';

storiesOf('2-Factor-Auth', module).add('default', () => <TwoFactorAuthentication />);
