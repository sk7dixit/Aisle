import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaClock, FaCheckCircle, FaExclamationCircle, FaArrowRight } from 'react-icons/fa';

const ServiceHome = () => {
    const { token, user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/seller/dashboard', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch service stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [token]);

    if (loading) return <div className="animate-pulse space-y-6">
        <div className="h-8 bg-white/5 rounded w-1/4"></div>
        <div className="grid grid-cols-3 gap-6">
            <div className="h-32 bg-white/5 rounded-3xl"></div>
            <div className="h-32 bg-white/5 rounded-3xl"></div>
            <div className="h-32 bg-white/5 rounded-3xl"></div>
        </div>
    </div>;

    return (
        <div className="space-y-10 animate-fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-nebula-text-header tracking-tight">Dashboard</h1>
                    <p className="text-nebula-text-body mt-1 font-medium">Welcome back, {user?.name.split(' ')[0]}. Here is what's happening today.</p>
                </div>
                <button className="warrior-btn px-6 py-2.5 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    Refresh Stats <FaArrowRight size={12} />
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pending Leads */}
                <div className="service-card p-6 group">
                    <div className="relative z-10">
                        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Incoming Requests</h3>
                        <p className="text-5xl font-black text-white leading-tight Outfit">{stats?.pendingLeadsCount || 0}</p>
                        <div className="flex items-center gap-2 mt-4 text-xs font-bold text-slate-500">
                            <span className="text-indigo-400">+2 from yesterday</span>
                        </div>
                    </div>
                    <FaClock className="card-watermark" size={100} />
                </div>

                {/* Upcoming Visits */}
                <div className="service-card p-6 group">
                    <div className="relative z-10">
                        <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-1">Scheduled Visits</h3>
                        <p className="text-5xl font-black text-white leading-tight Outfit">{stats?.upcomingVisitsCount || 0}</p>
                        <div className="flex items-center gap-2 mt-4 text-xs font-bold text-slate-500">
                            <span className="text-purple-400">Next: 2:00 PM</span>
                        </div>
                    </div>
                    <FaArrowRight className="card-watermark" size={100} />
                </div>

                {/* Earnings / Success */}
                <div className="service-card p-6 group">
                    <div className="relative z-10">
                        <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Completed Today</h3>
                        <p className="text-5xl font-black text-white leading-tight Outfit">{stats?.ordersToday || 0}</p>
                        <div className="flex items-center gap-2 mt-4 text-xs font-bold text-slate-500">
                            <span className="text-emerald-400">Target Reached: 80%</span>
                        </div>
                    </div>
                    <FaCheckCircle className="card-watermark" size={100} />
                </div>
            </div>

            <div className="grid lg:grid-cols-[1.5fr,1fr] gap-8">
                {/* Recent Activity Section (New) */}
                <div className="service-card p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black text-white nebula-font">Recent Activity</h3>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase cursor-pointer hover:underline">View All</span>
                    </div>

                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4 group cursor-pointer">
                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-indigo-500/30 transition-all">
                                    <FaClock size={18} className="text-indigo-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">New request received from Home Sector 4</p>
                                    <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Plumbing Service • 2 mins ago</p>
                                </div>
                                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                    <FaArrowRight size={12} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mini System Info / CTA */}
                <div className="space-y-6">
                    <div className="service-card p-8 bg-gradient-to-br from-indigo-500/10 to-transparent">
                        <h3 className="text-lg font-black text-white nebula-font mb-2">Grow Your Reach</h3>
                        <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">
                            Verified service providers get 3x more visibility in local searches. Boost your profile today.
                        </p>
                        <button className="warrior-btn w-full py-4 font-black uppercase text-xs tracking-[0.2em] flex justify-center items-center gap-2">
                            Go Professional <FaArrowRight size={14} />
                        </button>
                    </div>

                    <div className="service-card p-6 flex items-center gap-4 bg-white/0 border-dashed border-white/20">
                        <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400">
                            <FaExclamationCircle size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white">Profile Incomplete</p>
                            <p className="text-[10px] text-slate-500 font-medium">Add photos to your service portfolio.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceHome;
