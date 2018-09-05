import { Config } from './';

describe('configure', () => {
  Config.update();

  it('should initialized with default configs', () => {
    expect(Config.opts.API_RESPONSE_ASSOCIATION_MODE).toBe('ids');
    expect(Config.get('API_RESPONSE_ASSOCIATION_MODE')).toBe('ids');
  });
  it('should check if value equals current config', () => {
    expect(Config.is('API_RESPONSE_ASSOCIATION_MODE', 'ids')).toBeTruthy();
  });
  it('should return expected value by updated', () => {
    Config.update({ API_RESPONSE_ASSOCIATION_MODE: 'entity' });
    expect(Config.get('API_RESPONSE_ASSOCIATION_MODE')).toBe('entity');
  });
  it('should return default value', () => {
    expect(Config.get('not-exists' as any, 'default-value')).toBe('default-value');
  });
});
