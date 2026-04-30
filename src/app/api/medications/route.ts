import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/drizzle';
import { userMedications } from '@/lib/schema-postgres';
import { eq } from 'drizzle-orm';
import { createClient } from '../../../../utils/supabase/server';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ authenticated: false, medications: [] });
  }

  const rows = await db
    .select()
    .from(userMedications)
    .where(eq(userMedications.userId, userData.user.id));

  return NextResponse.json({
    authenticated: true,
    medications: rows.map((row) => row.medName),
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const medications: string[] = Array.isArray(payload?.medications)
    ? Array.from(new Set<string>(
      payload.medications.map(normalizeMedication).filter((value: string) => value.length > 0),
    ))
    : [];

  const userId = userData.user.id;
  await db.delete(userMedications).where(eq(userMedications.userId, userId));

  if (medications.length > 0) {
    await db.insert(userMedications).values(
      medications.map((medName) => ({
        id: `med-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        userId,
        medName,
      })),
    );
  }

  return NextResponse.json({ ok: true, medications });
}

function normalizeMedication(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}
