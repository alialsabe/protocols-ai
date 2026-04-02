import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('product');

  // Simulated affiliate price aggregation logic for MVP
  // The Commerce-Agent will eventually use Playwright to scrape this live.
  const affiliateTag = '?tag=protocolsai-20';

  if (!query) {
    return NextResponse.json({ error: 'Product query is required.' }, { status: 400 });
  }

  const mockData = [
    {
      vendor: 'Amazon',
      price: '$24.99',
      stock: true,
      link: `https://amazon.com/dp/B08J3T/${affiliateTag}`,
    },
    {
      vendor: 'iHerb',
      price: '$22.50',
      stock: true,
      link: `https://iherb.com/pr/${query}-123/${affiliateTag}`,
    }
  ];

  return NextResponse.json({
    query,
    results: mockData,
    timestamp: new Date().toISOString()
  });
}