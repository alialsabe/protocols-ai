import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../utils/supabase/server';
import { AccountActions } from '@/components/account/AccountActions';

export const metadata = {
  title: 'Account — Materia',
  description: 'Manage your Materia account, data, and disclaimer acknowledgement.',
};

// Server component so we can do a real auth check up front and bail to
// /login. Anonymous users have nothing to manage, so the page only makes
// sense for an authenticated visitor.
export default async function AccountPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect('/login?next=/account');
  }

  const user = userData.user;
  const created = user.created_at ? new Date(user.created_at) : null;

  return (
    <article className="mx-auto max-w-[720px] px-5 py-12 md:px-10 md:py-16">
      <span
        className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
        style={{ color: 'var(--accent)' }}
      >
        Account
      </span>
      <h1
        className="mt-2 text-[32px] font-extrabold tracking-[-0.5px] md:text-[40px]"
        style={{ color: 'var(--fg)' }}
      >
        Your Materia account
      </h1>

      <Card title="Profile">
        <Row label="Email" value={user.email ?? '—'} />
        <Row
          label="Account created"
          value={created ? created.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
        />
        <Row label="Account ID" value={user.id} mono />
      </Card>

      <Card title="Your data">
        <p className="text-[14px] leading-[22px]" style={{ color: 'var(--fg-muted)' }}>
          Materia stores your stack, medications, biometrics, and structured bloodwork markers
          (raw PDFs are never persisted). You own this data.
        </p>
        <ul className="mt-4 flex flex-col gap-3">
          <ActionItem
            label="Manage your stack"
            description="Edit your supplements, medications, and routine."
            href="/routine"
            kind="link"
          />
          <ActionItem
            label="Export your data"
            description="Email us to request a JSON export of your stack and bloodwork markers. Self-serve coming soon."
            href="mailto:hello@materia.app?subject=Data%20export%20request"
            kind="link"
            external
          />
          <ActionItem
            label="Delete your account"
            description="Email us to request permanent deletion of your account and all associated data. Self-serve coming soon."
            href="mailto:hello@materia.app?subject=Account%20deletion%20request"
            kind="link"
            external
            destructive
          />
        </ul>
      </Card>

      <Card title="Privacy & disclaimers">
        <AccountActions />
      </Card>

      <Card title="Legal">
        <ul className="flex flex-col gap-3">
          <ActionItem label="Medical disclaimer" description="" href="/disclaimer" kind="link" />
          <ActionItem label="Terms of service" description="" href="/terms" kind="link" />
          <ActionItem label="Privacy policy" description="" href="/privacy" kind="link" />
        </ul>
      </Card>

      <p
        className="mt-10 text-[12px]"
        style={{ color: 'var(--fg-dim)' }}
      >
        Need help with something not listed here?{' '}
        <Link
          href="mailto:hello@materia.app"
          className="underline"
          style={{ color: 'var(--accent-ink)' }}
        >
          hello@materia.app
        </Link>
      </p>
    </article>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="mt-8 rounded-[16px] p-6 md:p-8"
      style={{ background: 'var(--surface)', border: '1px solid var(--hair)' }}
    >
      <h2
        className="mb-5 text-[16px] font-bold uppercase tracking-[0.5px]"
        style={{ color: 'var(--fg)' }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      className="flex flex-col gap-1 border-b py-3 last:border-b-0 md:flex-row md:items-center md:justify-between md:gap-6"
      style={{ borderColor: 'var(--hair)' }}
    >
      <span
        className="font-mono text-[11px] font-bold uppercase tracking-[1.2px]"
        style={{ color: 'var(--fg-muted)' }}
      >
        {label}
      </span>
      <span
        className={`text-[14px] ${mono ? 'font-mono text-[12px]' : ''} break-all`}
        style={{ color: 'var(--fg)' }}
      >
        {value}
      </span>
    </div>
  );
}

interface ActionItemProps {
  label: string;
  description: string;
  href: string;
  kind: 'link';
  external?: boolean;
  destructive?: boolean;
}

function ActionItem({ label, description, href, external, destructive }: ActionItemProps) {
  const labelColor = destructive ? '#dc2626' : 'var(--fg)';
  return (
    <li>
      <Link
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className="flex items-start justify-between gap-4 rounded-[10px] px-4 py-3 transition-colors hover:bg-[var(--paper)]"
        style={{ border: '1px solid var(--hair)' }}
      >
        <span className="flex flex-col">
          <span className="text-[14px] font-bold" style={{ color: labelColor }}>
            {label}
          </span>
          {description && (
            <span className="mt-1 text-[12px]" style={{ color: 'var(--fg-muted)' }}>
              {description}
            </span>
          )}
        </span>
        <span
          className="font-mono text-[10px] font-bold uppercase tracking-[1.2px]"
          style={{ color: destructive ? '#dc2626' : 'var(--fg-muted)' }}
        >
          {external ? 'Email →' : 'Open →'}
        </span>
      </Link>
    </li>
  );
}
