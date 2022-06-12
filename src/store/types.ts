import type { AppState } from './app.redux';
import type { AuthState } from './auth.redux';
import type { MenuState } from './menu.redux';
import type { ModelsState } from './models.redux';
import type { SecurityState } from './security.redux';

interface GlobalState {
  type: string;
  payload: object;
  key: string;
}

export interface RootState {
  auth: AuthState;
  menu: MenuState;
  models: ModelsState;
  security: SecurityState;
  app: AppState;
  global: GlobalState;
}
