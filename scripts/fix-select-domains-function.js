import { Client } from 'pg';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env') });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();
  console.log('🔧 Fixing select_relevant_domains function...');

  const sql = `
CREATE OR REPLACE FUNCTION public.select_relevant_domains(
  p_query_text TEXT,
  p_query_embedding vector(1536),
  p_user_id UUID,
  p_max_domains INTEGER DEFAULT 3,
  p_min_score FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  domain_id UUID,
  domain_name TEXT,
  relevance_score FLOAT,
  rank INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH scored_domains AS (
    SELECT
      d.id as domain_id,
      d.name as domain_name,
      public.score_domain_relevance(p_query_text, p_query_embedding, d.id, p_user_id) as relevance_score
    FROM public.brain_domains d
    WHERE d.user_id = p_user_id
  )
  SELECT
    sd.domain_id,
    sd.domain_name,
    sd.relevance_score,
    ROW_NUMBER() OVER (ORDER BY sd.relevance_score DESC)::INTEGER as rank
  FROM scored_domains sd
  WHERE sd.relevance_score >= p_min_score
  ORDER BY sd.relevance_score DESC
  LIMIT p_max_domains;
END;
$$;
  `;

  try {
    await client.query(sql);
    console.log('✅ Function fixed successfully!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  await client.end();
}

main().catch(e => { console.error(e); client.end(); });
