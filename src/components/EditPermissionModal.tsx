import { useState, useEffect } from 'react';
import { permissionsApi, type Permission } from '../utils/api';

interface EditPermissionModalProps {
  permission: Permission | null;
  isOpen: boolean;
  isCreate: boolean;
  onClose: () => void;
  onSave: () => void;
}

const CATEGORIES = [
  { value: 'user_management', label: 'User Management' },
  { value: 'asset_management', label: 'Asset Management' },
  { value: 'admin', label: 'Admin' },
  { value: 'other', label: 'Other' },
] as const;

export default function EditPermissionModal({
  permission,
  isOpen,
  isCreate,
  onClose,
  onSave,
}: EditPermissionModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'user_management' | 'asset_management' | 'admin' | 'other'>('other');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form when permission changes
  useEffect(() => {
    if (permission) {
      setName(permission.name);
      setDescription(permission.description);
      setCategory(permission.category);
      setIsActive(permission.isActive);
    } else if (isCreate) {
      setName('');
      setDescription('');
      setCategory('other');
      setIsActive(true);
    }
    setError(null);
  }, [permission, isCreate]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    // Validate name format (resource:action)
    if (!/^[a-z0-9]+:[a-z0-9]+$/.test(name)) {
      setError('Permission name must be in format "resource:action" (e.g., users:read)');
      setIsSaving(false);
      return;
    }

    try {
      let response;
      if (isCreate) {
        response = await permissionsApi.create({
          name,
          description,
          category,
        });
      } else if (permission) {
        response = await permissionsApi.update(permission.id, {
          name,
          description,
          category,
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
        setError(response.error || `Failed to ${isCreate ? 'create' : 'update'} permission`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isCreate ? 'Create Permission' : 'Edit Permission'}
              </h2>
              {!isCreate && permission && (
                <p className="text-sm text-gray-600 mt-1">
                  {permission.name}
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
                Permission Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase())}
                placeholder="e.g., users:read, assets:write"
                required
                pattern="^[a-z0-9]+:[a-z0-9]+$"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Format: resource:action (e.g., users:read, assets:write, admin:all)
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
                placeholder="Describe what this permission allows"
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
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
                    Active Permission
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-8">
                  Inactive permissions cannot be assigned to users
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
                disabled={isSaving || !name || !description}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : isCreate ? 'Create Permission' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
