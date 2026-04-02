import { getRawDb } from '../src/lib/db';
import { lookupSupplement, logFallbackMiss } from '../src/lib/supplement-lookup';
import { generateSchedule } from '../src/lib/scheduler-engine';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function testLookup(query: string) {
  const report = lookupSupplement(query, { weightKg: 80, age: 30, sex: 'male' });
  assert(!!report, `lookup failed for: ${query}`);
  assert(!!report?.science?.summary, `science summary missing for: ${query}`);
  assert((report?.science?.findings?.length || 0) > 0, `findings missing for: ${query}`);
  assert((report?.social?.anecdotes?.length || 0) > 0, `social anecdotes missing for: ${query}`);
  assert(!!report?.sentiment?.topPositive, `sentiment missing for: ${query}`);
  assert(!!report?.dosage?.maintenance, `dosage missing for: ${query}`);
  assert((report?.schedule?.length || 0) > 0, `schedule missing for: ${query}`);
  assert((report?.medicineInteractions?.length || 0) > 0, `medicine interactions missing for: ${query}`);
  assert(!!report?.commerce?.affiliateLink, `affiliate recommendation missing for: ${query}`);
  assert((report?.companionSuggestions?.length || 0) > 0, `companion suggestions missing for: ${query}`);
  assert((report?.topBrands?.length || 0) >= 2, `top brands missing for: ${query}`);
  return report;
}

function run() {
  const goldenSupps = [
    'Magnesium Glycinate',
    'Creatine Monohydrate',
    'Vitamin D3',
    'Omega-3 Fish Oil (EPA/DHA)',
    'Zinc Picolinate',
    'Ashwagandha KSM-66',
    'L-Theanine',
    'CoQ10 (Ubiquinol)',
    'Vitamin K2 (MK-7)',
    'Iron (Ferrous Bisglycinate)',
    'Vitamin C (Ascorbic Acid)',
    'Vitamin B12 (Methylcobalamin)',
    'NAC (N-Acetyl Cysteine)',
    'Berberine HCl',
    "Lion's Mane Mushroom",
    'Melatonin',
    'Rhodiola Rosea',
    'Collagen Peptides',
    'Boron',
    'Turkey Tail Mushroom',
  ];

  for (const s of goldenSupps) testLookup(s);

  const abbreviationChecks: [string, string][] = [
    ['b12', 'Vitamin B12 (Methylcobalamin)'],
    ['vit c', 'Vitamin C (Ascorbic Acid)'],
    ['nac', 'NAC (N-Acetyl Cysteine)'],
    ['rhodiola', 'Rhodiola Rosea'],
    ['melatonin', 'Melatonin'],
    ['collagen', 'Collagen Peptides'],
    ['berberine', 'Berberine HCl'],
    ['mag', 'Magnesium Glycinate'],
    ['fish oil', 'Omega-3 Fish Oil (EPA/DHA)'],
    ['lions mane mushroom', "Lion's Mane Mushroom"],
    ['turkey tail mushroom', 'Turkey Tail Mushroom'],
    ['boron supplement', 'Boron'],
  ];

  for (const [alias, expectedName] of abbreviationChecks) {
    const report = lookupSupplement(alias, { weightKg: 80 });
    assert(!!report, `abbreviation/token lookup failed for: ${alias}`);
    assert(report?.name === expectedName, `alias "${alias}" returned "${report?.name}" instead of "${expectedName}"`);
  }

  const schedule = generateSchedule({
    supplements: ['Iron', 'Zinc Picolinate', 'Vitamin D3', 'Omega-3 Fish Oil (EPA/DHA)', 'Melatonin', 'Berberine HCl', 'Turkey Tail Mushroom'],
    medications: ['levothyroxine', 'warfarin', 'metformin', 'immunosuppressants'],
    routine: {
      wakeTime: '07:00',
      sleepTime: '23:00',
      meals: {
        breakfast: '08:00',
        lunch: '09:00',
        dinner: '18:30',
      },
    },
  });

  assert(schedule.blocks.length > 0, 'scheduler returned no blocks');
  assert(schedule.warnings.length > 0, 'scheduler returned no warnings');
  assert(
    schedule.warnings.some((w) => w.type === 'spacing' || (w.message || '').toLowerCase().includes('spacing')),
    'scheduler spacing warning missing'
  );
  assert(schedule.warnings.some((w) => w.type === 'medication'), 'scheduler medication warning missing');

  const raw = getRawDb();
  const before = raw.prepare('SELECT COUNT(*) as count FROM fallback_queue').get() as { count: number };
  const fallbackId = logFallbackMiss('methylene blue nootropic');
  assert(!!fallbackId, 'fallback miss logging did not return an id');
  const after = raw.prepare('SELECT COUNT(*) as count FROM fallback_queue').get() as { count: number };
  assert(after.count >= before.count, 'fallback queue count moved backwards');
  const fallbackRow = raw.prepare('SELECT status, hit_count FROM fallback_queue WHERE id = ?').get(fallbackId) as { status: string; hit_count: number } | undefined;
  assert(!!fallbackRow, 'fallback row not created');
  assert(fallbackRow?.status === 'pending', 'fallback row must default to pending review');
  assert((fallbackRow?.hit_count || 0) >= 1, 'fallback row hit count missing');

  console.log('✅ Golden set checks passed');
  console.log(`Supplements checked: ${goldenSupps.length}`);
  console.log(`Abbreviation/token checks: ${abbreviationChecks.length}`);
  console.log(`Scheduler blocks: ${schedule.blocks.length}`);
  console.log(`Scheduler warnings: ${schedule.warnings.length}`);
  console.log(`Fallback review queue entry: ${fallbackId}`);
}

run();
