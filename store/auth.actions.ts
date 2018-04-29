import { reduxAction } from 'node-buffs';

// --------------------------------------------------------------
// Login actionTypes
// --------------------------------------------------------------

export const authActionTypes = {
  LOGIN        : 'auth::login',
  LOGOUT       : 'auth::logout',
  LOGIN_FAILED : 'auth::login-failed',
  LOGIN_SUCCESS: 'auth::login-success',
};

export const isAvailable = action => action.type.startsWith('auth::') && !action.transient;

// --------------------------------------------------------------
// Login actions
// --------------------------------------------------------------

export const authActions = {
  login       : (username, password) => ({
    transient: true,
    ...reduxAction(authActionTypes.LOGIN, {
      username,
      password,
    }),
  }),
  logout      : () => reduxAction(authActionTypes.LOGOUT, { token: null, loginTime: null }),
  loginSuccess: (username, token) => reduxAction(authActionTypes.LOGIN_SUCCESS, {
    token,
    loginTime: new Date()
  }),
  loginFailed : error => reduxAction(authActionTypes.LOGIN_FAILED, {}, error),
};
