/**
 * 📝 Notion API Integration
 *
 * Sync ideas với Notion pages
 * Sử dụng Notion Official API
 *
 * ✅ Hoạt động trên cả Web và Electron Desktop App
 * - Fetch API được hỗ trợ native trong Electron
 * - Không cần cấu hình thêm
 */

interface NotionPage {
  id?: string;
  title: string;
  content?: string;
  properties?: Record<string, any>;
}

interface NotionConfig {
  apiKey: string;
  databaseId?: string;
}

class NotionAPI {
  private config: NotionConfig;
  private baseUrl = 'https://api.notion.com/v1';

  constructor(apiKey: string, databaseId?: string) {
    this.config = {
      apiKey,
      databaseId,
    };
  }

  /**
   * Create a page in Notion
   */
  async createPage(page: NotionPage): Promise<{ id: string; url: string }> {
    try {
      // If databaseId is provided, create page in database
      if (this.config.databaseId) {
        return await this.createPageInDatabase(page);
      }

      // Otherwise, create standalone page
      return await this.createStandalonePage(page);
    } catch (error: any) {
      throw new Error(`Failed to create Notion page: ${error.message}`);
    }
  }

  /**
   * Create page in a Notion database
   */
  private async createPageInDatabase(page: NotionPage): Promise<{ id: string; url: string }> {
    const response = await fetch(`${this.baseUrl}/pages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: {
          database_id: this.config.databaseId,
        },
        properties: {
          Name: {
            title: [
              {
                text: {
                  content: page.title,
                },
              },
            ],
          },
          ...this.mapIdeaProperties(page.properties),
        },
        children: page.content
          ? [
              {
                object: 'block',
                type: 'paragraph',
                paragraph: {
                  rich_text: [
                    {
                      type: 'text',
                      text: {
                        content: page.content,
                      },
                    },
                  ],
                },
              },
            ]
          : [],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create Notion page');
    }

    const data = await response.json();
    return {
      id: data.id,
      url: data.url || `https://notion.so/${data.id.replace(/-/g, '')}`,
    };
  }

  /**
   * Create standalone page (no database)
   * Note: This requires a parent page ID. For simplicity, we'll use database method.
   */
  private async createStandalonePage(page: NotionPage): Promise<{ id: string; url: string }> {
    // For standalone pages, we need a parent page ID
    // If no database ID provided, we'll create in user's workspace
    // This is a simplified version - in production, you'd want to handle this better

    // For now, throw error asking for database ID
    throw new Error(
      'Database ID is required. Please provide a Notion database ID in settings. ' +
        'You can create a database in Notion and share it with your integration.'
    );
  }

  /**
   * Map idea properties to Notion properties
   */
  private mapIdeaProperties(properties?: Record<string, any>): Record<string, any> {
    if (!properties) return {};

    const notionProps: Record<string, any> = {};

    if (properties.category) {
      notionProps.Category = {
        select: {
          name: properties.category,
        },
      };
    }

    if (properties.priority) {
      notionProps.Priority = {
        select: {
          name: properties.priority,
        },
      };
    }

    if (properties.status) {
      notionProps.Status = {
        select: {
          name: properties.status,
        },
      };
    }

    if (properties.tags && Array.isArray(properties.tags)) {
      notionProps.Tags = {
        multi_select: properties.tags.map((tag: string) => ({ name: tag })),
      };
    }

    return notionProps;
  }

  /**
   * Update an existing page
   */
  async updatePage(pageId: string, page: Partial<NotionPage>): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/pages/${pageId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          properties: page.title
            ? {
                Name: {
                  title: [
                    {
                      text: {
                        content: page.title,
                      },
                    },
                  ],
                },
              }
            : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update Notion page');
      }
    } catch (error: any) {
      throw new Error(`Failed to update Notion page: ${error.message}`);
    }
  }

  /**
   * Get page by ID
   */
  async getPage(pageId: string): Promise<NotionPage> {
    try {
      const response = await fetch(`${this.baseUrl}/pages/${pageId}`, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Notion-Version': '2022-06-28',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get Notion page');
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(`Failed to get Notion page: ${error.message}`);
    }
  }

  /**
   * Sync idea to Notion
   */
  async syncIdea(idea: {
    title: string;
    content?: string | null;
    category?: string;
    priority?: string;
    status?: string;
    tags?: string[];
  }): Promise<{ id: string; url: string }> {
    const content = [
      idea.content || '',
      idea.category ? `**Category:** ${idea.category}` : '',
      idea.priority ? `**Priority:** ${idea.priority}` : '',
      idea.status ? `**Status:** ${idea.status}` : '',
      idea.tags && idea.tags.length > 0 ? `**Tags:** ${idea.tags.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const page: NotionPage = {
      title: idea.title,
      content,
      properties: {
        category: idea.category,
        priority: idea.priority,
        status: idea.status,
        tags: idea.tags || [],
      },
    };

    return await this.createPage(page);
  }
}

export default NotionAPI;
export type { NotionConfig, NotionPage };
