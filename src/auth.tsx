import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { authApi } from './utils/api'

export interface User {
  id: string
  email: string
  name: string
  picture?: string
  provider: string
  roles?: string[]
  permissions?: string[]
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Restore auth state on app load using the backend session
  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refresh = async () => {
    setIsLoading(true)
    try {
      const response = await authApi.getCurrentUser()
      if (response.success && response.data && (response.data as any).user) {
        const { user } = response.data as { user: User }
        setUser(user)
        setIsAuthenticated(true)
      } else {
        setUser(null)
        setIsAuthenticated(false)
        localStorage.removeItem('token')
      }
    } catch {
      setUser(null)
      setIsAuthenticated(false)
      localStorage.removeItem('token')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Authentication failed')
    }

    const authData = response.data as { token?: string; user?: User }
    if (authData.token) {
      localStorage.setItem('token', authData.token)
    }
    if (authData.user) {
      setUser(authData.user)
      setIsAuthenticated(true)
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
      setIsAuthenticated(false)
      localStorage.removeItem('token')
    }
  }

  const effectiveRoles = (user?.roles && user.roles.length > 0 ? user.roles : ['user']) ?? ['user']
  const effectivePermissions = user?.permissions ?? []

  const hasRole = (role: string) => {
    return effectiveRoles.includes(role)
  }

  const hasAnyRole = (roles: string[]) => {
    return roles.some((role) => effectiveRoles.includes(role))
  }

  const hasPermission = (permission: string) => {
    return effectivePermissions.includes(permission)
  }

  const hasAnyPermission = (permissions: string[]) => {
    return permissions.some((permission) => effectivePermissions.includes(permission))
  }

  const value: AuthState = {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
    refresh,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
  }

  // Show loading state while checking auth (as per TanStack Router docs)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

