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
    const stack = err instanceof Error ? err.stack : undefined;
    const code = (err as Record<string, unknown>)?.code;
    return Response.json({ error: message, code, stack }, { status: 500 });
  }
}
