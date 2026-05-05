import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Mode = 'save' | 'optimize';
type Goal = 'sleep' | 'energy' | 'longevity' | 'cognition' | 'muscle';

interface InputSupplement {
  id: string;
  name: string;
  dose: string;
  form: string;
  brand: string;
  servings: number | null;
  estimated_monthly_cost_usd: number | null;
}

const SAVE_PROMPT = `You are a supplement stack cost optimizer. Your job is to find waste and lower cost while preserving the user's apparent goals (inferred from the stack itself).

You receive a JSON array of the user's current stack. Each item has: id, name, dose, form, brand, servings, estimated_monthly_cost_usd.

Cost-saving patterns to recognize:
- Zinc + B6 are already inside ZMA combos. Drop the standalones if ZMA is present.
- Mag Oxide has poor absorption. Recommend upgrading to Magnesium Glycinate or Citrate (slightly higher cost is fine if absorption is dramatically better).
- Multivitamins typically deliver trace doses of everything. Drop in favor of targeted singles.
- Rhodiola and Ashwagandha both modulate cortisol. Pick one.
- Niacinamide and standalone B3 are redundant if a B-complex is present.
- Calcium standalone is rarely needed if diet is reasonable.
- Tribulus, Tongkat Ali, Maca are often stacked redundantly. Pick one.
- Greens powders rarely earn their cost vs. eating actual vegetables.
- Combo products (e.g. ZMA replacing Zinc + Magnesium + B6) consolidate cost.

Bias toward cost reduction. Do NOT add new supplements. You may suggest cheaper combo replacements that subsume multiple items.`;

function optimizePrompt(goal: Goal | undefined): string {
  const goalDesc: Record<Goal, string> = {
    sleep: 'deeper sleep, faster sleep onset, fewer wakeups, better recovery',
    energy: 'sustained daytime energy, mitochondrial support, fewer afternoon crashes',
    longevity: 'cellular longevity, NAD+ support, oxidative stress reduction, healthspan',
    cognition: 'focus, memory, mental clarity, neuroprotection',
    muscle: 'muscle protein synthesis, strength, recovery, training adaptation',
  };

  const goalAdditions: Record<Goal, string> = {
    sleep: '- Glycine 3g before bed reliably improves sleep onset and deep sleep.\n- Magnesium Glycinate 300-400mg in evening.\n- L-Theanine 200mg if anxious before bed.\n- Apigenin 50mg shows promise for sleep depth.\n- Avoid stimulants and high-dose B vitamins after noon.',
    energy: '- CoQ10 (Ubiquinol form) 100-200mg for mitochondrial ATP.\n- Creatine Monohydrate 5g/day, surprisingly potent for cognitive and physical energy.\n- B-Complex (active forms: methylfolate, methylcobalamin, P5P).\n- Iron only if labs confirm deficiency.\n- Rhodiola 200-400mg for adaptogenic energy without crash.',
    longevity: '- NMN or NR (NAD+ precursors) 250-500mg.\n- Resveratrol 250-500mg with fat for absorption.\n- Omega-3 (high EPA) 2-3g/day.\n- Vitamin D3 + K2 (MK-7) for bone and arterial health.\n- Glycine 3g for collagen synthesis and methylation balance.\n- TMG 500-1g if on high methyl-donor stack.',
    cognition: "- Creatine Monohydrate 5g/day for cognitive output.\n- Omega-3 (high DHA) 2g/day.\n- Lion's Mane 500-1000mg for NGF.\n- L-Theanine 200mg + caffeine for focus without jitter.\n- Bacopa Monnieri (Bacognize) 300mg for memory consolidation.\n- Phosphatidylserine 100-300mg for cortisol-driven mental fatigue.",
    muscle: '- Creatine Monohydrate 5g/day, the single highest-ROI strength supplement.\n- Whey Protein or EAA blend if dietary protein is low.\n- Vitamin D3 5000 IU (suboptimal D suppresses testosterone and recovery).\n- Magnesium Glycinate 400mg for sleep-driven recovery.\n- Beta-Alanine 3-5g for higher-rep work capacity.\n- Citrulline Malate 6-8g pre-workout for pump and endurance.',
  };

  const goalLine = goal
    ? `The user's goal is: ${goal} (${goalDesc[goal]}).`
    : 'The user has not picked a specific goal. Infer from the stack.';

  const additions = goal
    ? `\n\nKey supplements typically associated with the "${goal}" goal:\n${goalAdditions[goal]}\n\nYou MAY add supplements from this list (or comparable evidence-grounded alternatives) to the stack if they improve goal alignment. When adding, set the optimized_stack item with a fresh id (use a short string like "add-1", "add-2"), give it a reasonable estimated_monthly_cost_usd, and explain WHY in the reasons array tied to the goal.`
    : '';

  return `You are a supplement stack optimizer focused on goal alignment, not cost. You receive a JSON array of the user's current stack and a goal. Your job: recommend the optimal stack for that goal.

${goalLine}

You receive each stack item as: id, name, dose, form, brand, servings, estimated_monthly_cost_usd.

You may DROP items that don't serve the goal (or are redundant), UPGRADE forms (e.g. Mag Oxide -> Glycinate), KEEP items that already serve the goal, and ADD new items that complete the stack for this goal.${additions}

Always include a brief, evidence-grounded reason tied to the goal for each change.`;
}

