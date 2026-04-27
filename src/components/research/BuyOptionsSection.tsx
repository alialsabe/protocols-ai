import { listAffiliateOptionsBySupplementId } from '@/lib/db';
import type { ProtocolReport } from '@/lib/protocol-types';

type AffiliateRow = {
  id: string;
  partnerName: string;
  partnerType: string;
  productName: string;
  affiliateUrl: string;
  priceDisplay: string | null;
  productForm: string;
  trustScore: number;
  priorityScore: number;
  isPrimary: number;
};

/**
 * "Options to buy" panel — sits directly under the At-a-glance card.
 * Reads any active affiliate options for the supplement; if there's no
 * dedicated row but the report carries a single primary commerce link,
 * we still surface that as a fallback so the section is never empty.
 */
export async function BuyOptionsSection({
  report,
  supplementId,
}: {
  report: ProtocolReport;
  supplementId?: string;
}) {
  let options: AffiliateRow[] = [];
  if (supplementId) {
    try {
      options = (await listAffiliateOptionsBySupplementId(supplementId)) as unknown as AffiliateRow[];
    } catch {
      options = [];
    }
  }

  if (options.length === 0 && report.commerce?.affiliateLink) {
    options = [
      {
        id: 'primary',
        partnerName: report.commerce.retailer,
        partnerType: 'retailer',
        productName: report.commerce.product,
        affiliateUrl: report.commerce.affiliateLink,
        priceDisplay: report.commerce.price ?? null,
        productForm: 'capsule',
        trustScore: 5,
        priorityScore: 0,
        isPrimary: 1,
      },
    ];
  }

  if (options.length === 0) return null;

  const primary = options.find((o) => o.isPrimary === 1) ?? options[0];
  const others = options.filter((o) => o.id !== primary.id).slice(0, 3);

  return (
    <section
      style={{
        background: 'var(--paper-2)',
        border: '1px solid var(--rule)',
        padding: '20px 24px',
        borderRadius: 4,
      }}
    >
      <span
        className="footnote"
        style={{
          letterSpacing: '1.4px',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          fontWeight: 600,
        }}
      >
        Options to buy
      </span>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <a
          href={primary.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            background: 'var(--paper)',
            border: '1px solid var(--rule)',
            borderRadius: 4,
            textDecoration: 'none',
            color: 'var(--ink)',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
              {primary.productName}
            </div>
            <div className="footnote" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
              {primary.partnerName}
              {primary.priceDisplay ? ` · ${primary.priceDisplay}` : ''}
            </div>
          </div>
          <span
            style={{
              flexShrink: 0,
              padding: '6px 12px',
              background: 'var(--accent)',
              color: 'var(--ink)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              borderRadius: 3,
            }}
          >
            Buy →
          </span>
        </a>

        {others.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {others.map((o) => (
              <li key={o.id}>
                <a
                  href={o.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    border: '1px solid var(--rule-soft)',
                    borderRadius: 3,
                    textDecoration: 'none',
                    fontSize: 12,
                    color: 'var(--ink-2)',
                  }}
                >
                  <span>
                    {o.partnerName}
                    {o.priceDisplay ? <span style={{ color: 'var(--ink-4)' }}> · {o.priceDisplay}</span> : null}
                  </span>
                  <span style={{ color: 'var(--ink-4)' }}>↗</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p
        className="footnote"
        style={{ marginTop: 12, fontSize: 10, color: 'var(--ink-4)', lineHeight: 1.5 }}
      >
        Affiliate links — we may earn a commission at no extra cost to you.
      </p>
    </section>
  );
}
