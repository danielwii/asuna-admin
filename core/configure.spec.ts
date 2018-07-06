import { config } from './configure';

describe('configure', () => {
  config.update();

  it('should initialized with default configs', () => {
    expect(config.opts.API_RESPONSE_ASSOCIATION_MODE).toBe('ids');
    expect(config.get('API_RESPONSE_ASSOCIATION_MODE')).toBe('ids');
  });
  it('should check if value equals current config', () => {
    expect(config.is('API_RESPONSE_ASSOCIATION_MODE', 'ids')).toBeTruthy();
  });
  it('should return expected value by updated', () => {
    config.update({ API_RESPONSE_ASSOCIATION_MODE: 'entity' });
    expect(config.get('API_RESPONSE_ASSOCIATION_MODE')).toBe('entity');
  });
  it('should return default value', () => {
    expect(config.get('not-exists' as any, 'default-value')).toBe('default-value');
  });
});
