/**
 * Rich LLM enrichment — generates a deep, structured science bundle
 * for every supplement in the catalog and writes to:
 *   • supplement_science  (summary, findings, interactions, sideEffects, medicineInteractions, extras)
 *   • supplement_dosage   (loading, maintenance, formula, unit) — if missing
 *   • schedule_rules      (preferredTime, withFood, fatSoluble, …) — if missing
 *   • companion_stacks    (5-8 cross-referenced supplement pairings)
 *   • medicine_interactions (3-6 drug interactions)
 *
 * Uses DeepSeek V4 Pro via OpenRouter (frontier quality, fraction of the cost).
 *
 * Run:    npx tsx scripts/enrich-science-llm.ts
 * Dry:    DRY_RUN=1 npx tsx scripts/enrich-science-llm.ts
 * Limit:  LIMIT=20 npx tsx scripts/enrich-science-llm.ts
 * Force:  FORCE=1 npx tsx scripts/enrich-science-llm.ts  (re-enrich llm_generated entries)
 * Slug:   ONLY=ashwagandha npx tsx scripts/enrich-science-llm.ts (single supplement)
 */
import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';
import { loadLocalEnv, getPoolerUrl } from '../src/lib/database-env';

loadLocalEnv();

function loadExtra(f: string) {
  const p = path.join(process.cwd(), f);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const idx = t.indexOf('=');
    const k = t.slice(0, idx).trim();
    const v = t.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!(k in process.env)) process.env[k] = v;
  }
}
loadExtra('.env.production.local');

const poolerUrl = getPoolerUrl();
if (!poolerUrl) throw new Error('Missing DATABASE_URL / SUPABASE_POOLER_URL');

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_KEY) throw new Error('Missing OPENROUTER_API_KEY');

// DeepSeek V4 Flash: efficiency-tuned MoE (284B/13B activated), 1M context,
// excellent at structured JSON. V4 Pro is better but heavily rate-limited
// upstream on OpenRouter's shared pool — Flash actually completes the run.
// To use Pro: ENRICH_MODEL=deepseek/deepseek-v4-pro (and add your own
// DeepSeek key at openrouter.ai/settings/integrations to bypass the pool).
const MODEL = process.env.ENRICH_MODEL ?? 'deepseek/deepseek-v4-flash';

const u = new URL(poolerUrl);
const sql = postgres({
  host: u.hostname, port: Number(u.port) || 5432,
  database: u.pathname.slice(1) || 'postgres',
  username: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  ssl: { rejectUnauthorized: false }, prepare: false, max: 12,
});

const DRY_RUN = process.env.DRY_RUN === '1';
const FORCE   = process.env.FORCE === '1';
const LIMIT   = parseInt(process.env.LIMIT ?? '500', 10);
const ONLY    = process.env.ONLY?.trim().toLowerCase();
const SPARSE  = process.env.SPARSE === '1';
const BATCH   = parseInt(process.env.BATCH ?? '10', 10);
const DELAY   = parseInt(process.env.DELAY ?? '300', 10);

// ─── types ───────────────────────────────────────────────────────────────────

type Finding = { title: string; detail: string; citation: string; quality: 'high' | 'medium' | 'low' };
type Interaction = { label: string; severity: string; note: string };
type SideEffect = { label: string; incidence: string; mitigation: string };
type MedInt = { medicineName: string; medicineClass?: string; severity: string; mechanism: string; recommendation: string };
type CompanionStack = { name: string; why: string; strength: 'common' | 'strong'; dosingNote?: string };
type Myth = { myth: string; reality: string };

type Extras = {
  plainSummary: string;
  keyBenefits: string[];
  bestFor: string[];
  whoShouldAvoid: string[];
  whatToExpect: string;
  mechanism: string;
  commonMyths: Myth[];
  sources: string[];
};

type DosageGen = { loading?: string; maintenance: string; formula: string; unit: string };
type ScheduleGen = {
  preferredTime: 'morning' | 'afternoon' | 'evening' | 'bedtime' | 'any';
  withFood: boolean; foodType?: string; emptyStomach: boolean;
  fatSoluble: boolean; stimulant: boolean; sedating: boolean;
};

