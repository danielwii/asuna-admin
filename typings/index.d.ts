// declare module '*.json' {
//   const value: any;
//   export default value;
// }

import { InterpolationWithTheme } from '@emotion/core';

declare global {
  namespace JSX {
    /**
     * Do we need to modify `LibraryManagedAttributes` too,
     * to make `className` props optional when `css` props is specified?
     */

    interface IntrinsicAttributes {
      css?: InterpolationWithTheme<any>;
    }
  }
}

declare module 'react' {
  interface DOMAttributes<T> {
    css?: InterpolationWithTheme<any>;
  }
}
