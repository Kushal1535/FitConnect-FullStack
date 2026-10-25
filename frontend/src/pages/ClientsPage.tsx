import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  Phone, 
  Mail, 
  Edit2, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  MessageSquare,
  Clock,
  ShieldAlert,
  ArrowUpDown
} from 'lucide-react';
import { clientService, CreateClientDTO, UpdateClientDTO } from '../services/clientService';
import { membershipService } from '../services/membershipService';
import { staffService } from '../services/staffService';
import { communicationService } from '../services/communicationService';
import { Client, ClientStatus, MembershipPlan, User, Communication } from '../types';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner, TableSkeleton } from '../components/common/LoadingSpinner';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Search
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'ALL');
  const [planFilter, setPlanFilter] = useState<string>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(searchParams.get('action') === 'add');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [deactivatingClient, setDeactivatingClient] = useState<Client | null>(null);
  const [clientComms, setClientComms] = useState<Communication[]>([]);

  // Form State
  const initialFormData: CreateClientDTO = {
    fullName: '',
    phoneNumber: '',
    email: '',
    membershipPlanId: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    status: 'ACTIVE',
    notes: '',
    assignedStaffId: 1,
    emergencyContact: '',
  };
  const [formData, setFormData] = useState<CreateClientDTO>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { showSuccess, showError, showWarning } = useNotification();
  const { user } = useAuth();

  
