import type React from 'react'
import { usePermissions } from '../hooks/usePermissions'

interface PermissionGuardProps {
  children: React.ReactNode
  roles?: string[]
  permissions?: string[]
  requireAll?: boolean
  fallback?: React.ReactNode
}

export function PermissionGuard({
  children,
  roles = [],
  permissions = [],
  requireAll = false,
  fallback = null,
}: PermissionGuardProps) {
  const { hasAnyRole, hasAnyPermission, hasRole, hasPermission } = usePermissions()

  const hasRequiredRoles =
    roles.length === 0 ||
    (requireAll ? roles.every((role) => hasRole(role)) : hasAnyRole(roles))

  const hasRequiredPermissions =
    permissions.length === 0 ||
    (requireAll
      ? permissions.every((permission) => hasPermission(permission))
      : hasAnyPermission(permissions))

  if (hasRequiredRoles && hasRequiredPermissions) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

