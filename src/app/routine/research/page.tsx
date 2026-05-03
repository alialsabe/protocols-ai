export const metadata = {
  title: 'Research — Stack Lab',
  description: 'Design N=1 self-experiments and track results against bloodwork.',
};

// Placeholder for the biohacker N=1 self-experiment designer.
// Spec lives separately; this page exists so the sidebar Research link
// can be enabled the moment the feature ships.
export default function ResearchPage() {
  return (
    <div>
      <header className="mb-8">
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--accent)' }}
        >
          Research
        </span>
        <h1
          className="mt-1 text-[28px] font-extrabold tracking-[-0.5px]"
          style={{ color: 'var(--fg)' }}
        >
          N=1 self-experiments
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: 'var(--fg-muted)' }}>
          Design protocols, track biomarkers, and compare results against published RCTs. Coming next.
        </p>
      </header>

      <section
        className="p-8 text-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--hair)' }}
      >
        <p
          className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--fg-muted)' }}
        >
          In design
        </p>
        <p className="mx-auto mt-3 max-w-[520px] text-[14px]" style={{ color: 'var(--fg-muted)' }}>
          Pick a supplement, define a protocol (duration, dose, schedule), choose target markers, and get an exportable plan. Bloodwork uploads automatically attach to active experiments to track effect over time.
        </p>
      </section>
    </div>
  );
}
