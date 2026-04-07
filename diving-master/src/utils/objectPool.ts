export interface ObjectPool<T> {
  acquire(factory: () => T): T;
  release(item: T): void;
  size(): number;
}

export function createObjectPool<T>(reset?: (item: T) => void): ObjectPool<T> {
  const available: T[] = [];

  return {
    acquire(factory) {
      return available.pop() ?? factory();
    },
    release(item) {
      reset?.(item);
      available.push(item);
    },
    size() {
      return available.length;
    },
  };
}
