'use client';

import { useEffect, useState } from 'react';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

interface AffiliateOption {
  id: string;
  partnerName: string;
  partnerType: string | null;
  productName: string;
  affiliateUrl: string;
  priceDisplay: string | null;
  productForm: string | null;
  isPrimary: boolean;
}

interface Props {
  slug: string;
  /** Where on the site the buy button is shown — for analytics segmentation. */
  surface: 'supplement-detail' | 'audit-finding' | 'bloodwork-finding';
}

/**
 * Renders the active affiliate options for a supplement as a small buy
 * card list. Pairs with /api/affiliates/[slug]. The component is silent
 * if no options are returned (most supplements don't have a partner yet).
 *
 * FTC compliance: an inline disclosure label sits above the list so the
 * user sees "we earn a commission" before clicking, not buried in the
 * footer. Click through fires AFFILIATE_CTA_CLICKED so funnel analytics
 * can track partner / surface conversion rate.
 */
export function BuySection({ slug, surface }: Props) {
  const [options, setOptions] = useState<AffiliateOption[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch(`/api/affiliates/${encodeURIComponent(slug)}`);
        if (!res.ok) return;
        const data: { options: AffiliateOption[] } = await res.json();
        if (!cancelled) setOptions(data.options ?? []);
      } catch {
        // silent — affiliate buttons are nice-to-have
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [slug]);

  if (!loaded || options.length === 0) return null;

  return (
    <section
      className="rounded-[16px] p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--hair)' }}
    >
      <div className="mb-3 flex items-baseline justify-between">
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--accent)' }}
        >
          Where to buy
        </span>
        <span
          className="font-mono text-[10px] uppercase tracking-[1.2px]"
          style={{ color: 'var(--fg-dim)' }}
        >
          Affiliate
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {options.map((opt) => (
          <li key={opt.id}>
            <a
              href={opt.affiliateUrl}
              target="_blank"
              rel="sponsored noopener noreferrer"
              onClick={() =>
                track(ANALYTICS_EVENTS.AFFILIATE_CTA_CLICKED, {
                  affiliate_id: opt.id,
                  partner: opt.partnerName,
                  partner_type: opt.partnerType ?? 'unknown',
                  slug,
                  surface,
                  is_primary: opt.isPrimary,
                })
              }
              className="flex min-h-[56px] items-center justify-between gap-4 rounded-[12px] px-4 py-3 transition-transform hover:translate-x-[2px]"
              style={{
                background: opt.isPrimary ? 'var(--paper)' : 'var(--paper-2)',
                border: `1px solid ${opt.isPrimary ? 'var(--accent)' : 'var(--hair-strong)'}`,
              }}
            >
              <span className="flex min-w-0 flex-col">
                <span
                  className="text-[14px] font-bold leading-tight"
                  style={{ color: 'var(--fg)' }}
                >
                  {opt.partnerName}
                </span>
                <span
                  className="mt-0.5 truncate text-[12px] leading-tight"
                  style={{ color: 'var(--fg-muted)' }}
                >
                  {opt.productName}
                  {opt.productForm ? ` · ${opt.productForm}` : ''}
                </span>
              </span>
              <span className="flex items-center gap-3 whitespace-nowrap">
                {opt.priceDisplay && (
                  <span
                    className="font-mono text-[12px] font-bold"
                    style={{ color: 'var(--fg)' }}
                  >
                    {opt.priceDisplay}
                  </span>
                )}
                <span
                  className="font-mono text-[10px] font-bold uppercase tracking-[1.2px]"
                  style={{ color: opt.isPrimary ? 'var(--accent-ink)' : 'var(--fg-muted)' }}
                >
                  Buy →
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[11px] leading-[16px]" style={{ color: 'var(--fg-dim)' }}>
        We may earn a commission at no extra cost to you when you buy through these links. This never influences which compounds we surface.
      </p>
    </section>
  );
}
