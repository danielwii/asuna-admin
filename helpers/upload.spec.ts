import { responseToUrl } from './upload';

describe('upload', () => {
  it('should return joined url', () => {
    expect(
      responseToUrl({
        filename: 'filename.ext',
        prefix: 'uploads',
        mode: 'local',
        bucket: 'default',
      }),
    ).toBe('uploads/filename.ext');
  });
});
