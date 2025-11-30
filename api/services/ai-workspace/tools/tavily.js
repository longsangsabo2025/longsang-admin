/**
 * Tavily Search Integration
 * Real-time web search for Research Assistant
 */

const { getAPIKeys } = require('../env-loader');

const keys = getAPIKeys();

/**
 * Search with Tavily
 */
async function tavilySearch(query, options = {}) {
  if (!keys.tavily) {
    console.warn('[Tavily] API key not found, skipping web search');
    return null;
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: keys.tavily,
        query,
        search_depth: options.searchDepth || 'basic',
        max_results: options.maxResults || 5,
        include_answer: true,
        include_raw_content: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      answer: data.answer,
      results: data.results?.map((r) => ({
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score,
      })) || [],
    };
  } catch (error) {
    console.error('[Tavily] Search error:', error);
    return null;
  }
}

module.exports = {
  tavilySearch,
};

