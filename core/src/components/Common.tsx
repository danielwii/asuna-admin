import { Button } from 'antd';
import _ from 'lodash';
import * as React from 'react';
import { FoldingCube } from 'styled-spinkit';
import * as util from 'util';
import { ErrorInfo } from './ErrorInfo';

export const WithLoading: React.FC<{ loading: boolean; error: any; retry? }> = ({
  loading,
  error,
  retry,
  children,
}) => {
  if (loading) return <FoldingCube />;
  if (error)
    return (
      <ErrorInfo>
        {retry && <Button onClick={() => retry()}>Reload</Button>}
        <pre>{util.inspect(error)}</pre>
      </ErrorInfo>
    );

  if (_.isFunction(children)) {
    const Component = children as React.FC;
    return <Component />;
  }

  return <>{children}</>;
};
