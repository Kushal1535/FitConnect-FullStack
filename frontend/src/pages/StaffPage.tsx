
import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  BriefcaseBusiness,
  Pencil,
} from 'lucide-react';

import {
  staffService,
  type CreateStaffDTO,
  type StaffRecord,
} from '../services/staffService';

import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const INITIAL_FORM: CreateStaffDTO = {
  fullName: '',
  email: '',
  phoneNumber: '',
  designation: '',
};

export const StaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActioningId, setIsActioningId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CreateStaffDTO>({
    ...INITIAL_FORM,
  });

  const { showSuccess, showError, showWarning } = useNotification();
  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMIN';

  const loadStaff = async () => {
    setIsLoading(true);

    try {
      const data = await staffService.getStaff();
      setStaffList(data);
    } catch (err: unknown) {
      showError(
        'Failed to Load Staff',
        err instanceof Error
          ? err.message
          : 'Unable to load staff records.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadStaff();
    // Load once when the page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateStaff = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!isAdmin) {
      showWarning(
        'Action Restricted',
        'Only an Admin can invite staff members.',
      );
      return;
    }

    const fullName = formData.fullName.trim();
    const email = formData.email.trim().toLowerCase();
    const phoneNumber = formData.phoneNumber.trim();
    const designation = formData.designation.trim();

    if (!fullName || !email || !phoneNumber || !designation) {
      showError(
        'Validation Error',
        'Please complete all required fields.',
      );
      return;
    }

    if (
      fullName.length > 100 ||
      email.length > 150 ||
      phoneNumber.length > 20 ||
      designation.length > 100
    ) {
      showError(
        'Validation Error',
        'One or more fields exceed the allowed length.',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await staffService.createStaff({
        fullName,
        email,
        phoneNumber,
        designation,
      });

      showSuccess(
        'Invitation Sent',
        `A staff invitation and OTP have been requested for ${email}. The account will be created after registration is completed.`,
      );

      setIsAddModalOpen(false);
      setFormData({ ...INITIAL_FORM });

      await loadStaff();
    } catch (err: unknown) {
      showError(
        'Failed to Send Invitation',
        err instanceof Error
          ? err.message
          : 'The server could not send the staff invitation.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDesignation = async (staff: StaffRecord) => {
    if (!isAdmin) {
      showWarning(
        'Action Restricted',
        'Only an Admin can edit designations.',
      );
      return;
    }

    const input = window.prompt(
      `Enter the professional designation for ${staff.fullName}:`,
      staff.designation || '',
    );

    if (input === null) {
      return;
    }

    const designation = input.trim();

    if (!designation || designation.length > 100) {
      showError(
        'Invalid Designation',
        'Enter a designation between 1 and 100 characters.',
      );
      return;
    }

    setIsActioningId(staff.id);

    try {
      const updated = await staffService.updateDesignation(
        staff.id,
        designation,
      );

      setStaffList((previous) =>
        previous.map((item) =>
          item.id === staff.id ? { ...item, ...updated } : item,
        ),
      );

      showSuccess(
        'Designation Updated',
        `${staff.fullName}'s designation is now ${designation}.`,
      );
    } catch (err: unknown) {
      showError(
        'Unable to Update Designation',
        err instanceof Error
          ? err.message
          : 'The designation update failed.',
      );
    } finally {
      setIsActioningId(null);
    }
  };

  const handleToggleStaffStatus = async (staff: StaffRecord) => {
    if (!isAdmin) {
      showWarning(
        'Action Restricted',
        'Only an Admin can manage staff.',
      );
      return;
    }

    if (staff.email.toLowerCase() === user?.email?.toLowerCase()) {
      showWarning(
        'Action Restricted',
        'You cannot deactivate your own account.',
      );
      return;
    }

    const nextActive = staff.active === false;

    const confirmed = window.confirm(
      nextActive
        ? `Reactivate ${staff.fullName}? They will be able to sign in again.`
        : `Deactivate ${staff.fullName}? Their login account will be disabled.`,
    );

    if (!confirmed) return;

    setIsActioningId(staff.id);

    try {
      const updated = await staffService.updateStatus(
        staff.id,
        nextActive,
      );

      setStaffList((previous) =>
        previous.map((item) =>
          item.id === staff.id ? { ...item, ...updated } : item,
        ),
      );

      showSuccess(
        nextActive ? 'Staff Reactivated' : 'Staff Deactivated',
        `${staff.fullName} has been ${
          nextActive ? 'reactivated' : 'deactivated'
        }.`,
      );
    } catch (err: unknown) {
      showError(
        'Unable to Update Staff',
        err instanceof Error ? err.message : 'The operation failed.',
      );
    } finally {
      setIsActioningId(null);
    }
  };

  const handleDeleteStaff = async (staff: StaffRecord) => {
    if (!isAdmin) {
      showWarning(
        'Action Restricted',
        'Only an Admin can delete staff.',
      );
      return;
    }

    if (staff.email.toLowerCase() === user?.email?.toLowerCase()) {
      showWarning(
        'Action Restricted',
        'You cannot delete your own account.',
      );
      return;
    }

    const confirmed = window.confirm(
      `Permanently delete ${staff.fullName} (${staff.email})? ` +
        'This cannot be undone. If other records depend on this account, ' +
        'the server should reject the deletion.',
    );

    if (!confirmed) return;

    const confirmationText = window.prompt(
      `Type DELETE to permanently remove ${staff.fullName}:`,
    );

    if (confirmationText !== 'DELETE') {
      showWarning(
        'Deletion Cancelled',
        'The confirmation text did not match. No changes were made.',
      );
      return;
    }

    setIsActioningId(staff.id);

    try {
      await staffService.deleteStaff(staff.id);

      setStaffList((previous) =>
        previous.filter((item) => item.id !== staff.id),
      );

      showSuccess(
        'Staff Permanently Deleted',
        `${staff.fullName} was permanently deleted.`,
      );
    } catch (err: unknown) {
      showError(
        'Deletion Blocked',
        err instanceof Error
          ? err.message
          : 'The server could not delete this staff member. They may have linked records.',
      );
    } finally {
      setIsActioningId(null);
    }
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;

    setIsAddModalOpen(false);
    setFormData({ ...INITIAL_FORM });
  };

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Staff Management
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Manage staff profiles, professional designations, access, and login accounts.
          </p>
        </div>

        {isAdmin ? (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <UserPlus className="h-4 w-4" />
            Invite Staff Member
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500">
            <Lock className="h-4 w-4" />
            Admin permission required
          </div>
        )}
      </div>

      {/* System role information */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-lg bg-purple-100 p-2 text-purple-700">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Staff Account Management
              </h2>

              <span className="rounded-full bg-purple-100 px-2.5 py-1 text-[10px] font-bold uppercase text-purple-700">
                Current Role: {user?.role ?? 'Unknown'}
              </span>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              New staff accounts receive the STAFF system role.
              Professional designations are managed separately.
              Deactivation preserves history, while permanent deletion
              is subject to the server's dependency checks.
            </p>
          </div>
        </div>
      </div>

      {/* Staff cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-12">
            <LoadingSpinner size="md" text="Loading staff records..." />
          </div>
        ) : staffList.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={Shield}
              title="No Staff Found"
              description="No staff members are currently registered."
            />
          </div>
        ) : (
          staffList.map((staff) => {
            const isBusy = isActioningId !== null;
            const isSelf =
              staff.email.toLowerCase() === user?.email?.toLowerCase();

            return (
              <div
                key={staff.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                        {staff.fullName
                          .split(' ')
                          .filter(Boolean)
                          .map((part) => part[0])
                          .join('')
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-slate-900">
                          {staff.fullName}
                        </h3>

                        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                          <BriefcaseBusiness className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {staff.designation || 'Staff Member'}
                          </span>
                        </p>

                        <span className="text-[11px] text-slate-400">
                          ID #{staff.id}
                        </span>
                      </div>
                    </div>

                    {/* System role is separate from designation */}
                    <span
                      className={`shrink-0 rounded px-2 py-1 text-[10px] font-bold uppercase ${
                        staff.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {staff.role}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{staff.email}</span>
                    </div>

                    {staff.phoneNumber && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{staff.phoneNumber}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {staff.createdAt
                          ? `Member since ${new Date(
                              staff.createdAt,
                            ).toLocaleDateString()}`
                          : 'Join date unavailable'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Admin actions */}
                <div className="mt-5 border-t border-slate-100 pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`flex items-center gap-1.5 text-[11px] font-semibold ${
                        staff.active === false
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {staff.active === false ? 'Inactive' : 'Active'}
                    </span>

                    {isAdmin && !isSelf && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void handleEditDesignation(staff)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit Designation
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleToggleStaffStatus(staff)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {staff.active === false ? (
                            <>
                              <UserCheck className="h-3.5 w-3.5" />
                              Reactivate
                            </>
                          ) : (
                            <>
                              <UserX className="h-3.5 w-3.5" />
                              Deactivate
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDeleteStaff(staff)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Permanently Delete
                        </button>
                      </div>
                    )}

                    {!isAdmin && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Lock className="h-3 w-3" />
                        View only
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Role permissions reference */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold tracking-tight text-slate-900">
          Role Permissions Reference
        </h2>

        <p className="text-xs text-slate-500">
          Professional designation does not grant additional system permissions.
          The backend must enforce authorization independently of this interface.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-3 font-semibold">Action</th>
                <th className="px-3 py-3 font-semibold">STAFF</th>
                <th className="px-3 py-3 font-semibold">ADMIN</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="px-3 py-3">View clients</td>
                <td className="px-3 py-3 text-emerald-700">Allowed*</td>
                <td className="px-3 py-3 text-emerald-700">Allowed</td>
              </tr>
              <tr>
                <td className="px-3 py-3">Record communications</td>
                <td className="px-3 py-3 text-emerald-700">Allowed*</td>
                <td className="px-3 py-3 text-emerald-700">Allowed</td>
              </tr>
              <tr>
                <td className="px-3 py-3">Manage membership plans</td>
                <td className="px-3 py-3 text-rose-600">Restricted</td>
                <td className="px-3 py-3 text-emerald-700">Allowed</td>
              </tr>
              <tr>
                <td className="px-3 py-3">Manage staff accounts</td>
                <td className="px-3 py-3 text-rose-600">Restricted</td>
                <td className="px-3 py-3 text-emerald-700">Allowed</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-slate-400">
          *Subject to permissions configured in Spring Security.
        </p>
      </div>

      {/* Invitation modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        title="Invite Staff Member"
        description="Send an invitation link and OTP. The staff member will create their own password."
        maxWidth="md"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div>
            <label
              htmlFor="staff-full-name"
              className="block text-xs font-semibold text-slate-700"
            >
              Full Name *
            </label>

            <input
              id="staff-full-name"
              type="text"
              value={formData.fullName}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  fullName: event.target.value,
                })
              }
              placeholder="Enter full name"
              autoComplete="name"
              maxLength={100}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="staff-email"
              className="block text-xs font-semibold text-slate-700"
            >
              Email Address *
            </label>

            <input
              id="staff-email"
              type="email"
              value={formData.email}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  email: event.target.value,
                })
              }
              placeholder="staff@fitconnect.com"
              autoComplete="email"
              maxLength={150}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="staff-phone"
              className="block text-xs font-semibold text-slate-700"
            >
              Phone Number *
            </label>

            <input
              id="staff-phone"
              type="tel"
              value={formData.phoneNumber}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  phoneNumber: event.target.value,
                })
              }
              placeholder="Enter phone number"
              autoComplete="tel"
              maxLength={20}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="staff-designation"
              className="block text-xs font-semibold text-slate-700"
            >
              Professional Designation *
            </label>

            <input
              id="staff-designation"
              type="text"
              value={formData.designation}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  designation: event.target.value,
                })
              }
              placeholder="e.g. Senior Trainer, Nutritionist"
              maxLength={100}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />

            <p className="mt-1 text-[11px] text-slate-500">
              Enter a job title for this staff member. This does not change
              their system permissions.
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
            The backend assigns the STAFF system role automatically.
            Admin permissions cannot be selected in this form.
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              disabled={isSubmitting}
              className="rounded-lg px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
