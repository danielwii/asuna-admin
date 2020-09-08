import { menuProxy } from '@asuna-admin/adapters';
import { createLogger } from '@asuna-admin/logger';
import { RootState } from '@asuna-admin/store';
import { Asuna } from '@asuna-admin/types';

import * as _ from 'lodash';
import * as R from 'ramda';
import { put, select, takeLatest } from 'redux-saga/effects';

const logger = createLogger('store:menu');

// --------------------------------------------------------------
// Module menuActionTypes
// --------------------------------------------------------------

const menuActionTypes = {
  // ACTION: 'module::action'
  INIT: 'menu::init',
  INIT_SUCCESS: 'menu::init-success',
};

export const isMenuModule = (action) => action.type.startsWith('menu::') && !action.transient;

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
  *init() {
    try {
      const { roles, user } = yield select((state: RootState) => state.security);

      if (user) {
        if (roles && roles.items) {
          const currentRoles: any = R.compose(
            R.filter<any>((role) => {
              // 判断返回的是否是 ids
              if (user.roles && _.isObjectLike(user.roles[0])) {
                return R.contains(role.id)(R.values(R.pluck('id' as any, user.roles)));
              }
              return R.contains(role.id)(user.roles);
            }),
            R.propOr([], 'items'),
          )(roles);
          logger.debug('[init]', 'current roles is', currentRoles);

          const isSysAdmin = !!R.find<any>((r) => r.name === 'SYS_ADMIN')(currentRoles);
          logger.debug('[init]', 'current user isSysAdmin', isSysAdmin);

          const authoritiesList = R.compose(
            // remove null values
            R.filter<any>(R.identity),
            // 后端返回字符串时需要反序列化为 JSON
            R.map<any, any>((role) => {
              const each: any = R.prop('authorities')(role);
              return R.is(String, each) ? JSON.parse(each) : each;
            }),
          )(currentRoles);
          logger.debug('[init]', 'current authoritiesList is', authoritiesList);

          const authorities = R.reduce(R.mergeWith(R.or), {})(authoritiesList);
          logger.debug('[init]', 'current authorities is', authorities);

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

export interface MenuState {
  menus: Asuna.Schema.Menu[];
}

const initialState: MenuState = {
  // openKey  : null,
  // activeKey: null,
  menus: [],
};

const menuReducer = (previousState = initialState, action) => {
  if (isMenuModule(action)) {
    return R.mergeDeepRight(previousState, action.payload);
  }
  return previousState;
};

export { menuActionTypes, menuActions, menuSagas, menuReducer, menuSagaFunctions };
