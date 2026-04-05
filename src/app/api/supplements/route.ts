import { listProtocolsSupplements } from '@/lib/db';

export async function GET() {
  const rows = await listProtocolsSupplements();

  return Response.json({
    supplements: rows,
    total: rows.length,
  });
}
