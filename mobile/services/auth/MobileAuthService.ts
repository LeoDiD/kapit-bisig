/**
 * Mobile Authentication Service
 * 
 * Handles volunteer authentication for the mobile app.
 * Volunteers are created by Admins/Staff in the web app
 * and use these credentials to log in to the mobile app.
 * 
 * Features:
 * - Secure login with JWT tokens
 * - Token storage using SecureStore
 * - Auto token refresh
 * - Role validation (only Volunteer role allowed)
 */

import * as SecureStore from 'expo-secure-store';
import { resolveApiBaseUrl } from '../config/apiSecurity';

// Configuration
const API_CONFIG = {
  baseUrl: resolveApiBaseUrl(
    process.env.EXPO_PUBLIC_API_URL,
    'http://localhost:3001/api',
    'MobileAuthService',
  ),
  timeout: 15000,
};

// Storage keys
const STORAGE_KEYS = {
  AUTH_TOKEN: '@kapit_bisig_auth_token',
  USER_DATA: '@kapit_bisig_user_data',
};

/**
 * User Role type
 */
export type UserRole = 'Admin' | 'Staff' | 'Volunteer';

/**
 * User Status type
 */
export type UserStatus = 'Active' | 'Inactive' | 'Suspended';

/**
 * User interface
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  barangay?: string;
  phoneNumber?: string;
  lastLogin?: string;
}

/**
 * Auth Response interface
 */
export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    token: string;
  };
  code?: string;
}

/**
 * API Error interface
 */
export interface ApiError {
  success: false;
  message: string;
  code?: string;
}

/**
 * Mobile Authentication Service Class
 */
class MobileAuthService {
  private token: string | null = null;
  private user: User | null = null;
  private isInitialized = false;

  /**
   * Initialize the auth service
   * Call this when the app starts to restore saved session
   */
  async initialize(): Promise<boolean> {
    try {
      const [storedToken, storedUser] = await Promise.all([
        this.getStoredItem(STORAGE_KEYS.AUTH_TOKEN),
        this.getStoredItem(STORAGE_KEYS.USER_DATA),
      ]);

      if (storedToken && storedUser) {
        this.token = storedToken;
        this.user = JSON.parse(storedUser);
        
        // Validate the token is still valid
        const isValid = await this.validateToken();
        if (!isValid) {
          await this.logout();
          this.isInitialized = true;
          return false;
        }
        
        this.isInitialized = true;
        return true;
      }

      this.isInitialized = true;
      return false;
    } catch (error) {
      console.error('[MobileAuthService] Initialization error:', error);
      this.isInitialized = true;
      return false;
    }
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return !!this.token && !!this.user;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.user;
  }

  /**
   * Get auth token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Login with email and password
   * Only allows Volunteer role users
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // Validate inputs
      if (!email || !password) {
        return {
          success: false,
          message: 'Email and password are required',
        };
      }

      const response = await fetch(`${API_CONFIG.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Login failed',
          code: data.code,
        };
      }

      if (!data.success || !data.data) {
        return {
          success: false,
          message: data.message || 'Invalid response from server',
        };
      }

      const { user, token } = data.data;

      // Validate role - only Volunteers can use mobile app
      if (user.role !== 'Volunteer') {
        return {
          success: false,
          message: 'This app is only for volunteers. Please use the web application.',
          code: 'INVALID_ROLE',
        };
      }

      // Store credentials
      await this.storeCredentials(token, user);

      return {
        success: true,
        message: 'Login successful',
        data: { user, token },
      };
    } catch (error) {
      console.error('[MobileAuthService] Login error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Logout and clear stored credentials
   */
  async logout(): Promise<void> {
    try {
      this.token = null;
      this.user = null;

      await Promise.all([
        this.deleteStoredItem(STORAGE_KEYS.AUTH_TOKEN),
        this.deleteStoredItem(STORAGE_KEYS.USER_DATA),
      ]);
    } catch (error) {
      console.error('[MobileAuthService] Logout error:', error);
    }
  }

  /**
   * Validate the current token
   */
  async validateToken(): Promise<boolean> {
    if (!this.token) return false;

    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Update user data
        this.user = data.data;
        await this.setStoredItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.data));
        return true;
      }

      return false;
    } catch (error) {
      console.error('[MobileAuthService] Token validation error:', error);
      return false;
    }
  }

  /**
   * Store credentials securely
   */
  private async storeCredentials(token: string, user: User): Promise<void> {
    this.token = token;
    this.user = user;

    await Promise.all([
      this.setStoredItem(STORAGE_KEYS.AUTH_TOKEN, token),
      this.setStoredItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user)),
    ]);
  }

  private async getStoredItem(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  }

  private async setStoredItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }

  private async deleteStoredItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  }

  /**
   * Create authenticated headers for API calls
   */
  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Make an authenticated API request
   */
  async authenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    if (!this.token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle token expiration
        if (response.status === 401) {
          await this.logout();
          return { success: false, error: 'Session expired. Please log in again.' };
        }

        return { success: false, error: data.message || 'Request failed' };
      }

      return { success: true, data };
    } catch (error) {
      console.error('[MobileAuthService] Request error:', error);
      return { success: false, error: 'Network error' };
    }
  }
}

// Export singleton instance
export const mobileAuthService = new MobileAuthService();

export default mobileAuthService;
