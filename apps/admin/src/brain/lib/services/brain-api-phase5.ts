/**
 * Brain API - Phase 5: Actions, Workflows, Tasks & Notifications
 * Sections 12-15
 */

import type { ApiResponse } from '@/brain/types/brain.types';
import type { Action, ActionInput } from '@/brain/types/action.types';
import type { Workflow, WorkflowInput } from '@/brain/types/workflow.types';
import type { Task, TaskInput } from '@/brain/types/task.types';
import type { Notification } from '@/brain/types/notification.types';
import { type Constructor, BrainAPIBase, getUserId } from './brain-api-base';

export function withPhase5Methods<T extends Constructor<BrainAPIBase>>(Base: T) {
  return class Phase5Methods extends Base {
    // ============================================
    // Phase 5 - Actions
    // ============================================

    async getActions(status?: string, limit: number = 50): Promise<Action[]> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const url = new URL(`${this.baseUrl}/brain/actions`);
      if (status) url.searchParams.set('status', status);
      if (limit) url.searchParams.set('limit', String(limit));
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to get actions' }))).error
        );
      const data: ApiResponse<Action[]> = await response.json();
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to get actions');
      return data.data;
    }

    async queueAction(req: ActionInput): Promise<Action> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({
          actionType: req.actionType,
          payload: req.payload,
          sessionId: req.sessionId,
        }),
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to queue action' }))).error
        );
      const data: ApiResponse<Action> = await response.json();
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to queue action');
      return data.data;
    }

    // ============================================
    // Phase 5 - Workflows
    // ============================================

    async getWorkflows(): Promise<Workflow[]> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/workflows`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to get workflows' }))).error
        );
      const data: ApiResponse<Workflow[]> = await response.json();
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to get workflows');
      return data.data;
    }

    async createWorkflow(req: WorkflowInput): Promise<Workflow> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({
          name: req.name,
          description: req.description,
          triggerType: req.triggerType,
          triggerConfig: req.triggerConfig,
          actions: req.actions,
          isActive: req.isActive,
        }),
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to create workflow' }))).error
        );
      const data: ApiResponse<Workflow> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to create workflow');
      return data.data;
    }

    async updateWorkflow(id: string, req: WorkflowInput): Promise<Workflow> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/workflows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({
          name: req.name,
          description: req.description,
          triggerType: req.triggerType,
          triggerConfig: req.triggerConfig,
          actions: req.actions,
          isActive: req.isActive,
        }),
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to update workflow' }))).error
        );
      const data: ApiResponse<Workflow> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to update workflow');
      return data.data;
    }

    async deleteWorkflow(id: string): Promise<void> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/workflows/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to delete workflow' }))).error
        );
    }

    async testWorkflow(
      id: string,
      context?: Record<string, any>
    ): Promise<{ actionsQueued: number }> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/workflows/${id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ context }),
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to test workflow' }))).error
        );
      const data: ApiResponse<{ actionsQueued: number }> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to test workflow');
      return data.data;
    }

    // ============================================
    // Phase 5 - Tasks
    // ============================================

    async getTasks(status?: string, limit: number = 100): Promise<Task[]> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const url = new URL(`${this.baseUrl}/brain/tasks`);
      if (status) url.searchParams.set('status', status);
      if (limit) url.searchParams.set('limit', String(limit));
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to get tasks' }))).error
        );
      const data: ApiResponse<Task[]> = await response.json();
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to get tasks');
      return data.data;
    }

    async createTask(req: TaskInput): Promise<Task> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify(req),
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to create task' }))).error
        );
      const data: ApiResponse<Task> = await response.json();
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to create task');
      return data.data;
    }

    async updateTask(
      id: string,
      req: Partial<TaskInput>
    ): Promise<Task> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify(req),
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to update task' }))).error
        );
      const data: ApiResponse<Task> = await response.json();
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to update task');
      return data.data;
    }

    // ============================================
    // Phase 5 - Notifications
    // ============================================

    async getNotifications(limit: number = 50): Promise<Notification[]> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(
        `${this.baseUrl}/brain/notifications?limit=${limit}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        }
      );
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to get notifications' }))).error
        );
      const data: ApiResponse<Notification[]> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to get notifications');
      return data.data;
    }

    async markNotificationsRead(ids: string[]): Promise<void> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/notifications/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to mark as read' }))).error
        );
    }
  };
}
