import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
let cacheHits = 0;
let cacheMisses = 0;

export async function getCached<T>(key: string, fn: () => Promise<T>, ttl = 300): Promise<T> {
  const hit = cache.get<T>(key);
  if (hit !== undefined) {
    cacheHits += 1;
    return hit;
  }
  cacheMisses += 1;
  const data = await fn();
  cache.set(key, data, ttl);
  return data;
}

export function getCacheStats(): { hits: number; misses: number; keys: number; hitRate: number } {
  const total = cacheHits + cacheMisses;
  return {
    hits: cacheHits,
    misses: cacheMisses,
    keys: cache.keys().length,
    hitRate: total ? Number((cacheHits / total).toFixed(4)) : 0,
  };
}

export function invalidate(...keys: string[]): void {
  cache.del(keys);
}

export function invalidatePrefix(prefix: string): void {
  const keys = cache.keys().filter((k) => k.startsWith(prefix));
  if (keys.length) cache.del(keys);
}
