import postgres from 'postgres';

const url = process.env.SOURCE_DATABASE_URL!;
const sql = postgres(url, { max: 1, prepare: false, ssl: 'require' });

async function main() {
  const schemas = await sql`
    select n.nspname, count(t.oid) as tables
    from pg_namespace n
    left join pg_class t on t.relnamespace = n.oid and t.relkind = 'r' and t.relispartition = false
    where n.nspname not like 'pg_%' and n.nspname <> 'information_schema'
    group by n.nspname order by 2 desc
  `;
  console.log('SCHEMAS', JSON.stringify(schemas));

  const dataTables = await sql`
    select schemaname, tablename from pg_tables
    where schemaname not in ('pg_catalog','information_schema')
    order by schemaname, tablename limit 200
  `;
  console.log('TABLES', JSON.stringify(dataTables));

  const databases = await sql`select datname from pg_database where datistemplate = false`;
  console.log('DATABASES', JSON.stringify(databases));
}

main().catch((e) => { console.error(e.message ?? e); process.exitCode = 1; })
  .finally(async () => { await sql.end(); });