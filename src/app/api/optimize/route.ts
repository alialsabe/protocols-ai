import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface InputSupplement {
  id: string;
  name: string;
  dose: string;
  form: string;
  brand: string;
  servings: number | null;
  estimated_monthly_cost_usd: number | null;
}

const SYSTEM_PROMPT = `You are a supplement stack optimizer. You receive a user's current supplement stack as a JSON array. Each item has: id, name, dose, form, brand, servings, estimated_monthly_cost_usd.

Your job: identify redundancies, low-value items, and bioavailability upgrades. Be opinionated but evidence-grounded. Don't drop things without a clear reason.

Common patterns to recognize:
- Zinc + B6 are already inside ZMA combos. Drop the standalones if ZMA is present.
- Mag Oxide has poor absorption. Recommend upgrading to Magnesium Glycinate or Citrate.
- Multivitamins typically deliver trace doses of everything. Drop in favor of targeted singles.
- Rhodiola and Ashwagandha both modulate cortisol. Pick one.
- Niacinamide and standalone B3 are redundant if a B-complex is present.
- Calcium standalone is rarely needed if diet is reasonable. Skip unless deficiency.
- Tribulus, Tongkat Ali, Maca are often stacked redundantly. Pick one based on goal.
- Greens powders rarely earn their cost vs. eating actual vegetables.
- Fish oil is generally worth keeping for EPA/DHA.
- Creatine, Vitamin D3, Magnesium (good forms), L-Theanine are usually keepers.

Return ONLY a JSON object matching this exact schema, with no markdown fences and no commentary:

{
  "monthly_savings_usd": number,           // how much $/mo the user saves with the optimized stack
  "annual_savings_usd": number,            // monthly_savings_usd * 12
  "leaner_pct": number,                    // ((original_count - optimized_count) / original_count) * 100, rounded
  "drop": [{ "name": string, "reason": string }],  // items to drop entirely
  "upgrade": [{ "from": string, "to": string, "reason": string }],  // items to swap to a better form
  "keep": [{ "name": string }],            // items to keep as-is
  "optimized_stack": [{                    // the final recommended stack (after drops + upgrades)
    "id": string, "name": string, "dose": string, "form": string,
    "brand": string, "servings": number | null,
    "estimated_monthly_cost_usd": number | null
  }],
  "reasons": [{                            // user-facing explanation, 2 to 6 entries
    "marker": "minus" | "up",              // minus = something dropped, up = something upgraded
    "headline": string,                    // short bold phrase, e.g. "Zinc + B6"
    "detail": string                       // one sentence explanation including dollar impact, e.g. "already inside ZMA combo. Saves $37/mo."
  }]
}

Rules:
- "name" in drop/upgrade/keep must match the input "name" exactly (case-insensitive).
- For upgrades, set the optimized_stack item's name to the new form (e.g. "Magnesium Glycinate") and keep the original id.
- monthly_savings_usd = sum of dropped costs + (negative if upgrade costs more) -- be honest about upgrades that cost slightly more.
- Be conservative: if a stack is already lean, return zero or minimal changes.
- Return JSON ONLY.`;

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced ? fenced[1] : text).trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no JSON object found');
  return JSON.parse(raw.slice(start, end + 1));
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Server is not configured for optimization' },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const stack: unknown = body?.stack;
  if (!Array.isArray(stack) || stack.length === 0) {
    return NextResponse.json({ error: 'stack must be a non-empty array' }, { status: 400 });
  }
  if (stack.length > 30) {
    return NextResponse.json({ error: 'stack too large (max 30 items)' }, { status: 400 });
  }

  // Sanitize input
  const cleanStack: InputSupplement[] = (stack as Array<Record<string, unknown>>).map((s) => ({
    id: typeof s.id === 'string' ? s.id : '',
    name: typeof s.name === 'string' ? s.name : '',
    dose: typeof s.dose === 'string' ? s.dose : '',
    form: typeof s.form === 'string' ? s.form : '',
    brand: typeof s.brand === 'string' ? s.brand : '',
    servings: typeof s.servings === 'number' ? s.servings : null,
    estimated_monthly_cost_usd:
      typeof s.estimated_monthly_cost_usd === 'number' ? s.estimated_monthly_cost_usd : null,
  })).filter((s) => s.name);

  if (cleanStack.length === 0) {
    return NextResponse.json({ error: 'no valid items in stack' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Here is my current stack:\n\n${JSON.stringify(cleanStack, null, 2)}`,
        },
      ],
    });
    const block = response.content.find((c) => c.type === 'text');
    if (!block || block.type !== 'text') throw new Error('no text response');
    const parsed = extractJson(block.text) as Record<string, unknown>;

    // Light validation, fall back to defaults if missing
    const result = {
      monthly_savings_usd: Math.max(0, Math.round(Number(parsed.monthly_savings_usd) || 0)),
      annual_savings_usd: Math.max(0, Math.round(Number(parsed.annual_savings_usd) || (Number(parsed.monthly_savings_usd) || 0) * 12)),
      leaner_pct: Math.max(0, Math.min(100, Math.round(Number(parsed.leaner_pct) || 0))),
      drop: Array.isArray(parsed.drop) ? parsed.drop : [],
      upgrade: Array.isArray(parsed.upgrade) ? parsed.upgrade : [],
      keep: Array.isArray(parsed.keep) ? parsed.keep : [],
      optimized_stack: Array.isArray(parsed.optimized_stack) ? parsed.optimized_stack : [],
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/optimize] error', err);
    const message = err instanceof Error ? err.message : 'optimize failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
