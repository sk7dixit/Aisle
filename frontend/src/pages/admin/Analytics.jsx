import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
    FiUsers, FiShoppingBag, FiCheckCircle, FiXCircle, FiFlag, FiActivity, 
    FiCalendar, FiMapPin, FiTrendingUp, FiAlertTriangle, FiPlusCircle, FiBarChart2, FiArrowUpRight
} from 'react-icons/fi';
import GlassCard from '../../components/ui/GlassCard';

const Analytics = () => {
    const [timeRange, setTimeRange] = useState('7d');
    const [activeTab, setActiveTab] = useState('metrics');

    // Data states
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [trendsData, setTrendsData] = useState(null);
    const [trendsLoading, setTrendsLoading] = useState(false);

    // Hyperlocal states
    const [hyperlocalData, setHyperlocalData] = useState(null);
    const [hyperlocalLoading, setHyperlocalLoading] = useState(false);
    const [selectedHeatArea, setSelectedHeatArea] = useState(null);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const token = JSON.parse(localStorage.getItem('aisleUser'))?.token;
            const res = await fetch(`/api/admin/analytics`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await res.json();
            if (res.ok) {
                setData(result);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrendsData = async () => {
        setTrendsLoading(true);
        try {
            const token = JSON.parse(localStorage.getItem('aisleUser'))?.token;
            const res = await fetch(`/api/admin/trends/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await res.json();
            if (res.ok) {
                setTrendsData(result);
            }
        } catch (error) {
            console.error("Failed to fetch admin trends data:", error);
        } finally {
            setTrendsLoading(false);
        }
    };

    const fetchHyperlocalData = async () => {
        setHyperlocalLoading(true);
        try {
            const token = JSON.parse(localStorage.getItem('aisleUser'))?.token;
            const res = await fetch(`/api/admin/hyperlocal/heatmap`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await res.json();
            if (res.ok) {
                setHyperlocalData(result);
                // Default select the first area if available
                if (result.areas && result.areas.length > 0) {
                    setSelectedHeatArea(result.areas[0]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch admin hyperlocal data:", error);
        } finally {
            setHyperlocalLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    // Fallbacks if data is loading or empty
    const userGrowthData = data?.charts?.userGrowth || [];
    const categoryData = data?.charts?.categories?.map((c, i) => ({
        ...c,
        color: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'][i % 5]
    })) || [];
    const topCities = data?.charts?.topCities || [];

    // KPI Config
    const kpis = [
        { label: 'New Users', val: data?.kpis?.newUsers ?? 0, sub: 'last 7 days', icon: FiUsers, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'New Sellers', val: data?.kpis?.newSellers ?? 0, sub: 'last 7 days', icon: FiShoppingBag, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { label: 'Verified', val: data?.kpis?.verifiedShops ?? 0, sub: 'shops total', icon: FiCheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
        { label: 'Rejected', val: data?.kpis?.rejectedShops ?? 0, sub: 'shops total', icon: FiXCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
        { label: 'Active Users', val: data?.kpis?.activeUsers ?? 0, sub: '24h unique', icon: FiActivity, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { label: 'Reports', val: data?.kpis?.openReports ?? 0, sub: 'open cases', icon: FiFlag, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    ];

    // Trends Data parsing
    const trends = trendsData?.topTrending || [];
    const emerging = trendsData?.emergingTrends || [];
    const gaps = trendsData?.demandGaps || [];
    const lowSupply = trendsData?.lowSupplyAreas || [];
    const highOpportunity = trendsData?.highOpportunityCategories || [];

    // Colors for demand level badges
    const getDemandBadgeColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'very_high': return 'bg-rose-500/15 text-rose-500 border-rose-500/20';
            case 'high': return 'bg-orange-500/15 text-orange-500 border-orange-500/20';
            case 'medium': return 'bg-amber-500/15 text-amber-500 border-amber-500/20';
            default: return 'bg-slate-500/15 text-slate-500 border-slate-500/20';
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-10">

            {/* Header with Time Range & Tab Toggle */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
                    <p className="text-sm text-gray-500">Platform operational metrics and marketplace intelligence</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Tab Toggles */}
                    <div className="flex bg-white/50 backdrop-blur-sm rounded-lg p-1 border border-white/60">
                        <button
                            onClick={() => setActiveTab('metrics')}
                            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                activeTab === 'metrics' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-white/30'
                            }`}
                        >
                            Platform Metrics
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('trends');
                                if (!trendsData) fetchTrendsData();
                            }}
                            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                activeTab === 'trends' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-white/30'
                            }`}
                        >
                            AI Trends & Gaps
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('hyperlocal');
                                if (!hyperlocalData) fetchHyperlocalData();
                            }}
                            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                activeTab === 'hyperlocal' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-white/30'
                            }`}
                        >
                            Hyperlocal Heatmap
                        </button>
                    </div>

                    {/* Time Range Selector (Metrics Tab Only) */}
                    {activeTab === 'metrics' && (
                        <div className="flex bg-white/50 backdrop-blur-sm rounded-lg p-1 border border-white/60">
                            {['Today', '7d', '30d'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`
                                        px-3 py-1 rounded-md text-[10px] font-semibold transition-all
                                        ${timeRange === range ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-white/30'}
                                    `}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* TAB 1: PLATFORM METRICS */}
            {activeTab === 'metrics' && (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 shrink-0">
                        {kpis.map((kpi, idx) => (
                            <GlassCard key={idx} className="p-3 md:p-4 flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                    <div className={`p-1.5 md:p-2 rounded-lg ${kpi.bg} ${kpi.color}`}>
                                        <kpi.icon size={16} className="md:w-[18px] md:h-[18px]" />
                                    </div>
                                    <span className="text-[9px] md:text-[10px] bg-white/60 px-1.5 py-0.5 rounded text-gray-500 font-medium">
                                        {kpi.sub}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-xl md:text-2xl font-bold text-gray-800">{loading ? '...' : kpi.val}</h3>
                                    <p className="text-[10px] md:text-xs text-gray-500 font-medium">{kpi.label}</p>
                                </div>
                            </GlassCard>
                        ))}
                    </div>

                    {/* Charts Section 1: Growth */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 shrink-0">
                        {/* User Growth */}
                        <GlassCard className="p-4 md:p-6 flex flex-col h-[280px] md:h-[350px]">
                            <h3 className="text-base md:text-lg font-bold text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
                                <FiUsers className="text-blue-500" /> User Growth Impact
                            </h3>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={userGrowthData}>
                                        <defs>
                                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ stroke: '#3B82F6', strokeWidth: 2 }}
                                        />
                                        <Area type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </GlassCard>

                        {/* Seller Onboarding - Distribution */}
                        <GlassCard className="p-4 md:p-6 flex flex-col h-[280px] md:h-[350px] justify-center items-center">
                            <FiActivity className="text-4xl text-purple-500 animate-pulse mb-3" />
                            <h3 className="text-base font-bold text-gray-800 mb-1">Operational Activity Timeline</h3>
                            <p className="text-sm text-gray-400 text-center px-4 max-w-sm">Active logging of operations is automated. Historical charts will plot seller and customer onboard pipeline flow here.</p>
                        </GlassCard>
                    </div>

                    {/* Charts Section 2: Insights */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 shrink-0">
                        {/* Category Distribution */}
                        <GlassCard className="p-4 md:p-6 flex flex-col h-[280px] md:h-[350px]">
                            <h3 className="text-base md:text-lg font-bold text-gray-800 mb-2 md:mb-4 flex items-center gap-2">
                                <FiShoppingBag className="text-indigo-500" /> Categories Distribution
                            </h3>
                            <div className="flex-1 w-full min-h-0 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={75}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none mb-6">
                                    <span className="text-xl md:text-2xl font-bold text-gray-700">{categoryData.length}</span>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Activity Profile */}
                        <GlassCard className="p-4 md:p-6 flex flex-col h-[280px] md:h-[350px] justify-center items-center text-center">
                            <FiCalendar className="text-4xl text-blue-500 mb-3" />
                            <h3 className="text-base font-bold text-gray-800 mb-1">Hour-of-day Activity Index</h3>
                            <p className="text-sm text-gray-400 max-w-[240px]">Platform traffic profile hourly indices are compiled in real-time.</p>
                        </GlassCard>

                        {/* Geo Insights */}
                        <GlassCard className="p-4 md:p-6 flex flex-col h-[280px] md:h-[350px]">
                            <h3 className="text-base md:text-lg font-bold text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
                                <FiMapPin className="text-red-500" /> Top Active Cities
                            </h3>
                            <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                                {topCities.map((city, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 md:p-3 rounded-xl bg-white/40 border border-white/50 hover:bg-white/60 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center bg-gray-800 text-white text-[10px] md:text-xs font-bold rounded-full">
                                                {idx + 1}
                                            </span>
                                            <span className="font-semibold text-gray-700 text-sm">{city.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs md:text-sm font-bold text-gray-800">{city.shops} Shops</p>
                                            <p className="text-[9px] md:text-[10px] text-gray-500">{city.users} Users</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </div>
                </>
            )}

            {/* TAB 2: AI TRENDS & DEMAND GAPS */}
            {activeTab === 'trends' && (
                <>
                    {trendsLoading && !trendsData ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                            <FiActivity className="text-4xl animate-spin text-blue-500" />
                            <span className="text-xs font-black uppercase tracking-wider">Compiling Marketplace Trends...</span>
                        </div>
                    ) : (
                        <>
                            {/* Intelligence Executive Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <GlassCard className="p-5 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-xl shrink-0">
                                        <FiAlertTriangle />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Demand Gaps</span>
                                        <h3 className="text-2xl font-bold text-gray-850">{gaps.length} Active Gaps</h3>
                                    </div>
                                </GlassCard>

                                <GlassCard className="p-5 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl shrink-0">
                                        <FiTrendingUp />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Max Growth</span>
                                        <h3 className="text-2xl font-bold text-gray-850">
                                            +{emerging.length > 0 ? Math.max(...emerging.map(e => e.growthPercentage)) : 100}%
                                        </h3>
                                    </div>
                                </GlassCard>

                                <GlassCard className="p-5 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl shrink-0">
                                        <FiMapPin />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Low Supply Areas</span>
                                        <h3 className="text-2xl font-bold text-gray-850">{lowSupply.length} Zones</h3>
                                    </div>
                                </GlassCard>

                                <GlassCard className="p-5 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl shrink-0">
                                        <FiBarChart2 />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">High Opportunity</span>
                                        <h3 className="text-2xl font-bold text-gray-850">
                                            {highOpportunity[0]?.category || 'Pharmacy'}
                                        </h3>
                                    </div>
                                </GlassCard>
                            </div>

                            {/* Charts & Graphs for Gaps */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Demand vs Supply Gap Index Chart */}
                                <GlassCard className="lg:col-span-8 p-5 flex flex-col h-[380px]">
                                    <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <FiBarChart2 className="text-blue-500" /> Top Demand Gaps (Demand vs Local Supply Index)
                                    </h3>
                                    <div className="flex-1 w-full min-h-0">
                                        {gaps.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={gaps.slice(0, 6)} margin={{ bottom: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                    <XAxis dataKey="keyword" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                    <Legend />
                                                    <Bar name="Demand Score" dataKey="demandScore" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                                    <Bar name="Supply Score" dataKey="supplyScore" fill="#10B981" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                                No calculated demand gaps in the database yet.
                                            </div>
                                        )}
                                    </div>
                                </GlassCard>

                                {/* Opportunity Categories Progress */}
                                <GlassCard className="lg:col-span-4 p-5 flex flex-col justify-between h-[380px]">
                                    <div>
                                        <h3 className="text-base font-bold text-gray-800 mb-1">High Opportunity Categories</h3>
                                        <p className="text-[10px] text-gray-400 font-semibold mb-4">Categories with largest calculated supply shortages.</p>
                                    </div>
                                    <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar">
                                        {highOpportunity.length > 0 ? (
                                            highOpportunity.map((item, idx) => (
                                                <div key={idx} className="space-y-1.5">
                                                    <div className="flex justify-between text-xs font-bold text-gray-700">
                                                        <span>{item.category}</span>
                                                        <span className="text-indigo-500 font-mono">{item.score} Gps</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden border border-slate-100">
                                                        <div 
                                                            className="bg-indigo-500 h-full rounded-full transition-all" 
                                                            style={{ width: `${Math.min(100, item.score)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                                No category analytics available.
                                            </div>
                                        )}
                                    </div>
                                </GlassCard>
                            </div>

                            {/* Aggregated Trends tables */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Left: Top Trends */}
                                <GlassCard className="lg:col-span-7 p-5 flex flex-col h-[400px]">
                                    <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <FiTrendingUp className="text-indigo-500" /> Active Local Search Trends
                                    </h3>
                                    <div className="flex-1 overflow-auto custom-scrollbar">
                                        {trends.length > 0 ? (
                                            <table className="w-full text-left text-xs font-semibold">
                                                <thead>
                                                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                                                        <th className="py-2.5">Keyword</th>
                                                        <th className="py-2.5">City</th>
                                                        <th className="py-2.5 text-center">Searches</th>
                                                        <th className="py-2.5 text-center">Growth</th>
                                                        <th className="py-2.5 text-right">Demand</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {trends.map((t, idx) => (
                                                        <tr key={idx} className="border-b border-gray-50/50 hover:bg-slate-50/40 transition-colors">
                                                            <td className="py-3 font-bold text-gray-800">{t.keyword}</td>
                                                            <td className="py-3 text-gray-500 font-medium capitalize">{t.city}</td>
                                                            <td className="py-3 text-center font-mono">{t.searchCount}</td>
                                                            <td className="py-3 text-center text-emerald-600 font-mono">+{t.growthPercentage}%</td>
                                                            <td className="py-3 text-right">
                                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${getDemandBadgeColor(t.demandLevel)}`}>
                                                                    {t.demandLevel}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-gray-400">
                                                No active search trends logged in the system.
                                            </div>
                                        )}
                                    </div>
                                </GlassCard>

                                {/* Right: Emerging & Gaps List */}
                                <div className="lg:col-span-5 flex flex-col gap-6 h-[400px]">
                                    {/* Emerging Trends Card */}
                                    <GlassCard className="flex-1 p-5 flex flex-col overflow-hidden">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                                            <FiArrowUpRight className="text-emerald-500" /> Emerging Spikes (+Growth)
                                        </h3>
                                        <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar">
                                            {emerging.length > 0 ? (
                                                emerging.map((e, idx) => (
                                                    <div key={idx} className="p-3 bg-white/40 border border-white/50 rounded-xl flex items-center justify-between hover:bg-white/70 transition-colors">
                                                        <div>
                                                            <span className="font-bold text-gray-800 text-sm block leading-tight">{e.keyword}</span>
                                                            <span className="text-[10px] text-gray-450 capitalize font-medium">{e.city}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-xs font-black text-emerald-600 font-mono block">+{e.growthPercentage}%</span>
                                                            <span className="text-[9px] text-gray-400 font-semibold">{e.searchCount} queries</span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-gray-450 text-xs py-10">
                                                    No emerging keyword spikes.
                                                </div>
                                            )}
                                        </div>
                                    </GlassCard>

                                    {/* Low Supply Zones */}
                                    <GlassCard className="h-[140px] p-4 flex flex-col overflow-hidden">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                                            <FiMapPin className="text-red-500" /> Low Supply Inventory Zones
                                        </h3>
                                        <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar">
                                            {lowSupply.length > 0 ? (
                                                lowSupply.map((zone, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-xs font-bold text-gray-600">
                                                        <span className="capitalize">{zone.city}</span>
                                                        <span className="text-red-500 font-mono">{zone.count} Items Listed</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-gray-400 text-xs py-4">
                                                    All regions are sufficiently stocked.
                                                </div>
                                            )}
                                        </div>
                                    </GlassCard>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* TAB 3: HYPERLOCAL HEATMAP */}
            {activeTab === 'hyperlocal' && (
                <>
                    {hyperlocalLoading && !hyperlocalData ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                            <FiActivity className="text-4xl animate-spin text-blue-500" />
                            <span className="text-xs font-black uppercase tracking-wider">Compiling Hyperlocal Insights...</span>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Executive KPI Stats for Hyperlocal */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <GlassCard className="p-5 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xl shrink-0">
                                        <FiMapPin />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Tracked Zones</span>
                                        <h3 className="text-2xl font-bold text-gray-800">{hyperlocalData?.areas?.length ?? 0} Areas</h3>
                                    </div>
                                </GlassCard>

                                <GlassCard className="p-5 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-xl shrink-0">
                                        <FiAlertTriangle />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Max Supply Gap</span>
                                        <h3 className="text-2xl font-bold text-gray-805">
                                            {hyperlocalData?.coverageDetails?.length > 0 
                                                ? Math.max(...hyperlocalData.coverageDetails.map(c => c.gap)) 
                                                : 0} Pts
                                        </h3>
                                    </div>
                                </GlassCard>

                                <GlassCard className="p-5 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl shrink-0">
                                        <FiTrendingUp />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Peak Demand Area</span>
                                        <h3 className="text-2xl font-bold text-gray-805 capitalize">
                                            {hyperlocalData?.areas?.length > 0 
                                                ? hyperlocalData.areas[0].area 
                                                : 'Vijay Nagar'}
                                        </h3>
                                    </div>
                                </GlassCard>

                                <GlassCard className="p-5 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl shrink-0">
                                        <FiCheckCircle />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Avg Coverage Score</span>
                                        <h3 className="text-2xl font-bold text-gray-850">
                                            {hyperlocalData?.areas?.length > 0
                                                ? Math.round(hyperlocalData.areas.reduce((acc, curr) => acc + curr.supplyScore, 0) / hyperlocalData.areas.length)
                                                : 0}%
                                        </h3>
                                    </div>
                                </GlassCard>
                            </div>

                            {/* Heatmap Map + Detail Panel */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Interactive Indore map */}
                                <GlassCard className="lg:col-span-8 p-5 flex flex-col min-h-[400px]">
                                    <h3 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
                                        <FiMapPin className="text-red-500" /> Indore Locality Heatmap (Demand & Supply Coverage)
                                    </h3>
                                    <p className="text-[10px] text-gray-400 font-semibold mb-4">Click/hover zones to review localized demand, supply and supply-gap metrics.</p>
                                    
                                    <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-center relative">
                                        <span className="absolute top-3 left-3 text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> Real-time Geo Clustering
                                        </span>
                                        
                                        <svg viewBox="0 0 400 300" className="w-full max-h-[300px]">
                                            {/* Grid Lines */}
                                            <path d="M 0 50 L 400 50 M 0 100 L 400 100 M 0 150 L 400 150 M 0 200 L 400 200 M 0 250 L 400 250" stroke="rgba(99,102,241,0.04)" strokeWidth="1" />
                                            <path d="M 50 0 L 50 300 M 100 0 L 100 300 M 150 0 L 150 300 M 200 0 L 200 300 M 250 0 L 250 300 M 300 0 L 300 300 M 350 0 L 350 300" stroke="rgba(99,102,241,0.04)" strokeWidth="1" />
                                            
                                            {/* Target Center lines */}
                                            <circle cx="200" cy="150" r="110" fill="none" stroke="rgba(99,102,241,0.03)" strokeWidth="1" strokeDasharray="4 4" />
                                            <circle cx="200" cy="150" r="75" fill="none" stroke="rgba(99,102,241,0.04)" strokeWidth="1" />
                                            <circle cx="200" cy="150" r="35" fill="none" stroke="rgba(99,102,241,0.06)" strokeWidth="1" />
                                            <circle cx="200" cy="150" r="3" fill="#6366f1" />

                                            {/* Render each area dynamically based on mapped coordinates */}
                                            {hyperlocalData?.areas?.map((a) => {
                                                let x = 200, y = 150;
                                                const name = a.area.toLowerCase();
                                                if (name.includes('vijay')) { x = 240; y = 50; }
                                                else if (name.includes('palasia')) { x = 200; y = 135; }
                                                else if (name.includes('bengali')) { x = 320; y = 150; }
                                                else if (name.includes('rajwada')) { x = 60; y = 150; }
                                                else if (name.includes('bhawarkua')) { x = 120; y = 250; }
                                                else { return null; } // Skip test zone in main Indore map

                                                const demandColor = a.demandScore >= 80 ? 'rgba(239, 68, 68, 0.15)' : a.demandScore >= 60 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)';
                                                const demandPulse = a.demandScore >= 80 ? '#EF4444' : a.demandScore >= 60 ? '#F59E0B' : '#3B82F6';
                                                const radius = 15 + (a.demandScore / 100) * 20;

                                                return (
                                                    <g key={a.area} className="cursor-pointer group" onClick={() => setSelectedHeatArea(a)}>
                                                        <circle cx={x} cy={y} r={radius} fill={demandColor} className="transition-all group-hover:scale-105" />
                                                        <circle cx={x} cy={y} r={5} fill={demandPulse} />
                                                        <circle cx={x} cy={y} r={10} fill="none" stroke={demandPulse} strokeWidth="1.5" className="animate-ping" style={{ animationDuration: '3s' }} />
                                                        <text x={x + 10} y={y + 4} fill="#1F2937" className="text-[9px] font-black select-none pointer-events-none capitalize">{a.area}</text>
                                                    </g>
                                                );
                                            })}

                                            {/* Inset or Box for Test Zone (Vadodara Rural) */}
                                            <g transform="translate(15, 220)" className="cursor-pointer group" onClick={() => {
                                                const vado = hyperlocalData?.areas?.find(a => a.area.toLowerCase().includes('vadodara'));
                                                if (vado) setSelectedHeatArea(vado);
                                            }}>
                                                <rect width="90" height="40" rx="6" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1" />
                                                <text x="8" y="15" fill="#4B5563" className="text-[8px] font-black uppercase tracking-wider">Test Area Inset</text>
                                                <text x="8" y="30" fill="#1F2937" className="text-[10px] font-extrabold capitalize">Vadodara Rural</text>
                                            </g>
                                        </svg>
                                    </div>
                                </GlassCard>

                                {/* Selected Area Detail Panel */}
                                <GlassCard className="lg:col-span-4 p-5 flex flex-col justify-between min-h-[400px]">
                                    <div>
                                        <h3 className="text-base font-bold text-gray-800 mb-1">Locality Deep-Dive</h3>
                                        <p className="text-[10px] text-gray-400 font-semibold mb-4">Click a locality on the heatmap to view details.</p>
                                    </div>

                                    {selectedHeatArea ? (
                                        <div className="flex-1 flex flex-col justify-between space-y-4">
                                            <div className="space-y-4">
                                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                                                    <span className="text-[8px] font-black uppercase text-indigo-500 tracking-wider">Active Zone</span>
                                                    <h4 className="text-lg font-black text-gray-800 capitalize leading-none">{selectedHeatArea.area}</h4>
                                                    <span className="text-[9px] font-bold text-gray-400 block mt-1">Pincode: {selectedHeatArea.pincode}</span>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center text-xs font-bold">
                                                        <span className="text-gray-500">Demand Index Score:</span>
                                                        <span className="text-red-500 font-extrabold">{selectedHeatArea.demandScore}/100</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                        <div className="bg-red-500 h-full" style={{ width: `${selectedHeatArea.demandScore}%` }} />
                                                    </div>

                                                    <div className="flex justify-between items-center text-xs font-bold">
                                                        <span className="text-gray-500">Seller Supply Coverage:</span>
                                                        <span className="text-emerald-500 font-extrabold">{selectedHeatArea.supplyScore}/100</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                        <div className="bg-emerald-500 h-full" style={{ width: `${selectedHeatArea.supplyScore}%` }} />
                                                    </div>

                                                    <div className="flex justify-between items-center text-xs font-bold">
                                                        <span className="text-gray-500">Population Density:</span>
                                                        <span className="text-indigo-500 font-extrabold">{selectedHeatArea.populationScore}/100</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                        <div className="bg-indigo-500 h-full" style={{ width: `${selectedHeatArea.populationScore}%` }} />
                                                    </div>

                                                    <div className="p-3 bg-indigo-50/30 border border-indigo-100 rounded-xl text-[10px] font-bold text-indigo-600 flex justify-between items-center mt-2">
                                                        <span>Calculated Supply Gap:</span>
                                                        <span className="text-sm font-black text-red-500">
                                                            {selectedHeatArea.demandScore - selectedHeatArea.supplyScore} pts
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-gray-100 text-[10px] text-gray-400 font-medium">
                                                Coordinates: [{selectedHeatArea.lat}, {selectedHeatArea.lng}]
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-55 border border-dashed border-slate-200 rounded-2xl text-xs text-gray-400">
                                            <FiMapPin className="text-3xl text-gray-300 mb-2 animate-bounce" />
                                            <span>Please select a zone circle on the Indore map to view localized breakdown.</span>
                                        </div>
                                    )}
                                </GlassCard>
                            </div>

                            {/* Section 2: Recharts BarChart & Area Trends Table */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Locality Gap Index Recharts Bar Chart */}
                                <GlassCard className="lg:col-span-7 p-5 flex flex-col h-[380px]">
                                    <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <FiBarChart2 className="text-indigo-500" /> Locality Gap Comparison (Demand vs Supply)
                                    </h3>
                                    <div className="flex-1 w-full min-h-0">
                                        {hyperlocalData?.areas?.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={hyperlocalData.areas} margin={{ bottom: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                    <XAxis dataKey="area" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                    <Legend />
                                                    <Bar name="Demand" dataKey="demandScore" fill="#EF4444" radius={[4, 4, 0, 0]} />
                                                    <Bar name="Supply Coverage" dataKey="supplyScore" fill="#10B981" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                                No calculated gaps in the database yet.
                                            </div>
                                        )}
                                    </div>
                                </GlassCard>

                                {/* Fastest Spiking Keywords Table */}
                                <GlassCard className="lg:col-span-5 p-5 flex flex-col h-[380px]">
                                    <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <FiTrendingUp className="text-emerald-500" /> Locality-Level Spikes
                                    </h3>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        {hyperlocalData?.trends?.length > 0 ? (
                                            <table className="w-full text-left text-xs font-semibold">
                                                <thead>
                                                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                                                        <th className="py-2.5">Zone</th>
                                                        <th className="py-2.5">Product</th>
                                                        <th className="py-2.5 text-right">Growth Spike</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {hyperlocalData.trends.map((t, idx) => (
                                                        <tr key={idx} className="border-b border-gray-50/50 hover:bg-slate-50/40 transition-colors">
                                                            <td className="py-3 font-bold text-gray-800 capitalize">{t.area}</td>
                                                            <td className="py-3 text-gray-500 font-semibold capitalize">{t.product}</td>
                                                            <td className="py-3 text-right text-emerald-600 font-mono font-extrabold">{t.growth}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                                                No search spikes logged in specific sub-areas yet.
                                            </div>
                                        )}
                                    </div>
                                </GlassCard>
                            </div>

                            {/* Section 3: Detailed Market Coverage Details Table */}
                            <GlassCard className="p-5 flex flex-col">
                                <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <FiActivity className="text-indigo-500" /> Locality Coverage & Demand/Supply Gap Report
                                </h3>
                                <div className="overflow-x-auto">
                                    {hyperlocalData?.coverageDetails?.length > 0 ? (
                                        <table className="w-full text-left text-xs font-semibold">
                                            <thead>
                                                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                                                    <th className="py-2.5">Locality Name</th>
                                                    <th className="py-2.5">Pincode</th>
                                                    <th className="py-2.5 text-center">Demand Score</th>
                                                    <th className="py-2.5 text-center">Supply Score</th>
                                                    <th className="py-2.5 text-center">Gap Index</th>
                                                    <th className="py-2.5 text-right">Action Needed</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {hyperlocalData.coverageDetails.map((det, idx) => {
                                                    const isHighGap = det.gap >= 25;
                                                    const isLowGap = det.gap <= 0;
                                                    return (
                                                        <tr key={idx} className="border-b border-gray-50/50 hover:bg-slate-50/40 transition-colors">
                                                            <td className="py-3 font-bold text-gray-800 capitalize">{det.area}</td>
                                                            <td className="py-3 text-gray-550 font-mono">{det.pincode}</td>
                                                            <td className="py-3 text-center text-red-500 font-bold">{det.demandScore}</td>
                                                            <td className="py-3 text-center text-emerald-500 font-bold">{det.supplyScore}</td>
                                                            <td className={`py-3 text-center font-mono font-extrabold ${isHighGap ? 'text-rose-500' : 'text-slate-650'}`}>
                                                                {det.gap}
                                                            </td>
                                                            <td className="py-3 text-right">
                                                                {isHighGap ? (
                                                                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                                                        Acquire Sellers
                                                                    </span>
                                                                ) : isLowGap ? (
                                                                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                                                        Healthy
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                                        Increase Catalog
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="text-center py-6 text-gray-400 text-xs">
                                            No detailed gap logs available.
                                        </div>
                                    )}
                                </div>
                            </GlassCard>
                        </div>
                    )}
                </>
            )}

            <div className="h-10 md:h-4"></div> {/* Bottom Spacer */}
        </div>
    );
};

export default Analytics;
