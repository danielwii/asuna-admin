import { diff } from '.';

describe('diff', () => {
  it('should detect deep difference', () => {
    const result = diff({ a: { b: 1 } }, { a: { b: 2 } });
    expect(result.isDifferent).toBeTruthy();
  });
});
