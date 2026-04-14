import { sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diag: Record<string, unknown> = {};
  try {
    const r1 = await db.execute(sql`SELECT count(*)::int AS c FROM supplements WHERE status = 'published'`);
    diag.supplements = r1;
    const r2 = await db.execute(sql`SELECT count(*)::int AS c FROM clinical_studies`);
    diag.clinical_studies = r2;
    const r3 = await db.execute(sql`SELECT count(*)::int AS c FROM supplement_science`);
    diag.supplement_science_all = r3;
    const r4 = await db.execute(sql`SELECT count(DISTINCT supplement_id)::int AS c FROM supplement_science`);
    diag.supplement_science_distinct = r4;
    const r5 = await db.execute(sql`SELECT current_user, session_user, current_setting('row_security') AS rls`);
    diag.session = r5;
    return Response.json({ ok: true, diag });
  } catch (err) {
    return Response.json({ ok: false, error: String(err), diag }, { status: 500 });
  }
}
