'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export interface SupplementIndexEntry {
  slug: string;
  name: string;
  aliases?: string[];
}

// module-scope cache so remounts don't refetch
let cached: SupplementIndexEntry[] | null = null;
let inflight: Promise<SupplementIndexEntry[]> | null = null;

async function loadCatalog(): Promise<SupplementIndexEntry[]> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch('/api/supplements/index', { cache: 'force-cache' });
      if (!res.ok) return [];
      const data = await res.json();
      const list: SupplementIndexEntry[] = Array.isArray(data?.supplements) ? data.supplements : [];
      cached = list;
      return list;
    } catch {
      return [];
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

const Ctx = createContext<SupplementIndexEntry[]>([]);

export function SupplementCatalogProvider({ children }: { children: React.ReactNode }) {
  const [catalog, setCatalog] = useState<SupplementIndexEntry[]>(cached ?? []);

  useEffect(() => {
    if (cached) {
      setCatalog(cached);
      return;
    }
    let cancelled = false;
    loadCatalog().then((list) => {
      if (!cancelled) setCatalog(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return <Ctx.Provider value={catalog}>{children}</Ctx.Provider>;
}

export function useSupplementCatalog(): SupplementIndexEntry[] {
  return useContext(Ctx);
}
