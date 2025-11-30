"""
AI Brain Integration for MCP Server
Connects to Supabase AI Second Brain for knowledge queries
"""

import os
import sys
import json
import logging
from typing import Optional, List, Dict, Any
from pathlib import Path
from datetime import datetime

# Fix Windows Unicode issue
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except:
        pass

# Supabase client
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False

logger = logging.getLogger(__name__)

# ════════════════════════════════════════════════════════════
# BRAIN CLIENT
# ════════════════════════════════════════════════════════════

class BrainClient:
    """Client for AI Second Brain operations."""
    
    def __init__(self):
        self.client: Optional[Client] = None
        self.user_id = "6490f4e9-ed96-4121-9c70-bb4ad1feb71d"  # Single user
        self._init_client()
    
    def _init_client(self):
        """Initialize Supabase client."""
        if not SUPABASE_AVAILABLE:
            logger.warning("Supabase not available - Brain features disabled")
            return
        
        url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not url or not key:
            logger.warning("Supabase credentials not found - Brain features disabled")
            return
        
        try:
            self.client = create_client(url, key)
            logger.info("[OK] Brain client initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Brain client: {e}")
    
    @property
    def is_available(self) -> bool:
        return self.client is not None
    
    async def list_domains(self) -> List[Dict]:
        """Get all knowledge domains."""
        if not self.is_available:
            return []
        
        try:
            # Schema: id, name, description, color, icon, created_at, updated_at, user_id, 
            # agent_config, agent_last_used_at, agent_total_queries, agent_success_rate
            response = self.client.table("brain_domains") \
                .select("*") \
                .eq("user_id", self.user_id) \
                .order("name") \
                .execute()
            
            return response.data or []
        except Exception as e:
            logger.error(f"list_domains error: {e}")
            return []
    
    async def search_knowledge(
        self, 
        query: str, 
        domain: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict]:
        """Search knowledge base."""
        if not self.is_available:
            return []
        
        try:
            # Schema: id, domain_id, title, content, content_type, source_url, source_file,
            # embedding, metadata, tags, created_at, updated_at, user_id
            q = self.client.table("brain_knowledge") \
                .select("*, brain_domains(name, icon, color)") \
                .eq("user_id", self.user_id) \
                .ilike("title", f"%{query}%") \
                .limit(limit)
            
            if domain:
                # Get domain ID first
                domain_response = self.client.table("brain_domains") \
                    .select("id") \
                    .eq("user_id", self.user_id) \
                    .eq("name", domain) \
                    .single() \
                    .execute()
                
                if domain_response.data:
                    q = q.eq("domain_id", domain_response.data["id"])
            
            response = q.execute()
            return response.data or []
            
        except Exception as e:
            logger.error(f"search_knowledge error: {e}")
            return []
    
    async def get_knowledge(self, knowledge_id: str) -> Optional[Dict]:
        """Get specific knowledge item."""
        if not self.is_available:
            return None
        
        try:
            response = self.client.table("brain_knowledge") \
                .select("*, brain_domains(name, icon)") \
                .eq("id", knowledge_id) \
                .eq("user_id", self.user_id) \
                .single() \
                .execute()
            
            return response.data
        except Exception as e:
            logger.error(f"get_knowledge error: {e}")
            return None
    
    async def add_knowledge(
        self,
        title: str,
        content: str,
        domain: str,
        content_type: str = "note",
        tags: List[str] = None,
        metadata: Dict = None,
        source_url: str = None
    ) -> Optional[Dict]:
        """Add new knowledge to brain."""
        if not self.is_available:
            return None
        
        try:
            # Get domain ID
            domain_response = self.client.table("brain_domains") \
                .select("id") \
                .eq("user_id", self.user_id) \
                .eq("name", domain) \
                .single() \
                .execute()
            
            if not domain_response.data:
                logger.error(f"Domain not found: {domain}")
                return None
            
            # Create knowledge item - matching actual schema
            data = {
                "user_id": self.user_id,
                "domain_id": domain_response.data["id"],
                "title": title,
                "content": content,
                "content_type": content_type,
                "tags": tags or [],
                "metadata": metadata or {"source": "mcp-server"},
                "source_url": source_url,
                "source_file": None
            }
            
            response = self.client.table("brain_knowledge") \
                .insert(data) \
                .execute()
            
            return response.data[0] if response.data else None
            
        except Exception as e:
            logger.error(f"add_knowledge error: {e}")
            return None
    
    async def get_brain_stats(self) -> Dict:
        """Get brain statistics."""
        if not self.is_available:
            return {"available": False}
        
        try:
            # Count domains
            domains = self.client.table("brain_domains") \
                .select("id", count="exact") \
                .eq("user_id", self.user_id) \
                .execute()
            
            # Count knowledge items
            knowledge = self.client.table("brain_knowledge") \
                .select("id", count="exact") \
                .eq("user_id", self.user_id) \
                .execute()
            
            return {
                "available": True,
                "domains": domains.count or 0,
                "knowledge_items": knowledge.count or 0
            }
            
        except Exception as e:
            logger.error(f"get_brain_stats error: {e}")
            return {"available": False, "error": str(e)}


