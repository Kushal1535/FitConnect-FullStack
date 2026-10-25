import { apiClient } from './apiClient';
import { MembershipPlan } from '../types';

export interface CreateMembershipPlanDTO {
  name: string;
  durationDays: number;
  price: number;
  description: string;
  features: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export const membershipService = {
  async getPlans(): Promise<MembershipPlan[]> {
    return apiClient.request<MembershipPlan[]>('/api/membership-plans', { method: 'GET' });
  },

  async createPlan(data: CreateMembershipPlanDTO): Promise<MembershipPlan> {
    return apiClient.request<MembershipPlan>('/api/membership-plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
