import { Promise } from 'bluebird';
import * as deepDiff from 'deep-diff';
import * as R from 'ramda';

import type { Diff } from 'deep-diff';

export const diff = (
  first,
  second,
  opts: { include?; exclude? } = {},
): { verbose: Array<Diff<any>>; isDifferent: boolean } => {
  let verbose;
  if (R.not(R.anyPass([R.isEmpty, R.isNil])(opts.include))) {
    verbose = deepDiff.diff(R.pickAll(opts.include)(first), R.pickAll(opts.include)(second));
  } else if (R.not(R.anyPass([R.isEmpty, R.isNil])(opts.exclude))) {
    verbose = deepDiff.diff(R.omit(opts.exclude)(first), R.omit(opts.exclude)(second));
  } else {
    verbose = deepDiff.diff(first, second);
  }
  return { verbose, isDifferent: !!verbose };
};

type Defer<R> = {
  resolve: (thenableOrResult?: Promise<R>) => void;
  reject: (error?: any) => void;
  onCancel?: (callback: () => void) => void;
  promise: Promise<R>;
};

function defer<R>(): Defer<R> {
  let resolve, reject, onCancel;
  const promise = new Promise(function () {
    resolve = arguments[0];
    reject = arguments[1];
    onCancel = arguments[2];
  });
  return { resolve, reject, onCancel, promise };
}

export class BatchLoader<T, R> {
  private queue: T[] = [];
  private runner: Promise<R> | null;

  constructor(
    private readonly batchLoaderFn: (keys: T[]) => Promise<R>,
    private readonly options?: {
      extractor?: (data: R, key: T) => any;
    },
  ) {}

  load(key: T): Promise<any> {
    this.queue.push(key);
    const runner =
      this.runner ||
      (this.runner = new Promise((resolve, reject) => {
        setTimeout(() => {
          this.runner = null;
          const { queue } = this;
          this.queue = [];
          this.batchLoaderFn(queue).then(resolve, reject);
        }, 0);
      }));

    return new Promise((resolve, reject) =>
      runner.then((data) => resolve(this.options?.extractor ? this.options.extractor(data, key) : data), reject),
    );
  }
}
