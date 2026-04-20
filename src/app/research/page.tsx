import Link from 'next/link';

const FIELD_LABELS: Record<string, string> = {
  goal: 'PRIMARY GOAL',
  meds: 'MEDICATIONS',
  routine: 'MORNING ROUTINE',
};

export default async function ResearchIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const intake = Object.entries(params).filter(([k]) => k in FIELD_LABELS);

  return (
    <main className="proto-grid relative min-h-screen overflow-x-hidden pb-20 md:pb-0">

      <section className="mx-auto max-w-[1200px] px-5 pt-16 pb-24 md:px-10 md:pt-20 lg:px-16 lg:pt-24">
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--accent)' }}
        >
          PROTOCOL DRAFT · PENDING
        </span>
        <h1
          className="mt-5 text-[36px] font-extrabold leading-[1.05] tracking-[-1px] md:text-[56px] md:leading-[60px]"
          style={{ color: 'var(--fg)' }}
        >
          Your starting protocol.
        </h1>
        <p
          className="mt-6 max-w-[640px] font-mono text-[13px] leading-[20px]"
          style={{ color: 'var(--fg-muted)' }}
        >
          STATUS · protocol generator is not live yet. We received your intake and
          will land a personalized stack here per DESIGN.md §4.3.
        </p>

        {intake.length > 0 && (
          <div
            className="mt-10 grid max-w-[720px] grid-cols-1 gap-0 border-t md:grid-cols-3"
            style={{ borderColor: 'var(--hair)' }}
          >
            {intake.map(([k, v], i) => (
              <div
                key={k}
                className="py-6 md:px-6"
                style={{
                  borderLeft: i === 0 ? 'none' : '1px solid var(--hair)',
                  borderTop: i > 0 ? '1px solid var(--hair)' : 'none',
                }}
              >
                <span
                  className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
                  style={{ color: 'var(--fg-dim)' }}
                >
                  {FIELD_LABELS[k]}
                </span>
                <div
                  className="mt-2 font-mono text-[18px] uppercase"
                  style={{ color: 'var(--fg)' }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-[10px] px-5 text-[13px] font-bold"
            style={{ background: 'var(--accent)', color: 'var(--bg)' }}
          >
            &larr; back to home
          </Link>
        </div>
      </section>

    </main>
  );
}
