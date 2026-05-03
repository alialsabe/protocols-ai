'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ScheduleBlock } from '@/lib/protocol-types';

interface Props {
  blocks: ScheduleBlock[];
  loading: boolean;
}

// Window the ribbon spans, in 24h minutes.
const WINDOW_START = 5 * 60;   // 5:00 AM
const WINDOW_END = 23 * 60;    // 11:00 PM
const WINDOW_LEN = WINDOW_END - WINDOW_START;
const HOUR_TICKS = [6, 9, 12, 15, 18, 21];

/**
 * Compact 24-hour ribbon view of the day's stack. Sits above the verbose
 * "Your Routine Today" block list to give an at-a-glance read on when
 * doses cluster and whether the day is balanced. Each block becomes a
 * dot sized by supplement count; clicking jumps to the matching block
 * in the list below.
 */
export function TimelineView({ blocks, loading }: Props) {
  const [now, setNow] = useState<number | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Update the "now" indicator once per minute. Null on the server / before
  // hydration so SSR + client agree.
  useEffect(() => {
    function tick() {
      const d = new Date();
      setNow(d.getHours() * 60 + d.getMinutes());
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const dots = useMemo(
    () =>
      blocks
        .map((b, idx) => {
          const minutes = parseTime12hToMinutes(b.time);
          if (minutes == null) return null;
          const pct = clamp(((minutes - WINDOW_START) / WINDOW_LEN) * 100, 0, 100);
          return { idx, block: b, minutes, pct };
        })
        .filter((d): d is NonNullable<typeof d> => d !== null),
    [blocks],
  );

  const nowPct =
    now != null && now >= WINDOW_START && now <= WINDOW_END
      ? ((now - WINDOW_START) / WINDOW_LEN) * 100
      : null;

  if (blocks.length === 0 && !loading) return null;

  const totalSupplements = blocks.reduce((sum, b) => sum + b.supplements.length, 0);

  return (
    <section className="pt-2 pb-2">
      <div className="flex items-baseline justify-between pb-4">
        <div>
          <span
            className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
            style={{ color: 'var(--accent)' }}
          >
            Timeline
          </span>
          <h2
            className="mt-1 text-[22px] font-extrabold tracking-[-0.4px]"
            style={{ color: 'var(--fg)' }}
          >
            {loading
              ? 'Plotting your day…'
              : `${blocks.length} ${blocks.length === 1 ? 'moment' : 'moments'} · ${totalSupplements} ${totalSupplements === 1 ? 'dose' : 'doses'}`}
          </h2>
        </div>
      </div>

      <div
        className="relative rounded-[16px] px-6 pt-12 pb-8"
        style={{ background: 'var(--surface)', border: '1px solid var(--hair)' }}
      >
        {/* Track */}
        <div className="relative h-[2px] w-full" style={{ background: 'var(--hair-strong)' }}>
          {/* Hour ticks */}
          {HOUR_TICKS.map((h) => {
            const minutes = h * 60;
            const pct = ((minutes - WINDOW_START) / WINDOW_LEN) * 100;
            return (
              <div
                key={h}
                className="absolute"
                style={{ left: `${pct}%`, top: '-6px', transform: 'translateX(-50%)' }}
              >
                <div className="h-[14px] w-[1px]" style={{ background: 'var(--hair-strong)' }} />
                <div
                  className="mt-1 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[1px] whitespace-nowrap"
                  style={{ color: 'var(--fg-dim)' }}
                >
                  {formatHourLabel(h)}
                </div>
              </div>
            );
          })}

          {/* Now indicator */}
          {nowPct != null && (
            <div
              className="absolute -top-[20px] flex flex-col items-center"
              style={{ left: `${nowPct}%`, transform: 'translateX(-50%)' }}
              aria-label="current time"
            >
              <span
                className="rounded-full px-2 py-[2px] font-mono text-[9px] font-bold uppercase tracking-[1.2px]"
                style={{ background: 'var(--accent)', color: '#000' }}
              >
                Now
              </span>
              <div
                className="mt-1 h-[28px] w-[1px]"
                style={{ background: 'var(--accent)' }}
              />
            </div>
          )}

          {/* Dots */}
          {dots.map((d) => {
            const size = dotSize(d.block.supplements.length);
            const isHovered = hoverIdx === d.idx;
            const hasCaution = Boolean(d.block.caution);
            return (
              <a
                key={d.idx}
                href={`#routine-block-${d.idx}`}
                onMouseEnter={() => setHoverIdx(d.idx)}
                onMouseLeave={() => setHoverIdx(null)}
                onFocus={() => setHoverIdx(d.idx)}
                onBlur={() => setHoverIdx(null)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110 focus-visible:scale-110 focus-visible:outline-none"
                style={{
                  left: `${d.pct}%`,
                  top: '50%',
                  width: `${size}px`,
                  height: `${size}px`,
                }}
                aria-label={`${d.block.time}: ${d.block.supplements.join(', ')}`}
              >
                <span
                  className="block h-full w-full rounded-full"
                  style={{
                    background: hasCaution ? '#fbbf24' : 'var(--accent)',
                    boxShadow: isHovered
                      ? '0 0 0 4px rgba(201,168,76,0.25)'
                      : '0 0 0 2px var(--paper)',
                  }}
                />
                <span
                  className="absolute left-1/2 top-full mt-2 -translate-x-1/2 font-mono text-[10px] font-bold uppercase tracking-[1px] whitespace-nowrap"
                  style={{
                    color: isHovered ? 'var(--fg)' : 'var(--fg-muted)',
                    transition: 'color 120ms ease',
                  }}
                >
                  {d.block.supplements.length}
                </span>
              </a>
            );
          })}
        </div>

        {/* Hover detail card */}
        {hoverIdx != null && dots[hoverIdx] && (
          <div
            className="absolute left-1/2 -translate-x-1/2 mt-6 max-w-[420px] rounded-[12px] px-4 py-3 text-center"
            style={{
              background: 'var(--paper)',
              border: '1px solid var(--hair-strong)',
              bottom: 'auto',
              top: 'calc(100% - 16px)',
            }}
          >
            <span
              className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
              style={{ color: 'var(--accent)' }}
            >
              {dots[hoverIdx].block.time}
            </span>
            <p className="mt-1 text-[13px] font-semibold" style={{ color: 'var(--fg)' }}>
              {dots[hoverIdx].block.supplements.join(' · ')}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function dotSize(supplementCount: number) {
  // 1 supp → 10px, scale up gently to a 22px cap.
  return Math.min(22, 10 + Math.max(0, supplementCount - 1) * 2);
}

function formatHourLabel(h24: number) {
  if (h24 === 0) return '12a';
  if (h24 === 12) return '12p';
  if (h24 < 12) return `${h24}a`;
  return `${h24 - 12}p`;
}

function parseTime12hToMinutes(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(t.trim());
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const pm = m[3].toUpperCase() === 'PM';
  if (h === 12) h = 0;
  if (pm) h += 12;
  return h * 60 + min;
}
