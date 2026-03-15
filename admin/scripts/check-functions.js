import { Client } from 'pg';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env') });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  // Check search_knowledge function signature
  console.log('=== search_knowledge function ===');
  const sk = await client.query(`
    SELECT p.proname, pg_catalog.pg_get_function_arguments(p.oid) as args
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'search_knowledge'
  `);
  sk.rows.forEach(r => console.log(r.proname, ':', r.args));

  // Check select_relevant_domains function signature
  console.log('\n=== select_relevant_domains function ===');
  const srd = await client.query(`
    SELECT p.proname, pg_catalog.pg_get_function_arguments(p.oid) as args
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'select_relevant_domains'
  `);
  srd.rows.forEach(r => console.log(r.proname, ':', r.args));

  // Check build_graph_from_knowledge function signature
  console.log('\n=== build_graph_from_knowledge function ===');
  const bg = await client.query(`
    SELECT p.proname, pg_catalog.pg_get_function_arguments(p.oid) as args
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'build_graph_from_knowledge'
  `);
  bg.rows.forEach(r => console.log(r.proname, ':', r.args));

  await client.end();
}

main().catch(e => { console.error(e); client.end(); });
