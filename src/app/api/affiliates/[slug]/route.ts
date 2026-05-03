import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { affiliateOptions, supplements } from '@/lib/schema-postgres';

// Returns active affiliate options for a supplement slug, ordered with the
// primary partner first, then by priority_score. Used by the supplement
// detail page sidebar and (later) by audit + bloodwork findings to power
// per-finding "buy this" buttons.

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

const loadAffiliatesForSlug = unstable_cache(
  async (slug: string): Promise<AffiliateOption[]> => {
    const supp = await db
      .select({ id: supplements.id })
      .from(supplements)
      .where(eq(supplements.slug, slug))
      .limit(1);

    if (supp.length === 0) return [];

    const rows = await db
      .select({
        id: affiliateOptions.id,
        partnerName: affiliateOptions.partnerName,
        partnerType: affiliateOptions.partnerType,
        productName: affiliateOptions.productName,
        affiliateUrl: affiliateOptions.affiliateUrl,
        priceDisplay: affiliateOptions.priceDisplay,
        productForm: affiliateOptions.productForm,
        isPrimary: affiliateOptions.isPrimary,
        priorityScore: affiliateOptions.priorityScore,
      })
      .from(affiliateOptions)
      .where(
        and(
          eq(affiliateOptions.supplementId, supp[0].id),
          eq(affiliateOptions.isActive, 1),
        ),
      )
      .orderBy(desc(affiliateOptions.isPrimary), desc(affiliateOptions.priorityScore));

    return rows.map((r) => ({
      id: r.id,
      partnerName: r.partnerName,
      partnerType: r.partnerType,
      productName: r.productName,
      affiliateUrl: r.affiliateUrl,
      priceDisplay: r.priceDisplay,
      productForm: r.productForm,
      isPrimary: r.isPrimary === 1,
    }));
  },
  ['affiliates-by-slug'],
  { revalidate: 600, tags: ['affiliates'] },
);

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  if (!slug) {
    return NextResponse.json({ options: [] }, { status: 400 });
  }
  try {
    const options = await loadAffiliatesForSlug(slug.toLowerCase().trim());
    return NextResponse.json({ options });
  } catch {
    return NextResponse.json({ options: [] }, { status: 200 });
  }
}
