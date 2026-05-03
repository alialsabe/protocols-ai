import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/drizzle';
import { deficiencyRules, userBloodwork } from '@/lib/schema-postgres';
import { extractMarkersFromPDF } from '@/lib/bloodwork-extractor';
import {
  mapMarkersToFindings,
  type DeficiencyRule,
  type ExtractedMarker,
} from '@/lib/bloodwork-rules';
import type { AuditSeverity } from '@/lib/audit-engine';
import { checkRateLimit, clientKey, rateLimitResponse } from '@/lib/rate-limit';
import { createClient } from '../../../../utils/supabase/server';

// PDFs can be page-heavy; let the route stream up to ~15s of work.
export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_PDF_BYTES = 10 * 1024 * 1024;

// Each upload calls OpenRouter's mistral-ocr (~$2/1k pages). 10/hour per
// authenticated user is generous for legitimate use and caps the worst
// case (a leaked token, a script bug, an attacker) at a few cents/hour.
const BLOODWORK_LIMIT_PER_HOUR = 10;

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const limit = checkRateLimit(
    `bloodwork:${clientKey(request, userData.user.id)}`,
    BLOODWORK_LIMIT_PER_HOUR,
    60 * 60 * 1000,
  );
  if (!limit.allowed) return rateLimitResponse(limit);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing "file" upload field.' }, { status: 400 });
  }
  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json({ error: 'PDF exceeds 10MB.' }, { status: 413 });
  }
  if (file.type && file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF uploads are supported.' }, { status: 415 });
  }

  const source = normalizeSource(formData.get('source'));
  const pdfBytes = Buffer.from(await file.arrayBuffer());

  let markers: ExtractedMarker[] = [];
  try {
    markers = await extractMarkersFromPDF(pdfBytes);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Extraction failed.';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const rules = await loadDeficiencyRules();
  const findings = mapMarkersToFindings(markers, rules);

  // Privacy: we persist the structured markers (the user's data, in a form
  // they can act on) but NEVER the raw PDF bytes. raw_pdf_url stays NULL.
  await db
    .insert(userBloodwork)
    .values({
      id: `blood-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      userId: userData.user.id,
      source,
      markers,
      rawPdfUrl: null,
    })
    .catch(() => undefined);

  return NextResponse.json({ markers, findings });
}

async function loadDeficiencyRules(): Promise<DeficiencyRule[]> {
  const rows = await db.select().from(deficiencyRules).catch(() => []);
  return rows.map((row) => ({
    id: row.id,
    markerName: row.markerName,
    markerAliases: parseAliases(row.markerAliases),
    unit: row.unit,
    thresholdLow: parseNumeric(row.thresholdLow),
    thresholdHigh: parseNumeric(row.thresholdHigh),
    severity: normalizeSeverity(row.severity),
    supplementSlug: row.supplementSlug,
    recommendation: row.recommendation,
    citation: row.citation,
  }));
}

function parseAliases(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  return [];
}

function parseNumeric(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeSeverity(value: string): AuditSeverity {
  const v = value.toLowerCase();
  if (v === 'high') return 'high';
  if (v === 'medium') return 'medium';
  if (v === 'low') return 'low';
  return 'info';
}

function normalizeSource(value: FormDataEntryValue | null): string {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'labcorp' || raw === 'quest') return raw;
  return 'other';
}
