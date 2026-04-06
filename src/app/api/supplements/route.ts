import { listProtocolsSupplements } from '@/lib/db';

export async function GET() {
  try {
    const rows = await listProtocolsSupplements();
    return Response.json({
      supplements: rows,
      total: rows.length,
    });
  } catch (err: unknown) {
    const e = err as Record<string, unknown>;
    return Response.json({
      error: e?.message ?? String(err),
      code: e?.code,
      severity: e?.severity,
      detail: e?.detail,
      hint: e?.hint,
      cause: e?.cause ? String(e.cause) : undefined,
      keys: Object.keys(e ?? {}),
    }, { status: 500 });
  }
}
