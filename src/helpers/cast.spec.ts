import { Config } from '../config';
import { castModelKey, castModelName } from './cast';

describe('cast', () => {
  it('should cat model key correctly', () => {
    expect(castModelKey('helloKitty')).toBe('helloKitty');
    Config.update({ MODEL_KEYS_CASE: 'Snake' });
    expect(castModelKey('helloKitty')).toBe('hello_kitty');
    Config.update({ MODEL_KEYS_CASE: 'Camel' });
    expect(castModelKey('hello_kitty')).toBe('helloKitty');
  });
  it('should cat model name correctly', () => {
    expect(castModelName('helloKitty')).toBe('helloKitty');
    Config.update({ MODEL_NAME_CASE: 'Snake' });
    expect(castModelName('helloKitty')).toBe('hello_kitty');
    Config.update({ MODEL_NAME_CASE: 'Camel' });
    expect(castModelName('hello_kitty')).toBe('helloKitty');
  });
});
