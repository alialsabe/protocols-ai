import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ScanResult {
  name: string;
  dose: string;
  form: string;
  brand: string;
  servings: number | null;
  estimated_monthly_cost_usd: number | null;
  confidence: number;
}

const SYSTEM_PROMPT = `You are a supplement label parser. You receive an image of a supplement bottle label, OR raw text describing one, OR a product URL/name.

Return ONLY a JSON object matching this exact schema, with no markdown fences and no commentary:

{
  "name": string,                          // canonical compound name, e.g. "Magnesium Glycinate"
  "dose": string,                          // per-serving dose with units, e.g. "400 mg", "2000 IU", "5 g"
  "form": string,                          // "capsule" | "tablet" | "softgel" | "powder" | "liquid" | "gummy" | other lowercase
  "brand": string,                         // brand name, e.g. "NOW Foods" — empty string if unknown
  "servings": number | null,               // total servings per container, integer, null if unknown
  "estimated_monthly_cost_usd": number | null, // best-effort retail cost per month at the labeled dose, integer, null if you cannot estimate
  "confidence": number                     // 0.0 to 1.0, how legible/certain you are about name+dose
}

Rules:
- "name" must be the active compound, not the marketing name. ZMA is acceptable as a combo name.
- If you cannot read the label or text confidently, set confidence below 0.6.
- For monthly cost: assume one labeled serving per day. Estimate based on typical retail pricing in the US.
- Return JSON ONLY. No prose, no fences, no explanation.`;

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced ? fenced[1] : text).trim();
  // Strip leading/trailing prose if any
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no JSON object found');
  return JSON.parse(raw.slice(start, end + 1));
}

function validate(obj: unknown): ScanResult {
  if (!obj || typeof obj !== 'object') throw new Error('not an object');
  const o = obj as Record<string, unknown>;
  const result: ScanResult = {
    name: typeof o.name === 'string' ? o.name : '',
    dose: typeof o.dose === 'string' ? o.dose : '',
    form: typeof o.form === 'string' ? o.form : '',
    brand: typeof o.brand === 'string' ? o.brand : '',
    servings: typeof o.servings === 'number' && Number.isFinite(o.servings) ? Math.round(o.servings) : null,
    estimated_monthly_cost_usd:
      typeof o.estimated_monthly_cost_usd === 'number' && Number.isFinite(o.estimated_monthly_cost_usd)
        ? Math.round(o.estimated_monthly_cost_usd)
        : null,
    confidence: typeof o.confidence === 'number' && Number.isFinite(o.confidence) ? o.confidence : 0,
  };
  if (!result.name) throw new Error('name missing');
  return result;
}

async function callClaude(
  client: Anthropic,
  content: Anthropic.Messages.ContentBlockParam[],
): Promise<ScanResult> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  });
  const block = response.content.find((c) => c.type === 'text');
  if (!block || block.type !== 'text') throw new Error('no text response');
  const parsed = extractJson(block.text);
  return validate(parsed);
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Server is not configured for label scanning' },
      { status: 500 },
    );
  }

  const client = new Anthropic({ apiKey });
  const contentType = request.headers.get('content-type') || '';

  try {
    let content: Anthropic.Messages.ContentBlockParam[];

    if (contentType.includes('multipart/form-data')) {
      const fd = await request.formData();
      const file = fd.get('image');
      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'image field is required' }, { status: 400 });
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      // Limit image size to 10 MB
      if (bytes.byteLength > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'image too large (max 10 MB)' }, { status: 413 });
      }
      const base64 = Buffer.from(bytes).toString('base64');
      const mediaType = (file.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
      content = [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64 },
        },
        { type: 'text', text: 'Parse this supplement label.' },
      ];
    } else {
      const body = await request.json().catch(() => ({}));
      const text: string | undefined = typeof body?.text === 'string' ? body.text : undefined;
      const url: string | undefined = typeof body?.url === 'string' ? body.url : undefined;
      if (!text && !url) {
        return NextResponse.json({ error: 'text or url is required' }, { status: 400 });
      }
      const userText = text
        ? `Parse this supplement description into the JSON schema:\n\n${text.slice(0, 4000)}`
        : `Look up this product URL or name and return the supplement parsed into the JSON schema:\n\n${url!.slice(0, 1000)}`;
      content = [{ type: 'text', text: userText }];
    }

    const result = await callClaude(client, content);

    if (result.confidence < 0.6) {
      return NextResponse.json(
        { error: 'Could not read the label clearly. Try again with better lighting.' },
        { status: 422 },
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/scan] error', err);
    const message = err instanceof Error ? err.message : 'scan failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
