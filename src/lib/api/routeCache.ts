import { createHash } from 'crypto';
import { NextResponse } from 'next/server';

type CacheNamespace = 'basic-data' | 'earnings-snapshot' | 'research-brief' | 'research-report' | 'serenity-memo' | 'technical-data';

type CacheVisibility = 'cdn' | 'internal' | 'none';

interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number;
}

interface RouteCacheStore {
  entries: Map<string, CacheEntry<unknown>>;
}

interface JsonResponseOptions {
  status?: number;
  cacheStatus?: 'HIT' | 'MISS' | 'SKIP';
  ttlSeconds?: number;
  visibility?: CacheVisibility;
  headers?: Record<string, string>;
}

const CACHE_VERSION = 'v0.5.3';
const VOLATILE_KEYS = new Set(['generatedAt', 'fetchedAt']);

function readPositiveInt(name: string, fallback: number, max: number) {
  const raw = process.env[name]?.trim();
  const parsed = raw ? Number(raw) : fallback;

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
}

function getStore(): RouteCacheStore {
  const globalCache = globalThis as typeof globalThis & { __mokiRouteCache?: RouteCacheStore };

  if (!globalCache.__mokiRouteCache) {
    globalCache.__mokiRouteCache = {
      entries: new Map(),
    };
  }

  return globalCache.__mokiRouteCache;
}

function normalizeForCache(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeForCache);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const record = value as Record<string, unknown>;

  return Object.keys(record)
    .filter((key) => !VOLATILE_KEYS.has(key))
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      const normalized = normalizeForCache(record[key]);

      if (normalized !== undefined) {
        acc[key] = normalized;
      }

      return acc;
    }, {});
}

function stableSerialize(value: unknown): string {
  return JSON.stringify(normalizeForCache(value));
}

function pruneStore(store: RouteCacheStore) {
  const now = Date.now();
  const maxEntries = readPositiveInt('ROUTE_CACHE_MAX_ENTRIES', 80, 500);

  for (const [key, entry] of store.entries) {
    if (entry.expiresAt <= now) {
      store.entries.delete(key);
    }
  }

  while (store.entries.size > maxEntries) {
    const oldestKey = store.entries.keys().next().value as string | undefined;

    if (!oldestKey) {
      break;
    }

    store.entries.delete(oldestKey);
  }
}

export function createRouteCacheKey(namespace: CacheNamespace, payload: unknown, extra: string[] = []) {
  const hash = createHash('sha256')
    .update(stableSerialize(payload))
    .digest('hex')
    .slice(0, 32);

  return [CACHE_VERSION, namespace, ...extra.filter(Boolean), hash].join(':');
}

export function getRouteCacheTtlSeconds(namespace: CacheNamespace) {
  if (namespace === 'research-brief' || namespace === 'research-report' || namespace === 'serenity-memo') {
    return readPositiveInt('LLM_CACHE_TTL_SECONDS', 1800, 86400);
  }

  return readPositiveInt('API_DATA_CACHE_TTL_SECONDS', 300, 3600);
}

export function readRouteCache<T>(key: string) {
  const store = getStore();
  const entry = store.entries.get(key) as CacheEntry<T> | undefined;

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    store.entries.delete(key);
    return null;
  }

  return {
    value: entry.value,
    ageSeconds: Math.max(0, Math.floor((Date.now() - entry.createdAt) / 1000)),
  };
}

export function writeRouteCache<T>(key: string, value: T, ttlSeconds: number) {
  if (ttlSeconds <= 0) {
    return;
  }

  const store = getStore();
  const now = Date.now();

  pruneStore(store);
  store.entries.set(key, {
    value,
    createdAt: now,
    expiresAt: now + ttlSeconds * 1000,
  });
}

function cacheControlHeader(visibility: CacheVisibility, ttlSeconds?: number) {
  if (visibility !== 'cdn' || !ttlSeconds || ttlSeconds <= 0) {
    return 'no-store';
  }

  const staleSeconds = readPositiveInt('API_STALE_WHILE_REVALIDATE_SECONDS', ttlSeconds * 2, 7200);

  return `public, s-maxage=${ttlSeconds}, stale-while-revalidate=${staleSeconds}`;
}

export function jsonResponse<T>(payload: T, options: JsonResponseOptions = {}) {
  const headers = new Headers(options.headers);
  const visibility = options.visibility ?? 'none';

  headers.set('Cache-Control', cacheControlHeader(visibility, options.ttlSeconds));

  if (options.cacheStatus) {
    headers.set('x-moki-cache', options.cacheStatus);
  }

  if (options.ttlSeconds !== undefined) {
    headers.set('x-moki-cache-ttl', String(options.ttlSeconds));
  }

  return NextResponse.json(payload, {
    status: options.status ?? 200,
    headers,
  });
}
