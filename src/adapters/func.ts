import { message } from 'antd';
import * as _ from 'lodash';
import * as R from 'ramda';

import { AppNavigator } from '../context/navigator';
import { AppContext } from '../core/context';
import { EventBus, EventType } from '../core/events';
import { Store } from '../core/store';
import { parseResponseError } from '../helpers/error';
import { TimelineMessageBox } from '../helpers/message-box';
import { createLogger } from '../logger';
import { menuProxy, securityProxy } from './proxy';

const logger = createLogger('adapters:func');

export class Func {
  static async loadAllSchemas() {
    logger.log('[loadAllSchemas]', 'load all schemas in saga');
    const { token } = Store.fromStore();
    const boxId = 'loadAllSchemas';
    if (token) {
      TimelineMessageBox.push({ key: boxId, type: 'loading', message: `loading all schemas...` });
      try {
        const schemas = await AppContext.ctx.models.loadSchemas();

        TimelineMessageBox.push({ key: boxId, type: 'done', message: `load all schemas success!` });
        // yield put(modelsActions.loadAllSchemasSuccess(schemas));
        logger.log('[loadAllSchemas]', 'load all model schemas', schemas);
        return schemas;
      } catch (e) {
        logger.warn('[loadAllSchemas]', e, { e });
        TimelineMessageBox.push({ key: boxId, type: 'error', message: parseResponseError(e) });
      }
    }
  }
  static async loadRoles() {
    const { token } = Store.fromStore();
    const boxId = 'loadAllRoles';
    if (token) {
      // message.loading('loading all roles...');
      TimelineMessageBox.push({ key: boxId, type: 'loading', message: `loading all roles...` });
      try {
        const response = await securityProxy.roles();
        // message.success('load all roles success!');
        TimelineMessageBox.push({ key: boxId, type: 'done', message: `load all roles success!` });
        logger.log('[loadAllRoles]', 'response of load all roles is', response);
        // yield put(securityActions.loadAllRolesSuccess(response.data));
        return response.data;
      } catch (e) {
        logger.warn('[loadAllRoles]', 'CATCH -> load all roles error', e);
        // message.error(toErrorMessage(e));
        TimelineMessageBox.push({ key: boxId, type: 'error', message: parseResponseError(e) });
      }
    }
  }
  static async getCurrentUser() {
    const { token } = Store.fromStore();
    const boxId = 'getCurrentUser';
    if (token) {
      // message.loading('loading current user...');
      TimelineMessageBox.push({ key: boxId, type: 'loading', message: `loading current user...` });
      try {
        logger.log('[getCurrentUser]', 'get current user after rehydrate...');
        const response = await securityProxy.currentUser();
        // message.success('get current user success!');
        TimelineMessageBox.push({ key: boxId, type: 'done', message: `get current user success!` });
        logger.log('[getCurrentUser]', 'response of get current user is', response);
        // await put(securityActions.getCurrentUserSuccess(response.data));
        return response.data;
      } catch (e) {
        logger.warn('[getCurrentUser]', 'CATCH -> get current user error', e);
        // message.error(toErrorMessage(e));
        TimelineMessageBox.push({ key: boxId, type: 'error', message: parseResponseError(e) });
        // await put(authActions.logout()); TODO
        await Func.logout();
      }
    }
  }
  static async loadMenus() {
    try {
      // const { roles, user } = await select((state: RootState) => state.security);
      const roles = await Func.loadRoles();
      const user = await Func.getCurrentUser();
      if (user) {
        if (roles && roles.items) {
          const currentRoles: any = R.compose(
            R.filter<any>((role) => {
              // 判断返回的是否是 ids
              if (user.roles && _.isObjectLike(user.roles[0])) {
                return R.includes(role.id)(R.values(R.pluck('id' as any, user.roles)));
              }
              return R.includes(role.id)(user.roles);
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

          const menus = await menuProxy.init(isSysAdmin, authorities);
          logger.log('[init]', 'init sage, menus is', menus);

          return { menus };
          // await put({ type: menuActionTypes.INIT_SUCCESS, payload: { menus } });
        } else {
          logger.warn('[init]', 'cannot found any roles');
        }
      } else {
        logger.warn('[init]', 'cannot found current user info');
        message.error('无法拉取到用户信息，请重新登录');
        AppNavigator.toLogin();
      }
    } catch (e) {
      logger.error('[init]', e);
    }
  }
  static async logout() {
    logger.log('remove token and schemas... then logout.');
    localStorage.removeItem('token');
    localStorage.removeItem('schemas');
    return AppNavigator.toLogin();
  }

  static async fetch(modelName: string, data) {
    const { token } = Store.fromStore();
    const boxId = 'fetch';
    if (token) {
      TimelineMessageBox.push({ key: boxId, type: 'loading', message: `loading model '${modelName}'...` });
      try {
        const response = await AppContext.adapters.models.fetch(modelName, data);
        TimelineMessageBox.push({ key: boxId, type: 'done', message: `load model '${modelName}' success` });
        logger.log('[fetch]', 'response of load model is', response);
        return response.data;
      } catch (e) {
        logger.warn('[fetch]', e, { e });
        TimelineMessageBox.push({ key: boxId, type: 'error', message: parseResponseError(e) });
      }
    }
  }

  static async upsert(modelName: string, data) {
    const { token } = Store.fromStore();
    const boxId = 'upsert';
    if (token) {
      TimelineMessageBox.push({ key: boxId, type: 'loading', message: `upsert model '${modelName}'...` });
      try {
        const response = await AppContext.adapters.models.upsert(modelName, data);
        message.success('更新/创建 成功！');
        TimelineMessageBox.push({ key: boxId, type: 'done', message: `upsert model '${modelName}' success` });
        logger.log('[upsert]', 'response of upsert model is', response);
        return response.data;
      } catch (error) {
        logger.warn('[upsert]', error, { error });
        TimelineMessageBox.push({ key: boxId, type: 'error', message: parseResponseError(error) });
      }
    }
  }
  static async remove(modelName: string, data) {
    const { token } = Store.fromStore();
    const boxId = 'remove';
    if (token) {
      TimelineMessageBox.push({ key: boxId, type: 'loading', message: `remove model '${modelName}'...` });
      try {
        const response = await AppContext.adapters.models.remove(modelName, data);
        message.success('删除 成功！');
        TimelineMessageBox.push({ key: boxId, type: 'done', message: `remove model '${modelName}' success` });
        logger.log('[remove]', 'response of remove model is', response);
        // refresh models in content index
        EventBus.sendEvent(EventType.MODEL_DELETE, { modelName, data });
        // const { models } = yield select((state: RootState) => state.content);
        // yield put(contentActions.loadModels(modelName, _.get(models, `${modelName}.extras`)));
        return response.data;
      } catch (error) {
        logger.warn('[remove]', error, { error });
        TimelineMessageBox.push({ key: boxId, type: 'error', message: parseResponseError(error) });
      }
    }
  }
}
