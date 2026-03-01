import { useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  Permission, 
  TabId, 
  UserRole,
  ROLE_PERMISSIONS, 
  ROLE_VISIBLE_TABS,
  getUserRole,
  isAdmin as checkIsAdmin,
  isManager as checkIsManager,
  isAdminOrManager as checkIsAdminOrManager,
} from '@/types/roles';

interface UsePermissionsReturn {
  // User role info
  role: UserRole;
  isAdmin: boolean;
  isManager: boolean;
  isAdminOrManager: boolean;
  
  // Permission checks
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  
  // Tab visibility
  canViewTab: (tabId: TabId) => boolean;
  visibleTabs: TabId[];
  
  // Project-level permissions (để sau mở rộng)
  canAccessProject: (projectId: string) => boolean;
}

/**
 * Hook để kiểm tra quyền của user hiện tại
 * 
 * Usage:
 * ```tsx
 * const { hasPermission, canViewTab, isAdmin } = usePermissions();
 * 
 * if (hasPermission('posts.create')) {
 *   // Show create post button
 * }
 * 
 * if (canViewTab('settings')) {
 *   // Show settings tab
 * }
 * ```
 */
export function usePermissions(): UsePermissionsReturn {
  const { user } = useAuth();
  
  const role = useMemo(() => getUserRole(user), [user]);
  
  const permissions = useMemo(() => {
    return new Set(ROLE_PERMISSIONS[role]);
  }, [role]);
  
  const visibleTabs = useMemo(() => {
    return ROLE_VISIBLE_TABS[role];
  }, [role]);
  
  const hasPermission = (permission: Permission): boolean => {
    return permissions.has(permission);
  };
  
  const hasAnyPermission = (perms: Permission[]): boolean => {
    return perms.some(p => permissions.has(p));
  };
  
  const hasAllPermissions = (perms: Permission[]): boolean => {
    return perms.every(p => permissions.has(p));
  };
  
  const canViewTab = (tabId: TabId): boolean => {
    return visibleTabs.includes(tabId);
  };
  
  // TODO: Implement project-level permissions
  // Hiện tại admin thấy all, manager/user sẽ filter theo project_members table
  const canAccessProject = (_projectId: string): boolean => {
    if (checkIsAdmin(role)) return true;
    // TODO: Check project_members table
    return true; // Tạm thời cho phép
  };
  
  return {
    role,
    isAdmin: checkIsAdmin(role),
    isManager: checkIsManager(role),
    isAdminOrManager: checkIsAdminOrManager(role),
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canViewTab,
    visibleTabs,
    canAccessProject,
  };
}

// Export types for convenience
export type { Permission, TabId, UserRole };
