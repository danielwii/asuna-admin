import { extend, parseJSONIfCould, removePreAndSuf, removePrefix, removeSuffix } from './func';
import { Config } from '@asuna-admin/config';

describe('func', () => {
  it('should extend all props', function() {
    expect(extend({ a: 1, c: 3 }, { a: 2, b: 2 })).toEqual({ a: 2, b: 2, c: 3 });
  });
  it('should remove prefix correctly', () => {
    expect(removePrefix('helloKittyhelloKitty', 'hello')).toBe('KittyhelloKitty');
    expect(removePrefix('helloKitty', '')).toBe('helloKitty');
    expect(removePrefix('hhello_kitty', 'h')).toBe('hello_kitty');
  });
  it('should remove suffix correctly', () => {
    expect(removeSuffix('helloKitty', 'Kitty')).toBe('hello');
    expect(removeSuffix('helloKitty', '')).toBe('helloKitty');
    expect(removeSuffix('hello_kittyy', 'y')).toBe('hello_kitty');
  });
  it('should remove suffix & prefix correctly', () => {
    expect(removePreAndSuf('helloKitty', 'he', 'Kitty')).toBe('llo');
    expect(removePreAndSuf('helloKitty', '', '')).toBe('helloKitty');
    expect(removePreAndSuf('hello_kittyy', 'he', 'y')).toBe('llo_kitty');
  });
  it('should parse json or return original text', () => {
    expect(parseJSONIfCould(JSON.stringify({ a: 1 }))).toEqual({ a: 1 });
    expect(parseJSONIfCould('{a:1}')).toEqual('{a:1}');
    expect(parseJSONIfCould('{"a":1}')).toEqual({ a: 1 });
  });
});
