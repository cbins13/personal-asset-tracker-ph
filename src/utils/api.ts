import { parseApiError, ErrorType } from './errorMessages';
import { withRetry } from './retry';
import { apiCache } from './apiCache';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  errorType?: ErrorType;
  canRetry?: boolean;
  statusCode?: number;
}

interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    picture?: string;
    provider: string;
    roles?: string[];
    permissions?: string[];
  };
}

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: string;
  roles: string[];
  permissions: string[];
  isActive?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

type CacheOptions = {
  key?: string;
  ttl?: number;
  bypass?: boolean;
  invalidatePatterns?: string[];
};

const getCacheKey = (endpoint: string, cacheOptions?: CacheOptions) =>
  cacheOptions?.key || endpoint;

const getInvalidationPatterns = (endpoint: string): string[] => {
  if (endpoint.startsWith('/auth')) return [''];
  if (endpoint.startsWith('/accounts/providers')) return ['/accounts/providers'];
  if (endpoint.startsWith('/accounts')) return ['/accounts', '/transactions'];
  if (endpoint.startsWith('/transactions')) return ['/transactions', '/accounts'];
  if (endpoint.startsWith('/categories')) return ['/categories'];
  if (endpoint.startsWith('/accountTypes')) return ['/accountTypes'];
  return [];
};

const pendingRequests = new Map<string, Promise<ApiResponse<any>>>();

const getRequestKey = (endpoint: string, options: RequestInit, method: string) => {
  const body = options.body;
  let bodyHash = '';
  if (typeof body === 'string') {
    bodyHash = body;
  } else if (body) {
    try {
      bodyHash = JSON.stringify(body);
    } catch {
      bodyHash = '';
    }
  }
  return `${method}:${endpoint}:${bodyHash}`;
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  cacheOptions?: CacheOptions
): Promise<ApiResponse<T>> {
  const method = (options.method || 'GET').toUpperCase();
  const cacheKey = getCacheKey(endpoint, cacheOptions);
  if (method === 'GET' && !cacheOptions?.bypass) {
    const cached = apiCache.get<T>(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached,
      };
    }
  }

  const executeRequest = async () => {
    try {
      // Wrap fetch call with retry logic for network errors and server errors
      const response = await withRetry(
        async () => {
          const fetchResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              ...options.headers,
            },
            credentials: 'include', // Important for sessions
          });

          // If it's a server error (5xx), throw to trigger retry
          if (!fetchResponse.ok && fetchResponse.status >= 500) {
            const errorData = await fetchResponse.json().catch(() => ({}));
            const error = new Error(errorData.error || 'Server error');
            (error as any).statusCode = fetchResponse.status;
            (error as any).errorType = ErrorType.SERVER;
            throw error;
          }

          // For non-server errors, return response (no retry)
          return fetchResponse;
        },
        {
          maxAttempts: 3,
          initialDelay: 1000,
          maxDelay: 10000,
          backoffMultiplier: 2,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorDetails = parseApiError(
          { ...data, statusCode: response.status },
          data.error || 'An error occurred'
        );

        return {
          success: false,
          error: errorDetails.userMessage,
          message: data.message,
          errorType: errorDetails.type,
          canRetry: errorDetails.canRetry,
          statusCode: errorDetails.statusCode,
        };
      }

      if (method === 'GET') {
        apiCache.set(cacheKey, data, cacheOptions?.ttl);
      } else {
        const patterns = cacheOptions?.invalidatePatterns || getInvalidationPatterns(endpoint);
        patterns.forEach((pattern) => apiCache.invalidate(pattern));
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      // This catch handles network errors and server errors after retries are exhausted
      const errorDetails = parseApiError(error, 'Network error occurred');

      return {
        success: false,
        error: errorDetails.userMessage,
        errorType: errorDetails.type,
        canRetry: errorDetails.canRetry,
        statusCode: errorDetails.statusCode,
      };
    }
  };

  const shouldDedup = !cacheOptions?.bypass;
  if (shouldDedup) {
    const requestKey = getRequestKey(endpoint, options, method);
    const existing = pendingRequests.get(requestKey);
    if (existing) {
      return existing as Promise<ApiResponse<T>>;
    }
    const requestPromise = executeRequest().finally(() => {
      pendingRequests.delete(requestKey);
    });
    pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  }

  return executeRequest();
}

