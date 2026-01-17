import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "../auth";
import logoSmall from "../assets/savvi_logo.png";
import AnimatedContent from "../effects/AnimatedContent";
import Sidebar from "./Sidebar";

export default function ProfilePage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth.user;
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await auth.logout();
      navigate({ to: "/login", search: { redirect: "/profile" } });
    } catch (err) {
      console.error("Logout error:", err);
      // Still redirect even if logout fails
      navigate({ to: "/login", search: { redirect: "/profile" } });
    }
  };

  const handleRefresh = async () => {
    await auth.refresh();
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen((prev) => !prev);
  };

  // User should always be available here since route is protected
  if (auth.isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar (only for authenticated users) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center md:hidden">
                <Link to="/" className="inline-flex items-center gap-2">
                  <img
                    src={logoSmall}
                    alt="Savvi"
                    className="h-[100px] w-[100px]"
                  />
                  <span className="text-lg font-semibold text-gray-900 tracking-tight">Savvi</span>
                </Link>
              </div>
              <nav className="relative ml-auto flex items-center">
                <button
                  onClick={toggleProfileMenu}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 border border-gray-300 overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-transform duration-150 hover:scale-105 hover:shadow-md"
                  aria-label="Open profile menu"
                >
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name || user.email}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-gray-700">
                      {(user?.name || user?.email || "U")[0].toUpperCase()}
                    </span>
                  )}
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-12 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-20 animate-fade-in-down">
                    <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                      Signed in as
                      <div className="font-medium text-gray-800 truncate">
                        {user?.email}
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      type="button"
                    >
                      Settings
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      type="button"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto w-full">
        {/* Welcome Section */}
        <AnimatedContent delay={0.05} duration={0.8}>
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {user?.name}!
                </h1>
                <p className="mt-2 text-gray-600">
                  You are successfully authenticated and your session is active.
                </p>
              </div>
              {user?.picture && (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-20 h-20 rounded-full border-4 border-primary-200"
                />
              )}
            </div>
          </div>
        </AnimatedContent>

        {/* Session Status Card */}
        <AnimatedContent delay={0.12} duration={0.8}>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-green-900">
                  Session Active
                </h3>
                <p className="text-sm text-green-700">
                  Your authentication session is valid and active.
                </p>
              </div>
            </div>
          </div>
        </AnimatedContent>

        {/* User Information Card */}
        <AnimatedContent delay={0.18} duration={0.85}>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                User Information
              </h2>
            </div>
            <div className="px-6 py-4">
              <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.name || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.email || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Authentication Provider</dt>
                <dd className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 capitalize">
                    {user?.provider || "N/A"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">User ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">
                  {user?.id || "N/A"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Roles</dt>
                <dd className="mt-1">
                  {user?.roles && user.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800 capitalize"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">No roles assigned</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Permissions</dt>
                <dd className="mt-1">
                  {user?.permissions && user.permissions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.permissions.map((permission) => (
                        <span
                          key={permission}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info-100 text-info-800"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">No permissions assigned</span>
                  )}
                </dd>
              </div>
              </dl>
            </div>
          </div>
        </AnimatedContent>

        {/* Session Details Card */}
        <AnimatedContent delay={0.22} duration={0.85}>
          <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Session Details
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Session Status</dt>
                <dd className="mt-1 text-sm text-green-600 font-medium">
                  ✓ Active and Valid
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Session Type</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  Server-side session (stored in MongoDB)
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Session Duration</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  Valid for 14 days (auto-extends on activity)
                </dd>
              </div>
              </div>
            </div>
          </div>
        </AnimatedContent>

        {/* Actions */}
        <AnimatedContent delay={0.28} duration={0.8}>
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={handleRefresh}
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Refresh Data
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </AnimatedContent>
      </main>
      </div>
    </div>
  );
}
