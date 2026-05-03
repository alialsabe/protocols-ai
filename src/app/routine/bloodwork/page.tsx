import { cookies } from 'next/headers';
import { createClient } from '../../../../utils/supabase/server';
import { BloodworkUpload } from '@/components/stack/BloodworkUpload';

export const metadata = {
  title: 'Bloodwork — Materia',
  description: 'Upload a lab PDF and get supplement actions for any deficiencies.',
};

export default async function BloodworkPage() {
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
          Bloodwork
        </span>
        <h1
          className="mt-1 text-[28px] font-extrabold tracking-[-0.5px]"
          style={{ color: 'var(--fg)' }}
        >
          Lab upload
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: 'var(--fg-muted)' }}>
          Drop a LabCorp, Quest, or any standard lab PDF. We extract markers, match against deficiency rules, and surface evidence-cited supplement actions. Raw PDF is never stored.
        </p>
      </header>
      <BloodworkUpload isAuthenticated={isAuthenticated} />
    </div>
  );
}
