import { AdvisorPanel } from '@/components/advisor/AdvisorPanel';

export default function AdvisorPage() {
  return (
    <main className="proto-grid relative min-h-screen">

      <section className="mx-auto max-w-[1200px] px-6 pt-10 md:px-10 lg:px-16">
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--accent)' }}
        >
          ADVISOR · v1
        </span>
        <h1
          className="mt-3 text-[40px] font-extrabold leading-[1.05] tracking-[-1.2px]"
          style={{ color: 'var(--fg)' }}
        >
          Ask the model.
        </h1>
        <p className="mt-3 max-w-[640px] text-[15px] leading-[24px]" style={{ color: 'var(--fg-muted)' }}>
          Supplement mechanism, dosing, stack interactions. Skips medical advice — that&apos;s for your
          physician.
        </p>
      </section>

      <section className="mx-auto mt-8 max-w-[900px] px-6 pb-24 md:px-10 lg:px-16">
        <div className="h-[70vh]">
          <AdvisorPanel />
        </div>
      </section>
    </main>
  );
}