type RichBundle = {
  summary: string;                       // technical / scientific tone
  extras: Extras;                        // plain-English + structured info
  findings: Finding[];                   // 5-8 RCT/meta-analysis findings
  interactions: Interaction[];           // 3-6 supplement-supplement
  sideEffects: SideEffect[];             // 3-6 entries
  medicineInteractions: MedInt[];        // 3-6 drug interactions
  companionStacks: CompanionStack[];     // 5-8 named pairings
  dosage: DosageGen;                     // dosage spec
  schedule: ScheduleGen;                 // timing rules
};

// ─── prompt ──────────────────────────────────────────────────────────────────

function prompt(name: string, slug: string, category: string): string {
  return `You are writing a deep, structured reference entry for the supplement "${name}" (category: ${category}).

This entry powers a research app where readers range from curious beginners to clinicians. They depend on accurate, well-organized information. Be thorough, factual, evidence-based, and honest about uncertainty.

Return ONLY a JSON object matching this exact shape — no markdown, no fences, no explanation:

{
  "summary": "2-3 sentence technical mechanism summary. Use precise language, name pathways/receptors/enzymes. This is the SCIENTIFIC tone description.",

  "extras": {
    "plainSummary": "2-3 short paragraphs in PLAIN ENGLISH for someone with no science background. NO compound names, NO enzyme names, NO 'inhibits X' or 'modulates Y'. Use everyday language: 'helps your body...', 'gives your muscles...', 'keeps your brain...'. Imagine explaining to a smart 14-year-old.",
    "keyBenefits": ["4-6 short benefit phrases, no jargon, e.g. 'Steadier energy throughout the day'", "..."],
    "bestFor": ["3-5 specific use cases or goals in plain language, e.g. 'Adults over 40 with sleep issues'", "..."],
    "whoShouldAvoid": ["3-5 contraindications in plain language, e.g. 'Pregnant or breastfeeding women'", "..."],
    "whatToExpect": "1-2 sentences on onset and timeline. When will the user feel something? What might they notice? Plain language.",
    "mechanism": "3-5 sentence DETAILED scientific mechanism — pathways, receptor binding, kinetics, dose-response. This goes in the scientific tab.",
    "commonMyths": [
      { "myth": "Common misconception in 1 sentence.", "reality": "Honest reality in 1-2 sentences with evidence." }
    ],
    "sources": ["List the source types you drew on, e.g. 'PubMed RCTs', 'Examine.com', 'NIH ODS', 'Cochrane reviews'", "..."]
  },

  "findings": [
    { "title": "Outcome label ≤6 words", "detail": "1-2 sentences with key numbers (effect size, sample size, duration).", "citation": "PMID: XXXXXXXX or 'Meta-analysis'", "quality": "high|medium|low" }
  ],

  "interactions": [
    { "label": "Supplement name", "severity": "synergy|moderate|caution", "note": "One sentence on the interaction." }
  ],

  "sideEffects": [
    { "label": "Side effect", "incidence": "very common|common|moderate|low|very low|rare", "mitigation": "How to avoid or minimize." }
  ],

  "medicineInteractions": [
    { "medicineName": "Drug name or class", "medicineClass": "SSRI|blood_thinner|statin|thyroid_med|...", "severity": "contraindicated|high|moderate|low", "mechanism": "Brief mechanism.", "recommendation": "Clinical action." }
  ],

  "companionStacks": [
    { "name": "Common supplement name (e.g. 'Magnesium Glycinate', 'Vitamin D3', 'Creatine Monohydrate')", "why": "1-2 sentences on why they work well together.", "strength": "common|strong", "dosingNote": "Optional: when/how to take together." }
  ],

  "dosage": {
    "loading": "Optional loading protocol, e.g. '5g/day for 5 days' or null",
    "maintenance": "Maintenance dose, e.g. '300-600 mg/day'",
    "formula": "How to take, e.g. 'split twice daily with meals' or 'single dose before bed'",
    "unit": "mg|g|mcg|IU|CFU"
  },

  "schedule": {
    "preferredTime": "morning|afternoon|evening|bedtime|any",
    "withFood": true,
    "foodType": "Optional, e.g. 'high-fat meal'",
    "emptyStomach": false,
    "fatSoluble": false,
    "stimulant": false,
    "sedating": false
  }
}

Quantity rules:
- findings: 5-8 entries (real PMIDs where you know them; "Meta-analysis" or "Review" otherwise — never fabricate)
- interactions: 3-6 entries
- sideEffects: 3-6 entries
- medicineInteractions: 3-6 entries
- companionStacks: 5-8 entries (use REAL common supplement names from the broader catalog)
- commonMyths: 2-3 entries

Quality rules:
- "high" = meta-analyses or multiple high-quality RCTs
- "medium" = single RCT or well-designed cohort
- "low" = observational, mechanistic, or animal-only
- If human evidence is sparse, say so honestly in summary AND plainSummary
- plainSummary should NEVER use words like: receptor, enzyme, modulate, inhibit, agonist, kinase, signal, pathway, neurotransmitter (use "brain chemical" if needed), bioavailability ("how well your body absorbs it")
- For very obscure supplements with little data, populate fields conservatively but still complete the structure`;
}