const loadInitialData = async () => {
  setIsLoading(true);

  try {
    const fetchedClients = await clientService.getClients();
    setClients(fetchedClients);

    if (user?.role === 'ADMIN') {
      const [fetchedPlans, fetchedStaff] = await Promise.all([
        membershipService.getPlans(),
        staffService.getStaff(),
      ]);

      setPlans(fetchedPlans);
      setStaffList(fetchedStaff);

      if (fetchedPlans.length > 0) {
        setFormData((prev) => ({
          ...prev,
          membershipPlanId: fetchedPlans[0].id,
        }));
      }
    } else {
      setPlans([]);
      setStaffList([]);
    }
  } catch (err: any) {
    showError(
      'Failed to fetch clients',
      err.message || 'Error communicating with Spring Boot API'
    );
  } finally {
    setIsLoading(false);
  }
};


  useEffect(() => {
  if (user) {
    loadInitialData();
  }
}, [user?.role]);

  // When viewing client, fetch their communication history
  useEffect(() => {
    if (viewingClient) {
      communicationService.getCommunications().then((allComms) => {
        setClientComms(allComms.filter((c) => c.clientId === viewingClient.id));
      });
    }
  }, [viewingClient]);

  // Handle plan selection auto-calculating end date
  const handlePlanChange = (planId: number) => {
    const selectedPlan = plans.find((p) => p.id === planId);
    if (selectedPlan && formData.startDate) {
      const start = new Date(formData.startDate);
      const end = new Date(start.getTime() + selectedPlan.durationDays * 86400000);
      setFormData((prev) => ({
        ...prev,
        membershipPlanId: planId,
        endDate: end.toISOString().split('T')[0],
      }));
    } else {
      setFormData((prev) => ({ ...prev, membershipPlanId: planId }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!formData.phoneNumber.trim()) errors.phoneNumber = 'Phone Number is required';
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email address';
    }
    if (!formData.startDate) errors.startDate = 'Start Date is required';
    if (!formData.endDate) errors.endDate = 'End Date is required';
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      errors.endDate = 'End Date must be after Start Date';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const created = await clientService.createClient(formData);
      setClients((prev) => [created, ...prev]);
      showSuccess('Client Registered', `${created.fullName} added successfully to Spring Boot database.`);
      setIsAddModalOpen(false);
      setFormData(initialFormData);
    } catch (err: any) {
      showError('Registration Failed', err.message || 'Could not save client record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !validateForm()) return;

    setIsSubmitting(true);
    try {
      const updated = await clientService.updateClient(editingClient.id, formData);
      setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (viewingClient?.id === updated.id) {
        setViewingClient(updated);
      }
      showSuccess('Client Updated', `Record for ${updated.fullName} was updated.`);
      setEditingClient(null);
    } catch (err: any) {
      showError('Update Failed', err.message || 'Could not update client record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (client: Client) => {
    const nextStatus: ClientStatus = client.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    try {
      const updated = await clientService.updateClientStatus(client.id, nextStatus);
      setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (viewingClient?.id === updated.id) {
        setViewingClient(updated);
      }
      showSuccess(
        nextStatus === 'ACTIVE' ? 'Client Reactivated' : 'Client Deactivated',
        `${client.fullName} status is now ${nextStatus}.`
      );
      setDeactivatingClient(null);
    } catch (err: any) {
      showError('Status Change Failed', err.message || 'Could not update status');
    }
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      fullName: client.fullName,
      phoneNumber: client.phoneNumber,
      email: client.email,
      membershipPlanId: client.membershipPlanId,
      startDate: client.startDate,
      endDate: client.endDate,
      status: client.status,
      notes: client.notes,
      assignedStaffId: client.assignedStaffId || 1,
      emergencyContact: client.emergencyContact || '',
    });
    setFormErrors({});
  };

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || client.status === statusFilter;

      const matchesPlan =
        planFilter === 'ALL' || String(client.membershipPlanId) === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [clients, searchQuery, statusFilter, planFilter]);

  // Paginated clients
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredClients, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage) || 1;

  return (
    <div className="space-y-6">
      {/* Page Title & Add Client Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Client Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Directory of registered fitness members, contact details, and pass validity
          </p>
        </div>

        <button
          onClick={() => {
            setFormData(initialFormData);
            setFormErrors({});
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Client</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name, phone, email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="w-full sm:w-auto flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1 text-xs text-slate-600 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="py-1 px-2 border border-slate-300 rounded-md text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRING_SOON">Expiring Soon</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-600 shrink-0">
            <span>Plan:</span>
            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="py-1 px-2 border border-slate-300 rounded-md text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Plans</option>
              {plans.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Clients Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} columns={6} />
        ) : filteredClients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Clients Found"
            description={
              searchQuery || statusFilter !== 'ALL' || planFilter !== 'ALL'
                ? 'No client records match your search criteria. Try adjusting or clearing your filters.'
                : 'No clients registered yet. Start by adding your first gym member.'
            }
            actionText={
              searchQuery || statusFilter !== 'ALL' || planFilter !== 'ALL'
                ? 'Clear Filters'
                : 'Add First Client'
            }
            onAction={() => {
              if (searchQuery || statusFilter !== 'ALL' || planFilter !== 'ALL') {
                setSearchQuery('');
                setStatusFilter('ALL');
                setPlanFilter('ALL');
              } else {
                setIsAddModalOpen(true);
              }
            }}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Membership Plan</th>
                    <th className="py-3 px-4">Validity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedClients.map((client) => {
                    const daysRemaining = Math.ceil(
                      (new Date(client.endDate).getTime() - new Date().getTime()) / 86400000
                    );

                    return (
                      <tr key={client.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Name & ID */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setViewingClient(client)}
                            className="font-bold text-slate-900 hover:text-emerald-700 text-left truncate block"
                          >
                            {client.fullName}
                          </button>
                          <span className="text-[11px] text-slate-400 tabular-nums">
                            ID: #{client.id}
                          </span>
                        </td>

                        {/* Phone & Email */}
                        <td className="py-3 px-4 space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-mono text-[11px] tabular-nums">
                              {client.phoneNumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[160px] text-[11px]">
                              {client.email}
                            </span>
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-800">
                            {client.membershipPlanName}
                          </span>
                          {client.assignedStaffName && (
                            <span className="block text-[11px] text-slate-400">
                              Coach: {client.assignedStaffName}
                            </span>
                          )}
                        </td>

                        {/* Validity Dates */}
                        <td className="py-3 px-4">
                          <div className="text-slate-800 tabular-nums font-mono text-[11px]">
                            {client.startDate} <span className="text-slate-400">to</span> {client.endDate}
                          </div>
                          <span className="text-[11px] text-slate-500 tabular-nums">
                            {daysRemaining > 0
                              ? `${daysRemaining} days left`
                              : daysRemaining === 0
                              ? 'Expires today'
                              : 'Expired'}
                          </span>
                        </td>

                        {/* Status (Anti-slop zero pill text with subtle background) */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                              client.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-800'
                                : client.status === 'EXPIRING_SOON'
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {client.status === 'ACTIVE'
                              ? 'Active'
                              : client.status === 'EXPIRING_SOON'
                              ? 'Expiring Soon'
                              : 'Inactive'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewingClient(client)}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                              title="View details"
                              aria-label="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(client)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit client"
                              aria-label="Edit client"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeactivatingClient(client)}
                              className={`p-1 rounded ${
                                client.status === 'INACTIVE'
                                  ? 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                              title={client.status === 'INACTIVE' ? 'Reactivate' : 'Deactivate'}
                              aria-label={client.status === 'INACTIVE' ? 'Reactivate' : 'Deactivate'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredClients.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(size) => {
                setItemsPerPage(size);
                setCurrentPage(1);
              }}
            />
          </>
        )}
      </div>

      {/* Add Client Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Client"
        description="Records client in Spring Boot MySQL database with membership duration"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateClient} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Full Name *</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Alex Henderson"
                className={`mt-1 block w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 ${
                  formErrors.fullName ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-emerald-500'
                }`}
              />
              {formErrors.fullName && <p className="mt-1 text-xs text-rose-600">{formErrors.fullName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Phone Number *</label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className={`mt-1 block w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 ${
                  formErrors.phoneNumber ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-emerald-500'
                }`}
              />
              {formErrors.phoneNumber && <p className="mt-1 text-xs text-rose-600">{formErrors.phoneNumber}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="alex@example.com"
                className={`mt-1 block w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 ${
                  formErrors.email ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-emerald-500'
                }`}
              />
              {formErrors.email && <p className="mt-1 text-xs text-rose-600">{formErrors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Membership Plan *</label>
              <select
                value={formData.membershipPlanId}
                onChange={(e) => handlePlanChange(Number(e.target.value))}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.price} - {p.durationDays} days)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">End Date *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={`mt-1 block w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 ${
                  formErrors.endDate ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-emerald-500'
                }`}
              />
              {formErrors.endDate && <p className="mt-1 text-xs text-rose-600">{formErrors.endDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Assigned Coach / Staff</label>
              <select
                value={formData.assignedStaffId}
                onChange={(e) => setFormData({ ...formData, assignedStaffId: Number(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Emergency Contact</label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                placeholder="Name & phone number"
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Notes & Fitness Goals</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Rehabbing left shoulder, interested in 7 AM morning workouts..."
              className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving to Database...' : 'Register Client'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Client Modal */}
      <Modal
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        title={`Edit Client: ${editingClient?.fullName}`}
        description="Updates existing record via Spring Boot PUT /api/clients/{id}"
        maxWidth="xl"
      >
        <form onSubmit={handleUpdateClient} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Full Name *</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Phone Number *</label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Membership Plan</label>
              <select
                value={formData.membershipPlanId}
                onChange={(e) => handlePlanChange(Number(e.target.value))}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingClient(null)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Client Detail View Modal */}
      <Modal
        isOpen={!!viewingClient}
        onClose={() => setViewingClient(null)}
        title={viewingClient ? viewingClient.fullName : 'Client Profile'}
        description={`Member ID #${viewingClient?.id} · ${viewingClient?.membershipPlanName}`}
        maxWidth="2xl"
      >
        {viewingClient && (
          <div className="space-y-6">
            {/* Overview Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div>
                <span className="text-slate-500 block">Phone</span>
                <span className="font-semibold text-slate-900 font-mono tabular-nums">
                  {viewingClient.phoneNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Email</span>
                <span className="font-semibold text-slate-900 truncate block">
                  {viewingClient.email}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Plan Expiry</span>
                <span className="font-semibold text-slate-900 font-mono tabular-nums">
                  {viewingClient.endDate}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Status</span>
                <span
                  className={`inline-block font-semibold px-2 py-0.5 rounded text-[11px] ${
                    viewingClient.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : viewingClient.status === 'EXPIRING_SOON'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {viewingClient.status}
                </span>
              </div>
            </div>

            {/* Notes Section */}
            {viewingClient.notes && (
              <div className="p-4 bg-white border border-slate-200 rounded-xl">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Staff Notes & Coaching Objectives
                </h4>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">{viewingClient.notes}</p>
              </div>
            )}

            {/* Communications Log for this Client */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Communication History ({clientComms.length})
                </h4>
              </div>
              {clientComms.length === 0 ? (
                <p className="text-xs text-slate-500 p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                  No communication logs recorded yet for this client.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  {clientComms.map((comm) => (
                    <div key={comm.id} className="p-3 text-xs bg-white hover:bg-slate-50">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-800">
                          {comm.channel} · {comm.category.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400 tabular-nums">
                          {new Date(comm.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1">{comm.messageText}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Logged by {comm.loggedByStaffName}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => handleToggleStatus(viewingClient)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  viewingClient.status === 'INACTIVE'
                    ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    : 'border-rose-200 text-rose-700 hover:bg-rose-50'
                }`}
              >
                {viewingClient.status === 'INACTIVE' ? 'Reactivate Client' : 'Deactivate Client'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(viewingClient)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => setViewingClient(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Deactivate Confirmation Modal */}
      <Modal
        isOpen={!!deactivatingClient}
        onClose={() => setDeactivatingClient(null)}
        title={
          deactivatingClient?.status === 'INACTIVE'
            ? `Reactivate ${deactivatingClient?.fullName}?`
            : `Deactivate ${deactivatingClient?.fullName}?`
        }
        description="Updates client status in MySQL via PATCH /api/clients/{id}/status"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {deactivatingClient?.status === 'INACTIVE'
              ? 'This will restore the client membership pass to active status and enable gym floor check-ins.'
              : 'This will mark the client as inactive. They will remain in the database for historical reporting and communications.'}
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setDeactivatingClient(null)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() => deactivatingClient && handleToggleStatus(deactivatingClient)}
              className={`px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors ${
                deactivatingClient?.status === 'INACTIVE'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              Confirm {deactivatingClient?.status === 'INACTIVE' ? 'Reactivation' : 'Deactivation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
