import { AppContext } from '@asuna-admin/core';

import { Button, Divider, Icon, Popover } from 'antd';
import * as React from 'react';
import { useState } from 'react';
import JSONTree from 'react-json-tree';
import * as util from 'util';

export const WithDebugInfo: React.FC<{ info: any }> = ({ info, children }) => {
  if (AppContext.isDevMode) {
    return (
      <>
        {children}
        <Popover content={<pre>{util.inspect(info, { depth: 5 })}</pre>} trigger={'click'}>
          <Icon type="info-circle" style={{ margin: '0 0.2rem' }} />
        </Popover>
      </>
    );
  }
  return <>{children}</>;
};

export const DebugInfo: React.FC<{ data: any; divider?: boolean; type?: 'json' | 'util' | 'tree' }> = ({
  data,
  divider,
  type,
}) => {
  const [lv, setLevel] = useState(3);

  if (!AppContext.isDebugMode) {
    return null;
  }

  const rendered = (type => {
    switch (type) {
      case 'json':
        return <pre>{JSON.stringify(data, null, 2)}</pre>;
      case 'util':
        return <pre>{util.inspect(data)}</pre>;
      default:
        return (
          <>
            <Button type="dashed" size="small" onClick={() => setLevel(lv + 1)} children="+" />{' '}
            <Button type="dashed" size="small" onClick={() => setLevel(lv - 1)} children="-" />
            <JSONTree data={data} hideRoot shouldExpandNode={(keyPath, data, level) => level < lv} />
          </>
        );
    }
  })(type);

  return (
    <>
      {divider && <Divider type="horizontal" style={{ margin: '1rem 0' }} />}
      {rendered}
    </>
  );
};
