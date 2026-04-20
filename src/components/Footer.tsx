export function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--rule)',
        marginTop: 80,
        padding: '32px 40px',
        background: 'var(--paper-2)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 32,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="footnote">Protocols.ai</span>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--ink-3)',
              lineHeight: 1.55,
              maxWidth: 260,
            }}
          >
            A plain-language reference for evidence-graded supplement research.
            Not medical advice.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="footnote">Source</span>
          <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
            Peer-reviewed studies indexed from PubMed, Cochrane, and Examine.
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="footnote">Last updated</span>
          <span className="footnote" style={{ color: 'var(--ink-3)', fontSize: 13 }}>
            {new Date().toISOString().slice(0, 10).replace(/-/g, '.')} · catalog v2.1
          </span>
        </div>
      </div>
    </footer>
  );
}
