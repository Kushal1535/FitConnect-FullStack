/**
 * Centralized API Client for Fit Connect
 * Connects to Java Spring Boot REST API (default: http://localhost:8080)
 * Includes realistic Mock fallback layer so students and reviewers can test all operations
 * with realistic latency, full validation, and state persistence.
 */

import {
  INITIAL_STAFF,
  INITIAL_PLANS,
  INITIAL_CLIENTS,
  INITIAL_COMMUNICATIONS,
  INITIAL_FOLLOW_UPS
} from './mockData';
import {
  User,
  Client,
  MembershipPlan,
  Communication,
  FollowUp,
  DashboardSummary,
  AuthResponse
} from '../types';

export interface ApiError {
  status: number;
  message: string;
  fieldErrors?: Record<string, string>;
  timestamp?: string;
  path?: string;
}

// Local storage keys for mock persistence
const STORAGE_KEYS = {
  TOKEN: 'fitconnect_jwt_token',
  USER: 'fitconnect_current_user',
  CLIENTS: 'fitconnect_mock_clients',
  PLANS: 'fitconnect_mock_plans',
  COMMUNICATIONS: 'fitconnect_mock_comms',
  FOLLOW_UPS: 'fitconnect_mock_followups',
  STAFF: 'fitconnect_mock_staff',
  USE_MOCK: 'fitconnect_use_mock_api',
  API_BASE_URL: 'fitconnect_api_base_url',
};

class ApiService {
  private baseUrl: string;
  private isMockMode: boolean;

  constructor() {
    this.baseUrl =
  localStorage.getItem(STORAGE_KEYS.API_BASE_URL) ||
  (import.meta.env.VITE_API_BASE_URL as string) ||
  'http://localhost:8081';
    
    // Default to mock mode in frontend playground unless explicitly configured
    // Default to the real Spring Boot backend unless explicitly configured
const storedMock = localStorage.getItem(STORAGE_KEYS.USE_MOCK);
this.isMockMode = storedMock !== null ? storedMock === 'true' : false;

    this.initializeMockStorage();
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url;
    localStorage.setItem(STORAGE_KEYS.API_BASE_URL, url);
  }

  public isMock(): boolean {
    return this.isMockMode;
  }

  public setMockMode(enabled: boolean) {
    this.isMockMode = enabled;
    localStorage.setItem(STORAGE_KEYS.USE_MOCK, String(enabled));
  }

