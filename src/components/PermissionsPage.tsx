import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import Sidebar from "./Sidebar";
import AnimatedContent from "../effects/AnimatedContent";
import { permissionsApi, type Permission } from "../utils/api";
import EditPermissionModal from "./EditPermissionModal";

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'user_management', label: 'User Management' },
  { value: 'asset_management', label: 'Asset Management' },
  { value: 'admin', label: 'Admin' },
  { value: 'other', label: 'Other' },
] as const;

export default function PermissionsPage() {
  const auth = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  const loadPermissions = async () => {
    setIsLoading(true);
    setError(null);
    const response = await permissionsApi.getAll(
      selectedCategory || undefined,
      showActiveOnly ? true : undefined
    );
    if (response.success && response.data) {
      setPermissions(response.data.permissions);
    } else {
      setError(response.error || "Failed to load permissions");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    void loadPermissions();
  }, [selectedCategory, showActiveOnly]);

  const handleEditClick = (permission: Permission) => {
    setEditingPermission(permission);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (permission: Permission) => {
    if (!confirm(`Are you sure you want to delete the permission "${permission.name}"?`)) {
      return;
    }

    try {
      const response = await permissionsApi.delete(permission.id);
      if (response.success) {
        void loadPermissions();
      } else {
        alert(response.error || "Failed to delete permission");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsCreateModalOpen(false);
    setEditingPermission(null);
  };

  const handleSave = () => {
    void loadPermissions();
  };

  const filteredPermissions = permissions.filter((perm) => {
    if (selectedCategory && perm.category !== selectedCategory) return false;
    if (showActiveOnly && !perm.isActive) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Permissions Management</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage system permissions that can be assigned to users.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Permission
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto w-full">
          <AnimatedContent delay={0.05} duration={0.8}>
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">All Permissions</h2>
                  <p className="text-sm text-gray-600">
                    Create, edit, and manage system permissions.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showActiveOnly}
                      onChange={(e) => setShowActiveOnly(e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Active only</span>
                  </label>
                  {!isLoading && !error && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100 text-xs">
                      Total: {filteredPermissions.length}
                    </span>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="py-10 flex items-center justify-center text-gray-500 text-sm">
                  Loading permissions...
                </div>
              ) : error ? (
                <div className="py-10 flex items-center justify-center text-red-600 text-sm">
                  {error}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredPermissions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            No permissions found. Create one to get started.
                          </td>
                        </tr>
                      ) : (
                        filteredPermissions.map((permission) => (
                          <tr key={permission.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-mono font-medium text-gray-900">{permission.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {permission.resource}:{permission.action}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-800">{permission.description}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                                {permission.category.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {permission.isActive ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditClick(permission)}
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 transition-colors"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(permission)}
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 transition-colors"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </AnimatedContent>
        </main>
      </div>

      <EditPermissionModal
        permission={editingPermission}
        isOpen={isModalOpen}
        isCreate={false}
        onClose={handleModalClose}
        onSave={handleSave}
      />

      <EditPermissionModal
        permission={null}
        isOpen={isCreateModalOpen}
        isCreate={true}
        onClose={handleModalClose}
        onSave={handleSave}
      />
    </div>
  );
}
