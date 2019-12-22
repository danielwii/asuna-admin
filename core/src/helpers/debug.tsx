import { AppContext } from '@asuna-admin/core';

import { Button, Divider, Icon, Popover } from 'antd';
import * as React from 'react';
import { useState } from 'react';
import JSONTree from 'react-json-tree';
import * as util from 'util';

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

export const DebugInfo: React.FC<{ data: any; divider?: boolean }> = ({ data, divider }) => {
  const [lv, setLevel] = useState(3);

  if (AppContext.isDebugMode) {
    return null;
  }

  return (
    <>
      {divider && <Divider type="horizontal" style={{ margin: '1rem 0' }} />}
      <Button type="dashed" size="small" onClick={() => setLevel(lv + 1)} children="+" />{' '}
      <Button type="dashed" size="small" onClick={() => setLevel(lv - 1)} children="-" />
      <JSONTree data={data} hideRoot shouldExpandNode={(keyPath, data, level) => level < lv} />
    </>
  );
};
