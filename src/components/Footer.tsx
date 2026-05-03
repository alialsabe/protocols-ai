import Link from 'next/link';

export function Footer() {
  return (
    <footer
      className="site-footer"
      style={{
        borderTop: '2px solid var(--ink)',
        marginTop: 80,
        padding: '32px 40px 28px',
        background: 'var(--paper-2)',
      }}
    >
      <style>{`
        @media (max-width: 820px) {
          .site-footer { padding: 28px 20px 24px !important; margin-top: 48px !important; }
          .site-footer-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
          .site-footer-grid p, .site-footer-grid span { max-width: none !important; }
          .site-footer-bottom { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
        }
      `}</style>

      {/* Brand line — same masthead language as the top nav */}
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto 22px',
          paddingBottom: 18,
          borderBottom: '1px solid var(--rule)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-fraunces), serif',
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: '-0.4px',
            color: 'var(--ink)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            lineHeight: 1,
          }}
        >
          <span style={{ display: 'inline-block', width: 7, height: 7, background: 'var(--accent)', borderRadius: '50%' }} />
          Stack Lab
        </div>
        <span
          className="footnote"
          style={{ color: 'var(--ink-3)', fontStyle: 'italic', fontFamily: 'var(--font-fraunces), serif', fontSize: 13 }}
        >
          A daily briefing for your supplement stack.
        </span>
      </div>

      <div
        className="site-footer-grid"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: 32,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="footnote" style={{ textTransform: 'uppercase', letterSpacing: '1.2px' }}>About</span>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--ink-3)',
              lineHeight: 1.55,
              maxWidth: 240,
            }}
          >
            Stack Lab reads your supplement stack and tells you what is duplicative, what conflicts, and what to drop. Educational use only — not medical advice.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="footnote" style={{ textTransform: 'uppercase', letterSpacing: '1.2px' }}>Source</span>
          <span style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.55 }}>
            Peer-reviewed studies indexed from PubMed, Cochrane, and Examine.
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="footnote" style={{ textTransform: 'uppercase', letterSpacing: '1.2px' }}>Legal</span>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, listStyle: 'none', padding: 0, margin: 0 }}>
            <li>
              <Link href="/disclaimer" style={{ fontSize: 13, color: 'var(--ink-3)', textDecoration: 'none' }}>
                Medical disclaimer
              </Link>
            </li>
            <li>
              <Link href="/terms" style={{ fontSize: 13, color: 'var(--ink-3)', textDecoration: 'none' }}>
                Terms of service
              </Link>
            </li>
            <li>
              <Link href="/privacy" style={{ fontSize: 13, color: 'var(--ink-3)', textDecoration: 'none' }}>
                Privacy policy
              </Link>
            </li>
          </ul>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="footnote" style={{ textTransform: 'uppercase', letterSpacing: '1.2px' }}>Last updated</span>
          <span className="footnote" style={{ color: 'var(--ink-3)', fontSize: 13 }}>
            {new Date().toISOString().slice(0, 10).replace(/-/g, '.')} · catalog v2.1
          </span>
        </div>
      </div>

      <div
        className="site-footer-bottom"
        style={{
          maxWidth: 1200,
          margin: '24px auto 0',
          paddingTop: 20,
          borderTop: '1px solid var(--rule-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          fontSize: 11,
          color: 'var(--ink-4)',
          lineHeight: 1.55,
        }}
      >
        <p style={{ margin: 0, maxWidth: 720 }}>
          <strong style={{ fontWeight: 600 }}>Affiliate disclosure:</strong> Some links on Stack Lab are affiliate links. We may earn a commission at no additional cost to you when you purchase through them. Affiliate relationships never influence which compounds we surface, how they are graded, or any audit or bloodwork analysis.
        </p>
        <span style={{ whiteSpace: 'nowrap' }}>© {new Date().getFullYear()} Stack Lab</span>
      </div>
    </footer>
  );
}
