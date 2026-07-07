import Link from 'next/link';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { sharedProtocols } from '@/lib/schema-postgres';

// ISR: cached HTML with a short freshness window for community stacks.
export const revalidate = 600;

type StackSnapshot = {
  name?: string;
  supplementNames?: string[];
};

function parseSnapshot(value: string | null): StackSnapshot {
  try {
    const parsed = JSON.parse(value ?? '{}');
    return {
      name: typeof parsed.name === 'string' ? parsed.name : undefined,
      supplementNames: Array.isArray(parsed.supplementNames)
        ? parsed.supplementNames.map(String)
        : [],
    };
  } catch {
    return { supplementNames: [] };
  }
}

async function loadPopularStacks() {
  const rows = await db
    .select()
    .from(sharedProtocols)
    .orderBy(
      desc(sharedProtocols.copyCount),
      desc(sharedProtocols.viewCount),
      desc(sharedProtocols.createdAt),
    )
    .limit(24);

  return rows.map((row) => ({
    row,
    snapshot: parseSnapshot(row.snapshot),
  }));
}

export default async function PopularStacksPage() {
  const stacks = await loadPopularStacks().catch(() => []);

  return (
    <main className="proto-grid relative min-h-screen">
      <section className="mx-auto max-w-[1100px] px-6 py-12 md:px-10 lg:px-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span
              className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
              style={{ color: 'var(--accent)' }}
            >
              Public Protocols
            </span>
            <h1
              className="mt-4 text-[40px] font-extrabold leading-[1.05] tracking-[-1.2px]"
              style={{ color: 'var(--fg)' }}
            >
              Popular stacks
            </h1>
            <p className="mt-3 max-w-[620px] text-[15px] leading-6" style={{ color: 'var(--fg-muted)' }}>
              Shared supplement routines ranked by copies and views. Use these as starting points,
              then adjust for your own context.
            </p>
          </div>
          <Link
            href="/routine"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md px-5 font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
            style={{ background: 'var(--accent)', color: '#09090b', textDecoration: 'none' }}
          >
            Build my stack
          </Link>
        </div>

        {stacks.length === 0 ? (
          <section
            className="mt-10 rounded-[16px] p-8"
            style={{ background: 'var(--surface)', border: '1px solid var(--hair)' }}
          >
            <p className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]" style={{ color: 'var(--fg-dim)' }}>
              Empty State - 01
            </p>
            <h2 className="mt-3 text-[18px] font-bold" style={{ color: 'var(--fg)' }}>
              No public stacks yet.
            </h2>
            <p className="mt-2 text-[14px] leading-6" style={{ color: 'var(--fg-muted)' }}>
              Shared stacks will appear here after users create public protocol links.
            </p>
          </section>
        ) : (
          <section className="mt-10 grid gap-4 md:grid-cols-2">
            {stacks.map(({ row, snapshot }, index) => {
              const names = snapshot.supplementNames ?? [];
              const preview = names.slice(0, 5);
              const overflow = names.length - preview.length;

              return (
                <Link
                  key={row.publicId}
                  href={`/stack/${row.publicId}`}
                  className="block rounded-[16px] p-5 transition-colors"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--hair)',
                    textDecoration: 'none',
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p
                        className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
                        style={{ color: 'var(--fg-dim)' }}
                      >
                        Rank {String(index + 1).padStart(2, '0')}
                      </p>
                      <h2 className="mt-2 text-[20px] font-extrabold tracking-[-0.3px]" style={{ color: 'var(--fg)' }}>
                        {snapshot.name ?? 'Shared Stack'}
                      </h2>
                    </div>
                    <div className="text-right font-mono text-[11px] uppercase tracking-[1.4px]" style={{ color: 'var(--fg-dim)' }}>
                      <div>{row.copyCount ?? 0} copies</div>
                      <div className="mt-1">{row.viewCount ?? 0} views</div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {preview.map((name) => (
                      <span
                        key={name}
                        className="rounded-md px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[1.1px]"
                        style={{ background: 'var(--surface-raise)', color: 'var(--fg-muted)' }}
                      >
                        {name}
                      </span>
                    ))}
                    {overflow > 0 && (
                      <span
                        className="rounded-md px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[1.1px]"
                        style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                      >
                        +{overflow} more
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </section>
    </main>
  );
}
