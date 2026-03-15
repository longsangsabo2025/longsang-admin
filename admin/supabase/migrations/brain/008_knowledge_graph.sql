-- ================================================
-- AI SECOND BRAIN - Knowledge Graph System
-- ================================================
-- This migration creates a knowledge graph to track relationships
-- between concepts across domains

-- ================================================
-- Knowledge Graph Nodes Table
-- ================================================
CREATE TABLE public.brain_knowledge_graph_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Node identification
  node_type TEXT NOT NULL, -- 'concept', 'knowledge', 'domain', 'principle', 'model'
  node_id UUID, -- Reference to original entity (knowledge_id, domain_id, etc.)
  node_label TEXT NOT NULL, -- Human-readable label
  node_description TEXT,

  -- Node properties
  properties JSONB DEFAULT '{}'::jsonb,
  embedding vector(1536), -- For similarity search

  -- Domain context
  domain_id UUID REFERENCES public.brain_domains(id) ON DELETE CASCADE,

  -- Metadata
  importance_score FLOAT DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Constraints
  CHECK (node_type IN ('concept', 'knowledge', 'domain', 'principle', 'model', 'rule', 'pattern'))
);

-- ================================================
-- Knowledge Graph Edges Table
-- ================================================
CREATE TABLE public.brain_knowledge_graph_edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Edge endpoints
  source_node_id UUID NOT NULL REFERENCES public.brain_knowledge_graph_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.brain_knowledge_graph_nodes(id) ON DELETE CASCADE,

  -- Edge properties
  edge_type TEXT NOT NULL, -- 'related_to', 'similar_to', 'depends_on', 'contradicts', 'supports'
  edge_label TEXT,
  edge_weight FLOAT DEFAULT 1.0 CHECK (edge_weight >= 0 AND edge_weight <= 1),

  -- Edge metadata
  properties JSONB DEFAULT '{}'::jsonb,
  confidence_score FLOAT DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- Cross-domain support
  is_cross_domain BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Constraints
  CHECK (source_node_id != target_node_id),
  CHECK (edge_type IN ('related_to', 'similar_to', 'depends_on', 'contradicts', 'supports', 'part_of', 'instance_of'))
);

-- ================================================
-- INDEXES
-- ================================================
-- Nodes indexes
CREATE INDEX idx_brain_graph_nodes_type ON public.brain_knowledge_graph_nodes(node_type);
CREATE INDEX idx_brain_graph_nodes_domain_id ON public.brain_knowledge_graph_nodes(domain_id);
CREATE INDEX idx_brain_graph_nodes_user_id ON public.brain_knowledge_graph_nodes(user_id);
CREATE INDEX idx_brain_graph_nodes_label ON public.brain_knowledge_graph_nodes USING GIN(to_tsvector('english', node_label));
CREATE INDEX idx_brain_graph_nodes_embedding ON public.brain_knowledge_graph_nodes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Edges indexes
CREATE INDEX idx_brain_graph_edges_source ON public.brain_knowledge_graph_edges(source_node_id);
CREATE INDEX idx_brain_graph_edges_target ON public.brain_knowledge_graph_edges(target_node_id);
CREATE INDEX idx_brain_graph_edges_type ON public.brain_knowledge_graph_edges(edge_type);
CREATE INDEX idx_brain_graph_edges_cross_domain ON public.brain_knowledge_graph_edges(is_cross_domain) WHERE is_cross_domain = true;

-- Composite indexes for common queries
CREATE INDEX idx_brain_graph_edges_source_type ON public.brain_knowledge_graph_edges(source_node_id, edge_type);
CREATE INDEX idx_brain_graph_nodes_domain_type ON public.brain_knowledge_graph_nodes(domain_id, node_type);

