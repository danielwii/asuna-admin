import preloadAll from 'jest-next-dynamic';
// import * as _ from 'lodash';
// import _ from 'lodash';
import { uniqueItems } from './Select';

beforeAll(async () => {
  await preloadAll();
});

describe('uniqueItems', () => {
  it('should return unique items by array', () => {
    expect(
      uniqueItems(
        [
          ['A', 'a'],
          ['B', 'b'],
        ],
        [
          ['A', '1'],
          ['C', '3'],
        ],
      ),
    ).toEqual([
      ['A', 'a'],
      ['B', 'b'],
      ['C', '3'],
    ]);
  });
  it('should return unique items by object with id', () => {
    expect(
      uniqueItems(
        [
          { id: 'A', value: 'a' },
          { id: 'B', value: 'b' },
        ],
        [
          { id: 'A', value: '1' },
          { id: 'C', value: '3' },
        ],
      ),
    ).toEqual([
      { id: 'A', value: 'a' },
      { id: 'B', value: 'b' },
      { id: 'C', value: '3' },
    ]);
  });
  it('should return unique items by object with key', () => {
    expect(
      uniqueItems(
        [
          { key: 'A', value: 'a' },
          { key: 'B', value: 'b' },
        ],
        [
          { key: 'A', value: '1' },
          { key: 'C', value: '3' },
        ],
      ),
    ).toEqual([
      { key: 'A', value: 'a' },
      { key: 'B', value: 'b' },
      { key: 'C', value: '3' },
    ]);
  });
  it('should return unique items by object with first key', () => {
    expect(
      uniqueItems(
        [
          { _first_: 'A', value: 'a' },
          { _first_: 'B', value: 'b' },
        ],
        [
          { _first_: 'A', value: '1' },
          { _first_: 'C', value: '3' },
        ],
      ),
    ).toEqual([
      { _first_: 'A', value: 'a' },
      { _first_: 'B', value: 'b' },
      { _first_: 'C', value: '3' },
    ]);
  });
});
