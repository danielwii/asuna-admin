export function extend<T, U>(first: T, second: U): T & U {
  return { ...first, ...second } as T & U;
}
