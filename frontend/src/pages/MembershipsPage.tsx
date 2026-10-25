import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  CreditCard, 
  Plus, 
  Check, 
  Clock, 
  Calendar, 
  Users, 
  RefreshCw, 
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { membershipService, CreateMembershipPlanDTO } from '../services/membershipService';
import { clientService } from '../services/clientService';
import { communicationService } from '../services/communicationService';
import { MembershipPlan, Client } from '../types';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const MembershipsPage: React.FC = () => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchParams] = useSearchParams();

  // Active view tab: 'plans' vs 'expiring'
  const [activeTab, setActiveTab] = useState<'plans' | 'expiring'>(
    searchParams.get('tab') === 'expiring' ? 'expiring' : 'plans'
  );

  // Modals
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [renewingClient, setRenewingClient] = useState<Client | null>(null);
  const [renewalDays, setRenewalDays] = useState<number>(30);
  const [renewalPlanId, setRenewalPlanId] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Plan creation form state
  const [planFormData, setPlanFormData] = useState<CreateMembershipPlanDTO>({
    name: '',
    durationDays: 30,
    price: 49.99,
    description: '',
    features: ['Gym floor access', 'Locker access'],
    status: 'ACTIVE',
  });
  const [featureInput, setFeatureInput] = useState('');

  const { showSuccess, showError, showWarning } = useNotification();
  const { user } = useAuth();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedPlans, fetchedClients] = await Promise.all([
        membershipService.getPlans(),
        clientService.getClients(),
      ]);
      setPlans(fetchedPlans);
      setClients(fetchedClients);
      if (fetchedPlans.length > 0) {
        setRenewalPlanId(fetchedPlans[0].id);
      }
    } catch (err: any) {
      showError('Failed to load memberships', err.message || 'Error communicating with API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter clients expiring within 30 days or already expired
  const expiringClients = clients
    .filter((c) => {
      const days = Math.ceil(
        (new Date(c.endDate).getTime() - new Date().getTime()) / 86400000
      );
      return days <= 30;
    })
    .sort(
      (a, b) =>
        new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
    );

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'ADMIN') {
      showWarning('Unauthorized', 'Only ADMIN role can create membership plans in Spring Boot backend.');
      return;
    }

    if (!planFormData.name.trim()) {
      showError('Validation Error', 'Plan Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await membershipService.createPlan(planFormData);
      setPlans((prev) => [...prev, created]);
      showSuccess('Plan Created', `${created.name} added to Spring Boot catalog.`);
      setIsAddPlanModalOpen(false);
      setPlanFormData({
        name: '',
        durationDays: 30,
        price: 49.99,
        description: '',
        features: ['Gym floor access'],
        status: 'ACTIVE',
      });
    } catch (err: any) {
      showError('Failed to create plan', err.message || 'Server error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setPlanFormData((prev) => ({
        ...prev,
        features: [...prev.features, featureInput.trim()],
      }));
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (idx: number) => {
    setPlanFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx),
    }));
  };

  const handleRenewMembership = async () => {
    if (!renewingClient) return;

    setIsSubmitting(true);
    try {
      // Calculate new end date from current end date or today, whichever is later
      const baseDate = new Date(renewingClient.endDate) > new Date()
        ? new Date(renewingClient.endDate)
        : new Date();

      const newEndDate = new Date(baseDate.getTime() + renewalDays * 86400000)
        .toISOString()
        .split('T')[0];

      const selectedPlan = plans.find((p) => p.id === renewalPlanId);

      const updated = await clientService.updateClient(renewingClient.id, {
        endDate: newEndDate,
        status: 'ACTIVE',
        membershipPlanId: renewalPlanId,
      });

      // Also record renewal communication audit log
      await communicationService.recordCommunication({
        clientId: renewingClient.id,
        channel: 'WHATSAPP',
        category: 'MEMBERSHIP_RENEWAL',
        direction: 'OUTGOING',
        messageText: `Membership renewed for ${renewalDays} days under ${selectedPlan?.name || 'Standard'}. New expiry date: ${newEndDate}.`,
        deliveryStatus: 'LOGGED_ONLY',
        loggedByStaffId: user?.id || 1,
        loggedByStaffName: user?.fullName || 'Staff Member',
      });

      setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      showSuccess('Membership Renewed', `${renewingClient.fullName} extended to ${newEndDate}.`);
      setRenewingClient(null);
    } catch (err: any) {
      showError('Renewal Failed', err.message || 'Could not update membership');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Plan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Membership Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Membership plan packages, expiration monitoring, and renewal workflows
          </p>
        </div>

        <div className="flex items-center gap-2">
          {user?.role === 'ADMIN' ? (
            <button
              onClick={() => setIsAddPlanModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Create Plan</span>
            </button>
          ) : (
            <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-[11px] text-slate-500 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
              <span>Admin role required to create new plans</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'plans'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Active Plans Catalog ({plans.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('expiring')}
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'expiring'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Upcoming Expiries & Renewals ({expiringClients.length})</span>
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner size="lg" text="Loading plans and memberships..." />
      ) : activeTab === 'plans' ? (
        /* Plan Catalog Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">{plan.name}</h3>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    {plan.durationDays} Days
                  </span>
                </div>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900 tabular-nums">
                    ${plan.price}
                  </span>
                  <span className="text-xs text-slate-500">/ package</span>
                </div>

                <p className="mt-2 text-xs text-slate-600 leading-relaxed min-h-[36px]">
                  {plan.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                    Included Features:
                  </span>
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-700">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 tabular-nums">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {plan.activeMembersCount || 0} active members
                </span>
                <span className="text-[11px] text-emerald-700 font-medium">Ready</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Expiring Memberships Watchlist */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 bg-amber-50/50 border-b border-amber-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                These clients have memberships expiring within 30 days or already overdue. Proactive renewal contact helps reduce churn.
              </span>
            </div>
          </div>

          {expiringClients.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No memberships expiring within the next 30 days.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Current Plan</th>
                    <th className="py-3 px-4">Expiration Date</th>
                    <th className="py-3 px-4">Days Left</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {expiringClients.map((client) => {
                    const daysRemaining = Math.ceil(
                      (new Date(client.endDate).getTime() - new Date().getTime()) / 86400000
                    );

                    return (
                      <tr key={client.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{client.fullName}</span>
                          <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                            {client.phoneNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {client.membershipPlanName}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                          {client.endDate}
                        </td>
                        <td className="py-3 px-4 tabular-nums">
                          <span
                            className={`font-semibold ${
                              daysRemaining <= 3
                                ? 'text-rose-600'
                                : daysRemaining <= 7
                                ? 'text-amber-600'
                                : 'text-slate-700'
                            }`}
                          >
                            {daysRemaining < 0
                              ? `Expired (${Math.abs(daysRemaining)}d ago)`
                              : daysRemaining === 0
                              ? 'Expires today'
                              : `${daysRemaining} days left`}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                              client.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-800'
                                : client.status === 'EXPIRING_SOON'
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-rose-50 text-rose-800'
                            }`}
                          >
                            {client.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setRenewingClient(client);
                              setRenewalPlanId(client.membershipPlanId);
                              const p = plans.find((item) => item.id === client.membershipPlanId);
                              if (p) setRenewalDays(p.durationDays);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Renew</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Renew Membership Modal */}
      <Modal
        isOpen={!!renewingClient}
        onClose={() => setRenewingClient(null)}
        title={`Renew Membership: ${renewingClient?.fullName}`}
        description="Extends client pass and records renewal event in Spring Boot audit trail"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Select Plan Package</label>
            <select
              value={renewalPlanId}
              onChange={(e) => {
                const pId = Number(e.target.value);
                setRenewalPlanId(pId);
                const p = plans.find((item) => item.id === pId);
                if (p) setRenewalDays(p.durationDays);
              }}
              className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (${p.price} - {p.durationDays} Days)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Renewal Extension (Days)</label>
            <input
              type="number"
              value={renewalDays}
              onChange={(e) => setRenewalDays(Number(e.target.value))}
              min={1}
              className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <p className="text-xs text-slate-500">
            Current end date: <strong className="text-slate-800">{renewingClient?.endDate}</strong>. 
            Renewing will calculate the new expiration date and update status to <strong className="text-emerald-700">ACTIVE</strong>.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setRenewingClient(null)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleRenewMembership}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Processing Renewal...' : 'Confirm Renewal'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Membership Plan Modal (Admin only) */}
      <Modal
        isOpen={isAddPlanModalOpen}
        onClose={() => setIsAddPlanModalOpen(false)}
        title="Create Membership Plan"
        description="Creates a new pricing package in Spring Boot POST /api/memberships"
        maxWidth="lg"
      >
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Plan Name *</label>
              <input
                type="text"
                value={planFormData.name}
                onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                placeholder="e.g. 6-Month Semi-Annual"
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Duration (Days) *</label>
              <input
                type="number"
                value={planFormData.durationDays}
                onChange={(e) => setPlanFormData({ ...planFormData, durationDays: Number(e.target.value) })}
                min={1}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Price ($ USD) *</label>
              <input
                type="number"
                step="0.01"
                value={planFormData.price}
                onChange={(e) => setPlanFormData({ ...planFormData, price: Number(e.target.value) })}
                min={0}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Short Description</label>
              <input
                type="text"
                value={planFormData.description}
                onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                placeholder="Target demographic / benefits"
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Included Features</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="text"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                placeholder="e.g. Complimentary towel service"
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold whitespace-nowrap"
              >
                Add Feature
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {planFormData.features.map((feat, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-xs text-slate-800"
                >
                  {feat}
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="text-slate-400 hover:text-rose-600 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddPlanModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Save Plan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
