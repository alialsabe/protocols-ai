import { TopBar } from '@/components/v2/TopBar';
import { BottomTabBar } from '@/components/v2/BottomTabBar';
import Link from 'next/link';

export default async function ResearchQueryPage({
  params,
}: {
  params: Promise<{ query: string }>;
}) {
  const { query } = await params;
  const q = decodeURIComponent(query);

  return (
    <main className="proto-grid relative min-h-screen overflow-x-hidden pb-20 md:pb-0">
      <TopBar />

      <section className="mx-auto max-w-[1200px] px-5 pt-16 pb-24 md:px-10 md:pt-20 lg:px-16 lg:pt-24">
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--accent)' }}
        >
          REPORT · PENDING
        </span>
        <h1
          className="mt-5 text-[36px] font-extrabold leading-[1.05] tracking-[-1px] md:text-[56px] md:leading-[60px]"
          style={{ color: 'var(--fg)' }}
        >
          {q}
        </h1>

        <p
          className="mt-6 max-w-[640px] font-mono text-[13px] leading-[20px]"
          style={{ color: 'var(--fg-muted)' }}
        >
          STATUS · supplement report surface is not live yet. This route is
          reserved for the full intelligence briefing per DESIGN.md §4.2.
        </p>

        <div
          className="mt-10 flex flex-col gap-6 border-t pt-10 md:flex-row md:gap-10"
          style={{ borderColor: 'var(--hair)' }}
        >
          <div className="flex-1">
            <span
              className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
              style={{ color: 'var(--fg-dim)' }}
            >
              WHAT LANDS HERE NEXT
            </span>
            <ul
              className="mt-3 space-y-2 text-[14px] leading-[22px]"
              style={{ color: 'var(--fg-muted)' }}
            >
              <li>&middot; score strip (evidence, safety, dose, time-to-feel)</li>
              <li>&middot; overview / evidence / dosage / interactions tabs</li>
              <li>&middot; per-study rows with PMIDs and quality grades</li>
              <li>&middot; 24h dose schedule visualization</li>
            </ul>
          </div>
          <div className="flex-1">
            <span
              className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
              style={{ color: 'var(--fg-dim)' }}
            >
              IN THE MEANTIME
            </span>
            <div className="mt-3 flex flex-col gap-3">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-[10px] px-4 text-[13px] font-bold"
                style={{ background: 'var(--accent)', color: 'var(--bg)' }}
              >
                Run another query
              </Link>
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-[10px] border px-4 font-mono text-[12px]"
                style={{ borderColor: 'var(--hair)', color: 'var(--fg-muted)' }}
              >
                &larr; back to home
              </Link>
            </div>
          </div>
        </div>
      </section>

      <BottomTabBar />
    </main>
  );
}
