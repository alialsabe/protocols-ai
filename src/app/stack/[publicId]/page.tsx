import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/drizzle';
import { sharedProtocols, savedStacks, supplements } from '@/lib/schema-postgres';
import { eq } from 'drizzle-orm';
import { T } from '@/lib/design-tokens';

/**
 * Public shared protocol page.
 *
 * URL: /stack/{publicId} — the public_id from shared_protocols.
 * Anonymously accessible. Shows a frozen snapshot of the stack at share time.
 * SEO-indexable (adds canonical meta).
 */

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

  // Snapshot is the frozen stack data at share time
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

  // If the snapshot is empty, fall back to the live stack (may not exist)
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
    <div className="min-h-screen" style={{ backgroundColor: T.bg }}>
      <header className="border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: T.border }}>
        <Link href="/" className="text-[#06d6a0] font-semibold tracking-tight">
          ← Protocols.ai
        </Link>
        <h1 className="text-sm font-medium text-white tracking-wide uppercase">Shared Protocol</h1>
        <div className="w-24" />
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#06d6a0] bg-[#06d6a0]/10 border border-[#06d6a0]/20 px-2.5 py-1 rounded-full mb-4">
            Shared Stack
          </div>
          <h2 className="text-3xl font-semibold text-white mb-2">{snapshot.name ?? 'Shared Stack'}</h2>
          <p className="text-sm text-[#71717a]">
            {supplementNames.length} supplement{supplementNames.length === 1 ? '' : 's'}
            {' · '}
            {row.viewCount ?? 0} view{row.viewCount === 1 ? '' : 's'}
          </p>
        </div>

        <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-white mb-4">Supplements</h3>
          {supplementNames.length === 0 ? (
            <p className="text-sm text-[#71717a]">This stack appears to be empty.</p>
          ) : (
            <ul className="space-y-2">
              {supplementNames.map((name, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between px-4 py-3 bg-[#18181b] rounded-lg border border-white/[0.04]"
                >
                  <span className="text-sm text-white font-medium">{name}</span>
                  <Link
                    href={`/?q=${encodeURIComponent(name)}`}
                    className="text-xs font-medium text-[#06d6a0] hover:underline"
                  >
                    Learn more →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-[#06d6a0]/[0.04] border border-[#06d6a0]/20 rounded-2xl p-5 text-center">
          <p className="text-sm text-white mb-3">Want to save your own protocol?</p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center h-10 px-5 bg-[#06d6a0] hover:bg-[#06d6a0]/90 text-black font-semibold rounded-lg transition-colors"
          >
            Sign up free
          </Link>
        </div>

        <p className="mt-10 text-[11px] text-[#52525b] text-center leading-relaxed">
          Not medical advice. Consult a healthcare provider before making changes to your supplements.
        </p>
      </main>
    </div>
  );
}
