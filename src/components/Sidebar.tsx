import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useRouterState } from "@tanstack/react-router";
import { useAuth } from "../auth";
import logoSmall from "../assets/savvi_logo.png";

type SidebarItem = {
  label: string;
  to: string;
  icon?: React.ReactNode;
  roles?: string[]; // if omitted, visible to all authenticated users
};

const sidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    roles: ["user", "admin"],
  },
  {
    label: "User Management",
    to: "/admin/users",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2a3 3 0 015.356-1.857M15 7a3 3 0 11-6 0 3 3 0 016 0"
        />
      </svg>
    ),
    roles: ["admin"],
  },
];

export default function Sidebar() {
  const auth = useAuth();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  // Load collapsed state from localStorage, default to false (expanded)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved ? JSON.parse(saved) : false;
  });

  // Save collapsed state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  if (!auth.isAuthenticated) {
    return null;
  }

  const visibleItems = sidebarItems.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    return auth.hasAnyRole(item.roles);
  });

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside
      className={`hidden md:flex md:flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header with logo and toggle button */}
      <div className="flex h-16 items-center border-b border-gray-200">
        <div className={`flex items-center ${isCollapsed ? "justify-center w-full px-2" : "px-6 w-full"}`}>
          {!isCollapsed && (
            <span className="flex items-center gap-2 flex-1">
              <img src={logoSmall} alt="Savvi" className="h-[50px] w-[50px]" />
              <span className="text-lg font-semibold tracking-tight text-gray-900">Savvi</span>
            </span>
          )}
          <button
            onClick={toggleSidebar}
            className={`ml-auto ${isCollapsed ? "mx-auto" : ""} p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors`}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 animate-fade-in-down">
        {visibleItems.map((item) => {
          const isActive = pathname === item.to;
          return (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  "group flex items-center rounded-md transition-all duration-200",
                  isCollapsed ? "justify-center px-2 py-2" : "px-3 py-2",
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                ].join(" ")}
                title={isCollapsed ? item.label : undefined}
              >
              {item.icon && (
                <span
                  className={`flex items-center justify-center ${isCollapsed ? "" : "mr-3"} transition-transform duration-200 group-hover:scale-110`}
                >
                  {item.icon}
                </span>
              )}
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer with user info */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-t border-gray-200 text-xs text-gray-500">
          <div className="font-medium text-gray-700 truncate">
            {auth.user?.name || auth.user?.email}
          </div>
          {auth.user?.roles && auth.user.roles.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {auth.user.roles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-secondary-50 text-secondary-700 border border-secondary-100 text-[10px] uppercase tracking-wide"
                >
                  {role}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      {isCollapsed && (
        <div className="px-2 py-3 border-t border-gray-200 flex justify-center">
          {auth.user?.picture ? (
            <img
              src={auth.user.picture}
              alt={auth.user.name || auth.user.email}
              className="w-8 h-8 rounded-full border-2 border-gray-200"
              title={auth.user.name || auth.user.email}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-xs font-medium text-primary-700">
                {(auth.user?.name || auth.user?.email || "U")[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

