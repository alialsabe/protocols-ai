import { z } from 'zod';
import type { ExtractedMarker } from './bloodwork-rules';

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

  const dataUrl = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
  const raw = await callVisionModel(dataUrl, apiKey);
  return parseAndValidate(raw);
}

// Sends the PDF directly to OpenRouter using their `file` content type.
// OpenRouter's file-parser plugin handles the PDF (text or OCR) before
// delegating to the model — so this works on Vercel serverless without
// any native binaries. mistral-ocr is needed because lab reports are
// often scans or images embedded in PDFs.
async function callVisionModel(pdfDataUrl: string, apiKey: string): Promise<string> {
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
            { type: 'text', text: 'Extract every marker from this lab report. JSON only.' },
            {
              type: 'file',
              file: {
                filename: 'bloodwork.pdf',
                file_data: pdfDataUrl,
              },
            },
          ],
        },
      ],
      plugins: [
        {
          id: 'file-parser',
          pdf: { engine: 'mistral-ocr' },
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