// ─── OpenRouter call ─────────────────────────────────────────────────────────

async function generate(name: string, slug: string, category: string, attempt = 1): Promise<RichBundle | null> {
  const MAX_ATTEMPTS = 5;
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://protocols-ai.vercel.app',
        'X-Title': 'Stack Lab rich enrichment',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2800,
        temperature: 0.25,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are a meticulous medical-science writer. Always respond with valid JSON only — no markdown, no explanation, no code fences.' },
          { role: 'user', content: prompt(name, slug, category) },
        ],
      }),
    });

    // Retry on rate limit (429) and transient 5xx errors with exponential backoff
    if (res.status === 429 || res.status >= 500) {
      if (attempt < MAX_ATTEMPTS) {
        const wait = Math.min(2000 * Math.pow(2, attempt - 1), 30000) + Math.floor(Math.random() * 1000);
        console.log(`  ⏳ ${slug} ${res.status} — retry ${attempt}/${MAX_ATTEMPTS} in ${wait}ms`);
        await new Promise(r => setTimeout(r, wait));
        return generate(name, slug, category, attempt + 1);
      }
      const body = await res.text();
      console.error(`  ✗ OpenRouter ${res.status} for ${slug} (gave up after ${attempt} tries): ${body.slice(0, 200)}`);
      return null;
    }

    if (!res.ok) {
      const body = await res.text();
      console.error(`  ✗ OpenRouter ${res.status} for ${slug}: ${body.slice(0, 240)}`);
      return null;
    }

    const data = await res.json() as { choices: { message: { content: string } }[] };
    const raw  = data.choices?.[0]?.message?.content?.trim() ?? '';
    const json = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const bundle = JSON.parse(json) as RichBundle;

    if (!bundle.summary || !bundle.extras?.plainSummary || !Array.isArray(bundle.findings)) {
      console.warn(`  ⚠ malformed bundle for ${slug}`);
      return null;
    }
    return bundle;
  } catch (err) {
    // Network errors — retry too
    if (attempt < MAX_ATTEMPTS) {
      const wait = Math.min(2000 * Math.pow(2, attempt - 1), 30000);
      console.log(`  ⏳ ${slug} ${(err as Error).message} — retry ${attempt}/${MAX_ATTEMPTS} in ${wait}ms`);
      await new Promise(r => setTimeout(r, wait));
      return generate(name, slug, category, attempt + 1);
    }
    console.error(`  ✗ ${slug}: ${(err as Error).message}`);
    return null;
  }
}

// ─── companion-stack name resolution ─────────────────────────────────────────

type SupRow = { id: string; slug: string; name: string; aliases: string };
type ResolvedSup = { id: string; slug: string; name: string };