  public resetMockData() {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(INITIAL_PLANS));
    localStorage.setItem(STORAGE_KEYS.COMMUNICATIONS, JSON.stringify(INITIAL_COMMUNICATIONS));
    localStorage.setItem(STORAGE_KEYS.FOLLOW_UPS, JSON.stringify(INITIAL_FOLLOW_UPS));
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(INITIAL_STAFF));
  }

  private initializeMockStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PLANS)) {
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(INITIAL_PLANS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMMUNICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.COMMUNICATIONS, JSON.stringify(INITIAL_COMMUNICATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FOLLOW_UPS)) {
      localStorage.setItem(STORAGE_KEYS.FOLLOW_UPS, JSON.stringify(INITIAL_FOLLOW_UPS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.STAFF)) {
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(INITIAL_STAFF));
    }
  }

  public getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  public setToken(token: string | null) {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
  }

  public getCurrentUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }

  /**
   * Universal Request Handler
   * If isMockMode is true, routes to internal memory store
   * If isMockMode is false, makes actual fetch request to Spring Boot backend
   */
  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (this.isMockMode) {
      return this.handleMockRequest<T>(endpoint, options);
    }

    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }

        const apiError: ApiError = {
          status: response.status,
          message: errorData.message || `Request failed with status ${response.status}`,
          fieldErrors: errorData.fieldErrors,
          timestamp: errorData.timestamp,
          path: errorData.path || endpoint,
        };
        throw apiError;
      }

      const responseText = await response.text();

      if (!responseText.trim()) {
        return {} as T;
      }

      try {
        return JSON.parse(responseText) as T;
      } catch {
        throw {
          status: response.status,
          message: 'The server returned an invalid JSON response.',
          path: endpoint,
        } as ApiError;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Realistic Mock Route Handler
   */
  private async handleMockRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
    // Artificial 180ms delay to reflect realistic network latency
    await new Promise((resolve) => setTimeout(resolve, 180));

    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body as string) : null;

    // 1. POST /api/auth/login
    if (endpoint === '/api/auth/login' && method === 'POST') {
      const { email, password } = body;
      const staffList: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF) || '[]');
      const user = staffList.find((u) => u.email.toLowerCase() === email?.toLowerCase());

      if (!user) {
        throw {
          status: 401,
          message: 'Invalid credentials. User email not registered in system.',
        } as ApiError;
      }

      if (!password || password.length < 6) {
        throw {
          status: 400,
          message: 'Password must be at least 6 characters.',
        } as ApiError;
      }

      const mockResponse: AuthResponse = {
        token: `mock_jwt_token_for_${user.id}_${Date.now()}`,
        tokenType: 'Bearer',
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      };
      return mockResponse as unknown as T;
    }

    // 2. GET /api/dashboard/summary
    if (endpoint === '/api/dashboard/summary' && method === 'GET') {
      const clients: Client[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS) || '[]');
      const followUps: FollowUp[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLLOW_UPS) || '[]');
      const communications: Communication[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMUNICATIONS) || '[]');

      const totalClients = clients.length;
      const activeMemberships = clients.filter((c) => c.status === 'ACTIVE').length;
      const pendingFollowUps = followUps.filter((f) => f.status === 'PENDING' || f.status === 'IN_PROGRESS').length;

      const summary: DashboardSummary = {
        totalClients,
        activeMemberships,
        pendingFollowUps,
        totalCommunications: communications.length,
      };
      return summary as unknown as T;
    }

    // 3. GET /api/clients
    if (endpoint === '/api/clients' && method === 'GET') {
      const clients: Client[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS) || '[]');
      return clients as unknown as T;
    }

    // 4. POST /api/clients
    if (endpoint === '/api/clients' && method === 'POST') {
      const clients: Client[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS) || '[]');
      const plans: MembershipPlan[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLANS) || '[]');
      const staffList: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF) || '[]');

      const plan = plans.find((p) => p.id === Number(body.membershipPlanId));
      const staff = staffList.find((s) => s.id === Number(body.assignedStaffId));

      const newClient: Client = {
        id: Math.floor(1000 + Math.random() * 9000),
        fullName: body.fullName,
        phoneNumber: body.phoneNumber,
        email: body.email,
        membershipPlanId: Number(body.membershipPlanId),
        membershipPlanName: plan ? plan.name : 'Standard Plan',
        startDate: body.startDate,
        endDate: body.endDate,
        status: body.status || 'ACTIVE',
        notes: body.notes || '',
        assignedStaffId: staff ? staff.id : undefined,
        assignedStaffName: staff ? staff.fullName : undefined,
        emergencyContact: body.emergencyContact || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      clients.unshift(newClient);
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
      return newClient as unknown as T;
    }

    // 5. GET /api/clients/{id}
    const clientDetailMatch = endpoint.match(/^\/api\/clients\/(\d+)$/);
    if (clientDetailMatch && method === 'GET') {
      const clientId = Number(clientDetailMatch[1]);
      const clients: Client[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS) || '[]');
      const found = clients.find((c) => c.id === clientId);
      if (!found) {
        throw { status: 404, message: `Client with id ${clientId} not found` } as ApiError;
      }
      return found as unknown as T;
    }

    // 6. PUT /api/clients/{id}
    if (clientDetailMatch && method === 'PUT') {
      const clientId = Number(clientDetailMatch[1]);
      const clients: Client[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS) || '[]');
      const plans: MembershipPlan[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLANS) || '[]');
      const staffList: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF) || '[]');

      const index = clients.findIndex((c) => c.id === clientId);
      if (index === -1) {
        throw { status: 404, message: `Client with id ${clientId} not found` } as ApiError;
      }

      const plan = plans.find((p) => p.id === Number(body.membershipPlanId));
      const staff = staffList.find((s) => s.id === Number(body.assignedStaffId));

      const updated: Client = {
        ...clients[index],
        ...body,
        id: clientId,
        membershipPlanName: plan ? plan.name : clients[index].membershipPlanName,
        assignedStaffName: staff ? staff.fullName : clients[index].assignedStaffName,
        updatedAt: new Date().toISOString(),
      };

      clients[index] = updated;
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
      return updated as unknown as T;
    }

    // 7. PATCH /api/clients/{id}/status
    const clientStatusMatch = endpoint.match(/^\/api\/clients\/(\d+)\/status$/);
    if (clientStatusMatch && method === 'PATCH') {
      const clientId = Number(clientStatusMatch[1]);
      const clients: Client[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS) || '[]');
      const index = clients.findIndex((c) => c.id === clientId);
      if (index === -1) {
        throw { status: 404, message: `Client with id ${clientId} not found` } as ApiError;
      }

      clients[index].status = body.status;
      clients[index].updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
      return clients[index] as unknown as T;
    }

    // 8. GET /api/membership-plans
    if ((endpoint === '/api/membership-plans' || endpoint === '/api/memberships') && method === 'GET') {
      const plans: MembershipPlan[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLANS) || '[]');
      return plans as unknown as T;
    }

    // 9. POST /api/membership-plans
    if ((endpoint === '/api/membership-plans' || endpoint === '/api/memberships') && method === 'POST') {
      const plans: MembershipPlan[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLANS) || '[]');
      const newPlan: MembershipPlan = {
        id: plans.length + 1,
        name: body.name,
        durationDays: Number(body.durationDays),
        price: Number(body.price),
        description: body.description || '',
        activeMembersCount: 0,
        features: Array.isArray(body.features) ? body.features : ['All-access membership'],
        status: 'ACTIVE',
      };
      plans.push(newPlan);
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
      return newPlan as unknown as T;
    }

    // 10. GET /api/communications
    if (endpoint === '/api/communications' && method === 'GET') {
      const comms: Communication[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMUNICATIONS) || '[]');
      return comms as unknown as T;
    }

    // 11. POST /api/communications
    if (endpoint === '/api/communications' && method === 'POST') {
      const comms: Communication[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMUNICATIONS) || '[]');
      const clients: Client[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS) || '[]');
      const client = clients.find((c) => c.id === Number(body.clientId));

      const newComm: Communication = {
        id: Math.floor(5000 + Math.random() * 5000),
        clientId: Number(body.clientId),
        clientName: client ? client.fullName : body.clientName || 'Client',
        clientPhone: client ? client.phoneNumber : body.clientPhone || '',
        channel: body.channel,
        category: body.category,
        direction: body.direction,
        messageText: body.messageText,
        deliveryStatus: body.deliveryStatus || 'LOGGED_ONLY',
        loggedByStaffId: Number(body.loggedByStaffId) || 1,
        loggedByStaffName: body.loggedByStaffName || 'Staff Member',
        timestamp: new Date().toISOString(),
        requiresFollowUp: !!body.requiresFollowUp,
        followUpDueDate: body.followUpDueDate,
      };

      comms.unshift(newComm);
      localStorage.setItem(STORAGE_KEYS.COMMUNICATIONS, JSON.stringify(comms));

      // If follow-up was requested, auto-create follow-up task
      if (body.requiresFollowUp && body.followUpDueDate) {
        const followUps: FollowUp[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLLOW_UPS) || '[]');
        const newFollowUp: FollowUp = {
          id: Math.floor(3000 + Math.random() * 3000),
          title: `Follow-up after ${body.channel.toLowerCase()}: ${body.category.toLowerCase().replace('_', ' ')}`,
          clientId: Number(body.clientId),
          clientName: client ? client.fullName : 'Client',
          clientPhone: client ? client.phoneNumber : '',
          dueDate: body.followUpDueDate,
          assignedStaffId: Number(body.loggedByStaffId) || 1,
          assignedStaffName: body.loggedByStaffName || 'Staff Member',
          priority: 'MEDIUM',
          status: 'PENDING',
          category: body.category,
          notes: `Created from communication log: "${body.messageText.substring(0, 60)}..."`,
          createdAt: new Date().toISOString(),
        };
        followUps.unshift(newFollowUp);
        localStorage.setItem(STORAGE_KEYS.FOLLOW_UPS, JSON.stringify(followUps));
      }

      return newComm as unknown as T;
    }

    // 12. GET /api/follow-ups
    if (endpoint === '/api/follow-ups' && method === 'GET') {
      const followUps: FollowUp[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLLOW_UPS) || '[]');
      return followUps as unknown as T;
    }

    // 13. POST /api/follow-ups
    if (endpoint === '/api/follow-ups' && method === 'POST') {
      const followUps: FollowUp[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLLOW_UPS) || '[]');
      const clients: Client[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS) || '[]');
      const staffList: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF) || '[]');

      const client = clients.find((c) => c.id === Number(body.clientId));
      const staff = staffList.find((s) => s.id === Number(body.assignedStaffId));

      const newFollowUp: FollowUp = {
        id: Math.floor(3000 + Math.random() * 3000),
        title: body.title,
        clientId: Number(body.clientId),
        clientName: client ? client.fullName : 'Client',
        clientPhone: client ? client.phoneNumber : '',
        dueDate: body.dueDate,
        assignedStaffId: staff ? staff.id : 1,
        assignedStaffName: staff ? staff.fullName : 'Staff',
        priority: body.priority || 'MEDIUM',
        status: body.status || 'PENDING',
        notes: body.notes || '',
        category: body.category || 'General Follow-up',
        createdAt: new Date().toISOString(),
      };

      followUps.unshift(newFollowUp);
      localStorage.setItem(STORAGE_KEYS.FOLLOW_UPS, JSON.stringify(followUps));
      return newFollowUp as unknown as T;
    }

    // 14. PATCH /api/follow-ups/{id}
    const followUpPatchMatch = endpoint.match(/^\/api\/follow-ups\/(\d+)$/);
    if (followUpPatchMatch && method === 'PATCH') {
      const followUpId = Number(followUpPatchMatch[1]);
      const followUps: FollowUp[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLLOW_UPS) || '[]');
      const index = followUps.findIndex((f) => f.id === followUpId);
      if (index === -1) {
        throw { status: 404, message: `Follow-up with id ${followUpId} not found` } as ApiError;
      }

      followUps[index] = {
        ...followUps[index],
        ...body,
        id: followUpId,
        completedAt: body.status === 'COMPLETED' ? new Date().toISOString() : followUps[index].completedAt,
      };

      localStorage.setItem(STORAGE_KEYS.FOLLOW_UPS, JSON.stringify(followUps));
      return followUps[index] as unknown as T;
    }

    // 15. GET /api/staff & POST /api/staff
    if (endpoint === '/api/staff' && method === 'GET') {
      const staffList: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF) || '[]');
      return staffList as unknown as T;
    }

    if (endpoint === '/api/staff' && method === 'POST') {
      const staffList: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF) || '[]');
      const newStaff: User = {
        id: staffList.length + 1,
        fullName: body.fullName,
        email: body.email,
        role: body.role || 'STAFF',
        phone: body.phone || '',
        active: true,
        createdAt: new Date().toISOString(),
      };
      staffList.push(newStaff);
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staffList));
      return newStaff as unknown as T;
    }

    throw {
      status: 404,
      message: `Endpoint ${method} ${endpoint} not mapped in mock router`,
    } as ApiError;
  }
}

export const apiClient = new ApiService();
