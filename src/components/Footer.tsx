import Link from 'next/link';

export function Footer() {
  return (
    <footer
      className="site-footer"
      style={{
        borderTop: '1px solid var(--gold)',
        marginTop: 80,
        padding: '32px 40px 28px',
        background: 'rgba(14, 18, 24, 0.6)',
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

      {/* Brand line */}
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
            fontFamily: 'var(--font-cinzel), serif',
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: '2.5px',
            color: 'var(--gold)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            lineHeight: 1,
            textTransform: 'uppercase',
          }}
        >
          <span style={{ fontSize: 18 }}>⚜</span>
          Stack Lab
        </div>
        <span
          className="footnote"
          style={{ color: 'var(--text-3)', fontSize: 11, letterSpacing: '1.4px', textTransform: 'uppercase' }}
        >
          Build your stack like a character
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
          <span
            className="footnote"
            style={{
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--gold)',
              fontFamily: 'var(--font-cinzel), serif',
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            About
          </span>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--text-3)',
              lineHeight: 1.55,
              maxWidth: 240,
            }}
          >
            Stack Lab is an inventory and audit for your supplement stack. Cards, rarities, and stats. Educational use only — not medical advice.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span
            className="footnote"
            style={{
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--gold)',
              fontFamily: 'var(--font-cinzel), serif',
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            Source
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.55 }}>
            Peer-reviewed studies indexed from PubMed, Cochrane, and Examine.
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span
            className="footnote"
            style={{
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--gold)',
              fontFamily: 'var(--font-cinzel), serif',
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            Legal
          </span>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, listStyle: 'none', padding: 0, margin: 0 }}>
            <li>
              <Link href="/disclaimer" style={{ fontSize: 13, color: 'var(--text-3)', textDecoration: 'none' }}>
                Medical disclaimer
              </Link>
            </li>
            <li>
              <Link href="/terms" style={{ fontSize: 13, color: 'var(--text-3)', textDecoration: 'none' }}>
                Terms of service
              </Link>
            </li>
            <li>
              <Link href="/privacy" style={{ fontSize: 13, color: 'var(--text-3)', textDecoration: 'none' }}>
                Privacy policy
              </Link>
            </li>
          </ul>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span
            className="footnote"
            style={{
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--gold)',
              fontFamily: 'var(--font-cinzel), serif',
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            Last updated
          </span>
          <span className="footnote" style={{ color: 'var(--text-3)', fontSize: 13 }}>
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
          color: 'var(--text-4)',
          lineHeight: 1.55,
        }}
      >
        <p style={{ margin: 0, maxWidth: 720 }}>
          <strong style={{ fontWeight: 600, color: 'var(--text-3)' }}>Affiliate disclosure:</strong> Some links on Stack Lab are affiliate links. We may earn a commission at no additional cost to you when you purchase through them. Affiliate relationships never influence which compounds we surface, how they are graded, or any audit findings.
        </p>
        <span style={{ whiteSpace: 'nowrap' }}>© {new Date().getFullYear()} Stack Lab</span>
      </div>
    </footer>
  );
}
