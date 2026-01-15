import { useState, useEffect } from 'react';
import { rolesApi, permissionsApi, type Role, type Permission } from '../utils/api';

interface EditRoleModalProps {
  role: Role | null;
  isOpen: boolean;
  isCreate: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function EditRoleModal({
  role,
  isOpen,
  isCreate,
  onClose,
  onSave,
}: EditRoleModalProps) {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  // Load available permissions from database
  useEffect(() => {
    const loadPermissions = async () => {
      setIsLoadingPermissions(true);
      const response = await permissionsApi.getAll(undefined, true); // Only active permissions
      if (response.success && response.data) {
        setAvailablePermissions(response.data.permissions);
      }
      setIsLoadingPermissions(false);
    };

    if (isOpen) {
      void loadPermissions();
    }
  }, [isOpen]);

  // Initialize form when role changes
  useEffect(() => {
    if (role) {
      setName(role.name);
      setDisplayName(role.displayName);
      setDescription(role.description);
      setPermissions(role.permissions.map((p) => p.name));
      setIsActive(role.isActive);
    } else if (isCreate) {
      setName('');
      setDisplayName('');
      setDescription('');
      setPermissions([]);
      setIsActive(true);
    }
    setError(null);
  }, [role, isCreate]);

  if (!isOpen) {
    return null;
  }

  const handlePermissionToggle = (permissionName: string) => {
    setPermissions((prev) =>
      prev.includes(permissionName)
        ? prev.filter((p) => p !== permissionName)
        : [...prev, permissionName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    if (!name || !displayName || !description) {
      setError('Name, display name, and description are required');
      setIsSaving(false);
      return;
    }

    try {
      let response;
      if (isCreate) {
        response = await rolesApi.create({
          name,
          displayName,
          description,
          permissions,
        });
      } else if (role) {
        response = await rolesApi.update(role.id, {
          name,
          displayName,
          description,
          permissions,
          isActive,
        });
      } else {
        setError('Invalid operation');
        setIsSaving(false);
        return;
      }

      if (response.success) {
        onSave();
        onClose();
      } else {
        setError(response.error || `Failed to ${isCreate ? 'create' : 'update'} role`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // Group permissions by category
  const permissionsByCategory = availablePermissions.reduce((acc, perm) => {
    const category = perm.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const categoryLabels: Record<string, string> = {
    user_management: 'User Management',
    asset_management: 'Asset Management',
    admin: 'Admin',
    other: 'Other',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isCreate ? 'Create Role' : 'Edit Role'}
              </h2>
              {!isCreate && role && (
                <p className="text-sm text-gray-600 mt-1">
                  {role.displayName}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role Name (Internal) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase())}
                placeholder="e.g., user, admin, moderator"
                required
                disabled={!isCreate && role?.isSystemRole}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">
                Internal identifier (lowercase, no spaces). Cannot be changed for system roles.
              </p>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., User, Administrator, Moderator"
                required
                disabled={!isCreate && role?.isSystemRole}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">
                Human-readable name displayed to users.
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this role allows users to do"
                required
                rows={3}
                disabled={!isCreate && role?.isSystemRole}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Permissions
              </label>
              {isLoadingPermissions ? (
                <div className="py-4 text-center text-sm text-gray-500">
                  Loading permissions...
                </div>
              ) : availablePermissions.length === 0 ? (
                <div className="py-4 text-center text-sm text-gray-500">
                  No permissions available. Create permissions in the Permissions page.
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {Object.entries(permissionsByCategory).map(([category, perms]) => (
                    <div key={category}>
                      <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                        {categoryLabels[category] || category}
                      </h4>
                      <div className="space-y-2">
                        {perms.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={permissions.includes(permission.name)}
                              onChange={() => handlePermissionToggle(permission.name)}
                              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-0.5"
                            />
                            <div className="flex-1">
                              <span className="text-sm text-gray-700 font-mono">
                                {permission.name}
                              </span>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {permission.description}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Status (only for edit) */}
            {!isCreate && (
              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active Role
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-8">
                  Inactive roles cannot be assigned to users
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !name || !displayName || !description}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : isCreate ? 'Create Role' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
