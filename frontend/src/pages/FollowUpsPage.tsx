import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  CalendarCheck, 
  Plus, 
  Filter, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  UserCheck, 
  Calendar,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { followUpService, CreateFollowUpDTO } from '../services/followUpService';
import { clientService } from '../services/clientService';
import { staffService } from '../services/staffService';
import { FollowUp, FollowUpPriority, FollowUpStatus, Client, User } from '../types';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const FollowUpsPage: React.FC = () => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchParams] = useSearchParams();

  // Tab: 'all' | 'today' | 'overdue' | 'upcoming' | 'completed'
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'overdue' | 'upcoming' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [staffFilter, setStaffFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(
    searchParams.get('action') === 'create'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const initialForm: CreateFollowUpDTO = {
    title: '',
    clientId: 101,
    dueDate: new Date().toISOString().split('T')[0],
    assignedStaffId: 1,
    priority: 'MEDIUM',
    status: 'PENDING',
    notes: '',
    category: 'Membership Renewal',
  };
  const [formData, setFormData] = useState<CreateFollowUpDTO>(initialForm);

  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();

  
const loadData = async () => {
  setIsLoading(true);

  try {
    // These endpoints are accessible to both ADMIN and STAFF.
    const [tasks, clientList] = await Promise.all([
      followUpService.getFollowUps(),
      clientService.getClients(),
    ]);

    setFollowUps(tasks);
    setClients(clientList);

    // Only ADMIN can access the staff management endpoint.
    if (user?.role === 'ADMIN') {
      const staff = await staffService.getStaff();
      setStaffList(staff);
    } else {
      setStaffList([]);

      // Staff users should be assigned to their own follow-ups.
      setFormData((prev) => ({
        ...prev,
        assignedStaffId: user?.id ?? prev.assignedStaffId,
      }));
    }

    if (clientList.length > 0) {
      setFormData((prev) => ({
        ...prev,
        clientId: clientList[0].id,
        assignedStaffId:
          user?.role === 'STAFF'
            ? user.id
            : prev.assignedStaffId,
      }));
    }
  } catch (err: any) {
    showError(
      'Failed to load tasks',
      err.message || 'API connection failed'
    );
  } finally {
    setIsLoading(false);
  }
};


  useEffect(() => {
  if (user) {
    loadData();
  }
}, [user?.role]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showError('Validation Error', 'Task title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await followUpService.createFollowUp(formData);
      setFollowUps((prev) => [created, ...prev]);
      showSuccess('Follow-up Scheduled', `Task created in Spring Boot database.`);
      setIsCreateModalOpen(false);
      setFormData(initialForm);
    } catch (err: any) {
      showError('Failed to create task', err.message || 'Server error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async (task: FollowUp) => {
    const nextStatus: FollowUpStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      const updated = await followUpService.updateFollowUpStatus(task.id, {
        status: nextStatus,
        notes: `Marked ${nextStatus} by ${user?.fullName || 'Staff'}`,
      });
      setFollowUps((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      showSuccess(
        nextStatus === 'COMPLETED' ? 'Task Completed' : 'Task Reopened',
        `Follow-up for ${task.clientName} status updated via PATCH /api/follow-ups/{id}.`
      );
    } catch (err: any) {
      showError('Update Failed', err.message || 'Could not update task');
    }
  };

  // Filter Tasks
  const todayStr = '2026-10-13'; // Context reference date
  const filteredTasks = useMemo(() => {
    return followUps.filter((task) => {
      // Tab filter
      if (activeTab === 'today') {
        if (task.dueDate !== todayStr || task.status === 'COMPLETED') return false;
      } else if (activeTab === 'overdue') {
        if (task.status === 'COMPLETED' || (task.status !== 'OVERDUE' && task.dueDate >= todayStr)) {
          return false;
        }
      } else if (activeTab === 'upcoming') {
        if (task.status === 'COMPLETED' || task.dueDate <= todayStr) return false;
      } else if (activeTab === 'completed') {
        if (task.status !== 'COMPLETED') return false;
      }

      // Priority & Staff Filter
      if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;
      if (staffFilter !== 'ALL' && String(task.assignedStaffId) !== staffFilter) return false;

      // Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          task.title.toLowerCase().includes(q) ||
          task.clientName.toLowerCase().includes(q) ||
          task.clientPhone.includes(q) ||
          task.category.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [followUps, activeTab, priorityFilter, staffFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header and Add Task */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Follow-Up Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize daily client outreach, retention reminders, and trainer check-ins
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Follow-Up</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold overflow-x-auto pb-1 sm:pb-0">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'all'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Tasks ({followUps.length})
        </button>
        <button
          onClick={() => setActiveTab('today')}
          className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'today'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Due Today
        </button>
        <button
          onClick={() => setActiveTab('overdue')}
          className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'overdue'
              ? 'border-rose-600 text-rose-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Overdue
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'upcoming'
              ? 'border-blue-600 text-blue-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'completed'
              ? 'border-slate-800 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search follow-ups or client name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1 text-xs text-slate-600 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="py-1 px-2 border border-slate-300 rounded-md text-xs bg-white text-slate-800 focus:ring-emerald-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-600 shrink-0">
            <span>Staff:</span>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="py-1 px-2 border border-slate-300 rounded-md text-xs bg-white text-slate-800 focus:ring-emerald-500"
            >
              <option value="ALL">All Staff</option>
              {staffList.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12">
            <LoadingSpinner size="md" text="Loading follow-up tasks..." />
          </div>
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No Tasks Found"
            description="No follow-up assignments match your filter selection."
            actionText="Schedule Task"
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTasks.map((task) => {
              const isOverdue =
                task.status !== 'COMPLETED' &&
                (task.status === 'OVERDUE' || task.dueDate < todayStr);

              return (
                <div
                  key={task.id}
                  className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    task.status === 'COMPLETED'
                      ? 'bg-slate-50/40 opacity-75'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className={`mt-0.5 p-1 rounded transition-colors shrink-0 ${
                        task.status === 'COMPLETED'
                          ? 'text-emerald-600 hover:text-slate-400'
                          : 'text-slate-300 hover:text-emerald-600'
                      }`}
                      title={task.status === 'COMPLETED' ? 'Mark Incomplete' : 'Mark Completed'}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold tracking-tight ${
                            task.status === 'COMPLETED'
                              ? 'line-through text-slate-500'
                              : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            task.priority === 'HIGH'
                              ? 'bg-rose-50 text-rose-700'
                              : task.priority === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">{task.clientName}</span>
                        <span className="text-slate-400 font-mono text-[11px] tabular-nums">
                          ({task.clientPhone})
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500">Coach: {task.assignedStaffName}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-[11px] text-slate-500">{task.category}</span>
                      </div>

                      {task.notes && (
                        <p className="mt-1.5 text-xs text-slate-500 bg-slate-50 p-2 rounded">
                          {task.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs tabular-nums">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span
                        className={`font-semibold ${
                          isOverdue
                            ? 'text-rose-600'
                            : task.dueDate === todayStr
                            ? 'text-emerald-700'
                            : 'text-slate-700'
                        }`}
                      >
                        {isOverdue ? 'Overdue: ' : ''}
                        {task.dueDate}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        task.status === 'COMPLETED'
                          ? 'bg-slate-100 text-slate-600'
                          : task.status === 'IN_PROGRESS'
                          ? 'bg-blue-50 text-blue-700'
                          : isOverdue
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Follow-Up Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Schedule Follow-Up Task"
        description="Creates an operational reminder via Spring Boot POST /api/follow-ups"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Task Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Call Aisha regarding 3-month renewal offer"
              className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Client *</label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: Number(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Due Date *</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Assigned Staff</label>
              <select
                value={formData.assignedStaffId}
                onChange={(e) => setFormData({ ...formData, assignedStaffId: Number(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as FollowUpPriority })}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Notes / Objectives</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Context or talking points for outreach..."
              className="mt-1 block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Scheduling...' : 'Save Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
