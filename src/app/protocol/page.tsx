import { ProtocolScheduler } from '@/components/v2/protocol/ProtocolScheduler';

export const metadata = {
  title: 'Protocol Scheduler — Materia',
  description:
    'Generate a daily supplement schedule from your stack. Timing, food context, and interaction warnings.',
};

export default function ProtocolPage() {
  return (
    <main className="proto-grid relative min-h-screen overflow-x-hidden pb-20 md:pb-0">

      <section
        className="mx-auto max-w-[1200px] px-5 py-6 md:px-10 md:py-8 lg:px-16"
        style={{ borderBottom: '1px solid var(--hair)' }}
      >
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--accent)' }}
        >
          Protocol Scheduler
        </span>
        <h1
          className="mt-2 text-[28px] font-extrabold leading-[1.1] tracking-[-0.6px] md:text-[36px]"
          style={{ color: 'var(--fg)' }}
        >
          Your daily protocol, timed.
        </h1>
        <p
          className="mt-3 max-w-[640px] text-[14px] leading-[22px]"
          style={{ color: 'var(--fg-muted)' }}
        >
          Pick supplements, set your routine, and the engine generates a day-by-day
          schedule with food context and interaction warnings.
        </p>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-8 md:px-10 md:py-10 lg:px-16">
        <ProtocolScheduler />
      </section>

    </main>
  );
}
