import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '../../../../../utils/supabase/server';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  await supabase.auth.signOut();
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/`, { status: 303 });
}
