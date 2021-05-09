import * as React from 'react';
import { useMountedState } from 'react-use';

export const NoSSR = ({ children, fallback = null }: { children: React.ReactElement; fallback?: JSX.Element | null }) => {
  const isMounted = useMountedState();
  return !isMounted ? fallback : children;
};
