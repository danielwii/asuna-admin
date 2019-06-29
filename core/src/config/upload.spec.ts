import { responseToUrl } from './upload';

describe('upload', () => {
  it('should return joined url', () => {
    expect(
      responseToUrl({
        filename: 'filename.ext',
        prefix: '2019/07',
        mode: 'local',
        bucket: 'default',
      }),
    ).toBe('default/2019/07/filename.ext');
  });
});
