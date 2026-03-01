// =====================================================
// ROLE & PERMISSION TYPES
// =====================================================

// Các role trong hệ thống
export type UserRole = 'admin' | 'manager' | 'user';

// Các quyền cơ bản
export type Permission = 
  // Projects
  | 'projects.view'
  | 'projects.create'
  | 'projects.edit'
  | 'projects.delete'
  // Posts
  | 'posts.view'
  | 'posts.create'
  | 'posts.edit'
  | 'posts.delete'
  | 'posts.publish'
  // Analytics
  | 'analytics.view'
  // Settings
  | 'settings.view'
  | 'settings.edit'
  // Users (chỉ admin)
  | 'users.view'
  | 'users.manage'
  // Automation
  | 'automation.view'
  | 'automation.manage'
  // Brain/Knowledge
  | 'brain.view'
  | 'brain.manage'
  // AI Tools
  | 'ai.image-generator'
  | 'ai.video-generator';

// Định nghĩa quyền cho từng role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // Admin có tất cả quyền
    'projects.view', 'projects.create', 'projects.edit', 'projects.delete',
    'posts.view', 'posts.create', 'posts.edit', 'posts.delete', 'posts.publish',
    'analytics.view',
    'settings.view', 'settings.edit',
    'users.view', 'users.manage',
    'automation.view', 'automation.manage',
    'brain.view', 'brain.manage',
    // AI Tools
    'ai.image-generator', 'ai.video-generator',
  ],
  manager: [
    // Manager có thể quản lý projects được cấp quyền
    'projects.view', 'projects.edit',
    'posts.view', 'posts.create', 'posts.edit', 'posts.publish',
    'analytics.view',
    'settings.view',
    'automation.view',
    'brain.view',
    // AI Tools - Manager có thể sử dụng
    'ai.image-generator',
  ],
  user: [
    // User chỉ có quyền xem cơ bản
    'projects.view',
    'posts.view',
    'analytics.view',
  ],
};

// Tabs có thể ẩn/hiện theo role
export type TabId = 
  | 'overview'
  | 'posts'
  | 'scheduler'
  | 'analytics'
  | 'marketing'
  | 'settings'
  | 'credentials'
  | 'automation'
  | 'brain';

// Tabs mà mỗi role có thể thấy
export const ROLE_VISIBLE_TABS: Record<UserRole, TabId[]> = {
  admin: ['overview', 'posts', 'scheduler', 'analytics', 'marketing', 'settings', 'credentials', 'automation', 'brain'],
  manager: ['overview', 'posts', 'scheduler', 'analytics', 'marketing', 'automation'],
  user: ['overview', 'posts', 'analytics'],
};

// Helper để check role
export const isAdmin = (role?: string): boolean => role === 'admin';
export const isManager = (role?: string): boolean => role === 'manager';
export const isAdminOrManager = (role?: string): boolean => role === 'admin' || role === 'manager';

// Helper để get role từ user metadata
export const getUserRole = (user: { user_metadata?: { role?: string } } | null): UserRole => {
  const role = user?.user_metadata?.role;
  if (role === 'admin' || role === 'manager' || role === 'user') {
    return role;
  }
  return 'user'; // Default role
};
