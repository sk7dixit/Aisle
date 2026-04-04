import React, { useState } from 'react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FiUsers, FiShoppingBag, FiCheckCircle, FiXCircle, FiFlag, FiActivity, FiCalendar, FiMapPin } from 'react-icons/fi';
import GlassCard from '../../components/ui/GlassCard';

const Analytics = () => {
    const [timeRange, setTimeRange] = useState('7d');

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('shoplensUser'))?.token;
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

    React.useEffect(() => {
        fetchAnalytics();
    }, []);

    // Fallbacks if data is loading or empty
    const userGrowthData = data?.charts?.userGrowth || [];
    const categoryData = data?.charts?.categories.map((c, i) => ({
        ...c,
        color: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'][i % 5]
    })) || [];
    const topCities = data?.charts?.topCities || [];

    // KPI Config
    const kpis = [
        { label: 'New Users', val: data?.kpis?.newUsers || 0, sub: 'last 7 days', icon: FiUsers, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'New Sellers', val: data?.kpis?.newSellers || 0, sub: 'last 7 days', icon: FiShoppingBag, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { label: 'Verified', val: data?.kpis?.verifiedShops || 0, sub: 'shops total', icon: FiCheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
        { label: 'Rejected', val: data?.kpis?.rejectedShops || 0, sub: 'shops total', icon: FiXCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
        { label: 'Active Users', val: data?.kpis?.activeUsers || 0, sub: '24h unique', icon: FiActivity, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { label: 'Reports', val: data?.kpis?.openReports || 0, sub: 'open cases', icon: FiFlag, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    ];

    return (
        <div className="h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-10">

            {/* Header with Time Range */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
                    <p className="text-sm text-gray-500">Platform insights and operational metrics</p>
                </div>
                <div className="flex bg-white/50 backdrop-blur-sm rounded-lg p-1 border border-white/60">
                    {['Today', '7d', '30d', 'Custom'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`
                                px-4 py-1.5 rounded-md text-xs font-semibold transition-all
                                ${timeRange === range ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-white/30'}
                            `}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

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
                            <h3 className="text-xl md:text-2xl font-bold text-gray-800">{kpi.val}</h3>
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

                {/* Seller Onboarding - Placeholder */}
                <GlassCard className="p-4 md:p-6 flex flex-col h-[200px] md:h-[350px] justify-center items-center">
                    <p className="text-sm text-gray-400 text-center px-4">Detailed pipeline data requires more history.</p>
                </GlassCard>
            </div>

            {/* Charts Section 2: Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 shrink-0">

                {/* Category Distribution */}
                <GlassCard className="p-4 md:p-6 flex flex-col h-[280px] md:h-[350px]">
                    <h3 className="text-base md:text-lg font-bold text-gray-800 mb-2 md:mb-4 flex items-center gap-2">
                        <FiShoppingBag className="text-indigo-500" /> Categories
                    </h3>
                    <div className="flex-1 w-full min-h-0 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
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
                            <span className="text-2xl md:text-3xl font-bold text-gray-700">4</span>
                        </div>
                    </div>
                </GlassCard>

                {/* Activity Profile */}
                <GlassCard className="p-4 md:p-6 flex flex-col h-[200px] md:h-[350px] justify-center items-center">
                    <p className="text-sm text-gray-400 text-center">Hourly activity data coming soon.</p>
                </GlassCard>

                {/* Geo Insights */}
                <GlassCard className="p-4 md:p-6 flex flex-col h-[280px] md:h-[350px]">
                    <h3 className="text-base md:text-lg font-bold text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
                        <FiMapPin className="text-red-500" /> Top Cities
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

            <div className="h-10 md:h-4"></div> {/* Bottom Spacer */}
        </div>
    );
};

export default Analytics;
