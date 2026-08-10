import postgres from 'postgres';

const s = postgres(process.env.TARGET_DATABASE_URL!, { max: 1, prepare: false, ssl: 'require' });

async function main() {
  const rows = await s`
    SELECT s.id, s.slug, s.name,
      (SELECT count(*) FROM supplement_science x WHERE x.supplement_id=s.id) as science,
      (SELECT count(*) FROM supplement_dosage x WHERE x.supplement_id=s.id) as dosage,
      (SELECT count(*) FROM schedule_rules x WHERE x.supplement_id=s.id) as schedule,
      (SELECT count(*) FROM supplement_social x WHERE x.supplement_id=s.id) as social,
      (SELECT count(*) FROM supplement_sentiment x WHERE x.supplement_id=s.id) as sentiment,
      (SELECT count(*) FROM supplement_production x WHERE x.supplement_id=s.id) as production,
      (SELECT count(*) FROM affiliate_options x WHERE x.supplement_id=s.id) as affiliate,
      (SELECT count(*) FROM medicine_interactions x WHERE x.supplement_id=s.id) as medint,
      (SELECT count(*) FROM clinical_studies x WHERE x.supplement_id=s.id) as studies,
      (SELECT count(*) FROM supplement_tags x WHERE x.supplement_id=s.id) as tags,
      (SELECT count(*) FROM supplement_types x WHERE x.supplement_id=s.id) as types,
      (SELECT count(*) FROM companion_stacks x WHERE x.supplement_id=s.id) as stacks,
      (SELECT count(*) FROM conflicts x WHERE x.supplement_a_id=s.id OR x.supplement_b_id=s.id) as conflicts
    FROM supplements s
    ORDER BY s.popularity_score DESC NULLS LAST
  `;
  const tot = rows.length;
  const cnt = (f) => rows.filter(r => r[f] > 0).length;
  console.log(`TOTAL supplements: ${tot}`);
  console.log(`table              | supplements covered `);
  for (const f of ['science','dosage','schedule','social','sentiment','production','affiliate','medint','studies','tags','types','stacks','conflicts']) {
    console.log(`${f.padEnd(18)} | ${String(cnt(f)).padStart(3)} / ${tot}`);
  }
  console.log('\nCompletely bare supplements (no science AND no social AND no production AND no affiliate):');
  const bare = rows.filter(r => r.science===0 || r.social===0 || r.production===0 || r.affiliate===0);
  console.log('table sets each missing entries for:');
  for (const f of ['science','social','production','affiliate','studies','conflicts']) {
    const missing = rows.filter(r => r[f]===0).map(r=>r.slug);
    console.log(`  missing ${f}: ${missing.length} -> ${missing.slice(0,8).join(', ')}${missing.length>8?'...':''}`);
  }
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); }).finally(() => s.end());
