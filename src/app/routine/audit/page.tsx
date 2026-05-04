import { cookies } from 'next/headers';
import { createClient } from '../../../../utils/supabase/server';
import { StackAudit } from '@/components/stack/StackAudit';

export const metadata = {
  title: 'Scout — Stack Lab',
  description: 'The Scout audits your stack: drug interactions, redundancies, conflicts, timing, and dosing.',
};

export default async function AuditPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: userData } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(userData.user);

  return <StackAudit isAuthenticated={isAuthenticated} />;
}