const SCHEMA_TAIL = `

Return ONLY a JSON object matching this exact schema, with no markdown fences and no commentary:

{
  "mode_summary": string,
  "monthly_savings_usd": number,
  "annual_savings_usd": number,
  "leaner_pct": number,
  "drop": [{ "name": string, "reason": string }],
  "upgrade": [{ "from": string, "to": string, "reason": string }],
  "keep": [{ "name": string }],
  "add": [{ "name": string, "reason": string }],
  "optimized_stack": [{
    "id": string, "name": string, "dose": string, "form": string,
    "brand": string, "servings": number | null,
    "estimated_monthly_cost_usd": number | null
  }],
  "reasons": [{
    "marker": "minus" | "up" | "plus",
    "headline": string,
    "detail": string
  }]
}

Rules:
- "name" in drop/upgrade/keep/add must match item names exactly (case-insensitive).
- For upgrades, set the optimized_stack item's name to the new form and keep the original id.
- For adds, give the new optimized_stack item a fresh id like "add-1".
- monthly_savings_usd may be negative in optimize mode if goal-aligned stack costs more.
- mode_summary is one user-facing sentence framing the recommendation.
- Be conservative in save mode: minimal changes if stack is already lean.
- Return JSON ONLY.`;

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced ? fenced[1] : text).trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no JSON object found');
  return JSON.parse(raw.slice(start, end + 1));
}

const VALID_GOALS: Goal[] = ['sleep', 'energy', 'longevity', 'cognition', 'muscle'];

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Server is not configured for recommendations' },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const stack: unknown = body?.stack;
  const modeRaw = body?.mode;
  const goalRaw = body?.goal;

  const mode: Mode = modeRaw === 'optimize' ? 'optimize' : 'save';
  const goal: Goal | undefined =
    mode === 'optimize' && typeof goalRaw === 'string' && VALID_GOALS.includes(goalRaw as Goal)
      ? (goalRaw as Goal)
      : undefined;

  if (!Array.isArray(stack) || stack.length === 0) {
    return NextResponse.json({ error: 'stack must be a non-empty array' }, { status: 400 });
  }
  if (stack.length > 30) {
    return NextResponse.json({ error: 'stack too large (max 30 items)' }, { status: 400 });
  }

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

  const systemPrompt =
    (mode === 'save' ? SAVE_PROMPT : optimizePrompt(goal)) + SCHEMA_TAIL;

  const userMessage =
    mode === 'optimize' && goal
      ? `My goal is: ${goal}.\n\nHere is my current stack:\n\n${JSON.stringify(cleanStack, null, 2)}`
      : `Here is my current stack:\n\n${JSON.stringify(cleanStack, null, 2)}`;

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });
    const block = response.content.find((c) => c.type === 'text');
    if (!block || block.type !== 'text') throw new Error('no text response');
    const parsed = extractJson(block.text) as Record<string, unknown>;

    const result = {
      mode,
      goal: goal ?? null,
      mode_summary: typeof parsed.mode_summary === 'string' ? parsed.mode_summary : '',
      monthly_savings_usd: Math.round(Number(parsed.monthly_savings_usd) || 0),
      annual_savings_usd: Math.round(
        Number(parsed.annual_savings_usd) || (Number(parsed.monthly_savings_usd) || 0) * 12,
      ),
      leaner_pct: Math.round(Number(parsed.leaner_pct) || 0),
      drop: Array.isArray(parsed.drop) ? parsed.drop : [],
      upgrade: Array.isArray(parsed.upgrade) ? parsed.upgrade : [],
      keep: Array.isArray(parsed.keep) ? parsed.keep : [],
      add: Array.isArray(parsed.add) ? parsed.add : [],
      optimized_stack: Array.isArray(parsed.optimized_stack) ? parsed.optimized_stack : [],
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/recommend] error', err);
    const message = err instanceof Error ? err.message : 'recommend failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
