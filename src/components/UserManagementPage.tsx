import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import Sidebar from "./Sidebar";
import AnimatedContent from "../effects/AnimatedContent";
import { usersApi, type UserSummary } from "../utils/api";

export default function UserManagementPage() {
  const auth = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    void loadUsers();
  }, []);

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
                View all registered accounts, their roles, and permissions.
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
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Permissions</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
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
                            {user.permissions.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {user.permissions.map((perm) => (
                                  <span
                                    key={perm}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-info-50 text-info-700 border border-info-100"
                                  >
                                    {perm}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">No permissions</span>
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
    </div>
  );
}

