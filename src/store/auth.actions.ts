import { reduxAction } from 'node-buffs/dist/redux';

// --------------------------------------------------------------
// Login actionTypes
// --------------------------------------------------------------

export const authActionTypes = {
  LOGIN: 'auth::login',
  LOGOUT: 'auth::logout',
  LOGIN_FAILED: 'auth::login-failed',
  LOGIN_SUCCESS: 'auth::login-success',
};

export const isAuthModule = (action) => action.type.startsWith('auth::') && !action.transient;

// --------------------------------------------------------------
// Login actions
// --------------------------------------------------------------

export const authActions = {
  login: (username: string, password: string, callback) => ({
    transient: true,
    type: authActionTypes.LOGIN,
    payload: { username, password },
    callback,
  }),
  logout: () => reduxAction(authActionTypes.LOGOUT, { token: null, loginTime: null }),
  loginSuccess: (username: string, token: string) =>
    reduxAction(authActionTypes.LOGIN_SUCCESS, {
      username,
      token,
      loginTime: new Date(),
    }),
  loginFailed: (error) => reduxAction(authActionTypes.LOGIN_FAILED, {}, error),
};