-- ================================================
-- FUNCTION: Find Paths Between Nodes
-- ================================================
CREATE OR REPLACE FUNCTION public.find_graph_paths(
  p_source_node_id UUID,
  p_target_node_id UUID,
  p_user_id UUID,
  p_max_depth INTEGER DEFAULT 5
)
RETURNS TABLE (
  path_id INTEGER,
  path_length INTEGER,
  path_nodes UUID[],
  path_edges UUID[],
  total_weight FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_paths UUID[][];
  v_current_path UUID[];
  v_depth INTEGER := 0;
BEGIN
  -- Simple BFS path finding (can be enhanced with recursive CTE)
  -- For now, return direct connections
  RETURN QUERY
  WITH RECURSIVE paths AS (
    SELECT
      ARRAY[source_node_id, target_node_id] as path_nodes,
      ARRAY[id] as path_edges,
      1 as depth,
      edge_weight as total_weight
    FROM public.brain_knowledge_graph_edges
    WHERE source_node_id = p_source_node_id
      AND user_id = p_user_id

    UNION ALL

    SELECT
      p.path_nodes || e.target_node_id,
      p.path_edges || e.id,
      p.depth + 1,
      p.total_weight * e.edge_weight
    FROM paths p
    JOIN public.brain_knowledge_graph_edges e ON e.source_node_id = p.path_nodes[array_length(p.path_nodes, 1)]
    WHERE p.depth < p_max_depth
      AND NOT (e.target_node_id = ANY(p.path_nodes)) -- Avoid cycles
      AND e.user_id = p_user_id
  )
  SELECT
    ROW_NUMBER() OVER ()::INTEGER as path_id,
    depth as path_length,
    path_nodes,
    path_edges,
    total_weight
  FROM paths
  WHERE path_nodes[array_length(path_nodes, 1)] = p_target_node_id
  ORDER BY depth, total_weight DESC
  LIMIT 10;
END;
$$;

-- ================================================
-- FUNCTION: Get Related Concepts
-- ================================================
CREATE OR REPLACE FUNCTION public.get_related_concepts(
  p_node_id UUID,
  p_user_id UUID,
  p_max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  node_id UUID,
  node_label TEXT,
  node_type TEXT,
  edge_type TEXT,
  edge_weight FLOAT,
  similarity_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.node_label,
    n.node_type,
    e.edge_type,
    e.edge_weight,
    e.edge_weight * n.importance_score as similarity_score
  FROM public.brain_knowledge_graph_edges e
  JOIN public.brain_knowledge_graph_nodes n ON (
    CASE
      WHEN e.source_node_id = p_node_id THEN n.id = e.target_node_id
      WHEN e.target_node_id = p_node_id THEN n.id = e.source_node_id
    END
  )
  WHERE (e.source_node_id = p_node_id OR e.target_node_id = p_node_id)
    AND e.user_id = p_user_id
    AND n.user_id = p_user_id
  ORDER BY similarity_score DESC, e.edge_weight DESC
  LIMIT p_max_results;
END;
$$;

-- ================================================
-- FUNCTION: Traverse Graph
-- ================================================
CREATE OR REPLACE FUNCTION public.traverse_graph(
  p_start_node_id UUID,
  p_user_id UUID,
  p_max_depth INTEGER DEFAULT 3
)
RETURNS TABLE (
  node_id UUID,
  node_label TEXT,
  node_type TEXT,
  depth INTEGER,
  path_from_start UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE traversal AS (
    SELECT
      n.id,
      n.node_label,
      n.node_type,
      0 as depth,
      ARRAY[n.id] as path_from_start
    FROM public.brain_knowledge_graph_nodes n
    WHERE n.id = p_start_node_id
      AND n.user_id = p_user_id

    UNION ALL

    SELECT
      n.id,
      n.node_label,
      n.node_type,
      t.depth + 1,
      t.path_from_start || n.id
    FROM traversal t
    JOIN public.brain_knowledge_graph_edges e ON (
      e.source_node_id = t.node_id OR e.target_node_id = t.node_id
    )
    JOIN public.brain_knowledge_graph_nodes n ON (
      (e.source_node_id = t.node_id AND n.id = e.target_node_id) OR
      (e.target_node_id = t.node_id AND n.id = e.source_node_id)
    )
    WHERE t.depth < p_max_depth
      AND NOT (n.id = ANY(t.path_from_start)) -- Avoid cycles
      AND e.user_id = p_user_id
      AND n.user_id = p_user_id
  )
  SELECT * FROM traversal
  ORDER BY depth, node_label;
END;
$$;

-- ================================================
-- FUNCTION: Build Graph from Knowledge
-- ================================================
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
  -- Create nodes from knowledge items
  FOR v_knowledge IN
    SELECT id, title, content, tags, embedding
    FROM public.brain_knowledge
    WHERE domain_id = p_domain_id
      AND user_id = p_user_id
  LOOP
    -- Insert node for knowledge item
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

  -- Create edges based on similarity (can be enhanced with AI)
  -- For now, create edges for knowledge items with similar tags
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
    0.7, -- Default similarity
    false,
    p_user_id
  FROM public.brain_knowledge_graph_nodes n1
  JOIN public.brain_knowledge_graph_nodes n2 ON n1.id < n2.id
  WHERE n1.domain_id = p_domain_id
    AND n2.domain_id = p_domain_id
    AND n1.user_id = p_user_id
    AND n2.user_id = p_user_id
    AND n1.properties->'tags' && n2.properties->'tags' -- Overlapping tags
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_edges_created = ROW_COUNT;

  RETURN jsonb_build_object(
    'nodes_created', v_nodes_created,
    'edges_created', v_edges_created,
    'domain_id', p_domain_id
  );
END;
$$;

-- ================================================
-- TRIGGERS
-- ================================================
CREATE OR REPLACE FUNCTION public.update_graph_node_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_graph_node_updated_at
  BEFORE UPDATE ON public.brain_knowledge_graph_nodes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_graph_node_updated_at();

CREATE TRIGGER update_graph_edge_updated_at
  BEFORE UPDATE ON public.brain_knowledge_graph_edges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_graph_node_updated_at();

-- ================================================
-- RLS POLICIES
-- ================================================
ALTER TABLE public.brain_knowledge_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_knowledge_graph_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own graph nodes"
  ON public.brain_knowledge_graph_nodes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own graph nodes"
  ON public.brain_knowledge_graph_nodes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own graph nodes"
  ON public.brain_knowledge_graph_nodes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own graph nodes"
  ON public.brain_knowledge_graph_nodes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own graph edges"
  ON public.brain_knowledge_graph_edges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own graph edges"
  ON public.brain_knowledge_graph_edges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own graph edges"
  ON public.brain_knowledge_graph_edges FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own graph edges"
  ON public.brain_knowledge_graph_edges FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================
-- GRANT PERMISSIONS
-- ================================================
GRANT EXECUTE ON FUNCTION public.find_graph_paths TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_graph_paths TO anon;
GRANT EXECUTE ON FUNCTION public.get_related_concepts TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_related_concepts TO anon;
GRANT EXECUTE ON FUNCTION public.traverse_graph TO authenticated;
GRANT EXECUTE ON FUNCTION public.traverse_graph TO anon;
GRANT EXECUTE ON FUNCTION public.build_graph_from_knowledge TO authenticated;
GRANT EXECUTE ON FUNCTION public.build_graph_from_knowledge TO anon;

-- ================================================
-- COMMENT
-- ================================================
COMMENT ON TABLE public.brain_knowledge_graph_nodes IS
'Nodes in the knowledge graph representing concepts, knowledge items, domains, etc.';

COMMENT ON TABLE public.brain_knowledge_graph_edges IS
'Edges in the knowledge graph representing relationships between nodes';

COMMENT ON FUNCTION public.find_graph_paths IS
'Finds paths between two nodes in the knowledge graph using BFS';

COMMENT ON FUNCTION public.get_related_concepts IS
'Gets concepts related to a given node';

COMMENT ON FUNCTION public.traverse_graph IS
'Traverses the graph starting from a node up to a maximum depth';

COMMENT ON FUNCTION public.build_graph_from_knowledge IS
'Builds a knowledge graph from knowledge items in a domain';