function buildNameIndex(rows: SupRow[]): Map<string, ResolvedSup> {
  const map = new Map<string, ResolvedSup>();
  const add = (key: string, sup: ResolvedSup) => {
    const k = key.toLowerCase().trim();
    if (k && !map.has(k)) map.set(k, sup);
  };
  for (const r of rows) {
    const sup = { id: r.id, slug: r.slug, name: r.name };
    add(r.name, sup);
    add(r.slug, sup);
    try {
      const aliases = JSON.parse(r.aliases || '[]') as string[];
      for (const a of aliases) add(a, sup);
    } catch { /* ignore */ }
  }
  return map;
}

function resolveCompanion(name: string, idx: Map<string, ResolvedSup>): ResolvedSup | null {
  const lower = name.toLowerCase().trim();
  if (idx.has(lower)) return idx.get(lower)!;
  // Try removing form qualifiers (e.g. "magnesium glycinate" → "magnesium")
  const cleaned = lower
    .replace(/\b(monohydrate|glycinate|citrate|bisglycinate|threonate|sulfate|hcl|methylcobalamin|d3|k2|extract|powder|capsule)\b/g, '')
    .replace(/\s+/g, ' ').trim();
  if (cleaned !== lower && idx.has(cleaned)) return idx.get(cleaned)!;
  // Try first 2 words
  const words = lower.split(/\s+/);
  if (words.length >= 2 && idx.has(`${words[0]} ${words[1]}`)) return idx.get(`${words[0]} ${words[1]}`)!;
  // Try just the first word if it's distinctive (4+ chars)
  if (words[0]?.length >= 5 && idx.has(words[0])) return idx.get(words[0])!;
  return null;
}

// ─── DB inserts ──────────────────────────────────────────────────────────────

async function ensureSchema() {
  await sql`ALTER TABLE supplement_science ADD COLUMN IF NOT EXISTS extras text NOT NULL DEFAULT '{}'`;
}

async function upsertScience(suppId: string, slug: string, b: RichBundle, dataSource: 'manual' | 'llm_generated') {
  const sciId = 'llm-' + slug.slice(0, 26);
  // Check if any science row exists for this supplement
  const existing = await sql<{ id: string; data_source: string }[]>`
    SELECT id, data_source FROM supplement_science WHERE supplement_id = ${suppId} LIMIT 1
  `;

  if (existing.length === 0) {
    await sql`
      INSERT INTO supplement_science
        (id, supplement_id, summary, source_count, findings, interactions, side_effects, medicine_interactions, data_source, extras)
      VALUES (
        ${sciId}, ${suppId}, ${b.summary}, ${b.findings.length},
        ${JSON.stringify(b.findings)},
        ${JSON.stringify(b.interactions)},
        ${JSON.stringify(b.sideEffects)},
        ${JSON.stringify(b.medicineInteractions)},
        ${dataSource},
        ${JSON.stringify(b.extras)}
      )
    `;
    return 'inserted';
  }

  const row = existing[0];
  // Always update extras (additive — even manual entries get plain-English + structured fields).
  // Only refresh other fields when the existing entry is llm_generated (don't clobber manual curation).
  if (row.data_source === 'llm_generated' || FORCE) {
    await sql`
      UPDATE supplement_science SET
        summary = ${b.summary},
        source_count = ${b.findings.length},
        findings = ${JSON.stringify(b.findings)},
        interactions = ${JSON.stringify(b.interactions)},
        side_effects = ${JSON.stringify(b.sideEffects)},
        medicine_interactions = ${JSON.stringify(b.medicineInteractions)},
        extras = ${JSON.stringify(b.extras)}
      WHERE id = ${row.id}
    `;
    return 'replaced';
  } else {
    // Manual entry — only fill in extras (don't overwrite curated content)
    await sql`UPDATE supplement_science SET extras = ${JSON.stringify(b.extras)} WHERE id = ${row.id}`;
    return 'extras-only';
  }
}

async function upsertDosage(suppId: string, slug: string, d: DosageGen) {
  const existing = await sql`SELECT id FROM supplement_dosage WHERE supplement_id = ${suppId} LIMIT 1`;
  if (existing.length > 0) return false;
  const dosId = 'dos-' + slug.replace(/-/g, '').slice(0, 24);
  await sql`
    INSERT INTO supplement_dosage (id, supplement_id, loading, maintenance, formula, unit)
    VALUES (${dosId}, ${suppId}, ${d.loading ?? null}, ${d.maintenance}, ${d.formula}, ${d.unit})
    ON CONFLICT (id) DO NOTHING
  `;
  return true;
}

