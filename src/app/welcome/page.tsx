import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../utils/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Welcome — Protocols.ai',
  description: 'Your account is ready. Here\u2019s how to get the most out of Protocols.ai.',
};

export default async function WelcomePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/welcome');
  }

  const email = user.email ?? '';
  const handle = email.split('@')[0] || 'friend';

  return (
    <div className="page" style={{ paddingTop: 48, paddingBottom: 96 }}>
      {/* Chapter-marker style header */}
      <div className="section-rule" style={{ paddingTop: 0 }}>
        <span className="label">
          <span className="num">00</span>
          <span>Welcome</span>
        </span>
        <span className="right">Account · {email}</span>
      </div>

      {/* Hero */}
      <section style={{ paddingTop: 24, paddingBottom: 40 }}>
        <span
          className="footnote"
          style={{
            color: 'var(--accent)',
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            fontWeight: 600,
          }}
        >
          Account active
        </span>
        <h1
          style={{
            marginTop: 14,
            fontSize: 'clamp(40px, 6vw, 64px)',
            fontWeight: 600,
            letterSpacing: '-1.2px',
            lineHeight: 1.05,
            color: 'var(--ink)',
            maxWidth: '18ch',
          }}
        >
          Welcome, {handle}.
        </h1>
        <p className="lede" style={{ marginTop: 20 }}>
          You now have a personal copy of Protocols.ai. Save compounds to your routine, compare
          evidence side by side, and get plain-language guidance grounded in clinical studies.
        </p>

        <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
          <Link href="/" className="btn">
            Browse compounds →
          </Link>
          <Link href="/stack" className="btn btn--ghost">
            Go to My Routine
          </Link>
        </div>
      </section>

      {/* Three-step onboarding */}
      <div className="section-rule">
        <span className="label">
          <span className="num">01</span>
          <span>Get started</span>
        </span>
        <span className="right">3 steps</span>
      </div>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 0,
          borderTop: '1px solid var(--rule-soft)',
          borderBottom: '1px solid var(--rule-soft)',
        }}
      >
        <OnboardStep
          num="01"
          title="Browse the ledger"
          body="Every compound carries an evidence grade, study count, and plain-language summary. Start with what you already take."
          ctaHref="/"
          ctaLabel="Open the ledger"
          borderRight
        />
        <OnboardStep
          num="02"
          title="Add to My Routine"
          body="Save compounds to your routine to track doses, surface interaction warnings, and schedule timing across your day."
          ctaHref="/stack"
          ctaLabel="Build a routine"
          borderRight
        />
        <OnboardStep
          num="03"
          title="Ask the advisor"
          body="Grounded in your routine and the studies on file. It will flag conflicts, cite sources, and refuse to guess outside the record."
          ctaHref="/advisor"
          ctaLabel="Open advisor"
        />
      </section>

      {/* Housekeeping */}
      <div className="section-rule">
        <span className="label">
          <span className="num">02</span>
          <span>Account</span>
        </span>
        <span className="right">Housekeeping</span>
      </div>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'center',
          gap: 24,
          padding: '24px 0',
          borderTop: '1px solid var(--rule-soft)',
        }}
      >
        <div>
          <div className="kvpair">
            <span className="k">Signed in as</span>
            <span className="v" style={{ fontFamily: 'var(--mono)' }}>
              {email}
            </span>
          </div>
          <p
            className="footnote"
            style={{ marginTop: 10, color: 'var(--ink-4)', letterSpacing: 0 }}
          >
            Your routine is stored to this account and syncs across devices when you sign in.
          </p>
        </div>
        <form action="/api/auth/signout" method="post" style={{ margin: 0 }}>
          <button type="submit" className="btn btn--ghost">
            Sign out
          </button>
        </form>
      </section>
    </div>
  );
}

function OnboardStep({
  num,
  title,
  body,
  ctaHref,
  ctaLabel,
  borderRight = false,
}: {
  num: string;
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
  borderRight?: boolean;
}) {
  return (
    <div
      style={{
        padding: '32px 28px',
        borderRight: borderRight ? '1px solid var(--rule-soft)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <span
        className="footnote"
        style={{
          display: 'inline-block',
          padding: '2px 6px',
          background: 'var(--paper-2)',
          border: '1px solid var(--rule)',
          color: 'var(--ink-3)',
          letterSpacing: '1.2px',
          width: 'fit-content',
        }}
      >
        {num}
      </span>
      <h3
        style={{
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: '-0.3px',
          color: 'var(--ink)',
          margin: 0,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: 'var(--ink-3)',
          margin: 0,
          maxWidth: '38ch',
        }}
      >
        {body}
      </p>
      <Link
        href={ctaHref}
        className="btn--link"
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--ink)',
          borderBottom: '1px solid var(--ink-4)',
          paddingBottom: 1,
          width: 'fit-content',
          marginTop: 4,
        }}
      >
        {ctaLabel} →
      </Link>
    </div>
  );
}
