import { z } from 'zod';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomBytes } from 'node:crypto';
import type { ExtractedMarker } from './bloodwork-rules';

// Strict schema. The model is told to omit anything it's unsure about;
// we silently drop malformed entries here as a second line of defense.
const markerSchema = z.object({
  name: z.string().min(1),
  value: z.number().finite(),
  unit: z.string().min(1),
  range_low: z.number().finite().nullable().optional(),
  range_high: z.number().finite().nullable().optional(),
});

export const extractionResponseSchema = z.object({
  markers: z.array(markerSchema),
});

export type ExtractionResponse = z.infer<typeof extractionResponseSchema>;

const SYSTEM_PROMPT = `You are a strict structured-data extractor for medical lab results.
Extract every marker with name, value, units, reference range.
Return JSON only matching this schema: {markers: [{name, value, unit, range_low, range_high}]}.
Do not interpret. Do not invent. Omit any marker you're unsure about.`;

export async function extractMarkersFromPDF(pdfBuffer: Buffer): Promise<ExtractedMarker[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured.');
  }

  const pngs = await renderPdfToPngs(pdfBuffer);
  if (pngs.length === 0) {
    return [];
  }

  try {
    const raw = await callVisionModel(pngs, apiKey);
    return parseAndValidate(raw);
  } finally {
    await Promise.allSettled(pngs.map((p) => fs.unlink(p)));
  }
}

// Convert a PDF buffer into one PNG per page using pdf-poppler. This needs
// the poppler binaries on PATH at runtime (already a Vercel concern, not a
// build concern). Tests mock this away via vi.mock.
async function renderPdfToPngs(pdfBuffer: Buffer): Promise<string[]> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bloodwork-'));
  const pdfPath = path.join(tmpDir, `${randomBytes(6).toString('hex')}.pdf`);
  await fs.writeFile(pdfPath, pdfBuffer);

  // Dynamic import keeps pdf-poppler off the cold-start path of routes that
  // never touch bloodwork.
  const poppler = await import('pdf-poppler');
  await poppler.convert(pdfPath, {
    format: 'png',
    out_dir: tmpDir,
    out_prefix: 'page',
    page: null,
  });

  await fs.unlink(pdfPath).catch(() => undefined);

  const entries = await fs.readdir(tmpDir);
  return entries
    .filter((name) => name.endsWith('.png'))
    .sort()
    .map((name) => path.join(tmpDir, name));
}

async function callVisionModel(pngPaths: string[], apiKey: string): Promise<string> {
  const images = await Promise.all(
    pngPaths.map(async (p) => {
      const bytes = await fs.readFile(p);
      return `data:image/png;base64,${bytes.toString('base64')}`;
    }),
  );

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract every marker from these lab pages. JSON only.' },
            ...images.map((url) => ({ type: 'image_url', image_url: { url } })),
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`OpenRouter request failed: ${response.status} ${detail.slice(0, 200)}`);
  }

  const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? '';
}

// Defense in depth: the model can return a near-miss object, mixed JSON +
// prose, or wrap markers in extra keys. We try strict parse first, then
// salvage individual entries before giving up.
export function parseAndValidate(raw: string): ExtractedMarker[] {
  const parsed = safeParseJson(raw);
  if (!parsed) return [];

  const strict = extractionResponseSchema.safeParse(parsed);
  if (strict.success) return strict.data.markers;

  const candidates = Array.isArray((parsed as { markers?: unknown }).markers)
    ? ((parsed as { markers: unknown[] }).markers)
    : [];

  return candidates
    .map((c) => markerSchema.safeParse(c))
    .filter((r) => r.success)
    .map((r) => (r as { data: ExtractedMarker }).data);
}

function safeParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}
