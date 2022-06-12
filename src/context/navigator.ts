import { createLogger } from '../logger';

const logger = createLogger('context:navigator');

export class AppNavigator {
  static toIndex = () => AppNavigator.goto('/');
  static toHome = () => AppNavigator.goto('/home');
  static toLogin = () => AppNavigator.goto('/login');

  static isLogin = () => window.location.pathname.startsWith('/login');

  static goto(path: string): void {
    const isCurrent = window.location.pathname !== path;
    logger.log('goto', { from: window.location.pathname, to: path, isCurrent });
    if (isCurrent) window.location.pathname = path;
  }
}
