// export const authHeader = token => ({ headers: { Authorization: `Bearer ${token}` } });
// TODO make helpers configurable
export const authHeader = token => ({ headers: { Authorization: token } });
