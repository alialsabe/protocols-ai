'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { RoutinePanel } from './RoutinePanel';

interface StackItem {
  id: string;
  name: string;
  slug: string;
}

interface SupplementOption {
  id: string;
  name: string;
  slug: string;
  popularityScore: number;
}

// Single source of truth for the user's routine — same key the AddToRoutineButton
// on each /research/[slug] page writes, and the Nav badge reads. We store slugs.
const ROUTINE_KEY = 'protocolsai.routine.v2';

function readLocalRoutine(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(ROUTINE_KEY) ?? '[]'); }
  catch { return []; }
}

function writeLocalRoutine(slugs: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ROUTINE_KEY, JSON.stringify(slugs));
  window.dispatchEvent(new CustomEvent('routine:update'));
}

export function StackBuilder() {
  const [stackId, setStackId] = useState<string | null>(null);
  const [stackName, setStackName] = useState('My Stack');
  const [items, setItems] = useState<StackItem[]>([]);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [allSupplements, setAllSupplements] = useState<SupplementOption[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false); // suppress autosave during hydration
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage (canonical) + reconcile with server stack when
  // the user is logged in. localStorage is the single source of truth; the
  // server is a backup that kicks in only on a fresh login / new device.
  useEffect(() => {
    async function init() {
      try {
        const [suppRes, stackRes] = await Promise.all([
          fetch('/api/supplements'),
          fetch('/api/stack'),
        ]);

        let list: SupplementOption[] = [];
        if (suppRes.ok) {
          const data = await suppRes.json();
          list = (data.supplements ?? []).map(
            (s: { id?: string; name?: string; slug?: string; popularityScore?: number }) => ({
              id: s.id ?? '',
              name: s.name ?? '',
              slug: s.slug ?? '',
              popularityScore: s.popularityScore ?? 0,
            })
          );
          setAllSupplements(list);
        }

        const bySlug = new Map(list.map((s) => [s.slug, s]));
        const byId   = new Map(list.map((s) => [s.id, s]));

        // localStorage = the user's intent, regardless of auth.
        const localSlugs = readLocalRoutine();
        const localItems: StackItem[] = localSlugs
          .map((slug) => bySlug.get(slug))
          .filter((s): s is SupplementOption => Boolean(s))
          .map((s) => ({ id: s.id, name: s.name, slug: s.slug }));

        let merged: StackItem[] = localItems;
        let resolvedStackId: string | null = null;
        let resolvedName = 'My Stack';
        let authed = false;

        if (stackRes.ok) {
          const data = await stackRes.json();
          authed = Boolean(data.authenticated);
          if (data.stack) {
            resolvedStackId = data.stack.id;
            resolvedName    = data.stack.name ?? 'My Stack';

            const serverIds: string[] = data.stack.supplementIds ?? [];
            const serverItems: StackItem[] = serverIds
              .map((id: string) => byId.get(id))
              .filter((s): s is SupplementOption => Boolean(s))
              .map((s) => ({ id: s.id, name: s.name, slug: s.slug }));

            if (localItems.length === 0 && serverItems.length > 0) {
              // Fresh login / new device — restore from server, mirror to local.
              merged = serverItems;
              writeLocalRoutine(serverItems.map((i) => i.slug));
            } else if (serverItems.length > 0) {
              // Both sides have data — union by id, local first (preserves order).
              const seen = new Set(localItems.map((i) => i.id));
              const fromServer = serverItems.filter((s) => !seen.has(s.id));
              merged = [...localItems, ...fromServer];
              if (fromServer.length > 0) {
                writeLocalRoutine(merged.map((i) => i.slug));
              }
            }
          }
        }

        setIsLoggedIn(authed);
        setStackId(resolvedStackId);
        setStackName(resolvedName);
        setItems(merged);
      } catch {
        // Fall back to localStorage-only on network failure.
        const localSlugs = readLocalRoutine();
        // If we don't have the supplements list, we can't resolve names.
        setItems(
          localSlugs.map((slug) => ({ id: slug, name: slug, slug })),
        );
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
        hydratedRef.current = true;
      }
    }
    init();
    return () => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current);
    };
  }, []);

  // React to routine changes from elsewhere (the AddToRoutineButton on a
  // /research/[slug] page, or another tab). Re-hydrate `items` from local.
  useEffect(() => {
    if (allSupplements.length === 0) return;
    const bySlug = new Map(allSupplements.map((s) => [s.slug, s]));
    function syncFromLocal() {
      const slugs = readLocalRoutine();
      const next: StackItem[] = slugs
        .map((slug) => bySlug.get(slug))
        .filter((s): s is SupplementOption => Boolean(s))
        .map((s) => ({ id: s.id, name: s.name, slug: s.slug }));
      setItems((prev) => {
        // No-op if the lists are identical (avoid render churn).
        if (prev.length === next.length && prev.every((p, i) => p.id === next[i].id)) {
          return prev;
        }
        return next;
      });
    }
    window.addEventListener('routine:update', syncFromLocal);
    return () => window.removeEventListener('routine:update', syncFromLocal);
  }, [allSupplements]);

  // Supplement search
  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }
      try {
        const res = await fetch(`/api/supplements/suggestions?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions ?? []);
          setShowDropdown(true);
        }
      } catch {
        // ignore
      }
    },
    []
  );

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 200);
  }

  // Single mutator — keeps state, localStorage, and (if authed) the server in sync.
  const commitItems = useCallback((next: StackItem[]) => {
    setItems(next);
    writeLocalRoutine(next.map((i) => i.slug));
    setSaveStatus('idle');
    setShareUrl(null);
  }, []);

  function addSupplement(name: string) {
    const match = allSupplements.find((s) => s.name.toLowerCase() === name.toLowerCase());
    if (!match) return;
    if (items.some((i) => i.id === match.id)) {
      setQuery('');
      setShowDropdown(false);
      return;
    }
    commitItems([...items, { id: match.id, name: match.name, slug: match.slug }]);
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
  }

  function removeItem(id: string) {
    commitItems(items.filter((i) => i.id !== id));
  }

  // Autosave to the server for logged-in users — debounced so adding several
  // supplements in a row only POSTs once.
  useEffect(() => {
    if (!hydratedRef.current) return;       // skip during initial hydration
    if (isLoggedIn !== true)    return;     // anonymous = local only
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => {
      // Fire and forget — explicit Save still exists for force-sync.
      fetch('/api/stack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: stackName,
          supplementIds: items.map((i) => i.id),
        }),
      })
        .then(async (res) => {
          if (!res.ok) return;
          const data = await res.json();
          if (data?.id) setStackId(data.id);
          setSaveStatus('saved');
        })
        .catch(() => { /* keep local-only — explicit Save can retry */ });
    }, 700);
    return () => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current);
    };
  }, [items, stackName, isLoggedIn]);

  async function handleSave(): Promise<string | null> {
    if (!isLoggedIn) return null;
    setSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/stack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: stackName,
          supplementIds: items.map((i) => i.id),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setStackId(data.id);
        setSaveStatus('saved');
        return data.id ?? null;
      }
      setSaveStatus('error');
      return null;
    } catch {
      setSaveStatus('error');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    // setStackId is async — never trust the closure value of stackId after a
    // save in the same tick. Use the id returned by handleSave() directly.
    let id = stackId;
    if (!id) {
      id = await handleSave();
    }
    if (!id) return;
    setSharing(true);
    try {
      const res = await fetch('/api/stack/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stackId: id }),
      });
      if (res.ok) {
        const data = await res.json();
        setShareUrl(data.url);
      }
    } catch {
      // ignore
    } finally {
      setSharing(false);
    }
  }

  // Memoize names array so RoutinePanel's effect doesn't re-run on unrelated re-renders.
  // (useEffect dep on a fresh array each render = infinite fetch loop)
  const itemNames = useMemo(() => items.map((i) => i.name), [items]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (loading) {
    return (
      <div
        className="mx-auto max-w-[1200px] px-5 py-12 md:px-10 lg:px-16"
        style={{ color: 'var(--fg-muted)' }}
      >
        <span className="font-mono text-[11px] uppercase tracking-[1.4px]">Loading...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-10 lg:px-16">

      {/* Header row: stack name + actions */}
      <div
        className="flex flex-col gap-4 pb-6 md:flex-row md:items-center md:justify-between"
        style={{ borderBottom: '1px solid var(--hair)' }}
      >
        <div className="flex flex-1 flex-col gap-1">
          <span
            className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
            style={{ color: 'var(--fg-dim)' }}
          >
            Routine Name
          </span>
          <input
            type="text"
            value={stackName}
            onChange={(e) => { setStackName(e.target.value); setSaveStatus('idle'); }}
            className="bg-transparent text-[20px] font-extrabold tracking-[-0.4px] outline-none"
            style={{ color: 'var(--fg)' }}
            placeholder="Name your routine"
            aria-label="Stack name"
          />
        </div>

        <div className="flex items-center gap-3">
          {saveStatus === 'saved' && (
            <span
              className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
              style={{ color: 'var(--accent)' }}
            >
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span
              className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
              style={{ color: '#ef4444' }}
            >
              Save failed
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !isLoggedIn}
            className="inline-flex min-h-[44px] items-center px-5 font-mono text-[11px] font-bold uppercase tracking-[1.4px] transition-colors disabled:opacity-40"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--hair)',
              color: 'var(--fg)',
            }}
            aria-label="Save stack"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>

          <button
            onClick={handleShare}
            disabled={sharing || !isLoggedIn || items.length === 0}
            className="inline-flex min-h-[44px] items-center px-5 font-mono text-[11px] font-bold uppercase tracking-[1.4px] transition-colors disabled:opacity-40"
            style={{
              background: 'var(--accent)',
              color: '#000',
            }}
            aria-label="Share stack"
          >
            {sharing ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>

      {/* Share URL row */}
      {shareUrl && (
        <div
          className="flex items-center gap-3 py-4"
          style={{ borderBottom: '1px solid var(--hair)' }}
        >
          <span
            className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
            style={{ color: 'var(--fg-dim)' }}
          >
            Share URL
          </span>
          <input
            readOnly
            value={shareUrl}
            className="flex-1 bg-transparent font-mono text-[12px] outline-none"
            style={{ color: 'var(--accent)' }}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            aria-label="Share URL"
          />
          <button
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            className="inline-flex min-h-[44px] items-center px-4 font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--hair)',
              color: 'var(--fg-muted)',
            }}
          >
            Copy
          </button>
        </div>
      )}

      {/* Search bar */}
      <div className="relative py-6" style={{ borderBottom: '1px solid var(--hair)' }} ref={dropdownRef}>
        <span
          className="mb-2 block font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--fg-dim)' }}
        >
          Add Compound
        </span>
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder="Search supplements..."
          className="w-full bg-transparent py-3 text-[15px] outline-none"
          style={{
            color: 'var(--fg)',
            borderBottom: '1px solid var(--hair)',
          }}
          aria-label="Search supplements"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
        />

        {showDropdown && suggestions.length > 0 && (
          <ul
            className="absolute left-0 right-0 z-20 mt-1 overflow-hidden"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--hair)',
            }}
            role="listbox"
          >
            {suggestions.slice(0, 10).map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addSupplement(s)}
                  className="flex w-full min-h-[44px] items-center px-4 text-[14px] text-left transition-colors hover:bg-white/5"
                  style={{ color: 'var(--fg)' }}
                  role="option"
                  aria-selected={false}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Stack list */}
      <div className="py-6">
        {items.length === 0 ? (
          <p
            className="font-mono text-[13px] tracking-[0.5px]"
            style={{ color: 'var(--fg-muted)' }}
          >
            Search above to add your first supplement.
          </p>
        ) : (
          <ol className="flex flex-col">
            {items.map((item, idx) => (
              <li
                key={item.id}
                className="flex items-center gap-4 py-4"
                style={{ borderBottom: '1px solid var(--hair)' }}
              >
                <span
                  className="w-7 font-mono text-[11px] font-bold uppercase tracking-[1.4px] tabular-nums"
                  style={{ color: 'var(--fg-dim)' }}
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>

                <span className="flex-1 text-[15px] font-semibold" style={{ color: 'var(--fg)' }}>
                  {item.name}
                </span>

                <Link
                  href={`/research/${allSupplements.find((s) => s.id === item.id)?.slug ?? item.id}`}
                  className="inline-flex min-h-[44px] items-center font-mono text-[11px] font-bold uppercase tracking-[1.4px] transition-colors hover:text-white"
                  style={{ color: 'var(--accent)' }}
                >
                  View Report
                </Link>

                <button
                  onClick={() => removeItem(item.id)}
                  className="inline-flex min-h-[44px] w-10 items-center justify-center font-mono text-[14px] transition-colors hover:text-white"
                  style={{ color: 'var(--fg-dim)' }}
                  aria-label={`Remove ${item.name}`}
                >
                  x
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Your Routine — scheduler-generated timeline + conflict resolver */}
      <RoutinePanel names={itemNames} />

      {/* Soft gate for unauthenticated users */}
      {isLoggedIn === false && (
        <div
          className="flex flex-col items-start gap-3 rounded-none p-5 md:flex-row md:items-center md:justify-between"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--hair)',
          }}
        >
          <div className="flex flex-col gap-1">
            <span
              className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
              style={{ color: 'var(--accent)' }}
            >
              Saved on this device
            </span>
            <p className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>
              Sign in to sync across devices, unlock your dashboard, and share this routine.
            </p>
          </div>
          <Link
            href="/signin"
            className="inline-flex min-h-[44px] items-center px-5 font-mono text-[11px] font-bold uppercase tracking-[1.4px] transition-colors hover:opacity-90"
            style={{
              background: 'var(--accent)',
              color: '#000',
            }}
          >
            Sign In
          </Link>
        </div>
      )}
    </div>
  );
}
