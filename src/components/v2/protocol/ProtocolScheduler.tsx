'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  ScheduleBlock,
  SchedulerOutput,
  SchedulerWarning,
  UserRoutine,
} from '@/lib/protocol-types';

interface Supplement {
  id?: string;
  slug: string;
  name: string;
  category?: string | null;
  popularityScore?: number;
}

const DEFAULT_ROUTINE: UserRoutine = {
  wakeTime: '07:00',
  sleepTime: '23:00',
  meals: { breakfast: '08:00', lunch: '12:30', dinner: '19:00' },
};

function labelCls() {
  return 'font-mono text-[11px] font-bold uppercase tracking-[1.4px]';
}

export function ProtocolScheduler() {
  const [all, setAll] = useState<Supplement[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [routine, setRoutine] = useState<UserRoutine>(DEFAULT_ROUTINE);
  const [medicationsInput, setMedicationsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SchedulerOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [suppRes, stackRes] = await Promise.all([
          fetch('/api/supplements'),
          fetch('/api/stack').catch(() => null),
        ]);
        let supps: Supplement[] = [];
        if (suppRes.ok) {
          const data = await suppRes.json();
          supps = data.supplements ?? [];
          if (!cancelled) setAll(supps);
        }
        if (stackRes && stackRes.ok) {
          const data = await stackRes.json();
          const ids: string[] = data?.stack?.supplementIds ?? [];
          if (!cancelled && ids.length > 0 && supps.length > 0) {
            const slugsById = new Map(supps.map((s) => [s.id ?? '', s.slug]));
            const slugs = ids.map((id) => slugsById.get(id)).filter((s): s is string => !!s);
            if (slugs.length > 0) setSelected(new Set(slugs));
          }
        }
      } catch {
        // ignore
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? all.filter((s) => s.name.toLowerCase().includes(q) || s.slug.includes(q))
      : all;
    return [...list]
      .sort((a, b) => (b.popularityScore ?? 0) - (a.popularityScore ?? 0))
      .slice(0, 24);
  }, [all, query]);

  const selectedList = useMemo(
    () => all.filter((s) => selected.has(s.slug)),
    [all, selected],
  );

  const toggle = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const generate = async () => {
    setError(null);
    setResult(null);
    if (selected.size === 0) {
      setError('Pick at least one supplement.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          supplements: Array.from(selected),
          routine,
          medications: medicationsInput
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Scheduler failed (${res.status})`);
      }
      const data = await res.json();
      setResult(data.schedule as SchedulerOutput);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scheduler failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Supplements picker */}
      <div className="flex flex-col gap-3">
        <span className={labelCls()} style={{ color: 'var(--fg-dim)' }}>
          01 / Supplements · {selected.size} selected
        </span>

        {selectedList.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedList.map((s) => (
              <button
                key={s.slug}
                type="button"
                onClick={() => toggle(s.slug)}
                className="inline-flex min-h-[36px] items-center gap-2 rounded-md px-3 font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
                style={{ background: 'var(--accent)', color: '#09090b' }}
              >
                {s.name}
                <span aria-hidden>×</span>
              </button>
            ))}
          </div>
        )}

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search supplements…"
          className="h-11 w-full rounded-md px-4 text-[14px]"
          style={{
            background: 'transparent',
            border: '1px solid var(--hair)',
            color: 'var(--fg)',
          }}
        />

        <div className="flex flex-wrap gap-2">
          {filtered.map((s) => {
            const active = selected.has(s.slug);
            return (
              <button
                key={s.slug}
                type="button"
                onClick={() => toggle(s.slug)}
                className="inline-flex min-h-[36px] items-center rounded-md px-3 font-mono text-[11px] transition-colors"
                style={
                  active
                    ? { background: 'var(--surface-raise)', border: '1px solid var(--accent)', color: 'var(--fg)' }
                    : { background: 'transparent', border: '1px solid var(--hair)', color: 'var(--fg-muted)' }
                }
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Routine */}
      <div className="flex flex-col gap-3">
        <span className={labelCls()} style={{ color: 'var(--fg-dim)' }}>
          02 / Routine
        </span>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {(
            [
              ['Wake', 'wakeTime'],
              ['Breakfast', 'breakfast'],
              ['Lunch', 'lunch'],
              ['Dinner', 'dinner'],
              ['Sleep', 'sleepTime'],
            ] as const
          ).map(([label, key]) => {
            const value =
              key === 'wakeTime' || key === 'sleepTime'
                ? routine[key]
                : routine.meals[key as keyof UserRoutine['meals']];
            return (
              <label key={key} className="flex flex-col gap-1">
                <span className={labelCls()} style={{ color: 'var(--fg-dim)' }}>
                  {label}
                </span>
                <input
                  type="time"
                  value={value}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (key === 'wakeTime' || key === 'sleepTime') {
                      setRoutine((r) => ({ ...r, [key]: v }));
                    } else {
                      setRoutine((r) => ({
                        ...r,
                        meals: { ...r.meals, [key]: v },
                      }));
                    }
                  }}
                  className="h-11 rounded-md px-3 text-[13px]"
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--hair)',
                    color: 'var(--fg)',
                  }}
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* Medications */}
      <div className="flex flex-col gap-2">
        <span className={labelCls()} style={{ color: 'var(--fg-dim)' }}>
          03 / Medications (comma-separated, optional)
        </span>
        <input
          type="text"
          value={medicationsInput}
          onChange={(e) => setMedicationsInput(e.target.value)}
          placeholder="e.g. sertraline, metformin"
          className="h-11 w-full rounded-md px-4 text-[14px]"
          style={{
            background: 'transparent',
            border: '1px solid var(--hair)',
            color: 'var(--fg)',
          }}
        />
      </div>

      {/* Generate button */}
      <div>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="h-12 rounded-[10px] px-6 text-[14px] font-bold tracking-tight disabled:opacity-60"
          style={{ background: 'var(--accent)', color: '#09090b' }}
        >
          {loading ? 'Generating…' : 'Generate schedule ⏎'}
        </button>
        {error && (
          <span
            className="ml-4 font-mono text-[12px]"
            style={{ color: 'var(--severity-high, #f87171)' }}
          >
            {error}
          </span>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="flex flex-col gap-5">
          <span className={labelCls()} style={{ color: 'var(--accent)' }}>
            Output · generated {new Date(result.generatedAt).toLocaleTimeString()}
          </span>

          {result.warnings.length > 0 && <WarningsList warnings={result.warnings} />}

          <div
            className="grid grid-cols-1 md:grid-cols-2"
            style={{
              borderRight: '1px solid var(--hair)',
              borderBottom: '1px solid var(--hair)',
            }}
          >
            {result.blocks.map((b, i) => (
              <BlockTile key={`${b.time}-${i}`} block={b} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BlockTile({ block }: { block: ScheduleBlock }) {
  return (
    <div
      className="flex flex-col gap-3 px-5 py-5 md:px-6 md:py-6"
      style={{ borderTop: '1px solid var(--hair)', borderLeft: '1px solid var(--hair)' }}
    >
      <div className="flex items-baseline justify-between gap-4">
        <span
          className="font-mono text-[22px] tabular-nums"
          style={{ color: 'var(--accent)' }}
        >
          {block.time}
        </span>
        <span
          className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--fg-dim)' }}
        >
          {block.title}
        </span>
      </div>
      <p className="text-[13px] leading-[20px]" style={{ color: 'var(--fg-muted)' }}>
        {block.context}
      </p>
      <div className="flex flex-wrap gap-2">
        {block.supplements.map((s) => (
          <span
            key={s}
            className="inline-flex items-center rounded-md px-2 py-1 font-mono text-[11px]"
            style={{ border: '1px solid var(--hair)', color: 'var(--fg)' }}
          >
            {s}
          </span>
        ))}
      </div>
      {block.caution && (
        <span
          className="font-mono text-[11px]"
          style={{ color: block.severity === 'warning' ? 'var(--severity-mid, #fbbf24)' : 'var(--fg-dim)' }}
        >
          ⚠ {block.caution}
        </span>
      )}
    </div>
  );
}

function WarningsList({ warnings }: { warnings: SchedulerWarning[] }) {
  return (
    <ul
      className="flex flex-col gap-2 rounded-md p-4"
      style={{ border: '1px solid var(--hair)' }}
    >
      {warnings.map((w, i) => (
        <li
          key={i}
          className="flex items-start gap-3 text-[13px] leading-[20px]"
          style={{ color: 'var(--fg-muted)' }}
        >
          <span
            className="mt-0.5 font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
            style={{
              color:
                w.severity === 'critical'
                  ? 'var(--severity-high, #f87171)'
                  : w.severity === 'warning'
                    ? 'var(--severity-mid, #fbbf24)'
                    : 'var(--fg-dim)',
            }}
          >
            {w.severity}
          </span>
          <span>{w.message}</span>
        </li>
      ))}
    </ul>
  );
}
