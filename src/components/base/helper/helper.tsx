/** @jsxRuntime classic */

/** @jsx jsx */
// noinspection ES6UnusedImports
import { css, jsx } from '@emotion/react';

import { parseJSONIfCould } from '@danielwii/asuna-helper/dist/utils';

import { Button, Typography } from 'antd';
import { Promise } from 'bluebird';
import _ from 'lodash';
import React, { ReactElement, ReactNode, ValidationMap, WeakValidationMap } from 'react';
import { useLogger } from 'react-use';
import useAsync from 'react-use/lib/useAsync';
import * as util from 'util';

import { ErrorInfo } from '../error';
import { Loading } from '../loading';

export interface CustomFC<P = {}, R = () => React.ReactNode> {
  propTypes?: WeakValidationMap<P>;
  contextTypes?: ValidationMap<any>;
  defaultProps?: Partial<P>;
  displayName?: string;
  (props: P & { children?: R }, context?: any): ReactElement | null;
}

export type StateChildren<S> = (state: S, setState: (state: S) => void) => ReactNode;
export type StateFunctionComponent<P = {}, S = {}> = CustomFC<P, StateChildren<S>>;
export type StateFC<State> = StateFunctionComponent<{ initialState?: State }, State>;

export function parseString(value?): string {
  return value ? (_.isString(value) ? value : JSON.stringify(value)) : '';
}

export function isJson(value): boolean {
  try {
    JSON.parse(value);
    return true;
  } catch (e) {
    return false;
  }
}

export function parseArray<T = any>(value): T[] {
  if (_.isArray(value)) {
    return value;
  }
  return parseJSONIfCould(value);
}

export function castToArrays(value: string): string[] {
  return isJson(value) ? JSON.parse(value) : _.compact(value?.split(','));
}

// export function valueToArrays(value: string | string[]): string[] {
//   return value ? (_.isArray(value) ? value : castToArrays(value)) : [];
// }

export const AsunaContent: React.FC<{ value: any; link?: boolean }> = ({ value, link }) => {
  const parsed = _.isObject(value) ? util.inspect(value) : value;
  // TODO add link icon to open in new tab
  // const isLink = /^(https?:\/\/\S+)/gi.test(parsed);
  return link ? (
    <Typography.Link href={parsed} target="_blank">
      {parsed}
    </Typography.Link>
  ) : (
    <Typography.Paragraph
      copyable={parsed ? { text: parsed } : false}
      ellipsis={{ rows: 3, expandable: true, symbol: '更多', tooltip: value }}
      style={{ cursor: 'pointer' }}
    >
      {value}
    </Typography.Paragraph>
  );
};

export const WithLoading: React.FC<React.PropsWithChildren<{ loading: boolean; error: any; retry?: () => any }>> = ({
  loading,
  error,
  retry,
  children,
}) => {
  if (loading) return <Loading type="fold" />;
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

  return <React.Fragment>{children}</React.Fragment>;
};

export function WithFuture<R>({
  future,
  fallback,
  children,
}: {
  future: () => Promise<R>;
  fallback?: React.ReactElement;
  children: ((props: R) => React.ReactNode) | React.ReactNode;
}): React.ReactElement {
  const { loading, value, error } = useAsync(future);

  if (loading) return fallback ?? <Loading type="circle" />;
  if (error)
    return (
      <ErrorInfo>
        <pre>{util.inspect(error)}</pre>
      </ErrorInfo>
    );

  return _.isFunction(children) ? (
    <React.Fragment>{children(value as any)}</React.Fragment>
  ) : (
    <React.Fragment>{children}</React.Fragment>
  );
}

export const WithSuspense = <R extends any>({
  future,
  fallback = <Loading type="circle" />,
  children,
}: {
  future: () => Promise<R>;
  fallback?: React.ReactElement | string;
  children: (props: R) => React.ReactNode;
}): React.ReactElement => {
  useLogger('<[WithSuspense]>');

  const Component = React.lazy(async () => {
    const data = await future();
    return { default: () => <React.Fragment>{children(data)}</React.Fragment> };
  });

  return (
    <React.Suspense fallback={fallback}>
      <Component />
    </React.Suspense>
  );
};

export function WithVariable<V>({
  variable,
  children,
}: {
  variable: V;
  children: (props: NonNullable<V>) => React.ReactNode;
}) {
  if (_.isNull(variable) || _.isUndefined(variable)) {
    return <span>n/a</span>;
  }
  return <React.Fragment>{children(variable as any)}</React.Fragment>;
}

export const withP = <P, R>(parameter: P, fn: (p: P) => R) => fn(parameter);
export const withP2 = <P1, P2, R>(parameter1: P1, parameter2: P2, fn: (p1: P1, p2: P2) => R) =>
  fn(parameter1, parameter2);
export const withP3 = <P1, P2, P3, R>(
  parameter1: P1,
  parameter2: P2,
  parameter3: P3,
  fn: (p1: P1, p2: P2, p3: P3) => R,
  // eslint-disable-next-line max-params
) => fn(parameter1, parameter2, parameter3);
export const fnWithP3 =
  <P1, P2, P3, R>(parameter1: P1, parameter2: P2, parameter3: P3) =>
  (fn: (p1: P1, p2: P2, p3: P3) => R): R =>
    fn(parameter1, parameter2, parameter3);

export function isPromiseAlike<T>(value: any): value is Promise<T> {
  return !!value?.then;
}

function memoForwardRef<N, P>(comp: React.ForwardRefRenderFunction<N, P>) {
  return React.memo(React.forwardRef<N, P>(comp));
}
