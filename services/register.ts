import createAuthService     from './auth';
import createModelService    from './models';
import createMenuService     from './menu';
import createApiService      from './api';
import createSecurityService from './security';
import createDefinitions     from './definitions';

import { ApiResponseAssociationMode, config, StringCase } from 'app/configure';
import { ILoginRegister, IIndexRegister }                 from 'app/context';

config.update({
  MODEL_KEYS_CASE              : StringCase.Camel,
  API_RESPONSE_ASSOCIATION_MODE: ApiResponseAssociationMode.ENTITY,
  IMAGE_API                    : 'api/images',
  VIDEO_API                    : 'api/videos',
});

export const register: ILoginRegister & IIndexRegister = {
  createAuthService,
  createModelService,
  createMenuService,
  createApiService,
  createSecurityService,
  createDefinitions,
};
