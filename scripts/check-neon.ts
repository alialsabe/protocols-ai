import postgres from 'postgres';

const url = process.env.TARGET_DATABASE_URL!;
const s = postgres(url, { max: 1, prepare: false, ssl: 'require' });

async function main() {
  const counts = await s`
    select
      (select count(*) from pg_tables where schemaname='public')::int as tables,
      (select count(*) from supplements)::int as supplements,
      (select count(*) from clinical_studies)::int as clinical_studies,
      (select count(*) from saved_stacks)::int as saved_stacks,
      (select count(*) from user_profiles)::int as user_profiles,
      (select count(*) from supplement_science)::int as supplement_science,
      (select count(*) from medicine_interactions)::int as medicine_interactions
  `;
  console.log('NEON COUNTS', JSON.stringify(counts[0]));

  const sample = await s`select slug, name from supplements order by popularity_score desc limit 5`;
  console.log('TOP SUPPLEMENTS', JSON.stringify(sample));
}

main().catch((e) => { console.error('ERR', e.message); process.exit(1); })
  .finally(async () => { await s.end(); });
