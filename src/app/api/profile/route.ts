import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/drizzle';
import { userProfiles } from '@/lib/schema-postgres';
import { eq } from 'drizzle-orm';
import { createClient } from '../../../../utils/supabase/server';

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const weightKg = typeof payload.weightKg === 'number' && payload.weightKg > 0 ? payload.weightKg : undefined;
  const heightCm = typeof payload.heightCm === 'number' && payload.heightCm > 0 ? payload.heightCm : undefined;

  const [existing] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userData.user.id))
    .limit(1);

  const current = existing ? JSON.parse(existing.biometrics ?? '{}') : {};
  const updated = {
    ...current,
    ...(weightKg != null ? { weightKg } : {}),
    ...(heightCm != null ? { heightCm } : {}),
  };

  const now = new Date().toISOString();

  if (existing) {
    await db
      .update(userProfiles)
      .set({ biometrics: JSON.stringify(updated), updatedAt: now })
      .where(eq(userProfiles.userId, userData.user.id));
  } else {
    const id = `profile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
    await db.insert(userProfiles).values({
      id,
      userId: userData.user.id,
      biometrics: JSON.stringify(updated),
      createdAt: now,
      updatedAt: now,
    });
  }

  return NextResponse.json({ ok: true, biometrics: updated });
}
