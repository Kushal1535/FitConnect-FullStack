
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    CalendarCheck,
    MessageSquare,
    CreditCard,
    ArrowRight,
    UserRound,
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { DashboardSummary } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const StaffDashboard: React.FC = () => {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const navigate = useNavigate();
    const { user } = useAuth();
    const { showError } = useNotification();

    useEffect(() => {
        let mounted = true;

        const loadDashboard = async () => {
            try {
                const data = await dashboardService.getSummary();
                if (mounted) setSummary(data);
            } catch (err: unknown) {
                if (mounted) {
                    showError(
                        'Dashboard Unavailable',
                        err instanceof Error
                            ? err.message
                            : 'Unable to load dashboard information.'
                    );
                }
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        loadDashboard();

        return () => {
            mounted = false;
        };
    }, []);

    const cards = [
        {
            title: 'Clients',
            value: summary?.totalClients,
            description: 'Registered client records',
            icon: Users,
            action: () => navigate('/clients'),
        },
        {
            title: 'Pending Follow-ups',
            value: summary?.pendingFollowUps,
            description: 'Follow-ups awaiting action',
            icon: CalendarCheck,
            action: () => navigate('/follow-ups'),
        },
        {
            title: 'Communications',
            value: summary?.totalCommunications,
            description: 'Recorded client interactions',
            icon: MessageSquare,
            action: () => navigate('/communications'),
        },
        {
            title: 'Active Memberships',
            value: summary?.activeMemberships,
            description: 'Currently active memberships',
            icon: CreditCard,
            action: () => navigate('/clients?status=ACTIVE'),
        },
    ];

    if (isLoading) {
        return (
            <div className="py-16">
                <LoadingSpinner size="lg" text="Loading your staff dashboard..." />
            </div>
        );
    }

    if (!summary) {
        return (
            <EmptyState
                icon={UserRound}
                title="Dashboard Unavailable"
                description="We couldn't load the dashboard. Check your connection and try again."
                actionText="Retry"
                onAction={() => window.location.reload()}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    Staff Workspace
                </p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                    Welcome, {user?.fullName || 'Staff Member'}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    Manage client interactions, follow-ups, and daily activities.
                </p>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-emerald-700">
                        <UserRound className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-emerald-900">
                            Staff Account
                        </p>
                        <p className="text-xs text-emerald-800">
                            {user?.email}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <button
                            key={card.title}
                            type="button"
                            onClick={card.action}
                            className="rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-emerald-300 hover:shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-600">
                                    {card.title}
                                </span>
                                <Icon className="h-5 w-5 text-emerald-600" />
                            </div>

                            <p className="mt-4 text-3xl font-bold text-slate-900">
                                {typeof card.value === 'number' ? card.value : '—'}
                            </p>

                            <div className="mt-2 flex items-center justify-between gap-2">
                                <span className="text-xs text-slate-500">
                                    {card.description}
                                </span>
                                <ArrowRight className="h-4 w-4 shrink-0 text-emerald-600" />
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="text-base font-bold text-slate-900">
                    Quick Actions
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Access your everyday tools.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <button
                        type="button"
                        onClick={() => navigate('/clients?action=add')}
                        className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                        Add Client
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/communications?action=record')}
                        className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Log Communication
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/follow-ups?action=create')}
                        className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Create Follow-up
                    </button>
                </div>
            </div>

            <p className="text-xs text-slate-400">
                Summary figures currently reflect the dashboard API response; they
                are not necessarily limited to records assigned to this staff member.
            </p>
        </div>
    );
};
