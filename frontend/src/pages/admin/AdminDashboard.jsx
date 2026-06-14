import React, { useState, useEffect } from 'react';
import {
    FiClock, FiCheckCircle, FiShoppingBag, FiUsers, FiArrowUp, FiArrowRight,
    FiMoreHorizontal, FiZap, FiFileText, FiTarget, FiAlertTriangle, FiActivity,
    FiSpeaker, FiShield, FiX, FiCheck, FiAlertCircle, FiFlag
} from 'react-icons/fi';
import GlassCard from '../../components/ui/GlassCard';
import { useNavigate } from 'react-router-dom';
import CopilotWidget from '../../components/CopilotWidget';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [announcementHidden, setAnnouncementHidden] = useState(false);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = JSON.parse(localStorage.getItem('aisleUser'))?.token;
                const res = await fetch('/api/admin/dashboard-stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch admin stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Helper to format time relative
    const timeAgo = (dateStr) => {
        const diff = Math.floor((new Date() - new Date(dateStr)) / 60000);
        if (diff < 60) return `${diff}m ago`;
        const h = Math.floor(diff / 60);
        if (h < 24) return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
    };

    // Actionable KPIs Only
    const kpis = [
        {
            label: 'Pending Verifications',
            val: stats?.kpis?.pendingVerifications || 0,
            icon: FiClock,
            priority: 'Decision',
            action: () => navigate('/admin/verifications')
        },
        {
            label: 'Open Reports',
            val: stats?.kpis?.openReports || 0,
            icon: FiFlag,
            priority: 'Decision',
            action: () => navigate('/admin/reports')
        },
        {
            label: 'Critical Alerts',
            val: stats?.kpis?.criticalAlerts || 0,
            icon: FiAlertCircle,
            priority: 'Decision',
            action: () => navigate('/admin/activity-logs?severity=Critical')
        },
        {
            label: 'System Status',
            val: stats?.kpis?.systemHealth || 'Checking...',
            icon: FiActivity,
            priority: 'Info'
        },
    ];

    const pendingVerifications = stats?.pendingList || [];

    const activities = (stats?.activity || []).map(act => ({
        ...act,
        time: timeAgo(act.time),
        icon: FiUsers // Default for now, as we only mapped New Users
    }));

    // Mobile Status Data
    const mobileStatus = {
        verifications: stats?.kpis?.pending || 0,
        reports: 0, // Placeholder
        healthy: true
    };

    // --- RENDER ---
    return (
        <div className="space-y-4 md:space-y-6 pb-20 md:pb-10">

            {/* === MOBILE ADMIN HOME === */}
            <div className="md:hidden space-y-6 pt-2">
                {/* 1. Situation Awareness Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => navigate('/admin/verifications')} className="bg-[#174D38] rounded-2xl p-4 text-white shadow-lg shadow-gray-900/10 active:scale-95 transition-transform text-left">
                        <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                            <FiClock size={20} />
                        </div>
                        <h3 className="text-3xl font-bold">{mobileStatus.verifications}</h3>
                        <p className="text-sm font-medium opacity-90 leading-tight mt-1">Pending Verifications</p>
                    </button>

                    <button onClick={() => navigate('/admin/reports')} className="bg-white rounded-2xl p-4 border border-[#CBCBCB] shadow-sm active:scale-95 transition-transform text-left relative overflow-hidden">
                        <div className="bg-gray-100 text-gray-900 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                            <FiFlag size={20} />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{mobileStatus.reports}</h3>
                        <p className="text-sm font-medium text-gray-500 leading-tight mt-1">Active<br />Reports</p>
                    </button>
                </div>

                {/* 2. Platform Status */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${mobileStatus.healthy ? 'bg-[#174D38]/10 text-[#174D38]' : 'bg-[#4D1717]/10 text-[#4D1717]'}`}>
                            <FiActivity size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Platform Status</h3>
                            <p className={`text-xs font-bold ${mobileStatus.healthy ? 'text-[#174D38]' : 'text-[#4D1717]'}`}>
                                {mobileStatus.healthy ? '● All Systems Operational' : '● Attention Needed'}
                            </p>
                        </div>
                    </div>
                    {/* Mock Toggle/Action */}
                    <button className="text-gray-400 hover:text-gray-600"><FiMoreHorizontal size={20} /></button>
                </div>

                {/* 3. Recent Activity (Mobile Timeline) */}
                <div>
                    <div className="flex justify-between items-center mb-3 px-1">
                        <h3 className="font-bold text-gray-900">Recent Activity</h3>
                        <button onClick={() => navigate('/admin/activity-logs')} className="text-xs font-bold text-gray-500">View All</button>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-4">
                        {activities.slice(0, 5).map((act, idx) => ( // Show first 5
                            <div key={idx} className="flex gap-3 relative">
                                {/* Timeline Line */}
                                {idx !== activities.length - 1 && (
                                    <div className="absolute left-[15px] top-8 bottom-[-16px] w-[2px] bg-gray-100"></div>
                                )}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${act.type === 'success' ? 'bg-[#174D38]/10 text-[#174D38]' :
                                    act.type === 'info' ? 'bg-gray-100 text-gray-900' :
                                        act.type === 'danger' ? 'bg-[#4D1717]/10 text-[#4D1717]' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    <act.icon size={14} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800 leading-snug">{act.text}</p>
                                    <p className="text-xs text-gray-400 font-medium">{act.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* === DESKTOP CONTENT (Hidden on Mobile) === */}
            <div className="hidden md:block space-y-6">

                <div>
                    <h2 className="text-xl font-bold text-gray-800">Hello, Admin</h2>
                    <p className="text-sm text-gray-500">Here's what needs your attention today.</p>
                </div>
                {/* Action Buttons: Strict Style */}
                <div className="flex gap-3 w-full md:w-auto pb-2 md:pb-0">
                    <button
                        onClick={() => navigate('/admin/verifications')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#174D38] text-white hover:bg-[#123d2c] transition-all font-bold text-sm"
                    >
                        <FiCheckCircle /> Review Verifications
                    </button>
                    <button
                        onClick={() => navigate('/admin/reports')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-[#CBCBCB] text-gray-700 hover:bg-gray-50 transition-all font-medium text-sm"
                    >
                        <FiShield /> View Reports
                    </button>
                    <button
                        onClick={() => navigate('/admin/announcements')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-[#CBCBCB] text-gray-700 hover:bg-gray-50 transition-all font-medium text-sm"
                    >
                        <FiSpeaker /> Send Announcement
                    </button>
                    <button
                        onClick={() => navigate('/admin/feedback')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-[#CBCBCB] text-gray-700 hover:bg-gray-50 transition-all font-medium text-sm"
                    >
                        <FiCheckCircle /> Feedback
                    </button>
                    <button
                        onClick={() => navigate('/admin/assisted-listing')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-[#CBCBCB] text-gray-700 hover:bg-gray-50 transition-all font-medium text-sm"
                    >
                        <FiArrowRight /> Assisted Listing Requests
                    </button>
                </div>


                {/* Announcement Banner */}
                {!announcementHidden && (
                    <div className="bg-gray-900 rounded-2xl p-4 text-white flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm shrink-0">
                                <FiSpeaker size={20} />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded uppercase tracking-wider">Published</span>
                                <p className="font-semibold text-sm mt-0.5 leading-tight">Platform Maintenance scheduled for Dec 25th, 2:00 AM UTC.</p>
                            </div>
                        </div>
                        <button onClick={() => setAnnouncementHidden(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0">
                            <FiX />
                        </button>
                    </div>
                )}

                {/* 2. KPI Section (Strict Decision Points) */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    {kpis.map((kpi, idx) => (
                        <GlassCard
                            key={idx}
                            className={`p-5 flex flex-col justify-between h-32 ${kpi.priority === 'Decision' ? 'cursor-pointer hover:border-[#174D38]' : ''}`}
                            onClick={kpi.action}
                        >
                            <div className="flex justify-between items-start">
                                <span className={`text-sm font-medium ${kpi.label === 'System Status' ? 'text-gray-500' : 'text-gray-900'}`}>{kpi.label}</span>
                                <kpi.icon className={kpi.label === 'System Status' ? 'text-[#174D38]' : 'text-[#174D38]'} />
                            </div>
                            <div>
                                <h3 className={`text-3xl font-bold ${kpi.label === 'System Status' ? 'text-[#174D38] text-xl' : 'text-gray-900'}`}>{kpi.val}</h3>
                            </div>
                        </GlassCard>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[500px]">

                    {/* 3. Upgraded Pending Verifications */}
                    <div className="col-span-1 lg:col-span-8 flex flex-col gap-6 h-full min-h-[400px]">
                        <GlassCard className="flex-1 flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-[#CBCBCB] flex justify-between items-center bg-gray-50/50">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-bold text-gray-900">Pending Verifications</h2>
                                </div>
                                <div className="text-xs font-bold text-[#174D38]">
                                    {pendingVerifications.length} ACTIONABLE
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 custom-scrollbar">
                                {pendingVerifications.map((item) => (
                                    <div key={item.id} className="group p-3 md:p-4 rounded-xl bg-white/40 border border-white/50 hover:bg-white/80 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative">

                                        <div className="flex items-start gap-4 w-full sm:w-auto">
                                            <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg shrink-0">
                                                {item.name[0]}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                                                    <span>{item.type}</span>
                                                    <span>•</span>
                                                    <span>{item.loc}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end mt-1 sm:mt-0">
                                            <div className="flex items-center sm:flex-col sm:items-end gap-3 sm:gap-0">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${item.priority === 'High' ? 'text-red-500' :
                                                    item.priority === 'Medium' ? 'text-orange-500' : 'text-blue-500'
                                                    }`}>
                                                    {item.priority} Priority
                                                </span>
                                                <div className="sm:hidden w-1 h-3 bg-gray-200 rounded-full"></div>
                                                <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-md sm:mt-1">
                                                    <FiClock size={12} className="text-gray-400" />
                                                    {item.sla}
                                                </div>
                                            </div>

                                            {/* Hover Actions - Visible on top-right for mobile, hover for desktop */}
                                            <div className="flex items-center gap-1 md:gap-2 absolute top-3 right-3 sm:relative sm:top-0 sm:right-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 md:p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors" title="Approve">
                                                    <FiCheck className="text-sm md:text-base" />
                                                </button>
                                                <button className="p-1.5 md:p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Reject">
                                                    <FiX className="text-sm md:text-base" />
                                                </button>
                                                <button className="p-1.5 md:p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors" title="Details">
                                                    <FiMoreHorizontal className="text-sm md:text-base" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </div>

                    {/* Right Column: System Health & Activity */}
                    <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 h-full">

                        {/* 5. System Health Card */}
                        <GlassCard className="p-5 flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                    System Health
                                </h3>
                                <div className="w-2 h-2 bg-[#174D38] rounded-full"></div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
                                        <span>API Uptime</span>
                                        <span className="text-green-600">99.9%</span>
                                    </div>
                                    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="w-[99.9%] h-full bg-[#174D38] rounded-full" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
                                        <span>Error Rate (24h)</span>
                                        <span className="text-gray-700">0.02%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="w-[2%] h-full bg-blue-500 rounded-full" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
                                        <span>Verification Load</span>
                                        <span className="text-orange-500">High</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="w-[75%] h-full bg-orange-400 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </GlassCard>

                        {/* 4. Activity Feed Preview */}
                        <GlassCard className="flex-1 flex flex-col min-h-[300px]">
                            <div className="p-5 border-b border-gray-100/50 flex justify-between items-center bg-white/40">
                                <h2 className="text-sm font-bold text-gray-800">Recent Activity</h2>
                                <button
                                    onClick={() => navigate('/admin/activity-logs')}
                                    className="text-xs font-bold text-blue-600 hover:underline"
                                >
                                    View All
                                </button>
                            </div>
                            <div className="flex-1 p-5 relative overflow-hidden">
                                <div className="absolute left-9 top-5 bottom-5 w-[2px] bg-gray-100/80"></div>
                                <div className="space-y-5 relative z-10">
                                    {activities.map((act, idx) => (
                                        <div key={idx} className="flex items-start gap-4 group">
                                            <div className={`
                                            w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10 transition-transform group-hover:scale-110
                                            ${act.type === 'success' ? 'bg-green-100 text-green-600' : ''}
                                            ${act.type === 'info' ? 'bg-blue-100 text-blue-600' : ''}
                                            ${act.type === 'neutral' ? 'bg-gray-100 text-gray-500' : ''}
                                            ${act.type === 'danger' ? 'bg-red-50 text-red-500' : ''}
                                            ${act.type === 'warning' ? 'bg-amber-50 text-amber-500' : ''}
                                        `}>
                                                <act.icon size={12} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-700 truncate">{act.text}</p>
                                                <p className="text-[10px] text-gray-400 font-medium">{act.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
            <CopilotWidget role="admin" />
        </div>
    );
};

export default AdminDashboard;
