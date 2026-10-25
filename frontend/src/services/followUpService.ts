import { apiClient } from './apiClient';
import { FollowUp, FollowUpPriority, FollowUpStatus } from '../types';

export interface CreateFollowUpDTO {
  title: string;
  clientId: number;
  dueDate: string;
  assignedStaffId: number;
  priority: FollowUpPriority;
  status: FollowUpStatus;
  notes?: string;
  category: string;
}

export interface UpdateFollowUpStatusDTO {
  status: FollowUpStatus;
  notes?: string;
}

export const followUpService = {
  async getFollowUps(): Promise<FollowUp[]> {
    return apiClient.request<FollowUp[]>('/api/follow-ups', { method: 'GET' });
  },

  async createFollowUp(data: CreateFollowUpDTO): Promise<FollowUp> {
    return apiClient.request<FollowUp>('/api/follow-ups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateFollowUpStatus(id: number, data: UpdateFollowUpStatusDTO): Promise<FollowUp> {
    return apiClient.request<FollowUp>(`/api/follow-ups/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
