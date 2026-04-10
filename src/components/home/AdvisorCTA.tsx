"use client";
import Link from 'next/link';
import { T } from '@/lib/design-tokens';

export function AdvisorCTA() {
  return (
    <section className="px-6 md:px-8 pb-20 max-w-7xl mx-auto">
      <div
        className="glass-panel p-12 md:p-24 text-center relative overflow-hidden"
      >
        {/* Subtle gradient overlay */}
        <div
          className="absolute inset-0 vanguard-gradient pointer-events-none"
          style={{ opacity: 0.04 }}
        />
        <h2
          className="relative text-3xl md:text-5xl font-black tracking-tighter mb-6"
          style={{ color: '#fff' }}
        >
          BUILD YOUR PROTOCOL.
        </h2>
        <p
          className="relative text-sm tracking-wide max-w-xl mx-auto mb-10"
          style={{ color: T.outline }}
        >
          Add your supplements, configure your daily routine, and receive a
          clinically-optimized chrono-protocol with dosage, timing, and conflict
          warnings.
        </p>
        <Link
          href="/advisor"
          className="relative inline-block vanguard-gradient px-10 py-4 text-[10px] font-black uppercase tracking-widest transition-opacity hover:opacity-90"
          style={{ color: T.textOnPrimary, borderRadius: 2 }}
        >
          Launch Advisor
        </Link>
      </div>
    </section>
  );
}
