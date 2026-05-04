'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { RoutineView } from './RoutineView';

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

// Derive a deterministic "rarity" tier from the supplement name so the inventory
// has visual variety without needing study-count enrichment yet. Once we wire
// real grade data, swap this for `gradeFromCount(item.studyCount)`.
function rarityFromName(name: string): 'common' | 'rare' | 'legendary' {
  const len = name.length;
  if (len > 18) return 'legendary';
  if (len > 11) return 'rare';
  return 'common';
}

const RARITY_LABEL: Record<string, string> = {
  common: '★',
  rare: '★★★',
  legendary: '★★★★',
};

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
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
              merged = serverItems;
              writeLocalRoutine(serverItems.map((i) => i.slug));
            } else if (serverItems.length > 0) {
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
        const localSlugs = readLocalRoutine();
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
        if (prev.length === next.length && prev.every((p, i) => p.id === next[i].id)) {
          return prev;
        }
        return next;
      });
    }
    window.addEventListener('routine:update', syncFromLocal);
    return () => window.removeEventListener('routine:update', syncFromLocal);
  }, [allSupplements]);

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

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (isLoggedIn !== true)    return;
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => {
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
        .catch(() => { /* keep local-only */ });
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

  const itemNames = useMemo(() => items.map((i) => i.name), [items]);

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
        style={{ color: 'var(--text-3)' }}
      >
        <span
          className="font-mono text-[11px] uppercase tracking-[1.4px]"
          style={{ color: 'var(--gold)' }}
        >
          ⚜ Loading stack...
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-10 lg:px-16">

      {/* L+ Stack header — gold rule + Cinzel title + meta line */}
      <div style={{ borderBottom: '1px solid var(--gold)', paddingBottom: 16, marginBottom: 24 }}>
        <div
          style={{
            fontFamily: 'var(--font-cinzel), serif',
            fontSize: 11,
            color: 'var(--gold)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontWeight: 600,
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ display: 'inline-block', width: 24, height: 1, background: 'var(--gold)' }} />
          ⚜ My Stack
        </div>
        <input
          type="text"
          value={stackName}
          onChange={(e) => { setStackName(e.target.value); setSaveStatus('idle'); }}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: 'var(--font-cinzel), serif',
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: '-0.3px',
            color: 'var(--text)',
            width: '100%',
            padding: '4px 0',
          }}
          placeholder="Name your stack..."
          aria-label="Stack name"
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
            marginTop: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 14,
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 11,
              color: 'var(--text-3)',
              letterSpacing: '1px',
            }}
          >
            <span><b style={{ color: 'var(--gold)' }}>{items.length}</b> EQUIPPED</span>
            <span><b style={{ color: 'var(--gold)' }}>{isLoggedIn ? 'CLOUD' : 'LOCAL'}</b> SAVE</span>
            {saveStatus === 'saved' && <span style={{ color: 'var(--good)' }}>● SAVED</span>}
            {saveStatus === 'error' && <span style={{ color: 'var(--bad)' }}>● ERROR</span>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={saving || !isLoggedIn}
              className="btn btn--ghost"
              style={{ opacity: !isLoggedIn ? 0.4 : 1 }}
              aria-label="Save stack"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleShare}
              disabled={sharing || !isLoggedIn || items.length === 0}
              className="btn"
              style={{ opacity: (!isLoggedIn || items.length === 0) ? 0.4 : 1 }}
              aria-label="Share stack"
            >
              {sharing ? 'Sharing...' : 'Share ▸'}
            </button>
          </div>
        </div>
      </div>

      {/* Share URL row */}
      {shareUrl && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            background: 'var(--bg-2)',
            border: '1px solid var(--gold)',
            borderRadius: 6,
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-cinzel), serif',
              fontSize: 10,
              color: 'var(--gold)',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            Share URL
          </span>
          <input
            readOnly
            value={shareUrl}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 12,
              color: 'var(--text-2)',
            }}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            aria-label="Share URL"
          />
          <button
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            className="btn btn--ghost"
            style={{ padding: '6px 12px', fontSize: 10 }}
          >
            Copy
          </button>
        </div>
      )}

      {/* Add compound search */}
      <div style={{ marginBottom: 24 }} ref={dropdownRef}>
        <div
          style={{
            fontFamily: 'var(--font-cinzel), serif',
            fontSize: 11,
            color: 'var(--gold)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontWeight: 600,
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ display: 'inline-block', width: 24, height: 1, background: 'var(--gold)' }} />
          Add to Stack
        </div>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            placeholder="Search supplements..."
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'var(--bg-2)',
              border: '1px solid var(--rule)',
              borderRadius: 6,
              fontSize: 14,
              color: 'var(--text)',
              outline: 'none',
              fontFamily: 'var(--font-inter), sans-serif',
            }}
            aria-label="Search supplements"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
          />

          {showDropdown && suggestions.length > 0 && (
            <ul
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                marginTop: 4,
                listStyle: 'none',
                padding: 0,
                background: 'var(--bg-2)',
                border: '1px solid var(--gold)',
                borderRadius: 6,
                overflow: 'hidden',
                zIndex: 20,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
              role="listbox"
            >
              {suggestions.slice(0, 10).map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addSupplement(s)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'transparent',
                      border: 'none',
                      borderTop: '1px solid var(--rule)',
                      color: 'var(--text)',
                      fontSize: 13,
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-cinzel), serif',
                      letterSpacing: '0.2px',
                    }}
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
      </div>

      {/* L+ inventory */}
      <div className="l-section-h">
        <div className="l">⚜ Equipped Items</div>
        <div className="r">
          <span style={{ marginRight: 12 }}>{items.length} TOTAL</span>
          <span
            onClick={() => setView('grid')}
            style={{
              cursor: 'pointer',
              color: view === 'grid' ? 'var(--gold)' : 'var(--text-4)',
              padding: '0 4px',
            }}
          >GRID</span>
          <span style={{ color: 'var(--text-5)' }}>·</span>
          <span
            onClick={() => setView('list')}
            style={{
              cursor: 'pointer',
              color: view === 'list' ? 'var(--gold)' : 'var(--text-4)',
              padding: '0 4px',
            }}
          >LIST</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            padding: '40px 24px',
            textAlign: 'center',
            background: 'linear-gradient(160deg, #1A2030 0%, #141923 100%)',
            border: '1.5px dashed var(--rule)',
            borderRadius: 6,
            color: 'var(--text-3)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-cinzel), serif',
              fontSize: 14,
              color: 'var(--gold)',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Your inventory is empty
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
            Search above to add your first supplement, or browse the{' '}
            <Link href="/?view=library" style={{ color: 'var(--gold)', borderBottom: '1px solid var(--gold)' }}>library</Link>.
          </p>
        </div>
      ) : view === 'grid' ? (
        // GRID view — 2 column on mobile, 3-4 on desktop
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 8,
          }}
        >
          {items.map((item) => {
            const rarity = rarityFromName(item.name);
            return (
              <div
                key={item.id}
                className="l-card"
                data-rarity={rarity}
                style={{ cursor: 'default' }}
              >
                <span className="l-dot" data-state="equipped" />
                <div>
                  <div className="l-card-name">{item.name}</div>
                  <div
                    className="l-card-dose"
                    style={{
                      color:
                        rarity === 'legendary' ? 'var(--gold)' :
                        rarity === 'rare' ? 'var(--rar-rare)' :
                        'var(--text-3)',
                      fontFamily: 'var(--font-cinzel), serif',
                      letterSpacing: '1px',
                      fontSize: 9.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    {RARITY_LABEL[rarity]} {rarity}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 10 }}>
                  <Link
                    href={`/research/${item.slug}`}
                    style={{
                      flex: 1,
                      fontFamily: 'var(--font-cinzel), serif',
                      fontSize: 10,
                      color: 'var(--gold)',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    View ▸
                  </Link>
                  <button
                    onClick={() => removeItem(item.id)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--rule)',
                      color: 'var(--text-4)',
                      width: 24,
                      height: 24,
                      borderRadius: 3,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 120ms var(--ease)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--bad)';
                      e.currentTarget.style.color = 'var(--bad)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--rule)';
                      e.currentTarget.style.color = 'var(--text-4)';
                    }}
                    aria-label={`Remove ${item.name}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // LIST view — single column rows with rarity stripe
        <div>
          {items.map((item) => {
            const rarity = rarityFromName(item.name);
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '13px 18px 13px 14px',
                  borderBottom: '1px solid var(--rule-soft)',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    background:
                      rarity === 'legendary' ? 'var(--gold)' :
                      rarity === 'rare' ? 'var(--rar-rare)' :
                      'var(--rar-common)',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-cinzel), serif',
                      fontSize: 15,
                      color: 'var(--text)',
                      fontWeight: 600,
                      letterSpacing: '0.1px',
                      lineHeight: 1.2,
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                      fontSize: 10,
                      color:
                        rarity === 'legendary' ? 'var(--gold)' :
                        rarity === 'rare' ? 'var(--rar-rare)' :
                        'var(--text-3)',
                      letterSpacing: '0.4px',
                      marginTop: 3,
                    }}
                  >
                    {RARITY_LABEL[rarity]} {rarity.toUpperCase()}
                  </div>
                </div>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--good)',
                    boxShadow: '0 0 6px var(--good-glow)',
                  }}
                />
                <Link
                  href={`/research/${item.slug}`}
                  style={{
                    fontFamily: 'var(--font-cinzel), serif',
                    fontSize: 10,
                    color: 'var(--gold)',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  View ▸
                </Link>
                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--rule)',
                    color: 'var(--text-4)',
                    width: 24,
                    height: 24,
                    borderRadius: 3,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label={`Remove ${item.name}`}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Routine view — 24h timeline + scheduler block list */}
      <div style={{ marginTop: 32 }}>
        <RoutineView names={itemNames} />
      </div>

      {/* Soft gate for unauthenticated users */}
      {isLoggedIn === false && items.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: 20,
            marginTop: 24,
            background: 'linear-gradient(160deg, #2A1818 0%, #1A0E0E 100%)',
            border: '1px solid var(--crimson)',
            borderRadius: 6,
          }}
          className="md:flex-row md:items-center md:justify-between"
        >
          <div style={{ flex: 1 }}>
            <span
              style={{
                fontFamily: 'var(--font-cinzel), serif',
                fontSize: 11,
                color: 'var(--gold)',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                fontWeight: 600,
                display: 'block',
                marginBottom: 4,
              }}
            >
              ⚠ Saved on this device only
            </span>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-2)', lineHeight: 1.45 }}>
              Sign in to sync your stack across devices, run the audit, and share with others.
            </p>
          </div>
          <Link href="/login" className="btn">
            Sign In ▸
          </Link>
        </div>
      )}
    </div>
  );
}
