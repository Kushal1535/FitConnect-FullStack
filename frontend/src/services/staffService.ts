
import { apiClient } from './apiClient';

export interface CreateStaffDTO {
  fullName: string;
  email: string;
  phoneNumber: string;
  designation: string;
}

/**
 * Matches the backend StaffResponse DTO.
 * System role and professional designation are separate fields.
 */
export interface StaffRecord {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  designation: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const staffService = {
  async getStaff(): Promise<StaffRecord[]> {
    return apiClient.request<StaffRecord[]>('/api/staff', {
      method: 'GET',
    });
  },

  /**
   * Requests a staff invitation.
   * The staff account is created after OTP verification
   * and password setup, not when the invitation is sent.
   */
  async createStaff(data: CreateStaffDTO): Promise<void> {
    await apiClient.request<void>('/api/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Updates the professional designation only.
   * Does not modify the ADMIN or STAFF system role.
   */
  async updateDesignation(
    id: number | string,
    designation: string,
  ): Promise<StaffRecord> {
    return apiClient.request<StaffRecord>(
      `/api/staff/${id}/designation`,
      {
        method: 'PATCH',
        body: JSON.stringify({ designation }),
      },
    );
  },

  async updateStatus(
    id: number | string,
    active: boolean,
  ): Promise<StaffRecord> {
    return apiClient.request<StaffRecord>(
      `/api/staff/${id}/status?active=${active}`,
      { method: 'PATCH' },
    );
  },

  async deleteStaff(id: number | string): Promise<void> {
    await apiClient.request<void>(`/api/staff/${id}`, {
      method: 'DELETE',
    });
  },
};
