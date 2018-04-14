import { put, select, takeLatest } from 'redux-saga/effects';

import * as R from 'ramda';
import _ from 'lodash';

import { menuProxy }        from '../adapters/menu';
import { createLogger, lv } from '../helpers/index';

const logger = createLogger('store:menu', lv.warn);

// --------------------------------------------------------------
// Module menuActionTypes
// --------------------------------------------------------------

const menuActionTypes = {
  // ACTION: 'module::action'
  INIT        : 'menu::init',
  INIT_SUCCESS: 'menu::init-success',
};

const isCurrent = type => type.startsWith('menu::');

// --------------------------------------------------------------
// Module menuActions
// --------------------------------------------------------------

const menuActions = {
  init: () => ({ type: menuActionTypes.INIT }),
};

// --------------------------------------------------------------
// Module menuSagas
// function* actionSage(args) {
//   yield call; yield puy({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

const menuSagaFunctions = {
  * init() {
    try {
      const { roles, user } = yield select(state => state.security);

      if (user) {
        if (roles && roles.items) {
          const currentRoles = R.compose(
            R.filter((role) => {
              // 判断返回的是否是 ids
              if (user.roles && _.isObjectLike(user.roles[0])) {
                return R.contains(role.id)(R.values(R.pluck('id', user.roles)));
              }
              return R.contains(role.id)(user.roles);
            }),
            R.propOr([], 'items'),
          )(roles);
          logger.info('[init]', 'current roles is', currentRoles);

          const isSysAdmin = !!R.find(role => role.name === 'SYS_ADMIN')(currentRoles);
          logger.info('[init]', 'current user isSysAdmin', isSysAdmin);

          const authoritiesList = R.compose(
            // remove null values
            R.filter(R.identity),
            // 后端返回字符串时需要反序列化为 JSON
            R.map((role) => {
              const each = R.prop('authorities')(role);
              return R.is(String, each) ? JSON.parse(each) : each;
            }),
          )(currentRoles);
          logger.info('[init]', 'current authoritiesList is', authoritiesList);

          const authorities = R.reduce(R.mergeWith(R.or), {})(authoritiesList);
          logger.info('[init]', 'current authorities is', authorities);

          const menus = yield menuProxy.init(isSysAdmin, authorities);
          logger.log('[init]', 'init sage, menus is', menus);

          yield put({ type: menuActionTypes.INIT_SUCCESS, payload: { menus } });
        } else {
          logger.warn('[init]', 'cannot found any roles');
        }
      } else {
        logger.warn('[init]', 'cannot found current user');
      }
    } catch (e) {
      logger.error('[init]', e);
    }
  },
};

const menuSagas = [
  // takeLatest / takeEvery (actionType, actionSage)
  takeLatest(menuActionTypes.INIT, menuSagaFunctions.init),
];

// --------------------------------------------------------------
// Module reducers
// action = { payload: any? }
// --------------------------------------------------------------

const initialState = {
  // openKey  : null,
  // activeKey: null,
  menus: [],
};

const menuReducer = (previousState = initialState, action) => {
  if (isCurrent(action.type)) {
    switch (action.type) {
      default:
        return { ...previousState, ...action.payload };
    }
  } else {
    return previousState;
  }
};

export {
  menuActionTypes,
  menuActions,
  menuSagas,
  menuReducer,
  menuSagaFunctions,
};
