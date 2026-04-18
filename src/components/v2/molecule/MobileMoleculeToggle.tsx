'use client';

/**
 * MobileMoleculeToggle — opt-in full-screen 3D takeover on phones.
 *
 * Desktop: hidden entirely (Split Deck already shows the molecule).
 * Mobile:  shows a floating "View molecule" pill at top-right of the hero.
 *          Tapping opens a full-screen overlay with the MoleculeCard.
 *
 * We mount the Canvas lazily — only when the overlay is open — so the
 * phone doesn't pay the Three.js cost until the user asks for it.
 */

import { useEffect, useState } from 'react';
import { MoleculeCard } from './MoleculeCard';
import type { SupplementRender } from './types';

type Props = {
  render: SupplementRender;
  deltaWeek?: number;
  name: string;
};

export function MobileMoleculeToggle({ render, deltaWeek, name }: Props) {
  const [open, setOpen] = useState(false);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="proto-mol-mobile-toggle"
        onClick={() => setOpen(true)}
        aria-label={`View ${name} molecule in 3D`}
      >
        <span className="proto-mol-mobile-toggle-dot" aria-hidden />
        View molecule
      </button>

      {open && (
        <div
          className="proto-mol-mobile-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${name} molecule`}
        >
          <div className="proto-mol-mobile-overlay-card">
            <MoleculeCard render={render} deltaWeek={deltaWeek} />
          </div>
          <button
            type="button"
            className="proto-mol-mobile-close"
            onClick={() => setOpen(false)}
            aria-label="Close molecule viewer"
          >
            ✕ Close
          </button>
        </div>
      )}
    </>
  );
}
