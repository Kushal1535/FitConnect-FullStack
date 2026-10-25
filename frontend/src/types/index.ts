/**
 * Fit Connect - TypeScript Domain Types
 * Prepared for Java Spring Boot REST API integration with MySQL persistence
 */

export type UserRole = 'ADMIN' | 'STAFF';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  active?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  fullName: string;
  email: string;
  role: UserRole;
}

export type ClientStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'INACTIVE';

export interface Client {
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string;
  membershipPlanId: number;
  membershipPlanName: string;
  startDate: string; // ISO date 'YYYY-MM-DD'
  endDate: string;   // ISO date 'YYYY-MM-DD'
  status: ClientStatus;
  notes: string;
  assignedStaffId?: number;
  assignedStaffName?: string;
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipPlan {
  id: number;
  name: string;
  durationDays: number;
  price: number;
  description: string;
  activeMembersCount: number;
  features: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export type CommunicationChannel = 'WHATSAPP' | 'CALL' | 'EMAIL' | 'IN_PERSON' | 'INTERNAL_NOTE';

export type CommunicationCategory = 
  | 'INQUIRY' 
  | 'MEMBERSHIP_RENEWAL' 
  | 'ATTENDANCE_FOLLOWUP' 
  | 'PAYMENT_BILLING' 
  | 'GENERAL_SUPPORT';

export type CommunicationDirection = 'INCOMING' | 'OUTGOING' | 'INTERNAL';

export type DeliveryStatus = 
  | 'DELIVERED' 
  | 'READ' 
  | 'PENDING' 
  | 'FAILED' 
  | 'RECEIVED' 
  | 'LOGGED_ONLY';

export interface Communication {
  id: number;
  clientId: number;
  clientName: string;
  clientPhone: string;
  channel: CommunicationChannel;
  category: CommunicationCategory;
  direction: CommunicationDirection;
  messageText: string;
  deliveryStatus: DeliveryStatus;
  loggedByStaffId: number;
  loggedByStaffName: string;
  timestamp: string;
  requiresFollowUp: boolean;
  followUpDueDate?: string;
}

export type FollowUpPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type FollowUpStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

export interface FollowUp {
  id: number;
  title: string;
  clientId: number;
  clientName: string;
  clientPhone: string;
  dueDate: string; // 'YYYY-MM-DD'
  assignedStaffId: number;
  assignedStaffName: string;
  priority: FollowUpPriority;
  status: FollowUpStatus;
  notes?: string;
  category: string;
  createdAt: string;
  completedAt?: string;
}

export interface Activity {
  id: number;
  type: 'NEW_CLIENT' | 'MEMBERSHIP_RENEWAL' | 'COMMUNICATION' | 'FOLLOWUP_COMPLETED' | 'STATUS_CHANGE';
  description: string;
  clientName: string;
  clientId?: number;
  timestamp: string;
  staffName: string;
}

export interface DashboardSummary {
  totalClients?: number;
  activeMemberships?: number;
  pendingFollowUps?: number;
  totalCommunications?: number;
  expiringSoonMemberships?: number;
  overdueFollowUps?: number;
  recentActivities?: Activity[];
  todayFollowUps?: FollowUp[];
  monthlyTrends?: {
    month: string;
    activeCount: number;
    newSignups: number;
    renewals: number;
  }[];
}

export interface MessageTemplate {
  id: string;
  title: string;
  category: CommunicationCategory;
  text: string;
  suggestedChannel: CommunicationChannel;
}
