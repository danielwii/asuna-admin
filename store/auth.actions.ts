import { reduxAction } from 'node-buffs';

// --------------------------------------------------------------
// Login actionTypes
// --------------------------------------------------------------

export const authActionTypes = {
  LOGIN: 'auth::login',
  LOGOUT: 'auth::logout',
  LOGIN_FAILED: 'auth::login-failed',
  LOGIN_SUCCESS: 'auth::login-success',
};

export const isAuthModule = action => action.type.startsWith('auth::') && !action.transient;

// --------------------------------------------------------------
// Login actions
// --------------------------------------------------------------

export const authActions = {
  login: (username, password, callback) => ({
    transient: true,
    type: authActionTypes.LOGIN,
    payload: { username, password },
    callback,
  }),
  logout: () => reduxAction(authActionTypes.LOGOUT, { token: null, loginTime: null }),
  loginSuccess: (username, token) =>
    reduxAction(authActionTypes.LOGIN_SUCCESS, {
      username,
      token,
      loginTime: new Date(),
    }),
  loginFailed: error => reduxAction(authActionTypes.LOGIN_FAILED, {}, error),
};
