import { Dispatch } from 'redux';

import type { AnyAction } from 'redux';

export class Dispatcher {
  /**
   * 提供一种脱离 redux-connect 调用 dispatch 的方式
   */
  private static _dispatch: Dispatch;

  public static regDispatch(dispatch: Dispatch): void {
    if (!Dispatcher._dispatch) Dispatcher._dispatch = dispatch;
  }

  public static dispatch(action: AnyAction) {
    !(typeof window === 'undefined') && Dispatcher._dispatch && Dispatcher._dispatch(action);
  }
}
