import { ReactNode } from 'react';
import { usePermissions, Permission, TabId } from '@/hooks/usePermissions';

interface PermissionGateProps {
  children: ReactNode;
  /** Yêu cầu permission cụ thể */
  permission?: Permission;
  /** Yêu cầu một trong các permissions */
  anyPermission?: Permission[];
  /** Yêu cầu tất cả permissions */
  allPermissions?: Permission[];
  /** Yêu cầu có thể xem tab */
  tab?: TabId;
  /** Chỉ admin mới thấy */
  adminOnly?: boolean;
  /** Admin hoặc manager mới thấy */
  managerOnly?: boolean;
  /** Hiển thị khi không có quyền */
  fallback?: ReactNode;
}

/**
 * Component để ẩn/hiện UI dựa trên quyền
 * 
 * @example
 * ```tsx
 * // Chỉ hiện nếu có quyền tạo post
 * <PermissionGate permission="posts.create">
 *   <Button>Tạo bài viết</Button>
 * </PermissionGate>
 * 
 * // Chỉ admin mới thấy
 * <PermissionGate adminOnly>
 *   <SettingsPanel />
 * </PermissionGate>
 * 
 * // Hiện fallback nếu không có quyền
 * <PermissionGate permission="settings.edit" fallback={<p>Bạn không có quyền</p>}>
 *   <SettingsForm />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  children,
  permission,
  anyPermission,
  allPermissions,
  tab,
  adminOnly,
  managerOnly,
  fallback = null,
}: PermissionGateProps) {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    canViewTab,
    isAdmin,
    isAdminOrManager,
  } = usePermissions();

  // Check adminOnly
  if (adminOnly && !isAdmin) {
    return <>{fallback}</>;
  }

  // Check managerOnly (admin hoặc manager)
  if (managerOnly && !isAdminOrManager) {
    return <>{fallback}</>;
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Check any permission
  if (anyPermission && !hasAnyPermission(anyPermission)) {
    return <>{fallback}</>;
  }

  // Check all permissions
  if (allPermissions && !hasAllPermissions(allPermissions)) {
    return <>{fallback}</>;
  }

  // Check tab visibility
  if (tab && !canViewTab(tab)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * HOC để wrap component với permission check
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<PermissionGateProps, 'children'>
) {
  return function WithPermissionComponent(props: P) {
    return (
      <PermissionGate {...options}>
        <WrappedComponent {...props} />
      </PermissionGate>
    );
  };
}
