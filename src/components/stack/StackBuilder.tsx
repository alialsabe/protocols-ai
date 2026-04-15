'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

interface StackItem {
  id: string;
  name: string;
}

interface SupplementOption {
  id: string;
  name: string;
  slug: string;
  popularityScore: number;
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load all supplements for ID lookup and current stack
  useEffect(() => {
    async function init() {
      try {
        const [suppRes, stackRes] = await Promise.all([
          fetch('/api/supplements'),
          fetch('/api/stack'),
        ]);

        if (suppRes.ok) {
          const data = await suppRes.json();
          const list: SupplementOption[] = (data.supplements ?? []).map(
            (s: { id?: string; name?: string; slug?: string; popularityScore?: number }) => ({
              id: s.id ?? '',
              name: s.name ?? '',
              slug: s.slug ?? '',
              popularityScore: s.popularityScore ?? 0,
            })
          );
          setAllSupplements(list);
        }

        if (stackRes.ok) {
          const data = await stackRes.json();
          // The API returns an explicit `authenticated` flag — anonymous users
          // get { stack: null, authenticated: false } and we must NOT treat
          // that as logged in.
          setIsLoggedIn(Boolean(data.authenticated));
          if (data.stack) {
            setStackId(data.stack.id);
            setStackName(data.stack.name ?? 'My Stack');
            const ids: string[] = data.stack.supplementIds ?? [];
            const names: string[] = data.stack.supplementNames ?? [];
            setItems(ids.map((id: string, i: number) => ({ id, name: names[i] ?? id })));
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

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

  function addSupplement(name: string) {
    const match = allSupplements.find((s) => s.name.toLowerCase() === name.toLowerCase());
    if (!match) return;
    if (items.some((i) => i.id === match.id)) {
      setQuery('');
      setShowDropdown(false);
      return;
    }
    setItems((prev) => [...prev, { id: match.id, name: match.name }]);
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    setSaveStatus('idle');
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSaveStatus('idle');
    setShareUrl(null);
  }

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
            Stack Name
          </span>
          <input
            type="text"
            value={stackName}
            onChange={(e) => { setStackName(e.target.value); setSaveStatus('idle'); }}
            className="bg-transparent text-[20px] font-extrabold tracking-[-0.4px] outline-none"
            style={{ color: 'var(--fg)' }}
            placeholder="Name your stack"
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
            Search above to add your first compound.
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
              Save Your Stack
            </span>
            <p className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>
              Sign in to save your stack, track changes, and share with others.
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
