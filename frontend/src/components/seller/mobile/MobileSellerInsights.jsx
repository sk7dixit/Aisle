import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
    Activity, ChevronRight, TrendingUp, TrendingDown, RefreshCw,
    Award, Eye, ShoppingBag, ArrowUpRight, Sparkles, Plus, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer, XAxis } from 'recharts';
import toast from 'react-hot-toast';

const MobileSellerInsights = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [score, setScore] = useState(83);
    const [analytics, setAnalytics] = useState({
        revenue: { value: '₹12,540', change: '+18%', up: true },
        orders: { value: '32', change: '+12%', up: true },
        visitors: { value: '145', change: '+24%', up: true },
        conversion: { value: '4.2%', change: '+5%', up: true }
    });

    const mockChartData = [
        { day: 'Mon', revenue: 4200 },
        { day: 'Tue', revenue: 5800 },
        { day: 'Wed', revenue: 5100 },
        { day: 'Thu', revenue: 7400 },
        { day: 'Fri', revenue: 8900 },
        { day: 'Sat', revenue: 11200 },
        { day: 'Sun', revenue: 12540 }
    ];

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            // Simulate API fetch delay
            await new Promise(resolve => setTimeout(resolve, 600));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col justify-center items-center gap-3 text-slate-400">
                <RefreshCw className="animate-spin text-teal-600" size={32} />
                <span className="text-xs font-bold uppercase tracking-wider">Compiling Business Intelligence...</span>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-5 pb-24 font-sans">
            {/* Title */}
            <div>
                <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    📊 Business Insights
                </h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    AI-powered analytics and growth intelligence
                </p>
            </div>

            {/* Business Score Circular Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white rounded-3xl p-5 shadow-lg flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest block">Store Index</span>
                    <h2 className="text-2xl font-black tracking-tight leading-none">Business Score</h2>
                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-1.5 max-w-[170px]">
                        Your store ranks in the top <span className="text-emerald-400 font-extrabold">12%</span> of local merchants in Vadodara.
                    </p>
                </div>

                {/* Circle Progress bar */}
                <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="40" cy="40" r="34" className="stroke-slate-850" strokeWidth="5.5" fill="transparent" />
                        <circle cx="40" cy="40" r="34" className="stroke-indigo-550" strokeWidth="5.5" fill="transparent"
                            strokeDasharray={213.6}
                            strokeDashoffset={213.6 - (213.6 * score) / 100}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-lg font-black tracking-tight leading-none text-white">{score}</span>
                        <span className="text-[8px] font-bold text-slate-400 mt-0.5">/100</span>
                    </div>
                </div>
            </div>

            {/* 2x2 Analytics Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Revenue Card */}
                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs space-y-2 text-left">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Weekly Revenue</span>
                    <div className="text-lg font-black text-slate-800">{analytics.revenue.value}</div>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600">
                        <TrendingUp size={10} /> {analytics.revenue.change} vs last week
                    </div>
                </div>

                {/* Orders Card */}
                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs space-y-2 text-left">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Total Orders</span>
                    <div className="text-lg font-black text-slate-800">{analytics.orders.value}</div>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600">
                        <TrendingUp size={10} /> {analytics.orders.change} completed
                    </div>
                </div>

                {/* Visitors Card */}
                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs space-y-2 text-left">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Shop Visitors</span>
                    <div className="text-lg font-black text-slate-800">{analytics.visitors.value}</div>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600">
                        <TrendingUp size={10} /> {analytics.visitors.change} visibility spike
                    </div>
                </div>

                {/* Conversion Card */}
                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs space-y-2 text-left">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Conversion Rate</span>
                    <div className="text-lg font-black text-slate-800">{analytics.conversion.value}</div>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600">
                        <TrendingUp size={10} /> {analytics.conversion.change} search match
                    </div>
                </div>
            </div>

            {/* Sparkline Chart */}
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Revenue Growth Trend</h3>
                        <p className="text-[8px] text-slate-400">Weekly sales distribution</p>
                    </div>
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        ▲ 18.4%
                    </span>
                </div>
                <div className="h-24 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mockChartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="insightsRevGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.01}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="day" hide />
                            <Area type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#insightsRevGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Highlighted AI Opportunity */}
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50/30 border border-indigo-150 rounded-2xl p-4 shadow-xs space-y-3 relative overflow-hidden">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1">
                        <Sparkles size={12} className="text-indigo-600" /> High-Yield AI Gap
                    </span>
                    <span className="text-[8px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        90% Confidence
                    </span>
                </div>
                <div className="space-y-1 text-left">
                    <h4 className="font-black text-xs text-slate-800">Add Organic Honey</h4>
                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        43 high-intent buyers search for this item in Vadodara Central. Add it to capture ₹4,500+ weekly sales.
                    </p>
                </div>
                <Link
                    to="/seller/products"
                    className="w-full h-9 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1"
                >
                    Add Product Now <ChevronRight size={14} />
                </Link>
            </div>
        </div>
    );
};

export default MobileSellerInsights;
