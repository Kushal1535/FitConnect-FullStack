import { apiClient } from './apiClient';
import { 
  Communication, 
  CommunicationChannel, 
  CommunicationCategory, 
  CommunicationDirection, 
  DeliveryStatus,
  MessageTemplate 
} from '../types';
import { INITIAL_TEMPLATES } from './mockData';

export interface CreateCommunicationDTO {
  clientId: number;
  clientName?: string;
  clientPhone?: string;
  channel: CommunicationChannel;
  category: CommunicationCategory;
  direction: CommunicationDirection;
  messageText: string;
  deliveryStatus?: DeliveryStatus;
  loggedByStaffId: number;
  loggedByStaffName: string;
  requiresFollowUp?: boolean;
  followUpDueDate?: string;
}

export interface CreateCommunicationRequest {
  clientId: number;
  channel: CommunicationChannel;
  subject: string;
  message: string;
}

export const communicationService = {
  async getCommunications(): Promise<Communication[]> {
    return apiClient.request<Communication[]>('/api/communications', { method: 'GET' });
  },

  async recordCommunication(data: CreateCommunicationRequest): Promise<Communication> {
    return apiClient.request<Communication>('/api/communications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getPredefinedTemplates(): MessageTemplate[] {
    return INITIAL_TEMPLATES;
  },

  /**
   * Helper to format a template with actual client variables
   */
  formatTemplateText(templateText: string, variables: Record<string, string>): string {
    let result = templateText;
    for (const [key, val] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
    }
    return result;
  },
};
