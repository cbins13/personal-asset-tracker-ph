import {
  createContext,
  useContext,
  useEffect,
  useRef,
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
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
}

const AuthContext = createContext<AuthState | undefined>(undefined)

const AUTH_TIMEOUT_MS = 10000 // 10 seconds
const MAX_RETRIES = 3
const IS_DEV = import.meta.env.DEV

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const retryCountRef = useRef(0)

  // Restore auth state on app load using the backend session
  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Helper function to create timeout promise
  const createTimeoutPromise = (timeoutMs: number): Promise<never> => {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Authentication check timed out after ${timeoutMs}ms`))
      }, timeoutMs)
    })
  }

  const refresh = async (isRetry = false) => {
    if (!isRetry) {
      setIsLoading(true)
      setError(null)
      retryCountRef.current = 0
    }
    
    const currentRetryCount = retryCountRef.current
    if (IS_DEV) {
      console.log('[Auth] Starting refresh, retry count:', currentRetryCount)
    }

    try {
      // Wrap the API call with a timeout
      const response = await Promise.race([
        authApi.getCurrentUser(),
        createTimeoutPromise(AUTH_TIMEOUT_MS)
      ])

      if (response.success && response.data && (response.data as any).user) {
        const { user } = response.data as { user: User }
        setUser(user)
        setIsAuthenticated(true)
        retryCountRef.current = 0 // Reset retry count on success
        setIsLoading(false)
        setError(null)
        
        if (IS_DEV) {
          console.log('[Auth] Refresh successful, user:', user.email)
        }
        return
      } else {
        setUser(null)
        setIsAuthenticated(false)
        retryCountRef.current = 0 // Reset retry count
        setIsLoading(false)
        setError(null)
        
        if (IS_DEV) {
          console.log('[Auth] Refresh failed: No user data in response')
        }
        return
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh authentication'
      setError(errorMessage)
      setUser(null)
      setIsAuthenticated(false)
      
      // Increment retry count
      retryCountRef.current += 1
      const newRetryCount = retryCountRef.current
      
      if (IS_DEV) {
        console.error('[Auth] Refresh error:', errorMessage, 'Retry count:', newRetryCount)
      }

      // Auto-retry if under max retries and not a timeout error
      if (newRetryCount < MAX_RETRIES && !errorMessage.includes('timed out')) {
        if (IS_DEV) {
          console.log('[Auth] Auto-retrying in 2 seconds...')
        }
        setTimeout(() => {
          refresh(true) // Pass isRetry flag
        }, 2000)
        // Keep loading state true while retrying
        return
      }
      
      // Max retries reached or timeout error - stop loading
      setIsLoading(false)
      if (IS_DEV) {
        console.log('[Auth] Refresh complete after max retries or timeout, loading set to false')
      }
    }
  }

  const login = async (email: string, password: string) => {
    setError(null)
    setIsLoading(true)
    
    try {
      const response = await authApi.login(email, password)
      if (!response.success || !response.data) {
        const errorMessage = response.error || 'Authentication failed'
        setError(errorMessage)
        setIsLoading(false)
        throw new Error(errorMessage)
      }

      const authData = response.data as { user?: User }
      if (authData.user) {
        setUser(authData.user)
        setIsAuthenticated(true)
        retryCountRef.current = 0 // Reset retry count on successful login
      }
      setIsLoading(false)
    } catch (err) {
      setIsLoading(false)
      throw err
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
      setIsAuthenticated(false)
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
    error,
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

