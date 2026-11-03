// Shared game state store.
// Production: Upstash Redis (connect it in Vercel → Storage; either env-var naming works).
// Local dev: in-process memory, so you can play without any setup.
import { Redis } from '@upstash/redis';

const url = import.meta.env.UPSTASH_REDIS_REST_URL ?? import.meta.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = import.meta.env.UPSTASH_REDIS_REST_TOKEN ?? import.meta.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;
const mem = new Map<string, unknown>();

export const hasSharedStore = Boolean(redis);

export function createStore(prefix: string) {
  const k = (key: string) => `${prefix}:${key}`;
  return {
    async get<T = unknown>(key: string): Promise<T | null> {
      if (redis) return (await redis.get<T>(k(key))) ?? null;
      return (mem.get(k(key)) as T) ?? null;
    },
    async set(key: string, value: unknown, exSeconds = 60 * 60 * 12) {
      if (redis) { await redis.set(k(key), value, { ex: exSeconds }); return; }
      mem.set(k(key), value);
    },
    async del(key: string) {
      if (redis) { await redis.del(k(key)); return; }
      mem.delete(k(key));
    },
    /** Keys under this prefix matching a glob like "game:*", returned without the prefix. */
    async keys(pattern = '*'): Promise<string[]> {
      const full = k(pattern);
      if (redis) {
        const out: string[] = [];
        let cursor: string | number = 0;
        do {
          const [next, batch]: [string | number, string[]] = await redis.scan(cursor, { match: full, count: 200 });
          out.push(...batch);
          cursor = next;
        } while (String(cursor) !== '0');
        return out.map((x) => x.slice(prefix.length + 1));
      }
      const re = new RegExp('^' + full.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
      return [...mem.keys()].filter((x) => re.test(x)).map((x) => x.slice(prefix.length + 1));
    },
  };
}
