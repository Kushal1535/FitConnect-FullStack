import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  CreditCard, 
  CheckCircle2, 
  Calendar, 
  ArrowUpRight, 
  UserPlus, 
  MessageSquare, 
  CalendarPlus, 
  Activity,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { followUpService } from '../services/followUpService';
import { DashboardSummary, FollowUp } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { WhatsAppNotice } from '../components/common/WhatsAppNotice';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedChartMetric, setSelectedChartMetric] = useState<'active' | 'signups' | 'renewals'>('active');
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await dashboardService.getSummary();
      setSummary(data);
    } catch (err: any) {
      showError('Failed to load dashboard', err.message || 'Error contacting API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkFollowUpComplete = async (followUp: FollowUp) => {
    try {
      await followUpService.updateFollowUpStatus(followUp.id, {
        status: 'COMPLETED',
        notes: `Completed by ${user?.fullName || 'Staff'} on ${new Date().toLocaleDateString()}`,
      });
      showSuccess('Follow-up Completed', `Task for ${followUp.clientName} marked as completed.`);
      loadData();
    } catch (err: any) {
      showError('Action Failed', err.message || 'Could not update follow-up');
    }
  };

  if (isLoading) {
    return (
      <div className="py-16">
        <LoadingSpinner size="lg" text="Loading Fit Connect operations summary..." />
      </div>
    );
  }

  if (!summary) {
    return (
      <EmptyState
        icon={Activity}
        title="No Dashboard Data Available"
        description="Unable to fetch summary metrics from the backend. Verify your connection or restart the service."
        actionText="Retry Loading"
        onAction={loadData}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time client retention, daily follow-ups, and communication overview
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/clients?action=add')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Client</span>
          </button>
          <button
            onClick={() => navigate('/communications?action=record')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Log Communication</span>
          </button>
          <button
            onClick={() => navigate('/follow-ups?action=create')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <CalendarPlus className="w-3.5 h-3.5 text-blue-600" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* WhatsApp Platform Integration Notice */}
      <WhatsAppNotice compact />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clients */}
        {typeof summary.totalClients === 'number' && <div
          onClick={() => navigate('/clients')}
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Total Registered Clients</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-200 transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {summary.totalClients}
            </span>
            <span className="text-xs text-emerald-700 font-medium flex items-center gap-0.5">
              <span>View All</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Active member roster</p>
        </div>}

        {/* Active Memberships */}
        {typeof summary.activeMemberships === 'number' && <div
          onClick={() => navigate('/clients?status=ACTIVE')}
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Active Memberships</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-100 transition-colors">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-700 tabular-nums">
              {summary.activeMemberships}
            </span>
            <span className="text-xs text-slate-500 font-medium tabular-nums">
              {typeof summary.totalClients === 'number'
                ? `${Math.round((summary.activeMemberships / Math.max(summary.totalClients, 1)) * 100)}% active rate`
                : 'Active memberships'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Valid passes on gym floor</p>
        </div>}

        {/* Pending Follow-Ups */}
        {typeof summary.pendingFollowUps === 'number' && <div
          onClick={() => navigate('/follow-ups')}
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Pending Follow-Ups</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 group-hover:bg-blue-100 transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-blue-700 tabular-nums">
              {summary.pendingFollowUps}
            </span>
            {typeof summary.overdueFollowUps === 'number' && summary.overdueFollowUps > 0 && (
              <span className="text-xs text-rose-600 font-semibold flex items-center gap-1 tabular-nums">
                <AlertTriangle className="w-3 h-3" />
                {summary.overdueFollowUps} overdue
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Scheduled client tasks</p>
        </div>}

        {/* Total Communications */}
        {typeof summary.totalCommunications === 'number' && <div className="p-5 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Total Communications</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-700">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-purple-700 tabular-nums">
              {summary.totalCommunications}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Logged client communications</p>
        </div>}
      </div>

      {/* Mid Section: Interactive Membership Trends Chart */}
      {summary.monthlyTrends?.length ? <div className="bg-white p-5 rounded-xl border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Membership & Growth Trajectory
            </h2>
            <p className="text-xs text-slate-500">
              Monthly breakdown of active memberships, new signups, and renewals
            </p>
          </div>

          {/* Chart Segmented Controls */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setSelectedChartMetric('active')}
              className={`px-3 py-1 font-semibold rounded-md transition-colors whitespace-nowrap ${
                selectedChartMetric === 'active'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Members
            </button>
            <button
              onClick={() => setSelectedChartMetric('signups')}
              className={`px-3 py-1 font-semibold rounded-md transition-colors whitespace-nowrap ${
                selectedChartMetric === 'signups'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              New Signups
            </button>
            <button
              onClick={() => setSelectedChartMetric('renewals')}
              className={`px-3 py-1 font-semibold rounded-md transition-colors whitespace-nowrap ${
                selectedChartMetric === 'renewals'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Renewals
            </button>
          </div>
        </div>

        {/* Responsive SVG Chart */}
        <div className="h-56 w-full flex items-end gap-6 sm:gap-10 pt-4 pb-2 px-2 border-b border-slate-100">
          {summary.monthlyTrends.map((trend, idx) => {
            const rawVal =
              selectedChartMetric === 'active'
                ? trend.activeCount
                : selectedChartMetric === 'signups'
                ? trend.newSignups
                : trend.renewals;

            const heightPct = Math.max((rawVal / (selectedChartMetric === 'active' ? 140 : 45)) * 100, 12);

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[11px] font-semibold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                  {rawVal}
                </span>
                <div className="w-full max-w-[48px] bg-slate-100 rounded-t-md overflow-hidden flex flex-col justify-end h-full">
                  <div
                    style={{ height: `${Math.min(heightPct, 100)}%` }}
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      selectedChartMetric === 'active'
                        ? 'bg-emerald-600 group-hover:bg-emerald-700'
                        : selectedChartMetric === 'signups'
                        ? 'bg-blue-600 group-hover:bg-blue-700'
                        : 'bg-purple-600 group-hover:bg-purple-700'
                    }`}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-600">{trend.month}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>Data synchronized from Spring Boot MySQL store</span>
        </div>
      </div> : null}

      {/* Two Column Section: Today's Follow-ups & Recent Activity */}
      {(summary.todayFollowUps || summary.recentActivities) && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Follow-ups */}
        {summary.todayFollowUps && <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Today&apos;s Scheduled Follow-Ups
              </h2>
              <p className="text-xs text-slate-500">Tasks requiring contact or action today</p>
            </div>
            <button
              onClick={() => navigate('/follow-ups')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>All Tasks</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 divide-y divide-slate-100">
            {summary.todayFollowUps.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No pending tasks due today. All caught up!
              </div>
            ) : (
              summary.todayFollowUps.map((task) => (
                <div key={task.id} className="py-3 flex items-start justify-between gap-3 group">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {task.clientName}
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
                    <p className="mt-0.5 text-xs text-slate-600 line-clamp-1">{task.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                      <span>Assigned: {task.assignedStaffName}</span>
                      <span>·</span>
                      <span>{task.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleMarkFollowUpComplete(task)}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-md transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Complete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>}

        {/* Recent Client Activities */}
        {summary.recentActivities && <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Recent Client Activity
              </h2>
              <p className="text-xs text-slate-500">Latest renewals, inquiries, and staff interactions</p>
            </div>
            <button
              onClick={() => navigate('/communications')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Comms Feed</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 divide-y divide-slate-100">
            {summary.recentActivities.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No recent activity available.</div>
            ) : summary.recentActivities.map((act) => (
              <div key={act.id} className="py-3 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {act.clientName}
                    </span>
                    <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{act.description}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Logged by {act.staffName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>}
      </div>}
    </div>
  );
};
