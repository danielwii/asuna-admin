import preloadAll from 'jest-next-dynamic';
import { diff } from './';

beforeAll(async () => {
  await preloadAll();
});

describe('diff', () => {
  it('should detect deep difference', () => {
    const result = diff({ a: { b: 1 } }, { a: { b: 2 } });
    expect(result.isDifferent).toBeTruthy();
  });
});
