/**
 * Test Helpers
 * Utilities for testing: database setup, mocks, factories
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Mock Supabase client for testing
class MockSupabaseClient {
  constructor() {
    this.data = new Map();
    this.inserts = [];
    this.updates = [];
    this.deletes = [];
  }

  from(table) {
    return {
      select: (columns = '*') => ({
        eq: (column, value) => ({
          eq: (col2, val2) => ({
            single: async () => {
              const key = `${table}:${column}:${value}:${col2}:${val2}`;
              return { data: this.data.get(key) || null, error: null };
            },
            limit: async (limit) => {
              const results = Array.from(this.data.values())
                .filter((item) => item.table === table)
                .slice(0, limit);
              return { data: results, error: null };
            },
            order: async (column, options) => {
              const results = Array.from(this.data.values())
                .filter((item) => item.table === table)
                .sort((a, b) => {
                  if (options.ascending) {
                    return a[column] > b[column] ? 1 : -1;
                  }
                  return a[column] < b[column] ? 1 : -1;
                });
              return { data: results, error: null };
            },
          }),
          limit: async (limit) => {
            const results = Array.from(this.data.values())
              .filter((item) => item.table === table && item[column] === value)
              .slice(0, limit);
            return { data: results, error: null };
          },
          order: async (column, options) => {
            const results = Array.from(this.data.values())
              .filter((item) => item.table === table && item[column] === value)
              .sort((a, b) => {
                if (options.ascending) {
                  return a[column] > b[column] ? 1 : -1;
                }
                return a[column] < b[column] ? 1 : -1;
              });
            return { data: results, error: null };
          },
          single: async () => {
            const key = `${table}:${column}:${value}`;
            return { data: this.data.get(key) || null, error: null };
          },
        }),
        limit: async (limit) => ({
          data: Array.from(this.data.values())
            .filter((item) => item.table === table)
            .slice(0, limit),
          error: null,
        }),
      }),
      insert: (data) => ({
        select: (columns = '*') => ({
          single: async () => {
            const id = data.id || `test-${Date.now()}-${Math.random()}`;
            const record = { ...data, id, table };
            this.data.set(`${table}:id:${id}`, record);
            this.inserts.push(record);
            return { data: record, error: null };
          },
        }),
      }),
      update: (data) => ({
        eq: (column, value) => ({
          eq: (col2, val2) => ({
            select: (columns = '*') => ({
              single: async () => {
                const key = `${table}:${column}:${value}:${col2}:${val2}`;
                const existing = this.data.get(key);
                if (existing) {
                  const updated = { ...existing, ...data };
                  this.data.set(key, updated);
                  this.updates.push(updated);
                  return { data: updated, error: null };
                }
                return { data: null, error: { message: 'Not found' } };
              },
            }),
          }),
          select: (columns = '*') => ({
            single: async () => {
              const key = `${table}:${column}:${value}`;
              const existing = this.data.get(key);
              if (existing) {
                const updated = { ...existing, ...data };
                this.data.set(key, updated);
                this.updates.push(updated);
                return { data: updated, error: null };
              }
              return { data: null, error: { message: 'Not found' } };
            },
          }),
        }),
      }),
      delete: () => ({
        eq: (column, value) => ({
          eq: (col2, val2) => {
            const key = `${table}:${column}:${value}:${col2}:${val2}`;
            const existing = this.data.get(key);
            if (existing) {
              this.data.delete(key);
              this.deletes.push(existing);
            }
            return { error: null, count: existing ? 1 : 0 };
          },
        }),
      }),
    };
  }

  auth = {
    getUser: async (token) => ({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    }),
  };

  reset() {
    this.data.clear();
    this.inserts = [];
    this.updates = [];
    this.deletes = [];
  }
}

// Test data factories
const testFactories = {
  createDomain: (overrides = {}) => ({
    id: overrides.id || `domain-${Date.now()}`,
    user_id: overrides.user_id || 'test-user-id',
    name: overrides.name || 'Test Domain',
    description: overrides.description || 'Test Description',
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
    ...overrides,
  }),

  createKnowledge: (overrides = {}) => ({
    id: overrides.id || `knowledge-${Date.now()}`,
    user_id: overrides.user_id || 'test-user-id',
    domain_id: overrides.domain_id || 'test-domain-id',
    content: overrides.content || 'Test knowledge content',
    title: overrides.title || 'Test Knowledge',
    status: overrides.status || 'active',
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
    ...overrides,
  }),

  createTask: (overrides = {}) => ({
    id: overrides.id || `task-${Date.now()}`,
    user_id: overrides.user_id || 'test-user-id',
    title: overrides.title || 'Test Task',
    description: overrides.description || 'Test Description',
    status: overrides.status || 'open',
    priority: overrides.priority || 'medium',
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
    ...overrides,
  }),

  createWorkflow: (overrides = {}) => ({
    id: overrides.id || `workflow-${Date.now()}`,
    user_id: overrides.user_id || 'test-user-id',
    name: overrides.name || 'Test Workflow',
    trigger_type: overrides.trigger_type || 'manual',
    actions: overrides.actions || [],
    is_active: overrides.is_active !== undefined ? overrides.is_active : true,
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
    ...overrides,
  }),
};

// Setup test database (mock)
function setupTestDatabase() {
  const mockSupabase = new MockSupabaseClient();
  return mockSupabase;
}

// Teardown test database
function teardownTestDatabase(mockSupabase) {
  if (mockSupabase && mockSupabase.reset) {
    mockSupabase.reset();
  }
}

// Create test request
function createTestRequest(overrides = {}) {
  return {
    method: 'GET',
    path: '/api/brain/test',
    headers: {
      'x-user-id': 'test-user-id',
      ...overrides.headers,
    },
    query: overrides.query || {},
    body: overrides.body || {},
    params: overrides.params || {},
    user: overrides.user || { id: 'test-user-id' },
    userId: overrides.userId || 'test-user-id',
    ...overrides,
  };
}

// Create test response
function createTestResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    on: jest.fn(),
  };
  return res;
}

module.exports = {
  MockSupabaseClient,
  testFactories,
  setupTestDatabase,
  teardownTestDatabase,
  createTestRequest,
  createTestResponse,
};


