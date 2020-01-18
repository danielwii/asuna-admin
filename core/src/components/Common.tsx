import { ErrorInfo } from 'asuna-admin';
import _ from 'lodash';
import * as React from 'react';
import { FoldingCube } from 'styled-spinkit';
import * as util from 'util';

export const WithLoading: React.FC<{ loading: boolean; error: any }> = ({ loading, error, children }) => {
  if (loading) return <FoldingCube />;
  if (error)
    return (
      <ErrorInfo>
        <pre>{util.inspect(error)}</pre>
      </ErrorInfo>
    );

  if (_.isFunction(children)) {
    const Component = children as React.FC;
    return <Component />;
  }

  return <>{children}</>;
};
