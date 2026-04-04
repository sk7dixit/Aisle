import React from 'react';
import {
    FiClock, FiCheckCircle, FiFlag, FiShield, FiX, FiCheck, FiMoreHorizontal, FiActivity
} from 'react-icons/fi';
import GlassCard from '../../components/ui/GlassCard';
import { useNavigate } from 'react-router-dom';

const ModeratorDashboard = () => {
    const navigate = useNavigate();

    // Mock Data - Focused on Reviews
    const kpis = [
        {
            label: 'Pending Reviews',
            val: '12',
            icon: FiClock,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            trend: 'High Priority',
        },
        {
            label: 'Flagged Issues',
            val: '5',
            icon: FiFlag,
            color: 'text-red-600',
            bg: 'bg-red-50',
            trend: '+2 today',
        },
        {
            label: 'Verified Today',
            val: '8',
            icon: FiCheckCircle,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            trend: 'Good Pace',
        },
    ];

    const reviewQueue = [
        { id: 1, name: "Anita's Boutique", type: "Fashion", loc: "Mumbai", sla: "18h left", priority: "High" },
        { id: 2, name: "Green Grocers", type: "Essentials", loc: "Pune", sla: "1d left", priority: "Medium" },
        { id: 3, name: "Tech Haven", type: "Electronics", loc: "Delhi", sla: "2d left", priority: "Low" },
    ];

    const flaggedItems = [
        { id: 101, reason: "Inappropriate Content", source: "User Report", time: "1h ago" },
        { id: 102, reason: "Duplicate Shop", source: "System Flag", time: "3h ago" },
    ];

    return (
        <div className="space-y-6 pb-10">
            <div>
                <h2 className="text-xl font-bold text-gray-800">Moderator Dashboard</h2>
                <p className="text-sm text-gray-500">Focus on quality assurance and verification.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {kpis.map((kpi, idx) => (
                    <GlassCard key={idx} hoverEffect className="p-5 flex flex-col justify-between h-32 relative overflow-hidden">
                        <div className="relative z-10 flex justify-between items-start">
                            <div className={`p-2.5 rounded-xl ${kpi.bg} ${kpi.color}`}>
                                <kpi.icon className="text-xl" />
                            </div>
                            <span className="text-xs font-bold text-gray-500 bg-white/50 px-2 py-1 rounded-lg border border-white/60">{kpi.trend}</span>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-3xl font-bold text-gray-800">{kpi.val}</h3>
                            <p className="text-sm font-semibold text-gray-500">{kpi.label}</p>
                        </div>
                    </GlassCard>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Review Queue */}
                <GlassCard className="flex flex-col min-h-[400px]">
                    <div className="p-5 border-b border-gray-100/50 flex justify-between items-center bg-white/40">
                        <div className="flex items-center gap-2">
                            <FiCheckCircle className="text-orange-500" />
                            <h2 className="text-base font-bold text-gray-800">Review Queue</h2>
                        </div>
                        <button onClick={() => navigate('/admin/verifications')} className="text-xs font-bold text-blue-600">View All</button>
                    </div>
                    <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[400px] custom-scrollbar">
                        {reviewQueue.map((item) => (
                            <div key={item.id} className="p-4 rounded-xl bg-white/40 border border-white/50 flex items-center justify-between gap-4">
                                <div>
                                    <h4 className="font-bold text-gray-800">{item.name}</h4>
                                    <p className="text-xs text-gray-500">{item.type} • {item.loc}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${item.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'
                                        }`}>{item.priority}</span>
                                    <button className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><FiCheck /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                {/* Flagged Issues */}
                <GlassCard className="flex flex-col min-h-[400px]">
                    <div className="p-5 border-b border-gray-100/50 flex justify-between items-center bg-white/40">
                        <div className="flex items-center gap-2">
                            <FiFlag className="text-red-500" />
                            <h2 className="text-base font-bold text-gray-800">Flagged Issues</h2>
                        </div>
                        <button onClick={() => navigate('/admin/reports')} className="text-xs font-bold text-blue-600">View All</button>
                    </div>
                    <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[400px] custom-scrollbar">
                        {flaggedItems.map((item) => (
                            <div key={item.id} className="p-4 rounded-xl bg-white/40 border border-white/50 flex items-center justify-between gap-4">
                                <div>
                                    <h4 className="font-bold text-gray-800">{item.reason}</h4>
                                    <p className="text-xs text-gray-500">{item.source} • {item.time}</p>
                                </div>
                                <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-600">Review</button>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default ModeratorDashboard;
