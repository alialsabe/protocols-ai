import { listProtocolsSupplements } from '@/lib/db';

export async function GET() {
  try {
    const rows = await listProtocolsSupplements();
    return Response.json({
      supplements: rows,
      total: rows.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
