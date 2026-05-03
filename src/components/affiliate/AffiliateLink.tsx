'use client';

import type { CSSProperties, ReactNode } from 'react';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

interface Props {
  href: string;
  affiliateId: string;
  partner: string;
  partnerType: string;
  slug: string;
  surface: 'supplement-detail' | 'audit-finding' | 'bloodwork-finding';
  isPrimary: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * Thin client wrapper around an affiliate <a> tag that fires
 * AFFILIATE_CTA_CLICKED to PostHog before navigation. Lets us keep the
 * parent (BuyOptionsSection) as a server component while still capturing
 * the click event funnel for partner / surface conversion analytics.
 *
 * Always uses target="_blank" + rel="sponsored noopener noreferrer" so
 * we comply with FTC + Google's affiliate link guidance.
 */
export function AffiliateLink({
  href,
  affiliateId,
  partner,
  partnerType,
  slug,
  surface,
  isPrimary,
  className,
  style,
  children,
}: Props) {
  function handleClick() {
    track(ANALYTICS_EVENTS.AFFILIATE_CTA_CLICKED, {
      affiliate_id: affiliateId,
      partner,
      partner_type: partnerType,
      slug,
      surface,
      is_primary: isPrimary,
    });
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored noopener noreferrer"
      onClick={handleClick}
      className={className}
      style={style}
    >
      {children}
    </a>
  );
}
