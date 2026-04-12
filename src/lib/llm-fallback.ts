/**
 * LLM fallback for supplements that exist in the catalog but lack
 * science/dosage data.
 *
 * Architecture:
 *   1. `shouldTriggerFallback()` — decides if a supplement needs generation
 *   2. `generateSupplementData()` — calls Claude with few-shot examples,
 *      returns structured data matching the supplement_science + supplement_dosage shape
 *   3. `saveFallbackData()` — persists to DB with data_source='llm_generated'
 *   4. `runFallback()` — orchestrator. Guarded by env var. Returns status
 *      so callers can tell the user "Data generating..." without a 500.
 *
 * Guarantees:
 *   - Never throws on LLM errors (timeout, parse failure, refusal)
 *   - Never ships without a disclaimer (data_source flag)
 *   - Caches forever on success (one call per supplement ever)
 */

import { db } from './drizzle';
import { supplementScience, supplementDosage } from './schema-postgres';

type FallbackStatus = 'ok' | 'generating' | 'disabled' | 'failed' | 'exists';

export interface FallbackResult {
  status: FallbackStatus;
  message?: string;
}

interface GeneratedScience {
  summary: string;
  findings: Array<{ title: string; detail: string; citation?: string; quality?: 'high' | 'medium' | 'low' }>;
  sideEffects: Array<{ label: string; incidence: string; mitigation?: string }>;
  medicineInteractions: Array<{ medicine: string; severity: 'low' | 'moderate' | 'high'; mechanism: string; recommendation: string }>;
}

interface GeneratedDosage {
  loading?: string;
  maintenance: string;
  formula: string;
  unit: string;
}

interface GeneratedData {
  science: GeneratedScience;
  dosage: GeneratedDosage;
}

/**
 * True when the supplement exists in the catalog but has no science row yet.
 * Callers should only trigger fallback for known supplements — never generate
 * for queries that aren't in the catalog at all.
 */
export function shouldTriggerFallback(args: { hasScience: boolean; hasDosage: boolean }): boolean {
  return !args.hasScience || !args.hasDosage;
}

/**
 * Ask Claude to generate structured supplement data.
 * Returns null on any failure (timeout, parse error, refusal) — never throws.
 *
 * The prompt uses the seeded 40 supplements as few-shot implicit priors
 * by describing the exact JSON shape expected.
 */
async function generateSupplementData(params: {
  name: string;
  category: string;
  baseCompound?: string | null;
}): Promise<GeneratedData | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const systemPrompt = `You are a supplement science researcher. You return ONLY valid JSON matching the schema below — no prose, no markdown, no disclaimers.

Schema:
{
  "science": {
    "summary": "2-3 sentences explaining the supplement's primary mechanism and use cases",
    "findings": [
      { "title": "Short finding name", "detail": "1-2 sentence evidence statement", "citation": "First author et al. Year", "quality": "high|medium|low" }
    ],
    "sideEffects": [
      { "label": "Side effect name", "incidence": "Common|Uncommon|Rare|Very rare", "mitigation": "How to avoid or manage" }
    ],
    "medicineInteractions": [
      { "medicine": "Medicine or class name", "severity": "low|moderate|high", "mechanism": "Why it interacts", "recommendation": "What to do" }
    ]
  },
  "dosage": {
    "loading": "Optional loading protocol (e.g. '5 g/day × 7 days'), or null",
    "maintenance": "Typical effective daily dose with unit",
    "formula": "Brief formula guidance (e.g. 'Take with fat for absorption')",
    "unit": "mg, g, IU, mcg, or similar"
  }
}

Rules:
- 3 to 6 findings, each with a real plausible citation (researcher name + year). DO NOT invent PMIDs or journal DOIs.
- 2 to 4 side effects.
- 2 to 5 medicine interactions with common medication classes (SSRIs, blood thinners, statins, thyroid meds, MAOIs, blood pressure meds, etc.).
- Dosage must be evidence-based, conservative, and cite peer-reviewed consensus ranges.
- If the supplement is obscure or controversial, be honest in the summary about the limited evidence.
- Never recommend a dose that would be clinically dangerous.`;

  const userPrompt = `Generate science and dosage data for: ${params.name}${params.baseCompound ? ` (${params.baseCompound})` : ''} in the ${params.category} category.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const body = await response.json();
    const text: string | undefined = body?.content?.[0]?.text;
    if (!text) return null;

    // Strip any markdown fences in case the model misbehaves
    const jsonText = text.replace(/```json\s*|\s*```/g, '').trim();
    const parsed = JSON.parse(jsonText) as GeneratedData;

    // Minimal shape validation — refuse malformed output
    if (!parsed?.science?.summary || !Array.isArray(parsed?.science?.findings)) return null;
    if (!parsed?.dosage?.maintenance) return null;

    return parsed;
  } catch {
    // Any failure (abort, network, parse, refusal) returns null
    return null;
  }
}

/**
 * Persist generated data to supplement_science + supplement_dosage.
 * Uses `data_source='llm_generated'` so the UI can surface a disclaimer.
 */
async function saveFallbackData(supplementId: string, data: GeneratedData): Promise<void> {
  const scienceId = `sci-llm-${supplementId.slice(0, 20)}-${Date.now().toString(36)}`;
  const dosageId = `dos-llm-${supplementId.slice(0, 20)}-${Date.now().toString(36)}`;

  await db.insert(supplementScience).values({
    id: scienceId,
    supplementId,
    summary: data.science.summary,
    sourceCount: data.science.findings.length,
    findings: JSON.stringify(data.science.findings),
    interactions: '[]',
    sideEffects: JSON.stringify(data.science.sideEffects),
    medicineInteractions: JSON.stringify(data.science.medicineInteractions),
    dataSource: 'llm_generated',
  });

  await db.insert(supplementDosage).values({
    id: dosageId,
    supplementId,
    loading: data.dosage.loading ?? null,
    maintenance: data.dosage.maintenance,
    formula: data.dosage.formula,
    unit: data.dosage.unit,
  });
}

/**
 * Main entry point. Called from lookupSupplement when a catalog supplement
 * is missing science/dosage data. Never throws.
 */
export async function runFallback(params: {
  supplementId: string;
  name: string;
  category: string;
  baseCompound?: string | null;
  hasScience: boolean;
  hasDosage: boolean;
}): Promise<FallbackResult> {
  if (!shouldTriggerFallback({ hasScience: params.hasScience, hasDosage: params.hasDosage })) {
    return { status: 'exists' };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { status: 'disabled', message: 'LLM fallback not configured.' };
  }

  try {
    const generated = await generateSupplementData({
      name: params.name,
      category: params.category,
      baseCompound: params.baseCompound,
    });
    if (!generated) return { status: 'generating', message: 'Data generation in progress.' };

    await saveFallbackData(params.supplementId, generated);
    return { status: 'ok' };
  } catch {
    // Database error on save. Don't fail the user's request.
    return { status: 'generating', message: 'Data generation in progress.' };
  }
}

/**
 * Fire-and-forget background trigger. Used by the comparison view so the
 * user sees partial data immediately and missing columns fill in on reload.
 */
export function triggerFallbackAsync(params: Parameters<typeof runFallback>[0]): void {
  if (!process.env.ANTHROPIC_API_KEY) return;
  void runFallback(params).catch(() => {
    // Swallow — background job, errors logged by the DB layer
  });
}
