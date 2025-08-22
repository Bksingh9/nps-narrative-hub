interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'store_manager';
  avatar?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

class AuthService {
  private readonly STORAGE_KEY = 'nps_auth_token';
  private readonly USER_KEY = 'nps_current_user';

  // Demo users for testing
  private readonly demoUsers = [
    // Admin accounts
    {
      email: 'admin@trends.com',
      password: 'admin123',
      user: {
        id: '1',
        email: 'admin@trends.com',
        name: 'Admin User',
        role: 'admin' as const,
        avatar:
          'https://ui-avatars.com/api/?name=Admin+User&background=6366f1&color=fff',
      },
    },
    {
      email: 'admin@reliancetrends.com',
      password: 'admin123',
      user: {
        id: '1',
        email: 'admin@reliancetrends.com',
        name: 'Admin User',
        role: 'admin' as const,
        avatar:
          'https://ui-avatars.com/api/?name=Admin+User&background=6366f1&color=fff',
      },
    },
    // Manager accounts
    {
      email: 'manager@trends.com',
      password: 'manager123',
      user: {
        id: '2',
        email: 'manager@trends.com',
        name: 'Store Manager',
        role: 'store_manager' as const,
        avatar:
          'https://ui-avatars.com/api/?name=Store+Manager&background=10b981&color=fff',
      },
    },
    {
      email: 'manager@reliancetrends.com',
      password: 'manager123',
      user: {
        id: '2',
        email: 'manager@reliancetrends.com',
        name: 'Store Manager',
        role: 'store_manager' as const,
        avatar:
          'https://ui-avatars.com/api/?name=Store+Manager&background=10b981&color=fff',
      },
    },
    // Viewer/User accounts
    {
      email: 'viewer@trends.com',
      password: 'viewer123',
      user: {
        id: '3',
        email: 'viewer@trends.com',
        name: 'Viewer User',
        role: 'user' as const,
        avatar:
          'https://ui-avatars.com/api/?name=Viewer+User&background=f59e0b&color=fff',
      },
    },
    {
      email: 'user@trends.com',
      password: 'user123',
      user: {
        id: '3',
        email: 'user@trends.com',
        name: 'Regular User',
        role: 'user' as const,
        avatar:
          'https://ui-avatars.com/api/?name=Regular+User&background=f59e0b&color=fff',
      },
    },
    {
      email: 'user@reliancetrends.com',
      password: 'user123',
      user: {
        id: '3',
        email: 'user@reliancetrends.com',
        name: 'Regular User',
        role: 'user' as const,
        avatar:
          'https://ui-avatars.com/api/?name=Regular+User&background=f59e0b&color=fff',
      },
    },
  ];

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find matching user
    const demoUser = this.demoUsers.find(
      u => u.email === credentials.email && u.password === credentials.password
    );

    if (demoUser) {
      const token = this.generateToken(demoUser.user);
      this.saveAuth(token, demoUser.user);

      return {
        success: true,
        user: demoUser.user,
        token,
      };
    }

    return {
      success: false,
      message: 'Invalid email or password',
    };
  }

  // Logout
  logout(): void {
    // Clear all auth data
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.USER_KEY);

    // Clear session storage to force login on next visit
    sessionStorage.clear();

    // Only redirect if not already on login page
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();

    // For demo, just check if token and user exist
    return !!(token && user);
  }

  // Get current user
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Get auth token
  getToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  // Save authentication data
  private saveAuth(token: string, user: User): void {
    localStorage.setItem(this.STORAGE_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // Generate mock JWT token
  private generateToken(user: User): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
        iat: Math.floor(Date.now() / 1000),
      })
    );
    const signature = btoa('mock-signature-' + Date.now());

    return `${header}.${payload}.${signature}`;
  }

  // Validate session
  validateSession(): boolean {
    if (!this.isAuthenticated()) {
      this.logout();
      return false;
    }
    return true;
  }

  // Update user profile
  async updateProfile(updates: Partial<User>): Promise<AuthResponse> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        message: 'User not authenticated',
      };
    }

    const updatedUser = { ...currentUser, ...updates };
    localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));

    return {
      success: true,
      user: updatedUser,
    };
  }

  // Change password (mock)
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<AuthResponse> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In a real app, this would validate current password and update on server
    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  // Reset password request (mock)
  async requestPasswordReset(email: string): Promise<AuthResponse> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const userExists = this.demoUsers.some(u => u.email === email);

    if (userExists) {
      return {
        success: true,
        message: 'Password reset link sent to your email',
      };
    }

    return {
      success: false,
      message: 'Email not found in our records',
    };
  }
}

export default new AuthService();
export type { User, LoginCredentials, AuthResponse };
