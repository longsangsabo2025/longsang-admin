import { Client } from 'pg';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env') });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();
  console.log('🔧 Fixing build_graph_from_knowledge function...');

  const sql = `
CREATE OR REPLACE FUNCTION public.build_graph_from_knowledge(
  p_domain_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nodes_created INTEGER := 0;
  v_edges_created INTEGER := 0;
  v_knowledge RECORD;
BEGIN
  FOR v_knowledge IN
    SELECT id, title, content, tags, embedding
    FROM public.brain_knowledge
    WHERE domain_id = p_domain_id
      AND user_id = p_user_id
  LOOP
    INSERT INTO public.brain_knowledge_graph_nodes (
      node_type,
      node_id,
      node_label,
      node_description,
      embedding,
      domain_id,
      user_id,
      properties
    )
    VALUES (
      'knowledge',
      v_knowledge.id,
      v_knowledge.title,
      LEFT(v_knowledge.content, 500),
      v_knowledge.embedding,
      p_domain_id,
      p_user_id,
      jsonb_build_object('tags', v_knowledge.tags)
    )
    ON CONFLICT DO NOTHING;

    v_nodes_created := v_nodes_created + 1;
  END LOOP;

  -- Create edges for nodes with overlapping tags using array overlap
  INSERT INTO public.brain_knowledge_graph_edges (
    source_node_id,
    target_node_id,
    edge_type,
    edge_weight,
    is_cross_domain,
    user_id
  )
  SELECT DISTINCT
    n1.id,
    n2.id,
    'similar_to',
    0.7,
    false,
    p_user_id
  FROM public.brain_knowledge_graph_nodes n1
  JOIN public.brain_knowledge_graph_nodes n2 ON n1.id < n2.id
  WHERE n1.domain_id = p_domain_id
    AND n2.domain_id = p_domain_id
    AND n1.user_id = p_user_id
    AND n2.user_id = p_user_id
    AND n1.properties ? 'tags'
    AND n2.properties ? 'tags'
    AND (
      SELECT array_agg(t) && (SELECT array_agg(t2) FROM jsonb_array_elements_text(n2.properties->'tags') t2)
      FROM jsonb_array_elements_text(n1.properties->'tags') t
    )
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_edges_created = ROW_COUNT;

  RETURN jsonb_build_object(
    'nodes_created', v_nodes_created,
    'edges_created', v_edges_created,
    'domain_id', p_domain_id
  );
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
