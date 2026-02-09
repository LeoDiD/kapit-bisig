/**
 * API Service for Kapit-Bisig Web Application
 * 
 * Centralized API client with authentication support and type safety.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * User Roles for RBAC
 */
export type UserRole = 'Admin' | 'Staff' | 'Volunteer';

/**
 * User Status
 */
export type UserStatus = 'Active' | 'Inactive' | 'Suspended';

/**
 * User interface
 */
export interface User {
  id: string;
  _id?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  barangay?: string;
  phoneNumber?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
}

/**
 * Create user data
 */
export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  barangay?: string;
  phoneNumber?: string;
  status?: UserStatus;
}

/**
 * Update user data
 */
export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  barangay?: string;
  phoneNumber?: string;
  status?: UserStatus;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * User statistics
 */
export interface UserStats {
  total: number;
  byRole: {
    admin: number;
    staff: number;
    volunteer: number;
  };
  byStatus: {
    active: number;
    inactive: number;
  };
}

/**
 * Available roles response
 */
export interface AvailableRoles {
  webRoles: UserRole[];
  mobileRoles: UserRole[];
  availableRoles: UserRole[];
}

/**
 * Distribution data from API
 */
export interface DistributionData {
  id: string;
  _id: string;
  barangay: string;
  scheduled: string;
  households: number;
  notes?: string;
  status: 'Unclaimed' | 'Claimed';
  claimedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get auth token from localStorage
 */
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

/**
 * Create headers with authentication
 */
const createHeaders = (includeAuth = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

/**
 * Handle API response
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  
  if (!response.ok) {
    const error = new Error(data.message || 'An error occurred');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).response = data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).status = response.status;
    throw error;
  }
  
  return data;
}

/**
 * API Client
 */
export const api = {
  // ==================== USERS ====================
  
  /**
   * Get all users with optional filtering
   */
  async getUsers(params?: {
    role?: UserRole;
    status?: UserStatus;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<User[]>> {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.append('role', params.role);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const url = `${API_URL}/users${searchParams.toString() ? `?${searchParams}` : ''}`;
    const response = await fetch(url, {
      headers: createHeaders(),
    });
    
    return handleResponse<ApiResponse<User[]>>(response);
  },

  /**
   * Get user by ID
   */
  async getUser(id: string): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_URL}/users/${id}`, {
      headers: createHeaders(),
    });
    return handleResponse<ApiResponse<User>>(response);
  },

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<ApiResponse<UserStats>> {
    const response = await fetch(`${API_URL}/users/stats`, {
      headers: createHeaders(),
    });
    return handleResponse<ApiResponse<UserStats>>(response);
  },

  /**
   * Get available roles for current user
   */
  async getAvailableRoles(): Promise<ApiResponse<AvailableRoles>> {
    const response = await fetch(`${API_URL}/users/roles/available`, {
      headers: createHeaders(),
    });
    return handleResponse<ApiResponse<AvailableRoles>>(response);
  },

  /**
   * Create a new user
   */
  async createUser(data: CreateUserData): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<User>>(response);
  },

  /**
   * Update user
   */
  async updateUser(id: string, data: UpdateUserData): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<User>>(response);
  },

  /**
   * Update user status
   */
  async updateUserStatus(id: string, status: UserStatus): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_URL}/users/${id}/status`, {
      method: 'PATCH',
      headers: createHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse<ApiResponse<User>>(response);
  },

  /**
   * Reset user password
   */
  async resetUserPassword(id: string, newPassword: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_URL}/users/${id}/password`, {
      method: 'PATCH',
      headers: createHeaders(),
      body: JSON.stringify({ newPassword }),
    });
    return handleResponse<ApiResponse<void>>(response);
  },

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleResponse<ApiResponse<void>>(response);
  },

  // ==================== AUTH ====================

  /**
   * Login
   */
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: createHeaders(false),
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<ApiResponse<{ token: string; user: User }>>(response);
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: createHeaders(),
    });
    return handleResponse<ApiResponse<User>>(response);
  },

  // ==================== HEALTH ====================

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) throw new Error('Server is not responding');
    return response.json();
  },

  // ==================== DISTRIBUTIONS ====================

  /**
   * Get all distributions
   */
  async getDistributions(): Promise<ApiResponse<DistributionData[]>> {
    const response = await fetch(`${API_URL}/distributions`, {
      headers: createHeaders(),
      credentials: 'include',
    });
    return handleResponse<ApiResponse<DistributionData[]>>(response);
  },

  /**
   * Create a new distribution
   */
  async createDistribution(data: {
    barangay: string;
    scheduled: string;
    households: number;
    notes?: string;
  }): Promise<ApiResponse<DistributionData>> {
    const response = await fetch(`${API_URL}/distributions`, {
      method: 'POST',
      headers: createHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<DistributionData>>(response);
  },

  /**
   * Mark a distribution as claimed
   */
  async claimDistribution(id: string): Promise<ApiResponse<DistributionData>> {
    const response = await fetch(`${API_URL}/distributions/${id}/claim`, {
      method: 'PATCH',
      headers: createHeaders(),
      credentials: 'include',
    });
    return handleResponse<ApiResponse<DistributionData>>(response);
  },
};

export default api;
