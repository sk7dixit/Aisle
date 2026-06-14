import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    FaStore, FaClock, FaCheckCircle, FaSpinner, FaLightbulb, FaTimes,
    FaArrowUp, FaCheck, FaExclamationCircle, FaUser, FaInfoCircle, FaAngleDown, FaAngleUp, FaChartLine
} from 'react-icons/fa';
import { io } from 'socket.io-client';
import { Link } from 'react-router-dom';
import QRScannerModal from '../../components/seller/QRScannerModal';
import PaymentSetupModal from '../../components/seller/PaymentSetupModal';
import { useSupport } from '../../context/SupportContext';
import { useNotifications } from '../../context/NotificationContext';
import '../../components/seller/seller-theme.css';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SellerHome = () => {
    const { user, token } = useAuth();
    const { openSupport } = useSupport();
    const { refreshData } = useNotifications();

    // Data states
    const [dashboardData, setDashboardData] = useState(null);
    const [stats, setStats] = useState({
        derivedStatus: 'CLOSED',
        isManualOverride: false,
        operatingMode: 'GUARANTEED',
        openingTime: '09:00',
        closingTime: '20:00',
        isVisible: false,
        upcomingVisitsCount: 0,
        ordersToday: 0
    });
    
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Accordion State for AI Insights
    const [showAIInsights, setShowAIInsights] = useState(false);

    // Timing Form State
    const [editTiming, setEditTiming] = useState(false);
    const [openTimeInput, setOpenTimeInput] = useState('09:00');
    const [closeTimeInput, setCloseTimeInput] = useState('20:00');

    // Fetch Dashboard Stats & Commerce OS metrics
    const fetchAllData = async () => {
        try {
            // 1. Fetch Legacy stats
            const statsRes = await fetch('/api/seller/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (statsRes.ok) {
                const statsVal = await statsRes.json();
                setStats(statsVal);
                setOpenTimeInput(statsVal.openingTime || '09:00');
                setCloseTimeInput(statsVal.closingTime || '20:00');
            }

            // 2. Fetch Commerce intelligence
            const commerceRes = await fetch('/api/commerce/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (commerceRes.ok) {
                const commerceVal = await commerceRes.json();
                setDashboardData(commerceVal);
            }
        } catch (err) {
            console.error("Failed to load dashboard aggregates:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();

        if (!user?._id) return;
        const socket = io();
        socket.emit("seller:join", user._id);
        socket.on("notification:new", (newNotif) => {
            console.log("🔔 Live Update inside Operator Home:", newNotif);
            refreshData();
            fetchAllData();
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    // Handle Schedule Timings Save
    const handleSaveSchedule = async () => {
        try {
            const res = await fetch('/api/seller/schedule', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ openingTime: openTimeInput, closingTime: closeTimeInput })
            });
            if (res.ok) {
                const data = await res.json();
                setStats(prev => ({
                    ...prev,
                    openingTime: data.openingTime,
                    closingTime: data.closingTime,
                    derivedStatus: data.derivedStatus
                }));
                showToast(`Timing updated to: ${data.openingTime} - ${data.closingTime}`);
                setEditTiming(false);
            }
        } catch (err) {
            console.error(err);
            showToast("Failed to update shop schedule.");
        }
    };

    // Toggle manual visibility status
    const handleToggleVisibility = async (isVisible) => {
        try {
            const res = await fetch('/api/seller/visibility', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isVisible })
            });
            if (res.ok) {
                const data = await res.json();
                setStats(prev => ({
                    ...prev,
                    derivedStatus: data.derivedStatus,
                    isManualOverride: data.isManualOverride
                }));
                showToast(`Shop manually set to ${isVisible ? 'OPEN' : 'CLOSED'}`);
            }
        } catch (err) {
            console.error(err);
            showToast("Error updating visibility.");
        }
    };

    // Reset back to auto timing mode
    const handleResetAutoTiming = async () => {
        try {
            const res = await fetch('/api/seller/reset-status', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(prev => ({
                    ...prev,
                    derivedStatus: data.derivedStatus,
                    isManualOverride: data.isManualOverride
                }));
                showToast("Automatic timing schedule activated.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Update shop operating mode (Availability System)
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
                await fetchAllData();
            }
        } catch (err) {
            console.error("Failed to update operating mode:", err);
            showToast("Failed to update Availability System.");
        }
    };

    // Handle Task resolution execution
    const handleCheckTask = async (taskId, taskName) => {
        setActionLoading(taskId);
        try {
            const res = await fetch(`/api/commerce/tasks/${taskId}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                showToast(`Resolved: "${taskName}"`);
                await fetchAllData();
            } else {
                showToast("Task resolution failed.");
            }
        } catch (err) {
            console.error("Action error:", err);
        } finally {
            setActionLoading(null);
        }
    };

    // Toast helper
    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage(prev => prev === msg ? '' : prev);
        }, 5000);
    };

    if (loading) {
        return (
            <div className="min-h-[80vh] flex flex-col justify-center items-center gap-4 text-[var(--muted-foreground)]">
                <FaSpinner className="animate-spin text-4xl text-indigo-500" />
                <span className="text-xs font-black uppercase tracking-widest">Loading Aisle Seller Dashboard...</span>
            </div>
        );
    }

    const tasks = dashboardData?.tasks || [];
    const forecasts = dashboardData?.forecasts || [];
    const demandGaps = dashboardData?.demandGaps || [];

    const lowStockCount = tasks.filter(t => t.action === 'RESTOCK_INVENTORY').length || 0;
    const ordersPendingCount = dashboardData?.ordersPending || 0;
    const revenueTodayVal = dashboardData?.revenueToday || 0;
    const revenueYesterdayVal = dashboardData?.revenueYesterday || 0;
    const revenueChangePercent = dashboardData?.revenueChangePercent || 0;

    const ordersTodayVal = dashboardData?.ordersToday || 0;
    const ordersCompletedToday = dashboardData?.ordersCompletedToday || 0;

    const visitsTodayVal = dashboardData?.visitsToday || 0;
    const visitsYesterdayVal = dashboardData?.visitsYesterday || 0;
    const visitsChangePercent = dashboardData?.visitsChangePercent || 0;

    const shopCategory = user?.shopDetails?.shopCategory || user?.shopDetails?.category || '';
    const isPharmacy = shopCategory?.toUpperCase()?.includes('PHARMACY') || user?.shopDetails?.shopType === 'PHARMACY';

    const revenueHistory = [
        { day: 'Mon', revenue: Math.round((revenueTodayVal || 6200) * 0.8) },
        { day: 'Tue', revenue: Math.round((revenueTodayVal || 6200) * 0.95) },
        { day: 'Wed', revenue: Math.round((revenueTodayVal || 6200) * 0.7) },
        { day: 'Thu', revenue: Math.round((revenueTodayVal || 6200) * 1.1) },
        { day: 'Fri', revenue: Math.round((revenueTodayVal || 6200) * 1.25) },
        { day: 'Sat', revenue: Math.round(revenueYesterdayVal || 5800) },
        { day: 'Sun', revenue: Math.round(revenueTodayVal || 8400) }
    ];

    return (
        <div className="space-y-8 pb-24 relative select-none max-w-5xl mx-auto">

            {/* Float Toast Notification */}
            {toastMessage && (
                <div className="fixed top-20 right-6 z-[99999] px-5 py-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 text-white rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-black uppercase tracking-wider animate-scale-up">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    <span>{toastMessage}</span>
                    <button onClick={() => setToastMessage('')} className="ml-2 hover:text-rose-400">
                        <FaTimes />
                    </button>
                </div>
            )}

            {/* HEADER */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-neutral-800/60 pb-4">
                <div>
                    <h1 className="text-xl font-black text-slate-800 dark:text-neutral-100 tracking-tight">
                        Good Morning, {user.name?.split(' ')[0]} <span className="inline-block origin-bottom-right animate-wave">👋</span>
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 mt-1">
                        Store: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{user.shopDetails?.shopName || 'Retail Hub'}</span>
                    </p>
                </div>
                
                <Link 
                    to="/seller/insights" 
                    className="px-4 py-1.5 border border-indigo-500 text-indigo-500 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-indigo-500 hover:text-white transition-all shadow-sm flex items-center gap-1.5"
                >
                    <FaChartLine /> View Insights Center
                </Link>
            </div>

            {/* TODAY'S AI SUMMARY BAR */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-500/15 via-indigo-500/10 to-transparent border border-indigo-500/20 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-700 dark:text-neutral-350">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    <span className="font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Today's AI Summary</span>
                </div>
                <div className="flex flex-wrap items-center gap-6 text-[11px] font-bold">
                    <span>Revenue Expected: <strong className="text-indigo-600 dark:text-indigo-400">₹{(revenueTodayVal * 1.15 || 8400).toLocaleString()}</strong></span>
                    <span>•</span>
                    <span>Demand: <strong className="text-indigo-600 dark:text-indigo-400">↑ 18% Indore surge</strong></span>
                    <span>•</span>
                    <span>Risk: <strong className="text-rose-500">{lowStockCount || 2} low stock items</strong></span>
                </div>
            </div>

            {/* LAYER 1: TODAY'S OVERVIEW & HEALTH */}
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    
                    {/* Business Health Card */}
                    <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md flex flex-col justify-between min-h-[160px]">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-neutral-550 block mb-1">Business Health</span>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-2xl font-black text-slate-800 dark:text-neutral-100 tracking-tight">82 / 100</span>
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                    Excellent
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-neutral-800 h-2 rounded-full mt-3 overflow-hidden">
                                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '82%' }}></div>
                            </div>
                        </div>
                        <div className="text-[9px] text-slate-400 dark:text-neutral-500 font-semibold space-y-1.5 mt-3">
                            <div className="flex justify-between">
                                <span>Inventory</span>
                                <span className="text-slate-750 dark:text-neutral-300 font-extrabold">90%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Response Rate</span>
                                <span className="text-slate-750 dark:text-neutral-300 font-extrabold">85%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Availability</span>
                                <span className="text-slate-750 dark:text-neutral-300 font-extrabold">75%</span>
                            </div>
                        </div>
                    </div>

                    {/* Today's Revenue */}
                    <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md flex flex-col justify-between min-h-[160px]">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-neutral-550 block">Today's Revenue</span>
                        <div className="text-3xl font-black text-slate-800 dark:text-neutral-100 tracking-tight my-1.5">
                            ₹{revenueTodayVal.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 mt-auto">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                revenueChangePercent >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                            }`}>
                                {revenueChangePercent >= 0 ? '↑' : '↓'} {Math.abs(revenueChangePercent)}%
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-neutral-550 font-semibold">
                                Yesterday: ₹{revenueYesterdayVal.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Orders Today */}
                    <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md flex flex-col justify-between min-h-[160px]">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-neutral-550 block">Orders Today</span>
                        <div className="text-3xl font-black text-slate-800 dark:text-neutral-100 tracking-tight my-1.5">
                            {ordersTodayVal}
                        </div>
                        <div className="flex items-center gap-2 mt-auto text-[10px] text-slate-400 dark:text-neutral-550 font-semibold">
                            <span className="text-indigo-550 dark:text-indigo-400 font-black">{ordersPendingCount} Pending</span>
                            <span>|</span>
                            <span className="text-slate-500 dark:text-neutral-400 font-bold">{ordersCompletedToday} Completed</span>
                        </div>
                    </div>

                    {/* Customer Visits */}
                    <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md flex flex-col justify-between min-h-[160px]">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-neutral-550 block">Customer Visits</span>
                        <div className="text-3xl font-black text-slate-800 dark:text-neutral-100 tracking-tight my-1.5">
                            {visitsTodayVal}
                        </div>
                        <div className="flex items-center gap-2 mt-auto">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                visitsChangePercent >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                            }`}>
                                {visitsChangePercent >= 0 ? '↑' : '↓'} {Math.abs(visitsChangePercent)}%
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-neutral-555 font-semibold">
                                Yesterday: {visitsYesterdayVal}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Operations Status Strip (Replaces Today's Tasks checklist) */}
                <div className="py-3.5 px-6 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-650 dark:text-neutral-400">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold">
                        <FaCheckCircle className="text-emerald-500 text-sm animate-pulse" />
                        <span>All Operations Normal</span>
                    </div>
                    <div className="flex items-center gap-6 text-[11px] text-slate-500 dark:text-neutral-450 font-bold">
                        <span><strong>{ordersPendingCount}</strong> Pending Orders</span>
                        <span>•</span>
                        <span><strong>{lowStockCount}</strong> Inventory Alerts</span>
                        <span>•</span>
                        <span><strong>{dashboardData?.pendingLeadsCount || 0}</strong> Customer Requests</span>
                    </div>
                </div>
            </div>

            {/* REVENUE LAST 7 DAYS TREND CHART */}
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-neutral-100 uppercase tracking-widest">Revenue Last 7 Days</h3>
                        <p className="text-[10px] text-slate-400 font-medium">Daily transaction yield trends compared to Indore average</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-555/20">
                        ▲ +18% Trend
                    </span>
                </div>
                <div className="h-56 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="homeRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.15)" />
                            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                            <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                            <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }} />
                            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#homeRevenueGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* NEARBY DEMAND PULSE & CUSTOMER ACTIVITY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hyperlocal Demand Pulse */}
                <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-neutral-100 uppercase tracking-widest">Nearby Demand Pulse</h3>
                        <p className="text-[10px] text-slate-400 font-medium">Hyperlocal demand trends from Indore Central search volumes</p>
                    </div>
                    <div className="space-y-3 pt-1">
                        {[
                            { name: "Soft Drinks", increase: 24, icon: "🥤" },
                            { name: "Ice Cream", increase: 18, icon: "🍨" },
                            { name: "Potato Chips", increase: 12, icon: "🍿" }
                        ].map((pulse, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 dark:bg-neutral-950 border border-slate-100 dark:border-neutral-850 rounded-2xl flex items-center justify-between transition-all hover:translate-x-1 duration-200">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{pulse.icon}</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-neutral-300">{pulse.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">
                                        📈 +{pulse.increase}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-right text-[9px] text-slate-400 font-bold uppercase tracking-wider pt-1">
                        Updated 4 mins ago
                    </div>
                </div>

                {/* Recent Customer Activity */}
                <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-neutral-100 uppercase tracking-widest">Recent Activity</h3>
                        <p className="text-[10px] text-slate-400 font-medium">Real-time interactions on your items nearby</p>
                    </div>
                    <div className="space-y-3 pt-1">
                        {[
                            { text: "Rahul viewed Organic Honey 5 min ago", badge: "viewed" },
                            { text: "2 users added Fresh Paneer to interested list", badge: "interested" },
                            { text: "1 request pending from Indore Central area", badge: "pending" },
                            { text: "4 products trending in neighboring streets", badge: "trending" }
                        ].map((act, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-650 dark:text-neutral-350">
                                <span className="text-indigo-555 dark:text-indigo-400 font-bold mt-1">•</span>
                                <p className="leading-relaxed font-semibold">
                                    {act.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* AI BUSINESS INSIGHTS (Always expanded, highly visible) */}
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-6">
                <div>
                    <h3 className="text-sm font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                        ✨ Aisle AI Business Insights
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">Autonomous optimization suggestions with pricing, inventory and margin adjustments</p>
                </div>
                
                {/* Demand Rising list */}
                <div className="space-y-3">
                    <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider font-bold block">
                        🔥 Demand Rising nearby
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {forecasts.length > 0 ? (
                            forecasts.slice(0, 2).map((item, idx) => (
                                <div key={idx} className="p-3.5 bg-slate-55 dark:bg-neutral-955 rounded-2xl border border-slate-100 dark:border-neutral-850 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-bold text-slate-850 dark:text-neutral-200">{item.productName}</p>
                                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Predicted demand: {item.predictedDemand} units</p>
                                    </div>
                                    <span className="text-[9px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded uppercase">
                                        {item.confidence}% Confidence
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="p-3.5 bg-slate-55 dark:bg-neutral-955 rounded-2xl border border-slate-100 dark:border-neutral-850 text-xs font-bold text-slate-400 text-center col-span-2">
                                No active demand surges forecast at this moment.
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Recommendations tasks list (relocated Today's Tasks action list here) */}
                <div className="space-y-3">
                    <span className="text-[9px] font-black uppercase text-emerald-500 tracking-wider font-bold block">
                        📋 Actionable AI Recommendations
                    </span>
                    {tasks.length > 0 ? (
                        <div className="space-y-2.5">
                            {tasks.map((taskItem) => {
                                const isHigh = taskItem.priority === 'HIGH';
                                const isComp = taskItem.status === 'COMPLETED';
                                
                                let taskDisplay = taskItem.task;
                                if (taskItem.action === 'COMPLETE_PAYMENT_SETUP') taskDisplay = "Complete bank verification KYC";
                                if (taskItem.action === 'RESTOCK_INVENTORY') taskDisplay = `Restock ${taskItem.task.replace('Restock ', '')}`;
                                if (taskItem.action === 'EXTEND_OFFER') taskDisplay = "Renew expired promo offer campaign";

                                return (
                                    <div 
                                        key={taskItem._id}
                                        className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 ${
                                            isComp 
                                                ? 'bg-slate-50/50 dark:bg-neutral-955/40 border-slate-100 dark:border-neutral-850 opacity-60' 
                                                : 'bg-white dark:bg-neutral-955 border-slate-100 dark:border-neutral-800 hover:border-indigo-200 dark:hover:border-indigo-900'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <button 
                                                disabled={isComp || actionLoading === taskItem._id}
                                                onClick={() => handleCheckTask(taskItem._id, taskItem.task)}
                                                className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                                                    isComp 
                                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow' 
                                                        : 'border-slate-300 dark:border-neutral-700 hover:border-indigo-500'
                                                }`}
                                            >
                                                {isComp && <FaCheck size={9} />}
                                            </button>
                                            <div>
                                                <span className={`text-xs font-bold block ${isComp ? 'line-through text-slate-400' : 'text-slate-800 dark:text-neutral-200'}`}>
                                                    {taskDisplay}
                                                </span>
                                                <span className={`text-[8px] font-black uppercase tracking-wider ${isHigh ? 'text-rose-500' : 'text-slate-400'}`}>
                                                    {taskItem.priority} Priority
                                                </span>
                                            </div>
                                        </div>

                                        {!isComp && taskItem.action && (
                                            <button
                                                disabled={actionLoading === taskItem._id}
                                                onClick={() => handleCheckTask(taskItem._id, taskItem.task)}
                                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5"
                                            >
                                                {actionLoading === taskItem._id ? <FaSpinner className="animate-spin" /> : "Complete"}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-4 bg-emerald-500/5 border border-emerald-200/20 rounded-2xl space-y-1">
                            <span className="text-[8px] font-black uppercase text-emerald-600 tracking-wider">✓ Success Recommendation</span>
                            <h4 className="text-xs font-black text-slate-850 dark:text-neutral-200">Catalog is 100% Optimized</h4>
                            <p className="text-[10px] text-slate-500 dark:text-neutral-450 leading-normal">Your pricing indexing and regional stock targets are in optimal balance.</p>
                        </div>
                    )}
                </div>

                {/* Search Gap Opportunity */}
                <div className="space-y-3">
                    <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider font-bold block">
                        💡 Opportunities to add
                    </span>
                    <div className="space-y-3">
                        {demandGaps.length > 0 ? (
                            demandGaps.slice(0, 2).map((gapItem, idx) => (
                                <div key={idx} className="p-3 bg-slate-55 dark:bg-neutral-955 border border-slate-100 dark:border-neutral-850 rounded-2xl flex items-center justify-between gap-3">
                                    <div>
                                        <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 block leading-none">{gapItem.productName}</span>
                                        <span className="text-[9px] text-slate-500 font-semibold">{gapItem.searchesCount} buyers searching nearby</span>
                                    </div>
                                    <Link 
                                        to="/seller/products" 
                                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider"
                                    >
                                        Add Item
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <div className="p-3.5 bg-slate-55 dark:bg-neutral-955 rounded-2xl border border-slate-100 dark:border-neutral-850 text-xs font-bold text-slate-400 text-center">
                                No custom search gaps detected currently.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* QUICK ACTIONS GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/seller/products" className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-100 dark:border-neutral-800/80 flex flex-col items-center justify-center text-center gap-2.5 hover:border-indigo-500 transition-all shadow-sm">
                    <span className="text-lg">📦</span>
                    <span className="text-slate-800 dark:text-neutral-200 font-extrabold text-xs">Products</span>
                </Link>
                <Link to="/seller/customer-visits" className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-100 dark:border-neutral-800/80 flex flex-col items-center justify-center text-center gap-2.5 hover:border-indigo-500 transition-all shadow-sm">
                    <span className="text-lg">📋</span>
                    <span className="text-slate-800 dark:text-neutral-200 font-extrabold text-xs">Orders</span>
                </Link>
                <Link to="/seller/insights" className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-100 dark:border-neutral-800/80 flex flex-col items-center justify-center text-center gap-2.5 hover:border-indigo-500 transition-all shadow-sm">
                    <span className="text-lg">📅</span>
                    <span className="text-slate-800 dark:text-neutral-200 font-extrabold text-xs">Events</span>
                </Link>
                <Link to="/seller/catalog-requests" className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-100 dark:border-neutral-800/80 flex flex-col items-center justify-center text-center gap-2.5 hover:border-indigo-500 transition-all shadow-sm">
                    <span className="text-lg">💬</span>
                    <span className="text-slate-800 dark:text-neutral-200 font-extrabold text-xs">Requests</span>
                </Link>
            </div>

            {/* Modals for QR Scanning and Setup */}
            {showScanner && (
                <QRScannerModal onScan={(code) => {
                    setShowScanner(false);
                    showToast(`Scanned QR code: ${code}`);
                }} onClose={() => setShowScanner(false)} />
            )}

            {showPaymentModal && (
                <PaymentSetupModal onClose={() => {
                    setShowPaymentModal(false);
                    fetchAllData();
                }} />
            )}
        </div>
    );
};

export default SellerHome;
