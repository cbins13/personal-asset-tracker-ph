const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface AuthResponse {
  success: boolean;
  token?: string;
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

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important for sessions
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'An error occurred',
        message: data.message,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
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
