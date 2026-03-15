/**
 * TypeScript Types for Collaboration
 */

export type Permission = 'read' | 'write' | 'comment';
export type TeamRole = 'admin' | 'member' | 'viewer';

export interface KnowledgeShare {
  id: string;
  knowledge_id: string;
  shared_by: string;
  shared_with: string;
  permission: Permission;
  created_at: string;
  updated_at: string;
  knowledge?: any;
  shared_by_user?: any;
  shared_with_user?: any;
}

export interface Comment {
  id: string;
  knowledge_id: string;
  user_id: string;
  comment: string;
  parent_comment_id?: string | null;
  created_at: string;
  updated_at: string;
  user?: any;
}

export interface TeamWorkspace {
  id: string;
  name: string;
  description?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  members?: TeamMember[];
}

export interface TeamMember {
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
}

export interface ShareKnowledgeRequest {
  knowledgeId: string;
  sharedWithUserId: string;
  permission?: Permission;
}

export interface AddCommentRequest {
  knowledgeId: string;
  comment: string;
  parentCommentId?: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface AddTeamMemberRequest {
  memberUserId: string;
  role?: TeamRole;
}
