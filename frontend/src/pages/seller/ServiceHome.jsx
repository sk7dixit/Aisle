import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  FaClock, FaCheckCircle, FaExclamationCircle, FaArrowRight, FaAngleDown, FaAngleUp, 
  FaChartLine, FaCalendarAlt, FaStar, FaInbox, FaWallet 
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

const ServiceHome = () => {
    const { token, user } = useAuth();
    const [stats, setStats] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState('');

    // Accordion State
    const [showAIInsights, setShowAIInsights] = useState(false);

    // Availability state
    const [isOnline, setIsOnline] = useState(user?.shopDetails?.isOpen ?? true);

    const fetchStats = async () => {
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const [statsRes, commerceRes] = await Promise.all([
                fetch('/api/seller/dashboard', { headers }),
                fetch('/api/commerce/dashboard', { headers })
            ]);

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
                setIsOnline(statsData.derivedStatus === 'ONLINE' || statsData.isVisible || (user?.shopDetails?.isOpen ?? true));
            }
            if (commerceRes.ok) {
                const commerceData = await commerceRes.json();
                setDashboardData(commerceData);
            }
        } catch (error) {
            console.error("Failed to fetch service stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchStats();
        }
    }, [token]);

    const toggleAvailability = async () => {
        try {
            const res = await fetch('/api/seller/visibility', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isVisible: !isOnline })
            });
            if (res.ok) {
                const data = await res.json();
                setIsOnline(!isOnline);
                setStats(prev => ({
                    ...prev,
                    derivedStatus: data.derivedStatus,
                    isManualOverride: data.isManualOverride,
                    isVisible: !isOnline
                }));
                showToast(`Status updated: Shop is now ${!isOnline ? 'ONLINE' : 'OFFLINE'}`);
            }
        } catch (error) {
            console.error("Failed to toggle status", error);
        }
    };

    const handleUpdateOperatingMode = async (mode) => {
        try {
            const res = await fetch('/api/seller/operating-mode', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ mode })
            });
            if (res.ok) {
                const data = await res.json();
                setStats(prev => ({
                    ...prev,
                    operatingMode: data.operatingMode
                }));
                showToast(`Availability System set to: ${
                    mode === 'GUARANTEED' ? 'Live Inventory' :
                    mode === 'BEST_EFFORT' ? 'Verified Availability' : 'Check Before Visit'
                }`);
                await fetchStats();
            }
        } catch (err) {
            console.error("Failed to update operating mode:", err);
            showToast("Failed to update Availability System.");
        }
    };

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage(prev => prev === msg ? '' : prev);
        }, 5000);
    };

    if (loading) return (
        <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/5 rounded w-1/4"></div>
            <div className="grid grid-cols-3 gap-6">
                <div className="h-32 bg-white/5 rounded-3xl"></div>
                <div className="h-32 bg-white/5 rounded-3xl"></div>
                <div className="h-32 bg-white/5 rounded-3xl"></div>
            </div>
        </div>
    );

    const pendingLeadsCount = stats?.pendingLeadsCount || 0;
    const upcomingVisitsCount = stats?.upcomingVisitsCount || 0;
    const completedTodayCount = stats?.ordersToday || 0;

    const ordersPendingCount = dashboardData?.ordersPending || 0;
    const revenueTodayVal = dashboardData?.revenueToday || 0;
    const revenueYesterdayVal = dashboardData?.revenueYesterday || 0;
    const revenueChangePercent = dashboardData?.revenueChangePercent || 0;

    const ordersTodayVal = dashboardData?.ordersToday || 0;
    const ordersCompletedToday = dashboardData?.ordersCompletedToday || 0;

    const visitsTodayVal = dashboardData?.visitsToday || 0;
    const visitsYesterdayVal = dashboardData?.visitsYesterday || 0;
    const visitsChangePercent = dashboardData?.visitsChangePercent || 0;

    return (
        <div className="space-y-10 animate-fade-in pb-24 max-w-5xl mx-auto">
            
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed top-20 right-6 z-[99999] px-5 py-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 text-white rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-black uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    <span>{toastMessage}</span>
                    <button onClick={() => setToastMessage('')} className="ml-2 hover:text-rose-400 text-xs font-bold font-mono">X</button>
                </div>
            )}

            {/* HEADER */}
            <div className="flex justify-between items-end border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight nebula-font">Dashboard</h1>
                    <p className="text-slate-400 mt-1 font-medium">Welcome back, {user?.name.split(' ')[0]}. Here is your operator command center.</p>
                </div>
                
                <Link 
                    to="/seller/insights" 
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:opacity-90 transition-all shadow-md flex items-center gap-2"
                >
                    <FaChartLine /> View Insights Center
                </Link>
            </div>

            {/* LAYER 1: TODAY'S OVERVIEW & SHOP STATUS */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Today's Overview</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Shop Status Card */}
                    <div className="service-card p-6 flex flex-col justify-between min-h-[160px]">
                        <div>
                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block mb-1">Shop Status</span>
                            <div className="flex items-center gap-1.5 mt-1">
                                {isOnline ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                        ONLINE
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                        OFFLINE
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1.5 mt-2">
                            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                                Timing: {stats?.openingTime || '09:00'} - {stats?.closingTime || '20:00'}
                            </p>
                            <button 
                                onClick={toggleAvailability}
                                className="text-[10px] font-black uppercase tracking-wider text-indigo-400 hover:underline flex items-center gap-1"
                            >
                                {isOnline ? "Go Offline →" : "Go Online →"}
                            </button>
                        </div>
                    </div>
                    {/* Today's Revenue */}
                    <div className="service-card p-6 flex flex-col justify-between min-h-[160px]">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block">Today's Revenue</span>
                        <div className="text-3xl font-black text-white tracking-tight my-1.5">
                            ₹{revenueTodayVal.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 mt-auto">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                revenueChangePercent >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-450'
                            }`}>
                                {revenueChangePercent >= 0 ? '↑' : '↓'} {Math.abs(revenueChangePercent)}%
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                                Yesterday: ₹{revenueYesterdayVal.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Bookings Today */}
                    <div className="service-card p-6 flex flex-col justify-between min-h-[160px]">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block">Bookings Today</span>
                        <div className="text-3xl font-black text-white tracking-tight my-1.5">
                            {ordersTodayVal}
                        </div>
                        <div className="flex items-center gap-2 mt-auto text-[10px] text-slate-400 font-semibold">
                            <span className="text-indigo-400 font-black">{ordersPendingCount} Pending</span>
                            <span>|</span>
                            <span className="text-slate-400 font-bold">{ordersCompletedToday} Completed</span>
                        </div>
                    </div>

                    {/* Customer Visits */}
                    <div className="service-card p-6 flex flex-col justify-between min-h-[160px]">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block">Customer Visits</span>
                        <div className="text-3xl font-black text-white tracking-tight my-1.5">
                            {visitsTodayVal}
                        </div>
                        <div className="flex items-center gap-2 mt-auto">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                visitsChangePercent >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-455'
                            }`}>
                                {visitsChangePercent >= 0 ? '↑' : '↓'} {Math.abs(visitsChangePercent)}%
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                                Yesterday: {visitsYesterdayVal}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Inline Alerts Box */}
                <div className="p-4 bg-white/5 border border-white/10 rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-sm text-xs font-bold text-slate-300">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400">
                            <span className="font-bold">⚠</span>
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-wider">Action Needed</h4>
                            <p className="text-[10px] text-slate-500 font-semibold">Missed customer booking inquiries require attention.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-black uppercase tracking-wider text-slate-400">
                        <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-xl border border-white/10">
                            Missed Leads: <strong className="text-rose-400">{pendingLeadsCount}</strong>
                        </span>
                        <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-xl border border-white/10">
                            Avg Response: <strong className="text-indigo-400">28 mins</strong>
                        </span>
                    </div>
                </div>
            </div>

            {/* LAYER 2: ACTION CENTER (Checklist) */}
            <div className="service-card p-8 space-y-4">
                <div>
                    <h3 className="text-lg font-black text-white nebula-font">Today's Tasks</h3>
                    <p className="text-xs text-slate-500 font-medium">Simplified service operations checklist</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Missed Leads Task */}
                    <Link to="/seller/requests" className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-between group transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center font-bold">
                                {pendingLeadsCount}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white">Missed Leads</p>
                                <p className="text-[10px] text-slate-500">Call back nearby clients</p>
                            </div>
                        </div>
                        <FaArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                    </Link>

                    {/* Pending Appointments */}
                    <Link to="/seller/bookings" className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-between group transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
                                {upcomingVisitsCount}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white">Pending Visits</p>
                                <p className="text-[10px] text-slate-500">Confirm slot appointments</p>
                            </div>
                        </div>
                        <FaArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                    </Link>

                    {/* Bank KYC */}
                    <Link to="/seller/profile" className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-between group transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                                ✓
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white">Complete KYC</p>
                                <p className="text-[10px] text-slate-500">Unlock weekly payouts</p>
                            </div>
                        </div>
                        <FaArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                    </Link>
                </div>
            </div>

            {/* STORE OPERATIONS SECTION */}
            <div className="service-card p-8 space-y-4">
                <div>
                    <h3 className="text-lg font-black text-white nebula-font">Store Operations</h3>
                    <p className="text-xs text-slate-500 font-medium">Configure storefront settings and preferences.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    {/* 1. Inventory Mode */}
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Inventory Mode</span>
                            <p className="text-xs font-bold text-white mt-1">
                                {stats?.operatingMode === 'GUARANTEED' && '🟢 Live Inventory'}
                                {stats?.operatingMode === 'BEST_EFFORT' && '🔵 Verified Availability'}
                                {stats?.operatingMode === 'RUSH' && '🟡 Check Before Visit'}
                            </p>
                        </div>
                        <div className="mt-4">
                            <select
                                value={stats?.operatingMode || 'GUARANTEED'}
                                onChange={(e) => handleUpdateOperatingMode(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-zinc-900 border border-white/10 text-slate-300 focus:outline-none"
                            >
                                <option value="GUARANTEED">Live Inventory</option>
                                <option value="BEST_EFFORT">Verified Availability</option>
                                <option value="RUSH">Check Before Visit</option>
                            </select>
                        </div>
                    </div>

                    {/* 2. Auto Timing Schedule */}
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Auto Timing</span>
                            <p className="text-xs font-bold text-white mt-1">
                                {stats?.isManualOverride ? 'Disabled (Manual Override)' : 'Enabled (Automatic Schedule)'}
                            </p>
                        </div>
                        <div className="mt-4 flex gap-2">
                            {stats?.isManualOverride ? (
                                <button
                                    onClick={async () => {
                                        try {
                                            const res = await fetch('/api/seller/reset-status', {
                                                method: 'POST',
                                                headers: { 'Authorization': `Bearer ${token}` }
                                            });
                                            if (res.ok) {
                                                const data = await res.json();
                                                setIsOnline(data.derivedStatus === 'ONLINE' || data.isVisible);
                                                showToast("Automatic timing schedule activated.");
                                                await fetchStats();
                                            }
                                        } catch (err) {
                                            console.error(err);
                                        }
                                    }}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                                >
                                    Enable Auto
                                </button>
                            ) : (
                                <button
                                    onClick={async () => {
                                        try {
                                            const res = await fetch('/api/seller/visibility', {
                                                method: 'PUT',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': `Bearer ${token}`
                                                },
                                                body: JSON.stringify({ isVisible: false })
                                            });
                                            if (res.ok) {
                                                const data = await res.json();
                                                setIsOnline(data.derivedStatus === 'ONLINE' || data.isVisible);
                                                showToast("Shop manually set to CLOSED");
                                                await fetchStats();
                                            }
                                        } catch (err) {
                                            console.error(err);
                                        }
                                    }}
                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                                >
                                    Force Close
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 3. Delivery Status */}
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Delivery Mode</span>
                            <p className="text-xs font-bold text-white mt-1">
                                Self Pickup & Home Delivery
                            </p>
                        </div>
                        <div className="mt-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-55/20">
                                ACTIVE
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* LAYER 3: INSIGHTS ACCORDION */}
            <div className="space-y-4">
                <button
                    onClick={() => setShowAIInsights(!showAIInsights)}
                    className="w-full p-4 rounded-3xl bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-wider transition-all flex justify-between items-center shadow-sm"
                >
                    <span>Business Insights (Optional)</span>
                    {showAIInsights ? <FaAngleUp /> : <FaAngleDown />}
                </button>

                {showAIInsights && (
                    <div className="service-card p-6 space-y-5 animate-scale-up">
                        {/* Demand Gaps */}
                        <div className="space-y-3">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                                🌸 Local Service Gaps
                            </span>
                            <div className="space-y-2.5">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-bold text-white">AC Gas Refill Service</p>
                                        <p className="text-[10px] text-slate-500">High local search queries in Palasia and Vijay Nagar.</p>
                                    </div>
                                    <span className="text-[9px] font-black text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded uppercase">High demand</span>
                                </div>

                                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-bold text-white">Sofa Dry Cleaning</p>
                                        <p className="text-[10px] text-slate-500">Local clients searching for dry cleaners in Indore Central.</p>
                                    </div>
                                    <span className="text-[9px] font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded uppercase">Growing</span>
                                </div>
                            </div>
                        </div>

                        {/* Conversions Efficiency Suggestion */}
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-1">
                            <span className="text-[8px] font-black uppercase text-emerald-400 tracking-wider">✓ Booking Advisor</span>
                            <h4 className="text-xs font-black text-white">Reduce Client Response Time</h4>
                            <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">Response times under 15 minutes increase booking confirmation rates by 40% (+₹4,200/mo estimated lift).</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Activity */}
            <div className="service-card p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-white nebula-font">Recent Activity</h3>
                </div>

                <div className="space-y-6">
                    {[1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-4 group cursor-pointer">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-indigo-500/30 transition-all">
                                <FaClock size={18} className="text-indigo-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">Customer visit completed successfully</p>
                                <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Indore Sector 3 • 2 hours ago</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default ServiceHome;
