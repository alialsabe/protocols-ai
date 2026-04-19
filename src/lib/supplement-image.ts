const SUPPLEMENT_IMAGES: Record<string, string> = {
  ashwagandha: '/images/supplements/v3/ashwagandha.webp',
  boron: '/images/supplements/v3/boron.webp',
  'turkey-tail': '/images/supplements/v3/turkey-tail.webp',
  berberine: '/images/supplements/v3/berberine.webp',
  rhodiola: '/images/supplements/v3/rhodiola.webp',
  'omega-3': '/images/supplements/v3/omega-3.webp',
  'vitamin-b12': '/images/supplements/v3/vitamin-b12.webp',
  melatonin: '/images/supplements/v3/melatonin.webp',
  'lions-mane': '/images/supplements/v3/lions-mane.webp',
  'l-theanine': '/images/supplements/v3/l-theanine.webp',
};

export function getSupplementImage(slug: string): string | null {
  return SUPPLEMENT_IMAGES[slug] ?? null;
}
