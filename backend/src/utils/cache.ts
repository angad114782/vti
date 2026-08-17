import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export async function getCached<T>(key: string, fn: () => Promise<T>, ttl = 300): Promise<T> {
  const hit = cache.get<T>(key);
  if (hit !== undefined) return hit;
  const data = await fn();
  cache.set(key, data, ttl);
  return data;
}

export function invalidate(...keys: string[]): void {
  cache.del(keys);
}

export function invalidatePrefix(prefix: string): void {
  const keys = cache.keys().filter((k) => k.startsWith(prefix));
  if (keys.length) cache.del(keys);
}
