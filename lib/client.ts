/**
 * ProspectEngine Frontend Client
 * Handles authentication and API communication with Neon PostgreSQL backend
 */

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    company_name: string;
    status: string;
    created_at: string;
    email_verified: boolean;
  };
  expiresIn: number;
}

interface Lead {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  location?: string;
  status: string;
  lead_score?: number;
  created_at: string;
  updated_at: string;
}

interface SearchCriteria {
  id: string;
  name: string;
  platform: string;
  keywords: string[];
  location?: string;
  is_active: boolean;
  created_at: string;
}

class ProspectEngineClient {
  private token: string | null = null;
  private apiUrl: string;
  private userId: string | null = null;

  constructor(apiUrl: string = '/api') {
    this.apiUrl = apiUrl;
    this.loadTokenFromStorage();
  }

  /**
   * Load token from localStorage
   */
  private loadTokenFromStorage(): void {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
      this.userId = localStorage.getItem('user_id');
    }
  }

  /**
   * Save token to localStorage
   */
  private saveTokenToStorage(token: string, userId: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_id', userId);
      this.token = token;
      this.userId = userId;
    }
  }

  /**
   * Clear authentication
   */
  clearAuth(): void {
    this.token = null;
    this.userId = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
    }
  }

  /**
   * Register a new user
   */
  async register(email: string, password: string, fullName: string, company?: string): Promise<AuthResponse> {
    const response = await fetch(`${this.apiUrl}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'register',
        email,
        password,
        full_name: fullName,
        company_name: company || '',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();
    this.saveTokenToStorage(data.data.token, data.data.user.id);
    return data.data;
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.apiUrl}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email,
        password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    this.saveTokenToStorage(data.data.token, data.data.user.id);
    return data.data;
  }

  /**
   * Verify current token
   */
  async verify(): Promise<{ user: AuthResponse['user'] } | null> {
    if (!this.token) {
      return null;
    }

    const response = await fetch(`${this.apiUrl}/auth`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        action: 'verify',
        token: this.token,
      }),
    });

    if (!response.ok) {
      this.clearAuth();
      return null;
    }

    return response.json();
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token && !!this.userId;
  }

  /**
   * Make authenticated request
   */
  private async authenticatedRequest(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<any> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.apiUrl}${endpoint}`, options);

    if (response.status === 401) {
      this.clearAuth();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get all leads for current user
   */
  async getLeads(): Promise<Lead[]> {
    const data = await this.authenticatedRequest('/leads');
    return data.data || [];
  }

  /**
   * Create a new lead
   */
  async createLead(leadData: Partial<Lead>): Promise<Lead> {
    const data = await this.authenticatedRequest('/leads', 'POST', leadData);
    return data.data;
  }

  /**
   * Update a lead
   */
  async updateLead(leadId: string, updates: Partial<Lead>): Promise<Lead> {
    const data = await this.authenticatedRequest(`/leads/${leadId}`, 'PATCH', updates);
    return data.data;
  }

  /**
   * Delete a lead
   */
  async deleteLead(leadId: string): Promise<void> {
    await this.authenticatedRequest(`/leads/${leadId}`, 'DELETE');
  }

  /**
   * Get search criteria
   */
  async getSearchCriteria(): Promise<SearchCriteria[]> {
    const data = await this.authenticatedRequest('/search-criteria');
    return data.data || [];
  }

  /**
   * Create search criteria
   */
  async createSearchCriteria(criteria: Partial<SearchCriteria>): Promise<SearchCriteria> {
    const data = await this.authenticatedRequest('/search-criteria', 'POST', criteria);
    return data.data;
  }

  /**
   * Export leads to CSV
   */
  async exportLeads(format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const response = await fetch(`${this.apiUrl}/leads/export?format=${format}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }

  /**
   * Get analytics for current user
   */
  async getAnalytics(): Promise<any> {
    return this.authenticatedRequest('/analytics');
  }
}

// Singleton instance
let clientInstance: ProspectEngineClient;

export function getClient(): ProspectEngineClient {
  if (!clientInstance) {
    clientInstance = new ProspectEngineClient();
  }
  return clientInstance;
}

export default ProspectEngineClient;
