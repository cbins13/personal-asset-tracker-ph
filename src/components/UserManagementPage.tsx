import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import Sidebar from "./Sidebar";
import AnimatedContent from "../effects/AnimatedContent";
import { usersApi, type UserSummary } from "../utils/api";
import EditUserModal from "./EditUserModal";

export default function UserManagementPage() {
  const auth = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    const response = await usersApi.getAll();
    if (response.success && response.data) {
      setUsers(response.data.users);
    } else {
      setError(response.error || "Failed to load users");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleEditClick = (user: UserSummary) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSave = () => {
    // Reload users after successful save
    void loadUsers();
    // Refresh auth state in case the current user was updated
    void auth.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar (admin-only route already enforced) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="mt-1 text-sm text-gray-600">
                View all registered accounts and manage their roles.
              </p>
            </div>
            <div className="hidden md:flex flex-col items-end text-xs text-gray-500">
              <span className="font-medium text-gray-800">
                {auth.user?.name || auth.user?.email}
              </span>
              <span className="mt-0.5">
                Roles:{" "}
                {auth.user?.roles && auth.user.roles.length > 0
                  ? auth.user.roles.join(", ")
                  : "N/A"}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto w-full">
          <AnimatedContent delay={0.05} duration={0.8}>
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
                  <p className="text-sm text-gray-600">
                    This is a read-only view powered by the backend. Only admins can access this page.
                  </p>
                </div>
                {!isLoading && !error && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                      Total users: {users.length}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">
                      Active: {users.filter((u) => u.isActive !== false).length}
                    </span>
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="py-10 flex items-center justify-center text-gray-500 text-sm">
                  Loading users...
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
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Provider</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Roles</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500 font-mono truncate">
                              ID: {user.id}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-800">{user.email}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                              {user.provider}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {user.roles.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {user.roles.map((role) => (
                                  <span
                                    key={role}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary-50 text-secondary-700 border border-secondary-100 capitalize"
                                  >
                                    {role}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">No roles</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {user.isActive !== false ? (
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
                            <button
                              onClick={() => handleEditClick(user)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 transition-colors"
                            >
                              <svg
                                className="w-4 h-4 mr-1.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </AnimatedContent>
        </main>
      </div>

      {/* Edit User Modal */}
      <EditUserModal
        user={editingUser}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSave}
      />
    </div>
  );
}

