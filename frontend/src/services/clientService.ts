import { apiClient } from './apiClient';
import { Client, ClientStatus } from '../types';

export interface CreateClientDTO {
  fullName: string;
  phoneNumber: string;
  email: string;
  membershipPlanId: number;
  startDate: string;
  endDate: string;
  status: ClientStatus;
  notes?: string;
  assignedStaffId?: number;
  emergencyContact?: string;
}

export interface UpdateClientDTO extends Partial<CreateClientDTO> {}

export const clientService = {
  async getClients(): Promise<Client[]> {
    return apiClient.request<Client[]>('/api/clients', { method: 'GET' });
  },

  async getClientById(id: number): Promise<Client> {
    return apiClient.request<Client>(`/api/clients/${id}`, { method: 'GET' });
  },

  async createClient(data: CreateClientDTO): Promise<Client> {
    return apiClient.request<Client>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateClient(id: number, data: UpdateClientDTO): Promise<Client> {
    return apiClient.request<Client>(`/api/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async updateClientStatus(id: number, status: ClientStatus): Promise<Client> {
    return apiClient.request<Client>(`/api/clients/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
