import React from 'react';
import { AppContext } from '@asuna-admin/core';
import { Icon, Popover } from 'antd';
import util from 'util';

interface IWithDebugInfoProps {
  info: any;
}

export class WithDebugInfo extends React.PureComponent<IWithDebugInfoProps> {
  render(): React.ReactNode {
    const { children, info } = this.props;
    if (AppContext.isDevMode) {
      return (
        <>
          {children}
          <Popover content={<pre>{util.inspect(info)}</pre>} trigger={'click'}>
            <Icon type="info-circle" style={{ margin: '0 0.2rem' }} />
          </Popover>
        </>
      );
    }
    return children || '';
  }
}
