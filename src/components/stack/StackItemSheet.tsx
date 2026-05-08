'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { gradeFromCount, RARITY_LABEL } from '@/lib/supplement-grade';

export interface StackSheetItem {
  id: string;
  name: string;
  slug: string;
  studyCount: number;
}

interface Props {
  item: StackSheetItem | null;
  onClose: () => void;
  onUnequip: (id: string) => void;
  onReplace?: (id: string) => void;
}

export function StackItemSheet({ item, onClose, onUnequip, onReplace }: Props) {
  // Esc to close + body scroll lock when open
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [item, onClose]);

  if (!item) return null;

  const grade = gradeFromCount(item.studyCount);
  // Sensible placeholder PWR derived from study count so the slot is filled.
  // Range: ~30 (no studies) → ~95 (lots of studies).
  const pwr = Math.min(99, 30 + item.studyCount * 7);
  const evidenceColor =
    grade.tier === 'a' ? 'var(--good)' :
    grade.tier === 'b' ? 'var(--gold)' :
    'var(--text-3)';
  const rarityColor =
    grade.rarity === 'legendary' ? 'var(--gold)' :
    grade.rarity === 'rare' ? 'var(--rar-rare)' :
    'var(--text-3)';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          zIndex: 80,
          animation: 'sl-fade-in 200ms var(--ease, ease-out) both',
        }}
      />

      {/* Sheet (mobile bottom-sheet, desktop centered modal) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stack-sheet-name"
        className="stack-item-sheet"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 81,
          background: 'var(--bg, #0E1218)',
          borderTop: '1px solid var(--gold)',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.6)',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'sl-slide-up 250ms var(--ease, cubic-bezier(0.2,0.8,0.2,1)) both',
        }}
      >
        {/* Drag handle */}
        <div
          aria-hidden="true"
          style={{
            width: 36,
            height: 4,
            background: 'var(--rule)',
            borderRadius: 2,
            margin: '10px auto 0',
            flexShrink: 0,
          }}
        />

        {/* Status row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            padding: '8px 18px 0',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail sheet"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-3)',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 10,
              letterSpacing: 1,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            CLOSE ✕
          </button>
        </div>

        {/* Scrolling content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px' }}>
          {/* Hero */}
          <div style={{ padding: '14px 0 14px', borderBottom: '1px solid var(--rule)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ minWidth: 0 }}>
                <div
                  id="stack-sheet-name"
                  style={{
                    fontFamily: 'var(--font-cinzel), serif',
                    fontSize: 24,
                    color: 'var(--text)',
                    fontWeight: 600,
                    letterSpacing: '-0.2px',
                    lineHeight: 1.1,
                  }}
                >
                  {item.name}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                    fontSize: 10,
                    color: 'var(--text-3)',
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    marginTop: 4,
                  }}
                >
                  Compound · Supplement
                </div>
              </div>
              <div
                style={{
                  flexShrink: 0,
                  padding: '5px 10px',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '1.4px',
                  color: rarityColor,
                  background: 'linear-gradient(135deg, var(--bg-card, #2D2010), var(--bg-card-end, #1F1610))',
                  border: `1px solid ${rarityColor}`,
                  borderRadius: 3,
                  textTransform: 'uppercase',
                }}
              >
                {RARITY_LABEL[grade.rarity]} {grade.rarity}
              </div>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-cinzel), serif',
                fontSize: 14,
                color: 'var(--gold)',
                fontWeight: 500,
                letterSpacing: '0.4px',
                marginTop: 8,
              }}
            >
              Standard dose
            </div>
            <div
              style={{
                marginTop: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 9px',
                background: 'rgba(15, 74, 40, 0.6)',
                color: 'var(--good)',
                border: '1px solid var(--good-glow, #2D5C3A)',
                borderRadius: 99,
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: '1px',
              }}
            >
              <span aria-hidden="true">●</span>
              EQUIPPED
            </div>
          </div>

          {/* Stat grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 0,
              borderBottom: '1px solid var(--rule)',
            }}
          >
            <Stat label="PWR" value={String(pwr)} color="var(--gold)" border />
            <Stat label="EVIDENCE" value={grade.label} color={evidenceColor} border />
            <Stat label="STUDIES" value={String(item.studyCount)} color="var(--rar-rare, #B898FF)" />
          </div>

          {/* Detail rows */}
          <DetailRow k="Half-life" v="—" />
          <DetailRow k="Peak effect" v="—" />
          <DetailRow k="Take with" v="See product label" />
          <DetailRow k="Studies indexed" v={`${item.studyCount} clinical studies`} />
          <DetailRow k="Cost / month" v="—" />

          {/* Effect */}
          <div style={{ padding: '14px 0 16px', borderBottom: '1px solid var(--rule)' }}>
            <div
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 9,
                color: 'var(--gold)',
                letterSpacing: '1.5px',
                fontWeight: 600,
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Effect
            </div>
            <div
              style={{
                fontFamily: 'var(--font-inter), sans-serif',
                fontSize: 13,
                color: 'var(--text)',
                lineHeight: 1.5,
                fontStyle: 'italic',
              }}
            >
              Tap <Link href={`/research/${item.slug}`} style={{ color: 'var(--gold)', fontStyle: 'normal', fontWeight: 600 }}>View research ▸</Link>{' '}
              for the full evidence breakdown, dose schedules, and known interactions.
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: '16px 0 0', display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => { onUnequip(item.id); onClose(); }}
              className="btn"
              style={{
                flex: 1,
                fontFamily: 'var(--font-cinzel), serif',
                fontSize: 12,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                fontWeight: 600,
                padding: '13px 10px',
                borderRadius: 4,
                border: '1.5px solid var(--gold)',
                background: 'linear-gradient(135deg, var(--bg-card, #2D2010), var(--bg-card-end, #1F1610))',
                color: 'var(--gold)',
                cursor: 'pointer',
              }}
            >
              Unequip
            </button>
            {onReplace && (
              <button
                type="button"
                onClick={() => onReplace(item.id)}
                className="btn btn--ghost"
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-cinzel), serif',
                  fontSize: 12,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  padding: '13px 10px',
                  borderRadius: 4,
                  border: '1.5px solid var(--rule)',
                  background: 'var(--bg-2, #161C28)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                }}
              >
                Replace
              </button>
            )}
            <Link
              href={`/research/${item.slug}`}
              aria-label="View research"
              style={{
                padding: 13,
                fontSize: 14,
                borderRadius: 4,
                border: '1.5px solid var(--rule)',
                background: 'var(--bg-2, #161C28)',
                color: 'var(--text)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 44,
              }}
            >
              ⋯
            </Link>
          </div>
        </div>
      </div>

      {/* Inline keyframes + desktop modal centering. Scoped via class. */}
      <style jsx>{`
        @keyframes sl-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes sl-slide-up {
          from { transform: translateY(100%); opacity: 0.6; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @media (min-width: 820px) {
          :global(.stack-item-sheet) {
            left: 50% !important;
            right: auto !important;
            bottom: 50% !important;
            transform: translate(-50%, 50%);
            width: min(480px, calc(100vw - 48px));
            max-height: 80vh;
            border-radius: 12px !important;
            border: 1px solid var(--gold) !important;
          }
        }
      `}</style>
    </>
  );
}

// ── Subcomponents ────────────────────────────────────────────

function Stat({
  label,
  value,
  color,
  border,
}: {
  label: string;
  value: string;
  color: string;
  border?: boolean;
}) {
  return (
    <div
      style={{
        padding: '14px 6px',
        textAlign: 'center',
        borderRight: border ? '1px solid var(--rule)' : undefined,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 8,
          color: 'var(--text-3)',
          letterSpacing: '1.4px',
          fontWeight: 600,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-cinzel), serif',
          fontSize: 22,
          color,
          fontWeight: 700,
          lineHeight: 1,
          marginTop: 4,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function DetailRow({ k, v }: { k: string; v: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: '1px dotted var(--rule)',
        fontSize: 12.5,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 9.5,
          color: 'var(--text-3)',
          letterSpacing: '1.2px',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}
      >
        {k}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-inter), sans-serif',
          fontSize: 13,
          color: 'var(--text)',
          fontWeight: 500,
        }}
      >
        {v}
      </span>
    </div>
  );
}
