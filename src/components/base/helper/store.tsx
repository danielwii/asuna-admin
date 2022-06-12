/** @jsxRuntime classic */

/** @jsx jsx */
// noinspection ES6UnusedImports
import { css, jsx } from '@emotion/react';
import React, { Dispatch, SetStateAction } from 'react';

export function StoreProvider<State = any>({
  initialState,
  children,
}: {
  initialState: State;
  children: (state: State, setState: Dispatch<SetStateAction<State>>) => React.ReactElement;
}) {
  const [state, setState] = React.useState(initialState);
  return (
    <div
      css={css`
        display: flex;
        justify-content: space-between;
        > div {
          flex: 0 0 calc(50% - 0.5rem);
          border: silver dashed 1px;
          padding: 0.5rem;
          margin: 0.2rem;
        }
      `}
    >
      <div>{children(state, setState)}</div>
      <div>
        <pre>{JSON.stringify({ state, initialState }, null, 2)}</pre>
      </div>
    </div>
  );
}
