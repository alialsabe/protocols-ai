"use client";
import Link from 'next/link';
import { Beaker } from 'lucide-react';
import { T } from '@/lib/design-tokens';

export function AdvisorCTA() {
  return (
    <section className="px-4 md:px-8 pb-14 max-w-7xl mx-auto">
      <Link
        href="/advisor"
        className="group block rounded-2xl p-6 md:p-8 transition-all duration-300 hover:-translate-y-0.5"
        style={{
          background: `linear-gradient(135deg, rgba(6,214,160,0.06) 0%, rgba(14,165,233,0.06) 100%)`,
          border: `1px solid ${T.borderAccent}`,
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="shrink-0 flex items-center justify-center rounded-xl w-12 h-12"
            style={{ background: T.accentDim, border: `1px solid ${T.borderAccent}` }}
          >
            <Beaker className="w-5 h-5" style={{ color: T.accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold mb-1" style={{ color: T.text }}>
              Build your protocol
              <span
                className="inline-block ml-2 text-xs font-bold px-2 py-0.5 rounded-md align-middle"
                style={{ background: T.accentDim, color: T.accent, border: `1px solid ${T.borderAccent}` }}
              >
                New
              </span>
            </h3>
            <p className="text-sm" style={{ color: T.textMuted }}>
              Tell us what you take. We'll build your schedule with dosage, timing, food context, and conflict warnings.
            </p>
          </div>
          <span
            className="hidden md:block text-xl transition-transform duration-200 group-hover:translate-x-1"
            style={{ color: T.accent }}
          >
            →
          </span>
        </div>
      </Link>
    </section>
  );
}
