/**
 * Unit Tests: Workflow Generator Service
 *
 * Tests for generating n8n workflows from commands
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Workflow Generator', () => {
  let workflowGenerator;

  beforeEach(async () => {
    vi.clearAllMocks();
    workflowGenerator = await import('../../api/services/workflow-generator.js');
  });

  it('should generate post workflow with correct structure', () => {
    const args = {
      topic: 'Test Topic',
      platform: 'facebook',
      tone: 'professional',
    };

    const workflow = workflowGenerator.generateFromCommand('create_post', args, {});

    expect(workflow).toBeDefined();
    expect(workflow.name).toContain('Create Post');
    expect(workflow.nodes).toBeDefined();
    expect(Array.isArray(workflow.nodes)).toBe(true);
    expect(workflow.connections).toBeDefined();
  });

  it('should generate backup workflow', () => {
    const args = {
      destination: 'google_drive',
      include_data: true,
    };

    const workflow = workflowGenerator.generateFromCommand('backup_database', args, {});

    expect(workflow).toBeDefined();
    expect(workflow.name).toContain('Backup Database');
    expect(workflow.nodes.length).toBeGreaterThan(0);
  });

  it('should generate SEO workflow with multiple articles', () => {
    const args = {
      keyword: 'bất động sản',
      word_count: 1000,
      count: 5,
    };

    const workflow = workflowGenerator.generateFromCommand('generate_seo', args, {});

    expect(workflow).toBeDefined();
    expect(workflow.name).toContain('Generate SEO');
    // Should have multiple article generation nodes
    const articleNodes = workflow.nodes.filter((n) => n.name?.includes('Generate Article'));
    expect(articleNodes.length).toBe(5);
  });

  it('should throw error for unknown function', () => {
    expect(() => {
      workflowGenerator.generateFromCommand('unknown_function', {}, {});
    }).toThrow();
  });
});