// Auth API functions
export const authApi = {
  register: async (email: string, password: string, name: string): Promise<ApiResponse<AuthResponse>> => {
    return apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  login: async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    return apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  googleLogin: async (credential: string): Promise<ApiResponse<AuthResponse>> => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    return apiRequest<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential, clientId }),
    });
  },

  logout: async (): Promise<ApiResponse> => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },

  getCurrentUser: async (): Promise<ApiResponse<AuthResponse>> => {
    return apiRequest<AuthResponse>('/auth/me');
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<ApiResponse<{ success: boolean }>> => {
    return apiRequest<{ success: boolean }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  },
};

// Users API functions (admin)
export const usersApi = {
  getAll: async (): Promise<ApiResponse<{ users: UserSummary[] }>> => {
    return apiRequest<{ users: UserSummary[] }>('/users');
  },

  updateUser: async (
    userId: string,
    updates: {
      roles?: string[];
      permissions?: string[];
      isActive?: boolean;
    }
  ): Promise<ApiResponse<{ user: UserSummary }>> => {
    return apiRequest<{ user: UserSummary }>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteAccount: async (): Promise<ApiResponse<{ success: boolean }>> => {
    return apiRequest<{ success: boolean }>('/users/me', {
      method: 'DELETE',
    });
  },
};

// Permissions API functions (admin)
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  category: 'user_management' | 'asset_management' | 'admin' | 'other';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const permissionsApi = {
  getAll: async (category?: string, isActive?: boolean): Promise<ApiResponse<{ permissions: Permission[] }>> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (isActive !== undefined) params.append('isActive', String(isActive));
    const query = params.toString();
    return apiRequest<{ permissions: Permission[] }>(`/permissions${query ? `?${query}` : ''}`);
  },

  getById: async (id: string): Promise<ApiResponse<{ permission: Permission }>> => {
    return apiRequest<{ permission: Permission }>(`/permissions/${id}`);
  },

  create: async (data: { name: string; description: string; category?: string }): Promise<ApiResponse<{ permission: Permission }>> => {
    return apiRequest<{ permission: Permission }>('/permissions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: { name?: string; description?: string; category?: string; isActive?: boolean }): Promise<ApiResponse<{ permission: Permission }>> => {
    return apiRequest<{ permission: Permission }>(`/permissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/permissions/${id}`, {
      method: 'DELETE',
    });
  },
};

// Roles API functions (admin)
export interface RolePermission {
  name: string;
  description: string;
  category: string;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: RolePermission[];
  isActive: boolean;
  isSystemRole: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const rolesApi = {
  getAll: async (isActive?: boolean): Promise<ApiResponse<{ roles: Role[] }>> => {
    const params = new URLSearchParams();
    if (isActive !== undefined) params.append('isActive', String(isActive));
    const query = params.toString();
    return apiRequest<{ roles: Role[] }>(`/roles${query ? `?${query}` : ''}`);
  },

  getById: async (id: string): Promise<ApiResponse<{ role: Role }>> => {
    return apiRequest<{ role: Role }>(`/roles/${id}`);
  },

  create: async (data: {
    name: string;
    displayName: string;
    description: string;
    permissions?: string[];
  }): Promise<ApiResponse<{ role: Role }>> => {
    return apiRequest<{ role: Role }>('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: string,
    data: {
      name?: string;
      displayName?: string;
      description?: string;
      permissions?: string[];
      isActive?: boolean;
    }
  ): Promise<ApiResponse<{ role: Role }>> => {
    return apiRequest<{ role: Role }>(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/roles/${id}`, {
      method: 'DELETE',
    });
  },
};

export interface Account {
  id: string;
  accountName: string;
  type: string;
  providerId?: string;
  providerLabel?: string;
  currentBalance: number;
  addToNetWorth: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AccountType {
  id: string;
  type: string;
  [key: string]: unknown;
}

export type TransactionKind = 'expense' | 'income' | 'installment' | 'transfer';

export interface Transaction {
  id: string;
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  amount: number;
  type?: 'credit' | 'debit';
  transactionKind?: TransactionKind;
  recordInBudget?: boolean;
  label?: string;
  categoryId?: string;
  categoryLabel?: string;
  notes?: string;
  occurredAt?: string;
  createdAt?: string;
  account?: Account;
  fromAccount?: Account;
  toAccount?: Account;
}

export interface Category {
  id: string;
  label: string;
  emoji?: string;
  type?: string;
}

export type ProvidersByType = Record<string, { id: string; label: string; accent: string }[]>;

export const accountsApi = {
  getAll: async (): Promise<ApiResponse<{ accounts: Account[] }>> => {
    return apiRequest<{ accounts: Account[] }>('/accounts');
  },
  getById: async (accountId: string): Promise<ApiResponse<{ account: Account }>> => {
    return apiRequest<{ account: Account }>(`/accounts/${accountId}`);
  },
  create: async (data: {
    accountName: string;
    type: string;
    currentBalance?: number;
    addToNetWorth?: boolean;
    providerId?: string;
    providerLabel?: string;
  }): Promise<ApiResponse<{ account: Account }>> => {
    return apiRequest<{ account: Account }>('/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (
    accountId: string,
    data: {
      accountName?: string;
      type?: string;
      currentBalance?: number;
      addToNetWorth?: boolean;
      providerId?: string;
      providerLabel?: string;
    }
  ): Promise<ApiResponse<{ account: Account }>> => {
    return apiRequest<{ account: Account }>(`/accounts/${accountId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: async (accountId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/accounts/${accountId}`, {
      method: 'DELETE',
    });
  },
  getProviders: async (): Promise<ApiResponse<{ providersByType: ProvidersByType }>> => {
    return apiRequest<{ providersByType: ProvidersByType }>('/accounts/providers');
  },
  createProvider: async (data: {
    type: string;
    providerLabel: string;
    accent?: string;
  }): Promise<ApiResponse<{ provider: { id: string; label: string; accent: string } }>> => {
    return apiRequest<{ provider: { id: string; label: string; accent: string } }>('/accounts/providers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const accountTypesApi = {
  getAll: async (): Promise<ApiResponse<{ accountTypes: AccountType[] }>> => {
    return apiRequest<{ accountTypes: AccountType[] }>('/accountTypes');
  },
  getById: async (id: string): Promise<ApiResponse<{ accountType: AccountType }>> => {
    return apiRequest<{ accountType: AccountType }>(`/accountTypes/${id}`);
  },
};

export const transactionsApi = {
  list: async (
    options?: string | { accountId?: string; kind?: TransactionKind; includeAccounts?: boolean }
  ): Promise<ApiResponse<{ transactions: Transaction[] }>> => {
    const query =
      typeof options === 'string'
        ? `accountId=${encodeURIComponent(options)}`
        : new URLSearchParams(
            Object.entries({
              accountId: options?.accountId,
              kind: options?.kind,
              includeAccounts: options?.includeAccounts ? 'true' : undefined,
            }).flatMap(([key, value]) => (value ? [[key, value]] : []))
          ).toString();
    return apiRequest<{ transactions: Transaction[] }>(`/transactions${query ? `?${query}` : ''}`);
  },
  create: async (data: {
    accountId?: string;
    fromAccountId?: string;
    toAccountId?: string;
    amount: number;
    type?: 'credit' | 'debit';
    transactionKind?: TransactionKind;
    recordInBudget?: boolean;
    label?: string;
    occurredAt?: string;
    categoryId?: string;
    categoryLabel?: string;
    notes?: string;
  }): Promise<ApiResponse<{ transaction: Transaction }>> => {
    return apiRequest<{ transaction: Transaction }>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (
    transactionId: string,
    data: {
      accountId?: string;
      fromAccountId?: string;
      toAccountId?: string;
      amount?: number;
      type?: 'credit' | 'debit';
      transactionKind?: TransactionKind;
      recordInBudget?: boolean;
      label?: string;
      occurredAt?: string;
      categoryId?: string;
      categoryLabel?: string;
      notes?: string;
    }
  ): Promise<ApiResponse<{ transaction: Transaction }>> => {
    return apiRequest<{ transaction: Transaction }>(`/transactions/${transactionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: async (transactionId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/transactions/${transactionId}`, {
      method: 'DELETE',
    });
  },
};

export const categoriesApi = {
  list: async (): Promise<ApiResponse<{ categories: Category[] }>> => {
    return apiRequest<{ categories: Category[] }>('/categories');
  },
};