import { cookies } from 'next/headers';
import { createClient } from '../../../../utils/supabase/server';
import { StackAudit } from '@/components/stack/StackAudit';

export const metadata = {
  title: 'Audit — Stack Lab',
  description: 'Find conflicts, redundancies, and dosing concerns in your stack.',
};

export default async function AuditPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: userData } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(userData.user);

  return (
    <div>
      <header className="mb-8">
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--accent)' }}
        >
          Audit
        </span>
        <h1
          className="mt-1 text-[28px] font-extrabold tracking-[-0.5px]"
          style={{ color: 'var(--fg)' }}
        >
          Stack audit
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: 'var(--fg-muted)' }}>
          Add your medications, then run a 5-category audit covering drug interactions, supplement conflicts, timing, redundancies, and dosing.
        </p>
      </header>
      <StackAudit isAuthenticated={isAuthenticated} />
    </div>
  );
}
