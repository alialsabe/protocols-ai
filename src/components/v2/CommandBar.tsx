'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

export function CommandBar({
  size = 'lg',
  defaultValue = '',
  autoFocus = false,
}: {
  size?: 'lg' | 'sm';
  defaultValue?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tall = size === 'lg';

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await fetch(`/api/supplements/suggestions?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.suggestions?.length > 0) {
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch { /* ignore */ }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setValue(v);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 200);
  }

  function selectSuggestion(name: string) {
    setValue(name);
    setShowSuggestions(false);
    setSuggestions([]);
    track(ANALYTICS_EVENTS.SUPPLEMENT_SEARCHED, { query_length: name.length });
    router.push(`/research/${encodeURIComponent(name)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveIndex(-1);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    }
  }

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      selectSuggestion(suggestions[activeIndex]);
      return;
    }
    const query = value.trim();
    if (!query) return;
    track(ANALYTICS_EVENTS.SUPPLEMENT_SEARCHED, { query_length: query.length });
    router.push(`/research/${encodeURIComponent(query)}`);
  }

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit}>
        <div
          className={`proto-scan relative flex items-center overflow-hidden ${
            tall ? 'h-20 md:h-24' : 'h-14'
          }`}
          style={{
            background: 'var(--surface)',
            border: `1px solid ${focused ? 'var(--accent)' : 'var(--hair)'}`,
            borderRadius: showSuggestions ? '16px 16px 0 0' : 16,
            boxShadow: focused
              ? '0 0 0 4px var(--accent-dim), inset 0 1px 0 rgba(255,255,255,0.04)'
              : 'inset 0 1px 0 rgba(255,255,255,0.04)',
            transition: 'border-color 200ms var(--ease), box-shadow 200ms var(--ease)',
          }}
        >
          <div className="flex flex-shrink-0 items-center gap-2 pl-4 pr-3 md:gap-3 md:pl-6 md:pr-4">
            <span
              className="block h-2 w-2 flex-shrink-0 rounded-full"
              style={{
                background: 'var(--accent)',
                boxShadow: '0 0 12px var(--accent-glow)',
              }}
              aria-hidden
            />
            <span
              className="hidden font-mono text-[11px] font-bold uppercase tracking-[1.4px] md:inline"
              style={{ color: 'var(--fg-dim)' }}
            >
              Query
            </span>
          </div>
          <input
            ref={inputRef}
            aria-label="Query supplement, condition, or stack"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setFocused(true);
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onBlur={() => setFocused(false)}
            placeholder="search supplement or stack…"
            enterKeyHint="search"
            autoComplete="off"
            className={`min-w-0 flex-1 bg-transparent font-mono outline-none ${
              tall ? 'text-[16px] md:text-[20px]' : 'text-[14px] md:text-[15px]'
            }`}
            style={{ color: 'var(--fg)' }}
          />
          <div className="flex flex-shrink-0 items-center gap-2 pr-3 md:pr-5">
            {value.trim() ? (
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
                style={{
                  background: 'var(--accent)',
                  color: '#09090b',
                }}
              >
                Analyze →
              </button>
            ) : (
              <kbd
                className="hidden rounded-md border px-2 py-1 font-mono text-[11px] md:inline-block"
                style={{ borderColor: 'var(--hair-strong)', color: 'var(--fg-dim)' }}
              >
                ⌘K
              </kbd>
            )}
          </div>
        </div>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute inset-x-0 z-50 overflow-hidden"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--accent)',
            borderTop: 'none',
            borderRadius: '0 0 16px 16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          {suggestions.map((name, i) => (
            <li
              key={name}
              role="option"
              aria-selected={i === activeIndex}
              onPointerDown={(e) => {
                e.preventDefault();
                selectSuggestion(name);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className="flex cursor-pointer items-center gap-3 px-5 py-3 font-mono text-[13px] transition-colors"
              style={{
                background: i === activeIndex ? 'var(--accent-dim)' : 'transparent',
                color: i === activeIndex ? 'var(--accent)' : 'var(--fg-muted)',
                borderTop: i > 0 ? '1px solid var(--hair)' : 'none',
              }}
            >
              <span
                className="block h-1 w-1 flex-shrink-0 rounded-full"
                style={{ background: i === activeIndex ? 'var(--accent)' : 'var(--fg-dim)' }}
                aria-hidden
              />
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
