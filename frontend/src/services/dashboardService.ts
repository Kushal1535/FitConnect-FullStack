import { apiClient } from './apiClient';
import { DashboardSummary } from '../types';

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    return apiClient.request<DashboardSummary>('/api/dashboard/summary', { method: 'GET' });
  },
};
