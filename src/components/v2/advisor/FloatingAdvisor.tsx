'use client';

import { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { AdvisorPanel } from '@/components/advisor/AdvisorPanel';
import { closeAdvisor, openAdvisor, useAdvisorOpen } from './advisorStore';

export function FloatingAdvisor() {
  const open = useAdvisorOpen();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (open) closeAdvisor();
        return;
      }
      // 'j' shortcut — skip if typing into an input/textarea/contentEditable
      if (e.key === 'j' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement | null;
        if (target) {
          const tag = target.tagName;
          if (
            tag === 'INPUT' ||
            tag === 'TEXTAREA' ||
            tag === 'SELECT' ||
            target.isContentEditable
          ) {
            return;
          }
        }
        e.preventDefault();
        if (open) closeAdvisor();
        else openAdvisor();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      // desktop only — click-outside dismiss
      if (window.matchMedia('(max-width: 767px)').matches) return;
      const node = panelRef.current;
      if (node && !node.contains(e.target as Node)) {
        closeAdvisor();
      }
    }
    // delay binding so the opening click doesn't immediately close
    const t = window.setTimeout(() => window.addEventListener('mousedown', onClick), 0);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  return (
    <>
      {/* Desktop FAB — hidden on mobile; BottomTabBar handles mobile trigger */}
      {!open && (
        <button
          type="button"
          onClick={openAdvisor}
          aria-label="Open advisor (press J)"
          className="proto-focus fixed bottom-6 right-6 z-40 hidden h-14 w-14 items-center justify-center rounded-full transition-transform hover:scale-105 md:inline-flex"
          style={{
            background: 'var(--accent)',
            color: '#09090b',
            boxShadow: '0 10px 30px var(--accent-glow), 0 0 0 1px rgba(255,255,255,0.06)',
          }}
        >
          <Sparkles className="h-6 w-6" strokeWidth={2} />
        </button>
      )}

      {open && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: 'rgba(9,9,11,0.72)', backdropFilter: 'blur(4px)' }}
            onClick={closeAdvisor}
            aria-hidden
          />

          {/* Desktop floating card */}
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Supplement advisor"
            className="proto-advisor-pop fixed z-50 hidden flex-col md:flex"
            style={{
              right: '1.5rem',
              bottom: '1.5rem',
              width: '400px',
              height: '600px',
              maxHeight: 'calc(100vh - 4rem)',
            }}
          >
            <AdvisorPanel onClose={closeAdvisor} />
          </div>

          {/* Mobile drawer */}
          <div
            role="dialog"
            aria-label="Supplement advisor"
            className="proto-advisor-slide fixed inset-x-0 bottom-0 z-50 md:hidden"
            style={{
              top: '3rem',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            <AdvisorPanel onClose={closeAdvisor} />
          </div>
        </>
      )}
    </>
  );
}
