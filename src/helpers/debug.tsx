import React from 'react';
import { AppContext } from '@asuna-admin/core';
import { Icon, Popover } from 'antd';
import util from 'util';

interface IWithDebugInfoProps {
  content: any;
  info: any;
}

export class WithDebugInfo extends React.PureComponent<IWithDebugInfoProps> {
  render(): React.ReactNode {
    const { content, info } = this.props;
    if (AppContext.isDevMode) {
      return (
        <div>
          {content}
          <Popover content={<pre>{util.inspect(info)}</pre>} trigger={'click'}>
            <Icon type="info-circle" style={{ margin: '0 0.2rem' }} />
          </Popover>
        </div>
      );
    }
  }
}
