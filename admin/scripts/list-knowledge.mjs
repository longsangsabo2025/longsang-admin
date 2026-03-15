import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:5432/postgres' });

const result = await pool.query("SELECT title FROM brain_knowledge WHERE title ILIKE '%sabo%' OR content ILIKE '%sabo%'");
console.log('Knowledge matching SABO:', result.rows.length);
result.rows.forEach(r => console.log(' -', r.title));

const allTitles = await pool.query('SELECT title FROM brain_knowledge ORDER BY title');
console.log('\nAll knowledge titles (' + allTitles.rows.length + '):');
allTitles.rows.forEach(r => console.log(' -', r.title));

await pool.end();
