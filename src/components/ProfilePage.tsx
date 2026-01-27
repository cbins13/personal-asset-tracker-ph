import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../auth";
import logoSmall from "../assets/savvi_logo.png";
import AnimatedContentWrapper from "../effects/AnimatedContentWrapper";
import Sidebar from "./Sidebar";
import ErrorBoundary from "./ErrorBoundary";

const LOADING_TIMEOUT_MS = 10000; // 10 seconds
const IS_DEV = import.meta.env.DEV;

interface ErrorDisplayProps {
  message: string;
  onRetry: () => void;
}

function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
          <svg
            className="w-6 h-6 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
          Unable to Load Profile
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          {message}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRetry}
            className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
          <Link
            to="/dashboard"
            className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-center"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth.user;
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoggedLoadingStart = useRef(false);

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
    setLoadingError(null);
    await auth.refresh();
  };

  const handleRetry = async () => {
    setLoadingError(null);
    if (IS_DEV) {
      console.log('[ProfilePage] Retrying auth refresh...');
    }
    await handleRefresh();
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen((prev) => !prev);
  };

  // Set up timeout for loading state
  useEffect(() => {
    if (auth.isLoading && !hasLoggedLoadingStart.current) {
      hasLoggedLoadingStart.current = true;
      if (IS_DEV) {
        console.log('[ProfilePage] Loading started, setting timeout for', LOADING_TIMEOUT_MS, 'ms');
      }
      
      timeoutRef.current = setTimeout(() => {
        if (auth.isLoading) {
          const errorMessage = auth.error || 'Loading took too long. Please check your connection and try again.';
          setLoadingError(errorMessage);
          if (IS_DEV) {
            console.error('[ProfilePage] Loading timeout exceeded after', LOADING_TIMEOUT_MS, 'ms');
          }
        }
      }, LOADING_TIMEOUT_MS);
    } else if (!auth.isLoading) {
      // Clear timeout if loading completes
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      hasLoggedLoadingStart.current = false;
      
      if (IS_DEV) {
        console.log('[ProfilePage] Loading completed, user:', user?.email || 'null');
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [auth.isLoading, auth.error, user]);

  // Log loading state changes
  useEffect(() => {
    if (IS_DEV) {
      console.log('[ProfilePage] Auth state changed:', {
        isLoading: auth.isLoading,
        isAuthenticated: auth.isAuthenticated,
        hasUser: !!user,
        error: auth.error,
      });
    }
  }, [auth.isLoading, auth.isAuthenticated, user, auth.error]);

  // Show error display if there's a loading error
  if (loadingError) {
    return <ErrorDisplay message={loadingError} onRetry={handleRetry} />;
  }

  // Show error from auth context if available
  if (auth.error && !auth.isLoading && !user) {
    return <ErrorDisplay message={auth.error} onRetry={handleRetry} />;
  }

  // Show loading state while auth is loading or user is not available
  if (auth.isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          {IS_DEV && (
            <p className="mt-2 text-xs text-gray-500">
              {auth.isLoading ? 'Auth loading...' : 'Waiting for user data...'}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar (only for authenticated users) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center md:hidden">
                <Link to="/" className="inline-flex items-center gap-2">
                  <img
                    src={logoSmall}
                    alt="Savvi"
                    className="h-[100px] w-[100px]"
                  />
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Savvi</span>
                </Link>
              </div>
              <nav className="relative ml-auto flex items-center">
                <button
                  onClick={toggleProfileMenu}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-transform duration-150 hover:scale-105 hover:shadow-md"
                  aria-label="Open profile menu"
                >
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name || user.email}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {(user?.name || user?.email || "U")[0].toUpperCase()}
                    </span>
                  )}
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-12 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 z-20 animate-fade-in-down">
                    <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                      Signed in as
                      <div className="font-medium text-gray-800 dark:text-gray-200 truncate">
                        {user?.email}
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
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
        <AnimatedContentWrapper delay={0.05} duration={0.8}>
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
        </AnimatedContentWrapper>

        {/* Session Status Card */}
        <AnimatedContentWrapper delay={0.12} duration={0.8}>
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
        </AnimatedContentWrapper>

        {/* User Information Card */}
        <AnimatedContentWrapper delay={0.18} duration={0.85}>
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
        </AnimatedContentWrapper>

        {/* Session Details Card */}
        <AnimatedContentWrapper delay={0.22} duration={0.85}>
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
        </AnimatedContentWrapper>

        {/* Actions */}
        <AnimatedContentWrapper delay={0.28} duration={0.8}>
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
        </AnimatedContentWrapper>
      </main>
      </div>
    </div>
    </ErrorBoundary>
  );
}