# Global brain client instance
brain_client = BrainClient()


# ════════════════════════════════════════════════════════════
# MCP TOOL FUNCTIONS
# ════════════════════════════════════════════════════════════

async def brain_search(query: str, domain: str = None, limit: int = 10) -> Dict:
    """
    Search the AI Second Brain knowledge base.
    
    Args:
        query: Search query
        domain: Optional domain to filter (e.g., "Development", "Business")
        limit: Maximum results (default: 10)
    
    Returns:
        Search results with knowledge items
    """
    logger.info(f"[BRAIN] brain_search: '{query}' in {domain or 'all domains'}")
    
    if not brain_client.is_available:
        return {
            "success": False,
            "error": "Brain not available. Check Supabase connection."
        }
    
    results = await brain_client.search_knowledge(query, domain, limit)
    
    # Format results - using actual schema fields
    items = []
    for item in results:
        items.append({
            "id": item.get("id"),
            "title": item.get("title"),
            "content_type": item.get("content_type"),
            "domain": item.get("brain_domains", {}).get("name", "Unknown"),
            "tags": item.get("tags", []),
            "content_preview": item.get("content", "")[:300],
            "source_url": item.get("source_url"),
            "created_at": item.get("created_at")
        })
    
    return {
        "success": True,
        "query": query,
        "domain_filter": domain,
        "count": len(items),
        "results": items
    }


async def brain_list_domains() -> Dict:
    """
    List all knowledge domains in the AI Brain.
    
    Returns:
        List of domains with stats
    """
    logger.info("[BRAIN] brain_list_domains")
    
    if not brain_client.is_available:
        return {
            "success": False,
            "error": "Brain not available. Check Supabase connection."
        }
    
    domains = await brain_client.list_domains()
    
    # Format using actual schema fields
    items = []
    for d in domains:
        items.append({
            "id": d.get("id"),
            "name": d.get("name"),
            "icon": d.get("icon"),
            "description": d.get("description"),
            "color": d.get("color"),
            "agent_total_queries": d.get("agent_total_queries", 0),
            "agent_success_rate": d.get("agent_success_rate")
        })
    
    return {
        "success": True,
        "count": len(items),
        "domains": items
    }


async def brain_add(
    title: str,
    content: str,
    domain: str,
    content_type: str = "note",
    tags: List[str] = None
) -> Dict:
    """
    Add new knowledge to the AI Brain.
    
    Args:
        title: Knowledge title
        content: Knowledge content (markdown supported)
        domain: Domain name (e.g., "Development", "Business")
        content_type: Type of content (note, code, snippet, article, etc.)
        tags: Optional tags for categorization
    
    Returns:
        Created knowledge item
    """
    logger.info(f"[BRAIN] brain_add: '{title}' to {domain}")
    
    if not brain_client.is_available:
        return {
            "success": False,
            "error": "Brain not available. Check Supabase connection."
        }
    
    result = await brain_client.add_knowledge(
        title=title,
        content=content,
        domain=domain,
        content_type=content_type,
        tags=tags
    )
    
    if result:
        return {
            "success": True,
            "action": "created",
            "knowledge": {
                "id": result.get("id"),
                "title": result.get("title"),
                "domain": domain,
                "content_type": content_type
            }
        }
    else:
        return {
            "success": False,
            "error": "Failed to add knowledge. Check domain name."
        }


async def brain_stats() -> Dict:
    """
    Get AI Brain statistics.
    
    Returns:
        Brain statistics including domain and knowledge counts
    """
    logger.info("[BRAIN] brain_stats")
    
    stats = await brain_client.get_brain_stats()
    return {
        "success": stats.get("available", False),
        **stats
    }
