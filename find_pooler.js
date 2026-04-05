const fs = require('fs');
const { execSync } = require('child_process');

const content = fs.readFileSync('.env.local', 'utf8');
const match = content.match(/postgresql:\/\/postgres:(.*?)@db\.(.*?)\.supabase\.co/);
if (!match) process.exit(1);

const [_, password, ref] = match;
const user = `postgres.${ref}`;

const regions = [
  "aws-0-us-east-1", "aws-0-us-west-1", "aws-0-us-east-2", "aws-0-us-west-2",
  "aws-0-eu-central-1", "aws-0-eu-west-1", "aws-0-eu-west-2", "aws-0-ap-northeast-1", 
  "aws-0-ap-northeast-2", "aws-0-ap-southeast-1", "aws-0-ap-southeast-2", "aws-0-ap-south-1",
  "aws-0-sa-east-1", "aws-0-ca-central-1"
];

for (const r of regions) {
  const host = `${r}.pooler.supabase.com`;
  console.log(`Trying ${host}...`);
  try {
    execSync(`PGSSLMODE="require" PGPASSWORD="${password}" psql -h ${host} -p 6543 -U ${user} -d postgres -c "SELECT 1;"`, { stdio: 'ignore', timeout: 5000 });
    console.log(`\nSUCCESS_REGION: ${r}`);
    fs.writeFileSync('pooler_url.txt', `postgresql://${user}:${password}@${host}:6543/postgres`);
    process.exit(0);
  } catch (e) {
    // console.log(`Failed ${host}`);
  }
}
console.log('Not found');
