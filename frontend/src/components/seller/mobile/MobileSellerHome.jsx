import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
    Activity, ChevronRight, CheckCircle, Check, Play, Sparkles,
    AlertCircle, Clock, ShoppingBag, Eye, Heart, Database, Loader, ArrowRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const MobileSellerHome = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();

    // Data States
    const [stats, setStats] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchAllData = async () => {
        try {
            const statsRes = await fetch('/api/seller/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (statsRes.ok) {
                const statsVal = await statsRes.json();
                setStats(statsVal);
            }

            const commerceRes = await fetch('/api/commerce/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (commerceRes.ok) {
                const commerceVal = await commerceRes.json();
                setDashboardData(commerceVal);
            }
        } catch (err) {
            console.error("Failed to load mobile dashboard aggregates:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

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
                await fetchAllData();
            }
        } catch (err) {
            console.error("Action error:", err);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col justify-center items-center gap-3 text-slate-400">
                <Loader className="animate-spin text-indigo-600" size={32} />
                <span className="text-xs font-bold uppercase tracking-wider">Analyzing Store Intelligence...</span>
            </div>
        );
    }

    const tasks = dashboardData?.tasks || [];
    const forecasts = dashboardData?.forecasts || [];
    const demandGaps = dashboardData?.demandGaps || [];
    
    const lowStockCount = tasks.filter(t => t.action === 'RESTOCK_INVENTORY').length || 0;
    const revenueTodayVal = dashboardData?.revenueToday || 0;
    const revenueYesterdayVal = dashboardData?.revenueYesterday || 0;
    const ordersTodayVal = dashboardData?.ordersToday || 0;
    const visitsTodayVal = dashboardData?.visitsToday || 0;

    const revenueHistory = [
        { day: 'M', revenue: Math.round((revenueTodayVal || 6200) * 0.8) },
        { day: 'T', revenue: Math.round((revenueTodayVal || 6200) * 0.95) },
        { day: 'W', revenue: Math.round((revenueTodayVal || 6200) * 0.7) },
        { day: 'T', revenue: Math.round((revenueTodayVal || 6200) * 1.1) },
        { day: 'F', revenue: Math.round((revenueTodayVal || 6200) * 1.25) },
        { day: 'S', revenue: Math.round(revenueYesterdayVal || 5800) },
        { day: 'S', revenue: Math.round(revenueTodayVal || 8400) }
    ];

    return (
        <div className="p-4 space-y-5">
            
            {/* --- GREETING HEADER --- */}
            <div>
                <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                    Good Morning 👋
                </h1>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Store Health: <span className="text-indigo-600 font-extrabold">{user?.shopDetails?.shopName || 'Retail Hub'}</span>
                </p>
            </div>

            {/* --- SECTION 1: STORE HEALTH HERO CARD --- */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex justify-between items-start">
                    <div>
                        <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest block">Store Health</span>
                        <h2 className="text-3xl font-black text-white tracking-tight mt-1">82<span className="text-xs text-slate-400">/100</span></h2>
                        <span className="text-[10px] font-bold text-emerald-400 block mt-1">Excellent Status</span>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 text-right">
                        <span className="text-[10px] font-black text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 uppercase tracking-wider">
                            +18% Demand
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold block">
                            ₹{(revenueTodayVal * 1.15 || 8400).toLocaleString()} Expected
                        </span>
                    </div>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: '82%' }}></div>
                </div>
            </div>

            {/* --- SECTION 2: TODAY'S SNAPSHOT (HORIZONTAL SCROLL) --- */}
            <div className="space-y-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Today's Snapshot</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
                    
                    {/* Revenue Card */}
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs min-w-[120px] max-w-[120px] snap-start flex flex-col justify-between">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Revenue</span>
                        <h4 className="text-lg font-black text-slate-800 mt-2">₹{revenueTodayVal.toLocaleString()}</h4>
                        <span className="text-[9px] text-emerald-600 font-extrabold mt-1">↑ 18%</span>
                    </div>

                    {/* Orders Card */}
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs min-w-[120px] max-w-[120px] snap-start flex flex-col justify-between">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Orders</span>
                        <h4 className="text-lg font-black text-slate-800 mt-2">{ordersTodayVal}</h4>
                        <span className="text-[9px] text-indigo-600 font-extrabold mt-1">{tasks.filter(t => t.action === 'RESTOCK_INVENTORY').length} Alerts</span>
                    </div>

                    {/* Visitors Card */}
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs min-w-[120px] max-w-[120px] snap-start flex flex-col justify-between">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Visitors</span>
                        <h4 className="text-lg font-black text-slate-800 mt-2">{visitsTodayVal}</h4>
                        <span className="text-[9px] text-slate-400 font-bold mt-1">Active Now</span>
                    </div>
                </div>
            </div>

            {/* --- SECTION 3: TODAY'S AI BRIEF --- */}
            <div className="bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-transparent border border-indigo-500/15 rounded-2xl p-4 shadow-xs space-y-3 relative overflow-hidden">
                <div className="flex justify-between items-center pb-2 border-b border-indigo-500/10">
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1">
                        <Sparkles size={12} /> Today's AI Brief
                    </span>
                    <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Active</span>
                </div>
                
                <div className="space-y-1.5 text-xs text-slate-700 font-semibold leading-relaxed">
                    <p className="flex items-center gap-1.5">🎯 Demand rising in beverages</p>
                    <p className="flex items-center gap-1.5">🥤 Restock Soft Drinks (Low inventory)</p>
                    <p className="flex items-center gap-1.5">💰 Expected Revenue ₹{(revenueTodayVal * 1.15 || 8400).toLocaleString()}</p>
                    <p className="flex items-center gap-1.5 text-rose-500">⚠️ {lowStockCount || 2} Low Stock Alerts</p>
                </div>
                <button
                    onClick={() => navigate('/seller/products')}
                    className="w-full h-9 bg-white border border-indigo-500/20 hover:bg-slate-50 text-indigo-600 rounded-xl text-xs font-bold shadow-xs cursor-pointer mt-2"
                >
                    View Low Stock Items
                </button>
            </div>

            {/* --- SECTION 4: REVENUE GRAPH (MAX 220PX HEIGHT) --- */}
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Last 7 Days Revenue</h3>
                        <p className="text-[9px] text-slate-400">Daily yield compared to Vadodara</p>
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Week +18%
                    </span>
                </div>
                <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueHistory} margin={{ top: 5, right: 5, left: -40, bottom: 0 }}>
                            <defs>
                                <linearGradient id="mobileRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }} />
                            <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }} />
                            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#mobileRevenueGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* --- SECTION 5: NEARBY DEMAND PULSE (SWIPE CARDS) --- */}
            <div className="space-y-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Nearby Demand Pulse</h3>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
                    {[
                        { name: "Soft Drinks", increase: 24, icon: "🥤", color: "from-amber-500 to-orange-500" },
                        { name: "Ice Cream", increase: 18, icon: "🍨", color: "from-pink-500 to-rose-500" },
                        { name: "Potato Chips", increase: 12, icon: "🍿", color: "from-teal-500 to-emerald-500" }
                    ].map((pulse, idx) => (
                        <div
                            key={idx}
                            className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs min-w-[200px] max-w-[200px] snap-start flex flex-col justify-between h-[110px]"
                        >
                            <div className="flex justify-between items-start">
                                <span className="text-2xl">{pulse.icon}</span>
                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    +{pulse.increase}%
                                </span>
                            </div>
                            <div className="flex justify-between items-end mt-2">
                                <span className="text-xs font-black text-slate-800">{pulse.name}</span>
                                <Link
                                    to="/seller/products"
                                    className="text-[9px] font-black text-indigo-600 uppercase tracking-wider flex items-center gap-0.5 hover:underline"
                                >
                                    View Products <ChevronRight size={10} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- SECTION 6: TASKS TO COMPLETE (CHECKLIST STYLE) --- */}
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs space-y-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Tasks To Complete</h3>
                
                {tasks.length > 0 ? (
                    <div className="space-y-2">
                        {tasks.map(taskItem => {
                            const isComp = taskItem.status === 'COMPLETED';
                            return (
                                <div
                                    key={taskItem._id}
                                    className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-b-0"
                                >
                                    <button
                                        disabled={isComp || actionLoading === taskItem._id}
                                        onClick={() => handleCheckTask(taskItem._id, taskItem.task)}
                                        className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                                            isComp
                                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                                : 'border-slate-300 hover:border-indigo-500'
                                        }`}
                                    >
                                        {isComp && <Check size={10} />}
                                    </button>
                                    <span className={`text-xs font-semibold ${isComp ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                        {taskItem.task}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-3 py-1">
                            <span className="w-5 h-5 bg-indigo-600 text-white rounded-lg flex items-center justify-center"><Check size={10} /></span>
                            <span className="text-xs font-semibold text-slate-400 line-through">Complete KYC</span>
                        </div>
                        <div className="flex items-center gap-3 py-1">
                            <span className="w-5 h-5 bg-indigo-600 text-white rounded-lg flex items-center justify-center"><Check size={10} /></span>
                            <span className="text-xs font-semibold text-slate-400 line-through">Upload Banner</span>
                        </div>
                        <div className="flex items-center gap-3 py-1">
                            <span className="w-5 h-5 bg-indigo-600 text-white rounded-lg flex items-center justify-center"><Check size={10} /></span>
                            <span className="text-xs font-semibold text-slate-400 line-through">Add Cover Photo</span>
                        </div>
                    </div>
                )}
            </div>

            {/* --- SECTION 7: RECENT ACTIVITY TIMELINE --- */}
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs space-y-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Recent Activity</h3>
                <div className="space-y-4 pl-2 py-1 relative">
                    <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-slate-100"></div>

                    {[
                        { icon: <Eye size={12} className="text-indigo-600" />, text: "Rahul viewed Organic Honey", time: "5m ago" },
                        { icon: <Heart size={12} className="text-rose-500" />, text: "Paneer added to interested list", time: "20m ago" },
                        { icon: <ShoppingBag size={12} className="text-emerald-600" />, text: "Request received from Indore", time: "1h ago" }
                    ].map((activity, idx) => (
                        <div key={idx} className="flex gap-4 relative">
                            <div className="w-7.5 h-7.5 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center z-10 shrink-0">
                                {activity.icon}
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-xs text-slate-700 font-semibold leading-relaxed">{activity.text}</p>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{activity.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- SECTION 8: AI OPPORTUNITIES (RECOMMENDATION CARD) --- */}
            <div className="space-y-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">AI Opportunities</h3>
                
                {demandGaps.length > 0 ? (
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex justify-between items-center">
                        <div className="space-y-1">
                            <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                90% Confidence
                            </span>
                            <h4 className="text-xs font-black text-slate-800">{demandGaps[0].productName}</h4>
                            <p className="text-[10px] text-slate-500 font-semibold">{demandGaps[0].searchesCount} buyers searching nearby</p>
                        </div>
                        <Link
                            to="/seller/products"
                            className="bg-indigo-600 text-white px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shadow"
                        >
                            Add Product
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex justify-between items-center">
                        <div className="space-y-1">
                            <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                90% Confidence
                            </span>
                            <h4 className="text-xs font-black text-slate-800">Organic Honey</h4>
                            <p className="text-[10px] text-slate-500 font-semibold">43 buyers searching in Vadodara Central</p>
                        </div>
                        <Link
                            to="/seller/products"
                            className="bg-indigo-600 text-white px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shadow"
                        >
                            Add Product
                        </Link>
                    </div>
                )}
            </div>

        </div>
    );
};

export default MobileSellerHome;
