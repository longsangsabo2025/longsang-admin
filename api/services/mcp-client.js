/**
 * MCP Client for Backend API
 * Connects to the Python MCP Server and provides workspace tools
 */

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3002/mcp';

class MCPClient {
  constructor() {
    this.sessionId = null;
    this.initialized = false;
    this.tools = [];
  }

  /**
   * Initialize MCP connection and get session
   */
  async initialize() {
    try {
      const response = await fetch(MCP_SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'longsang-admin-api', version: '1.0' }
          },
          id: 1
        })
      });

      // Get session ID from header
      this.sessionId = response.headers.get('mcp-session-id');
      
      if (!this.sessionId) {
        throw new Error('No session ID received from MCP server');
      }

      // Get available tools
      await this.loadTools();
      
      this.initialized = true;
      console.log('[MCP Client] Initialized with session:', this.sessionId);
      console.log('[MCP Client] Available tools:', this.tools.map(t => t.name).join(', '));
      
      return true;
    } catch (error) {
      console.error('[MCP Client] Initialize error:', error.message);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Load available tools from MCP server
   */
  async loadTools() {
    if (!this.sessionId) return [];

    try {
      const response = await fetch(MCP_SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'mcp-session-id': this.sessionId
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/list',
          id: 2
        })
      });

      const data = await response.json();
      
      if (data.result && data.result.tools) {
        this.tools = data.result.tools;
        return this.tools;
      }
      
      return [];
    } catch (error) {
      console.error('[MCP Client] Load tools error:', error.message);
      return [];
    }
  }

  /**
   * Call a tool on MCP server
   */
  async callTool(toolName, args = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.sessionId) {
      return { success: false, error: 'MCP not connected' };
    }

    try {
      const response = await fetch(MCP_SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'mcp-session-id': this.sessionId
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: args
          },
          id: Date.now()
        })
      });

      const data = await response.json();
      
      if (data.error) {
        return { success: false, error: data.error.message };
      }

      // Extract text content from MCP response
      if (data.result && data.result.content) {
        const textContent = data.result.content
          .filter(c => c.type === 'text')
          .map(c => c.text)
          .join('\n');
        
        // Try to parse as JSON
        try {
          return JSON.parse(textContent);
        } catch {
          return { success: true, data: textContent };
        }
      }

      return { success: true, data: data.result };
    } catch (error) {
      console.error(`[MCP Client] Tool ${toolName} error:`, error.message);
      
      // Try to reconnect
      this.initialized = false;
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // Convenience methods for common tools
  // ============================================

  async readFile(filePath) {
    return this.callTool('read_file', { file_path: filePath });
  }

  async writeFile(filePath, content) {
    return this.callTool('write_file', { file_path: filePath, content });
  }

  async searchFiles(query, path = null, filePattern = null) {
    return this.callTool('search_files', { query, path, file_pattern: filePattern });
  }

  async listFiles(path = null, recursive = false) {
    return this.callTool('list_files', { path, recursive });
  }

  async runCommand(command, workingDir = null) {
    return this.callTool('run_command', { command, working_dir: workingDir });
  }

  async gitStatus(path = null) {
    return this.callTool('git_status', { path });
  }

  async gitDiff(path = null, staged = false) {
    return this.callTool('git_diff', { path, staged });
  }

  async listProjects() {
    return this.callTool('list_projects', {});
  }

  async getProjectInfo(projectPath) {
    return this.callTool('get_project_info', { project_path: projectPath });
  }

  async brainSearch(query, domain = null, limit = 10) {
    return this.callTool('brain_search', { query, domain, limit });
  }

  async brainListDomains() {
    return this.callTool('brain_list_domains', {});
  }

  async brainAdd(title, content, domain, contentType = 'note', tags = []) {
    return this.callTool('brain_add', { 
      title, content, domain, content_type: contentType, tags 
    });
  }

  async brainStats() {
    return this.callTool('brain_stats', {});
  }

  /**
   * Get tools formatted for OpenAI function calling
   */
  getOpenAITools() {
    return this.tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema || { type: 'object', properties: {} }
      }
    }));
  }

  /**
   * Check if MCP server is available
   */
  async isAvailable() {
    try {
      const response = await fetch(MCP_SERVER_URL.replace('/mcp', '/health'), {
        method: 'GET',
        timeout: 2000
      });
      return response.ok;
    } catch {
      // Try initialize instead
      return this.initialize();
    }
  }
}

// Singleton instance
const mcpClient = new MCPClient();

module.exports = mcpClient;
