import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/drizzle';
import { sharedProtocols, savedStacks, supplements } from '@/lib/schema-postgres';
import { eq } from 'drizzle-orm';

interface SharedPageProps {
  params: Promise<{ publicId: string }>;
}

async function loadShared(publicId: string) {
  const shared = await db
    .select()
    .from(sharedProtocols)
    .where(eq(sharedProtocols.publicId, publicId))
    .limit(1);

  if (shared.length === 0) return null;
  const row = shared[0];

  let snapshot: {
    name?: string;
    supplementIds?: string[];
    supplementNames?: string[];
  } = {};
  try {
    snapshot = JSON.parse(row.snapshot ?? '{}');
  } catch {
    snapshot = {};
  }

  if (!snapshot.supplementNames || snapshot.supplementNames.length === 0) {
    const stack = await db
      .select()
      .from(savedStacks)
      .where(eq(savedStacks.id, row.stackId))
      .limit(1);

    if (stack.length > 0) {
      let supplementIds: string[] = [];
      try {
        supplementIds = JSON.parse(stack[0].supplementIds ?? '[]');
      } catch {
        supplementIds = [];
      }

      const names: string[] = [];
      for (const id of supplementIds) {
        const rows = await db.select().from(supplements).where(eq(supplements.id, id)).limit(1);
        if (rows[0]?.name) names.push(rows[0].name);
      }
      snapshot = {
        name: stack[0].name ?? 'Shared Stack',
        supplementIds,
        supplementNames: names,
      };
    }
  }

  return { row, snapshot };
}

export async function generateMetadata({ params }: SharedPageProps): Promise<Metadata> {
  const { publicId } = await params;
  const data = await loadShared(publicId).catch(() => null);
  if (!data) {
    return { title: 'Shared Protocol — Protocols.ai' };
  }
  const name = data.snapshot.name ?? 'Shared Protocol';
  const count = data.snapshot.supplementNames?.length ?? 0;
  return {
    title: `${name} — Protocols.ai`,
    description: `A shared supplement protocol with ${count} supplement${count === 1 ? '' : 's'}.`,
    alternates: {
      canonical: `/stack/${publicId}`,
    },
  };
}

export default async function SharedStackPage({ params }: SharedPageProps) {
  const { publicId } = await params;
  const data = await loadShared(publicId).catch(() => null);
  if (!data) notFound();

  const { row, snapshot } = data;
  const supplementNames = snapshot.supplementNames ?? [];

  return (
    <main className="proto-grid relative min-h-screen">

      <section className="mx-auto max-w-[820px] px-6 pt-10 md:px-10 lg:px-16">
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--accent)' }}
        >
          SHARED PROTOCOL · {publicId.slice(0, 8).toUpperCase()}
        </span>
        <h1
          className="mt-4 text-[40px] font-extrabold leading-[1.05] tracking-[-1.2px]"
          style={{ color: 'var(--fg)' }}
        >
          {snapshot.name ?? 'Shared Stack'}
        </h1>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[1.4px]" style={{ color: 'var(--fg-dim)' }}>
          {supplementNames.length} COMPOUND{supplementNames.length === 1 ? '' : 'S'}
          <span className="mx-2" style={{ color: 'var(--fg-faint)' }}>·</span>
          {row.viewCount ?? 0} VIEW{row.viewCount === 1 ? '' : 'S'}
        </p>
      </section>

      <section className="mx-auto mt-10 max-w-[820px] px-6 md:px-10 lg:px-16">
        <div
          className="overflow-hidden rounded-[16px]"
          style={{ background: 'var(--surface)', border: '1px solid var(--hair)' }}
        >
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--hair)' }}>
            <span
              className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
              style={{ color: 'var(--fg-dim)' }}
            >
              STACK CONTENTS
            </span>
          </div>

          {supplementNames.length === 0 ? (
            <div className="p-8 text-center text-[13px]" style={{ color: 'var(--fg-muted)' }}>
              This stack appears to be empty.
            </div>
          ) : (
            <ul>
              {supplementNames.map((name, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between px-6 py-4"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--hair)' }}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md font-mono text-[11px] font-bold"
                      style={{
                        background: 'var(--surface-raise)',
                        border: '1px solid var(--hair)',
                        color: 'var(--fg-dim)',
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[15px] font-semibold" style={{ color: 'var(--fg)' }}>
                      {name}
                    </span>
                  </div>
                  <Link
                    href={`/research/${encodeURIComponent(name)}`}
                    className="font-mono text-[11px] uppercase tracking-[1.4px] transition-colors hover:text-white"
                    style={{ color: 'var(--accent)' }}
                  >
                    VIEW REPORT →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-[820px] px-6 md:px-10 lg:px-16">
        <div
          className="rounded-[16px] p-6 text-center"
          style={{
            background: 'var(--accent-dim)',
            border: '1px solid var(--hair-accent)',
          }}
        >
          <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>
            Want to save your own protocol?
          </p>
          <Link
            href="/signup"
            className="mt-4 inline-flex items-center rounded-md px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[1.4px] transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent)', color: '#09090b' }}
          >
            CREATE ACCOUNT →
          </Link>
        </div>
      </section>

      <footer className="mx-auto mt-16 max-w-[820px] px-6 pb-12 text-center md:px-10 lg:px-16">
        <p
          className="font-mono text-[10px] uppercase tracking-[1.4px]"
          style={{ color: 'var(--fg-faint)' }}
        >
          NOT MEDICAL ADVICE · CONSULT YOUR PROVIDER BEFORE MAKING CHANGES
        </p>
      </footer>
    </main>
  );
}
