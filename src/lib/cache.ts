export const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function cacheKey(...parts: Array<string | number | undefined | null>) {
  return parts.map((p) => String(p ?? '')).join(':');
}

export function readCache<T = any>(key: string, ttlMs: number = DEFAULT_TTL_MS): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !obj.t || Date.now() - obj.t > ttlMs) return null;
    return obj.v as T;
  } catch {
    return null;
  }
}

export function writeCache(key: string, value: any) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v: value }));
  } catch {}
}

// Helper to hydrate state from cache immediately, then fetch fresh and update
export async function hydrateWithCache<T>(params: {
  key: string;
  ttlMs?: number;
  fetcher: () => Promise<T>;
  onHydrate?: (cached: T) => void;
  onUpdate: (fresh: T) => void;
}) {
  const { key, ttlMs = DEFAULT_TTL_MS, fetcher, onHydrate, onUpdate } = params;
  const cached = readCache<T>(key, ttlMs);
  if (cached) {
    onHydrate?.(cached);
  }
  const fresh = await fetcher();
  writeCache(key, fresh);
  onUpdate(fresh);
  return fresh;
}
