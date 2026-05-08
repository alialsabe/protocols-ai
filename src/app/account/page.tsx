import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../utils/supabase/server';
import { AccountActions } from '@/components/account/AccountActions';

export const metadata = {
  title: 'Account — Stack Lab',
  description: 'Manage your Stack Lab account, data, and disclaimer acknowledgement.',
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
    <article style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px 80px' }}>
      <div
        style={{
          fontFamily: 'var(--font-cinzel), serif',
          fontSize: 11,
          color: 'var(--gold)',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          fontWeight: 600,
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ display: 'inline-block', width: 24, height: 1, background: 'var(--gold)' }} />
        ⚜ Hero
      </div>
      <h1
        style={{
          margin: 0,
          fontFamily: 'var(--font-cinzel), serif',
          fontSize: 'clamp(28px, 4.4vw, 40px)',
          fontWeight: 600,
          letterSpacing: '-0.4px',
          lineHeight: 1.1,
          color: 'var(--text)',
        }}
      >
        Your Stack Lab account
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
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--text-2)' }}>
          Stack Lab stores your stack, medications, biometrics, and structured bloodwork markers
          (raw PDFs are never persisted). You own this data.
        </p>
        <ul style={{ marginTop: 16, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ActionItem
            label="Manage your stack"
            description="Edit your supplements, medications, and routine."
            href="/routine"
            kind="link"
          />
          <ActionItem
            label="Export your data"
            description="Email us to request a JSON export of your stack and bloodwork markers. Self-serve coming soon."
            href="mailto:hello@stacklab.science?subject=Data%20export%20request"
            kind="link"
            external
          />
          <ActionItem
            label="Delete your account"
            description="Email us to request permanent deletion of your account and all associated data. Self-serve coming soon."
            href="mailto:hello@stacklab.science?subject=Account%20deletion%20request"
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
        <ul style={{ padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ActionItem label="Medical disclaimer" description="" href="/disclaimer" kind="link" />
          <ActionItem label="Terms of service" description="" href="/terms" kind="link" />
          <ActionItem label="Privacy policy" description="" href="/privacy" kind="link" />
        </ul>
      </Card>

      <p style={{ marginTop: 40, fontSize: 13, color: 'var(--text-3)' }}>
        Need help with something not listed here?{' '}
        <Link
          href="mailto:hello@stacklab.science"
          style={{ color: 'var(--gold)', borderBottom: '1px solid var(--gold)' }}
        >
          hello@stacklab.science
        </Link>
      </p>
    </article>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        marginTop: 28,
        padding: '20px 24px 22px',
        background: 'linear-gradient(160deg, var(--bg-card) 0%, var(--bg-card-end) 100%)',
        border: '1px solid var(--rule)',
        borderRadius: 6,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-cinzel), serif',
          fontSize: 10,
          color: 'var(--gold)',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          fontWeight: 600,
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ display: 'inline-block', width: 18, height: 1, background: 'var(--gold)' }} />
        {title}
      </div>
      {children}
    </section>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '12px 0',
        borderBottom: '1px solid var(--rule-soft)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-jetbrains-mono), var(--mono)',
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '1.2px',
          color: 'var(--text-3)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: mono ? 12 : 14,
          fontFamily: mono ? 'var(--font-jetbrains-mono), var(--mono)' : undefined,
          color: 'var(--text)',
          wordBreak: 'break-all',
        }}
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
  const labelColor = destructive ? 'var(--bad)' : 'var(--text)';
  const arrowColor = destructive ? 'var(--bad)' : 'var(--gold)';
  return (
    <li>
      <Link
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          padding: '12px 14px',
          border: '1px solid var(--rule)',
          borderRadius: 4,
          background: 'var(--bg-2)',
          transition: 'border-color 150ms var(--ease), background 150ms var(--ease)',
        }}
      >
        <span style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: labelColor }}>{label}</span>
          {description && (
            <span style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
              {description}
            </span>
          )}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-jetbrains-mono), var(--mono)',
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            color: arrowColor,
            whiteSpace: 'nowrap',
          }}
        >
          {external ? 'Email →' : 'Open →'}
        </span>
      </Link>
    </li>
  );
}
