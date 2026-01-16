const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export const api = {
  // Users
  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_URL}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  async getUser(id: string): Promise<User> {
    const response = await fetch(`${API_URL}/users/${id}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  async createUser(data: CreateUserData): Promise<User> {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },

  async deleteUser(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete user');
  },

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) throw new Error('Server is not responding');
    return response.json();
  },
};

export default api;