async function upsertSchedule(suppId: string, slug: string, s: ScheduleGen) {
  const existing = await sql`SELECT id FROM schedule_rules WHERE supplement_id = ${suppId} LIMIT 1`;
  if (existing.length > 0) return false;
  const schId = 'sch-' + slug.replace(/-/g, '').slice(0, 24);
  await sql`
    INSERT INTO schedule_rules
      (id, supplement_id, preferred_time, with_food, food_type, empty_stomach, fat_soluble, stimulant, sedating)
    VALUES (
      ${schId}, ${suppId}, ${s.preferredTime},
      ${s.withFood ? 1 : 0}, ${s.foodType ?? null},
      ${s.emptyStomach ? 1 : 0}, ${s.fatSoluble ? 1 : 0},
      ${s.stimulant ? 1 : 0}, ${s.sedating ? 1 : 0}
    )
    ON CONFLICT (id) DO NOTHING
  `;
  return true;
}

async function upsertCompanionStacks(suppId: string, slug: string, stacks: CompanionStack[], idx: Map<string, ResolvedSup>) {
  // First, resolve all companions BEFORE touching the DB. If we can't resolve
  // at least 2 valid companions, keep the existing stacks (don't wipe good data
  // when the new generation produced unresolvable names).
  const resolved: { stack: CompanionStack; sup: ResolvedSup; index: number }[] = [];
  for (let i = 0; i < stacks.length; i++) {
    const r = resolveCompanion(stacks[i].name, idx);
    if (r && r.id !== suppId) resolved.push({ stack: stacks[i], sup: r, index: i });
  }
  if (resolved.length < 2) return -1; // signal "kept existing"

  await sql`DELETE FROM companion_stacks WHERE supplement_id = ${suppId}`;
  for (const { stack, sup, index } of resolved) {
    const why = stack.dosingNote ? `${stack.why} (${stack.dosingNote})` : stack.why;
    const stkId = `stk-${slug.slice(0, 18)}-${sup.slug.slice(0, 18)}`.slice(0, 60);
    await sql`
      INSERT INTO companion_stacks (id, supplement_id, companion_supplement_id, why, strength, sort_order)
      VALUES (${stkId}, ${suppId}, ${sup.id}, ${why}, ${stack.strength}, ${index})
      ON CONFLICT (id) DO NOTHING
    `;
  }
  return resolved.length;
}

async function upsertMedicineInteractions(suppId: string, slug: string, interactions: MedInt[]) {
  if (interactions.length === 0) return -1; // keep existing
  await sql`DELETE FROM medicine_interactions WHERE supplement_id = ${suppId}`;
  for (let i = 0; i < interactions.length; i++) {
    const m = interactions[i];
    const miId = `mi-${slug.slice(0, 18)}-${i}`.slice(0, 60);
    await sql`
      INSERT INTO medicine_interactions
        (id, supplement_id, medicine_name, medicine_class, severity, mechanism, recommendation, source)
      VALUES (${miId}, ${suppId}, ${m.medicineName}, ${m.medicineClass ?? null}, ${m.severity}, ${m.mechanism}, ${m.recommendation}, ${'llm_generated'})
      ON CONFLICT (id) DO NOTHING
    `;
  }
  return interactions.length;
}

// ─── main ────────────────────────────────────────────────────────────────────

async function processOne(row: SupRow & { category: string }, idx: Map<string, ResolvedSup>) {
  const bundle = await generate(row.name, row.slug, row.category);
  if (!bundle) return { ok: false };

  if (DRY_RUN) {
    console.log(`  [DRY] ${row.slug}: plain="${bundle.extras.plainSummary.slice(0, 60)}…" stacks=${bundle.companionStacks.length} findings=${bundle.findings.length}`);
    return { ok: true };
  }

  const result = await upsertScience(row.id, row.slug, bundle, 'llm_generated');
  const newDose = await upsertDosage(row.id, row.slug, bundle.dosage);
  const newSched = await upsertSchedule(row.id, row.slug, bundle.schedule);
  const stackCount = await upsertCompanionStacks(row.id, row.slug, bundle.companionStacks, idx);
  const medCount = await upsertMedicineInteractions(row.id, row.slug, bundle.medicineInteractions);

  console.log(`  ✓ ${row.slug.padEnd(40)} sci=${result} dose=${newDose ? 'new' : '-'} sched=${newSched ? 'new' : '-'} stacks=${stackCount} meds=${medCount}`);
  return { ok: true };
}

