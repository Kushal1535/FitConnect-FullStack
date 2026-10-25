import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  Send,
  PhoneCall,
  Mail,
  FileText,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Calendar,
  Layers,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import {
  communicationService,
  CreateCommunicationDTO,
} from '../services/communicationService';
import { clientService } from '../services/clientService';
import {
  Communication,
  Client,
  CommunicationChannel,
  CommunicationCategory,
  CommunicationDirection,
  DeliveryStatus,
  MessageTemplate
} from '../types';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { WhatsAppNotice } from '../components/common/WhatsAppNotice';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const CommunicationsPage: React.FC = () => {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchParams] = useSearchParams();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [deliveryFilter, setDeliveryFilter] = useState<string>('ALL');

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(
    searchParams.get('action') === 'record'
  );
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);

  // Form State
  const initialForm: CreateCommunicationDTO = {
    clientId: 101,
    channel: 'WHATSAPP',
    category: 'MEMBERSHIP_RENEWAL',
    direction: 'OUTGOING',
    messageText: '',
    deliveryStatus: 'LOGGED_ONLY',
    loggedByStaffId: 1,
    loggedByStaffName: 'Staff Member',
    requiresFollowUp: false,
    followUpDueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
  };
  const [formData, setFormData] = useState<CreateCommunicationDTO>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showSuccess, showError, showInfo } = useNotification();
  const { user } = useAuth();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [comms, clientList] = await Promise.all([
        communicationService.getCommunications(),
        clientService.getClients(),
      ]);
      setCommunications(comms);
      setClients(clientList);
      setTemplates(communicationService.getPredefinedTemplates());

      if (clientList.length > 0) {
        setFormData((prev) => ({
          ...prev,
          clientId: clientList[0].id,
          loggedByStaffId: user?.id || 1,
          loggedByStaffName: user?.fullName || 'Staff Member',
        }));
      }
    } catch (err: any) {
      showError('Failed to load communications', err.message || 'API error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.messageText.trim()) {
      showError('Validation Error', 'Message text or consultation notes cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      const client = clients.find((c) => c.id === Number(formData.clientId));

      // Explicit honest delivery status check
      let status: DeliveryStatus = formData.deliveryStatus || 'LOGGED_ONLY';
      if (formData.channel === 'WHATSAPP') {
        // Honest messaging flag: mark logged internally unless webhook connected
        status = 'LOGGED_ONLY';
      }

      const created = await communicationService.recordCommunication({
        clientId: Number(formData.clientId),
        channel: formData.channel,
        subject: `${formData.category.replace(/_/g, ' ')} - ${client?.fullName || 'Client'}`,
        message: formData.messageText.trim(),
      });

      setCommunications((prev) => [created, ...prev]);
      showSuccess(
        'Communication Logged',
        `Interaction with ${client?.fullName || 'Client'} recorded via Spring Boot.`
      );
      setIsRecordModalOpen(false);
      setFormData(initialForm);
    } catch (err: any) {
      showError('Failed to record', err.message || 'Server error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyTemplate = (tmpl: MessageTemplate) => {
    const client = clients.find((c) => c.id === formData.clientId) || clients[0];
    const interpolated = communicationService.formatTemplateText(tmpl.text, {
      client_name: client?.fullName || 'Member',
      plan_name: client?.membershipPlanName || 'Membership Plan',
      end_date: client?.endDate || 'Soon',
      staff_name: user?.fullName || 'Fit Connect Trainer',
      date_time: 'Tomorrow at 10:00 AM',
    });

    setFormData((prev) => ({
      ...prev,
      category: tmpl.category,
      channel: tmpl.suggestedChannel,
      messageText: interpolated,
    }));
    setIsTemplateModalOpen(false);
    showInfo('Template Inserted', `Template "${tmpl.title}" populated with client variables.`);
  };

  // Filtered Communications
  const filteredComms = useMemo(() => {
    return communications.filter((comm) => {
      const matchesSearch =
        comm.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comm.messageText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comm.clientPhone.includes(searchQuery);

      const matchesChannel =
        channelFilter === 'ALL' || comm.channel === channelFilter;

      const matchesCategory =
        categoryFilter === 'ALL' || comm.category === categoryFilter;

      const matchesDelivery =
        deliveryFilter === 'ALL' || comm.deliveryStatus === deliveryFilter;

      return matchesSearch && matchesChannel && matchesCategory && matchesDelivery;
    });
  }, [communications, searchQuery, channelFilter, categoryFilter, deliveryFilter]);

  const getChannelIcon = (channel: CommunicationChannel) => {
    switch (channel) {
      case 'WHATSAPP':
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      case 'CALL':
        return <PhoneCall className="w-4 h-4 text-blue-600" />;
      case 'EMAIL':
        return <Mail className="w-4 h-4 text-purple-600" />;
      case 'IN_PERSON':
        return <UserCheck className="w-4 h-4 text-amber-600" />;
      case 'INTERNAL_NOTE':
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Log Communication Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Communication Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Omni-channel client interactions, WhatsApp Business Platform bridge, and internal audit notes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Templates ({templates.length})</span>
          </button>
          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Record Communication</span>
          </button>
        </div>
      </div>

      {/* WhatsApp Platform Policy Notice */}
      <WhatsAppNotice />

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search communications, notes, phone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="w-full sm:w-auto flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1 text-xs text-slate-600 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Channel:</span>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="py-1 px-2 border border-slate-300 rounded-md text-xs bg-white text-slate-800 focus:ring-emerald-500"
            >
              <option value="ALL">All Channels</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="CALL">Phone Call</option>
              <option value="EMAIL">Email</option>
              <option value="IN_PERSON">In-Person</option>
              <option value="INTERNAL_NOTE">Internal Note</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-600 shrink-0">
            <span>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-1 px-2 border border-slate-300 rounded-md text-xs bg-white text-slate-800 focus:ring-emerald-500"
            >
              <option value="ALL">All Categories</option>
              <option value="MEMBERSHIP_RENEWAL">Renewal</option>
              <option value="INQUIRY">Inquiry</option>
              <option value="ATTENDANCE_FOLLOWUP">Attendance</option>
              <option value="PAYMENT_BILLING">Billing</option>
              <option value="GENERAL_SUPPORT">Support</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-600 shrink-0">
            <span>Status:</span>
            <select
              value={deliveryFilter}
              onChange={(e) => setDeliveryFilter(e.target.value)}
              className="py-1 px-2 border border-slate-300 rounded-md text-xs bg-white text-slate-800 focus:ring-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="LOGGED_ONLY">Logged Only</option>
              <option value="DELIVERED">Delivered</option>
              <option value="READ">Read</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Communications Stream */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12">
            <LoadingSpinner size="md" text="Loading communication logs..." />
          </div>
        ) : filteredComms.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No Communications Found"
            description="No logs matching your current filters. Record a new interaction or clear filters."
            actionText="Record Communication"
            onAction={() => setIsRecordModalOpen(true)}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredComms.map((comm) => (
              <div key={comm.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100">
                      {getChannelIcon(comm.channel)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">
                        {comm.clientName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                        {comm.clientPhone}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {(comm.category ?? 'GENERAL').replace(/_/g, ' ')}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${comm.direction === 'INCOMING'
                          ? 'bg-blue-50 text-blue-700'
                          : comm.direction === 'OUTGOING'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-purple-50 text-purple-700'
                        }`}
                    >
                      {comm.direction}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                      {new Date(comm.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pl-8">
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-lg border border-slate-100 font-normal">
                    {comm.messageText}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-3">
                      <span>Logged by: <strong className="font-semibold text-slate-700">{comm.loggedByStaffName}</strong></span>
                      {comm.requiresFollowUp && (
                        <span className="text-amber-700 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Follow-up scheduled: {comm.followUpDueDate}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Delivery Status:</span>
                      <span className="font-semibold text-slate-700">
                        {(comm.deliveryStatus ?? 'UNKNOWN').replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record Communication Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Client Communication"
        description="Records incoming/outgoing contact in Spring Boot POST /api/communications"
        maxWidth="xl"
      >
        <form onSubmit={handleRecordCommunication} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Select Client *</label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: Number(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-emerald-500"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.phoneNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Channel *</label>
              <select
                value={formData.channel}
                onChange={(e) =>
                  setFormData({ ...formData, channel: e.target.value as CommunicationChannel })
                }
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-emerald-500"
              >
                <option value="WHATSAPP">WhatsApp (Meta Cloud API layer)</option>
                <option value="CALL">Phone Call</option>
                <option value="EMAIL">Email</option>
                <option value="IN_PERSON">In-Person Consultation</option>
                <option value="INTERNAL_NOTE">Internal Staff Note</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Category *</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as CommunicationCategory })
                }
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-emerald-500"
              >
                <option value="MEMBERSHIP_RENEWAL">Membership Renewal</option>
                <option value="INQUIRY">Inquiry / Consultation</option>
                <option value="ATTENDANCE_FOLLOWUP">Attendance & Check-in</option>
                <option value="PAYMENT_BILLING">Payment & Billing</option>
                <option value="GENERAL_SUPPORT">General Member Support</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Direction</label>
              <select
                value={formData.direction}
                onChange={(e) =>
                  setFormData({ ...formData, direction: e.target.value as CommunicationDirection })
                }
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-emerald-500"
              >
                <option value="OUTGOING">Outgoing (From Fit Connect staff)</option>
                <option value="INCOMING">Incoming (From client)</option>
                <option value="INTERNAL">Internal Note only</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Message / Notes *</label>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(true)}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                Insert Predefined Template
              </button>
            </div>
            <textarea
              rows={4}
              value={formData.messageText}
              onChange={(e) => setFormData({ ...formData, messageText: e.target.value })}
              placeholder="Enter message text, consultation notes, or phone summary..."
              className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Schedule automatic follow-up checkbox */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={formData.requiresFollowUp}
                onChange={(e) => setFormData({ ...formData, requiresFollowUp: e.target.checked })}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Automatically schedule a follow-up task for this client</span>
            </label>

            {formData.requiresFollowUp && (
              <div className="pt-2 flex items-center gap-3">
                <label className="text-xs text-slate-600">Follow-up Due Date:</label>
                <input
                  type="date"
                  value={formData.followUpDueDate}
                  onChange={(e) => setFormData({ ...formData, followUpDueDate: e.target.value })}
                  className="px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white focus:ring-emerald-500"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Log Communication'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Message Templates Selector Modal */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Predefined Message Templates"
        description="Standardized fitness member messages with dynamic variable substitution"
        maxWidth="lg"
      >
        <div className="space-y-3">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="p-3 border border-slate-200 rounded-lg hover:border-slate-300 bg-white space-y-1.5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">{tmpl.title}</span>
                <span className="text-[10px] font-semibold text-slate-500 px-1.5 py-0.5 rounded bg-slate-100">
                  {tmpl.category.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-mono bg-slate-50 p-2 rounded">
                {tmpl.text}
              </p>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition-colors"
                >
                  Use This Template
                </button>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};