async function run() {
  console.log(`\n🔬 Stack Lab — RICH science enrichment`);
  console.log(`   model=${MODEL}  dry=${DRY_RUN}  force=${FORCE}  limit=${LIMIT}  batch=${BATCH}\n`);

  await ensureSchema();

  // Build the supplement name index (for resolving companion stacks)
  const allRows = await sql<SupRow[]>`SELECT id, slug, name, aliases FROM supplements WHERE status='published'`;
  const idx = buildNameIndex(allRows);
  console.log(`📚 indexed ${allRows.length} supplements for stack resolution.\n`);

  // Decide which to process
  let rows: (SupRow & { category: string })[];
  if (ONLY) {
    rows = await sql<(SupRow & { category: string })[]>`
      SELECT id, slug, name, aliases, category FROM supplements
      WHERE status='published' AND (slug ILIKE ${ONLY} OR name ILIKE ${'%' + ONLY + '%'})
      LIMIT ${LIMIT}
    `;
  } else if (SPARSE) {
    // Re-enrich supplements that came out sparse: < 3 stacks or < 2 med interactions or empty extras
    rows = await sql<(SupRow & { category: string })[]>`
      SELECT s.id, s.slug, s.name, s.aliases, s.category FROM supplements s
      WHERE s.status='published' AND (
        (SELECT count(*) FROM companion_stacks cs WHERE cs.supplement_id = s.id) < 3
        OR (SELECT count(*) FROM medicine_interactions mi WHERE mi.supplement_id = s.id) < 2
        OR EXISTS (
          SELECT 1 FROM supplement_science ss
          WHERE ss.supplement_id = s.id AND coalesce(ss.extras, '{}') = '{}'
        )
      )
      ORDER BY s.popularity_score DESC NULLS LAST
      LIMIT ${LIMIT}
    `;
  } else if (FORCE) {
    rows = await sql<(SupRow & { category: string })[]>`
      SELECT s.id, s.slug, s.name, s.aliases, s.category FROM supplements s
      JOIN supplement_science ss ON ss.supplement_id = s.id
      WHERE s.status='published' AND ss.data_source = 'llm_generated'
      ORDER BY s.popularity_score DESC NULLS LAST
      LIMIT ${LIMIT}
    `;
  } else {
    // Default: anyone missing extras (the new rich field) OR no science at all
    rows = await sql<(SupRow & { category: string })[]>`
      SELECT s.id, s.slug, s.name, s.aliases, s.category FROM supplements s
      LEFT JOIN supplement_science ss ON ss.supplement_id = s.id
      WHERE s.status='published'
        AND (ss.id IS NULL OR coalesce(ss.extras, '{}') = '{}' OR ss.extras = '')
      ORDER BY s.popularity_score DESC NULLS LAST
      LIMIT ${LIMIT}
    `;
  }

  console.log(`📋 ${rows.length} supplements to enrich.\n`);
  if (rows.length === 0) { await sql.end(); return; }

  let ok = 0, fail = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const wave = rows.slice(i, i + BATCH);
    const wn = Math.floor(i / BATCH) + 1;
    const tot = Math.ceil(rows.length / BATCH);
    console.log(`Wave ${wn}/${tot}:`);
    const results = await Promise.allSettled(wave.map(r => processOne(r, idx)));
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.ok) ok++;
      else fail++;
    }
    if (i + BATCH < rows.length) await new Promise(r => setTimeout(r, DELAY));
  }

  console.log(`\n✅ done.  ok=${ok}  fail=${fail}`);
  await sql.end();
}

run().catch(async (err) => { console.error('❌ Fatal:', err); await sql.end(); process.exit(1); });
