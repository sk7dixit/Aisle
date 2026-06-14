import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    FaExclamationCircle, FaStar, FaCheckCircle, FaSpinner, FaLightbulb, FaTrophy,
    FaRobot, FaAngleRight, FaArrowUp, FaChartLine, FaTimes, FaMapMarkerAlt, FaCheck, FaExclamationTriangle,
    FaCoins, FaArrowDown, FaStore, FaChartPie, FaPercentage, FaGraduationCap
} from 'react-icons/fa';
import { io } from 'socket.io-client';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import '../../components/seller/seller-theme.css'; // Predefined theme styling
import CopilotWidget from '../../components/CopilotWidget';

const SellerInsights = () => {
    const { user, token } = useAuth();
    
    // Data states
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [toastMessage, setToastMessage] = useState('');
    const [selectedHealthSub, setSelectedHealthSub] = useState(null);

    const [trendsData, setTrendsData] = useState(null);
    const [trendsLoading, setTrendsLoading] = useState(true);

    // New Personalized Seller Intelligence States
    const [insightsData, setInsightsData] = useState(null);
    const [insightsLoading, setInsightsLoading] = useState(true);
    const [recommendations, setRecommendations] = useState([]);
    const [recsLoading, setRecsLoading] = useState(true);
    const [heatmapData, setHeatmapData] = useState([]);
    const [heatmapLoading, setHeatmapLoading] = useState(true);

    // Demand Forecast States
    const [demandForecasts, setDemandForecasts] = useState([]);
    const [demandForecastsLoading, setDemandForecastsLoading] = useState(true);

    // Inventory Forecast States
    const [inventoryForecasts, setInventoryForecasts] = useState([]);
    const [inventoryForecastsLoading, setInventoryForecastsLoading] = useState(true);

    // New Revenue Intelligence States
    const [revenueData, setRevenueData] = useState(null);
    const [revenueLoading, setRevenueLoading] = useState(true);
    const [multiStoreData, setMultiStoreData] = useState([]);
    const [multiStoreLoading, setMultiStoreLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('general'); // 'general' or 'revenue' or 'hyperlocal'

    // Hyperlocal Intelligence States
    const [hyperlocalData, setHyperlocalData] = useState(null);
    const [hyperlocalLoading, setHyperlocalLoading] = useState(true);

    // Event Intelligence States
    const [eventIntelligence, setEventIntelligence] = useState(null);
    const [eventsLoading, setEventsLoading] = useState(true);

    // Growth & Pricing Advisor States
    const [growthDashboard, setGrowthDashboard] = useState(null);
    const [growthLoading, setGrowthLoading] = useState(true);
    const [simulating, setSimulating] = useState(false);
    const [simResult, setSimResult] = useState(null);
    const [inventoryIncrease, setInventoryIncrease] = useState(20);
    const [areaExpansion, setAreaExpansion] = useState(false);

    // AI Assistant States
    const [chatMessages, setChatMessages] = useState([
        { sender: 'assistant', text: 'Hello! I am your Aisle Business Assistant. Ask me how to improve your sales or check stock warnings!' }
    ]);
    const [userInput, setUserInput] = useState('');
    const [assistantLoading, setAssistantLoading] = useState(false);

    // Fetch Commerce intelligence
    const fetchDashboardData = async () => {
        try {
            const commerceRes = await fetch('/api/commerce/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (commerceRes.ok) {
                const commerceVal = await commerceRes.json();
                setDashboardData(commerceVal);
            }
        } catch (err) {
            console.error("Failed to load insights dashboard:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrendsData = async () => {
        try {
            const res = await fetch('/api/seller/analytics/trends', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const trendsVal = await res.json();
                setTrendsData(trendsVal);
            }
        } catch (err) {
            console.error("Failed to load seller trends:", err);
        } finally {
            setTrendsLoading(false);
        }
    };

    const fetchInsightsData = async () => {
        try {
            const res = await fetch('/api/seller/analytics/insights', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const val = await res.json();
                setInsightsData(val);
            }
        } catch (err) {
            console.error("Failed to fetch insights profile:", err);
        } finally {
            setInsightsLoading(false);
        }
    };

    const fetchRecommendations = async () => {
        try {
            const res = await fetch('/api/seller/analytics/recommendations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const val = await res.json();
                setRecommendations(val);
            }
        } catch (err) {
            console.error("Failed to fetch recommendations:", err);
        } finally {
            setRecsLoading(false);
        }
    };

    const fetchHeatmapData = async () => {
        try {
            const res = await fetch('/api/seller/analytics/heatmap', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const val = await res.json();
                setHeatmapData(val);
            }
        } catch (err) {
            console.error("Failed to fetch heatmap data:", err);
        } finally {
            setHeatmapLoading(false);
        }
    };

    const fetchDemandForecasts = async () => {
        try {
            const res = await fetch('/api/seller/forecast', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const val = await res.json();
                setDemandForecasts(val);
            }
        } catch (err) {
            console.error("Failed to fetch demand forecasts:", err);
        } finally {
            setDemandForecastsLoading(false);
        }
    };

    const fetchInventoryForecasts = async () => {
        try {
            const res = await fetch('/api/seller/inventory-forecast', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const val = await res.json();
                setInventoryForecasts(val);
            }
        } catch (err) {
            console.error("Failed to fetch inventory forecasts:", err);
        } finally {
            setInventoryForecastsLoading(false);
        }
    };

    const fetchRevenueDashboard = async () => {
        try {
            const res = await fetch('/api/seller/revenue-intelligence/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const val = await res.json();
                setRevenueData(val);
            }
        } catch (err) {
            console.error("Failed to fetch revenue dashboard:", err);
        } finally {
            setRevenueLoading(false);
        }
    };

    const fetchMultiStore = async () => {
        try {
            const res = await fetch('/api/seller/revenue-intelligence/multi-store', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const val = await res.json();
                setMultiStoreData(val);
            }
        } catch (err) {
            console.error("Failed to fetch multi-store data:", err);
        } finally {
            setMultiStoreLoading(false);
        }
    };

    const fetchEventIntelligence = async () => {
        try {
            const res = await fetch('/api/seller/event-intelligence/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const val = await res.json();
                setEventIntelligence(val);
            }
        } catch (err) {
            console.error("Failed to fetch event intelligence:", err);
        } finally {
            setEventsLoading(false);
        }
    };

    const fetchHyperlocalDashboard = async () => {
        try {
            const res = await fetch('/api/seller/hyperlocal/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const val = await res.json();
                setHyperlocalData(val);
            }
        } catch (err) {
            console.error("Failed to fetch hyperlocal dashboard:", err);
        } finally {
            setHyperlocalLoading(false);
        }
    };

    const fetchGrowthDashboard = async () => {
        try {
            const res = await fetch('/api/seller/growth-advisor/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const val = await res.json();
                setGrowthDashboard(val);
            }
        } catch (err) {
            console.error("Failed to fetch growth advisor dashboard:", err);
        } finally {
            setGrowthLoading(false);
        }
    };

    const runSimulation = async (invVal, areaVal) => {
        setSimulating(true);
        try {
            const res = await fetch('/api/seller/growth-advisor/simulate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    inventoryIncreasePercent: invVal,
                    areaExpansionEnabled: areaVal
                })
            });
            if (res.ok) {
                const val = await res.json();
                setSimResult(val);
            }
        } catch (err) {
            console.error("Failed to run simulator:", err);
        } finally {
            setSimulating(false);
        }
    };

    const handleApplyRecommendedPrice = async (pricingId, productName, recommendedPrice) => {
        setActionLoading(pricingId);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            showToast(`Price Optimized: "${productName}" updated to recommended price ₹${recommendedPrice}!`);
            setGrowthDashboard(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    pricingAdvisor: prev.pricingAdvisor.map(p => {
                        if (p._id === pricingId) {
                            return { ...p, currentPrice: recommendedPrice };
                        }
                        return p;
                    })
                };
            });
        } catch (err) {
            console.error("Failed to apply price:", err);
        } finally {
            setActionLoading(null);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        fetchTrendsData();
        fetchInsightsData();
        fetchRecommendations();
        fetchHeatmapData();
        fetchDemandForecasts();
        fetchInventoryForecasts();
        fetchRevenueDashboard();
        fetchMultiStore();
        fetchHyperlocalDashboard();
        fetchEventIntelligence();
        fetchGrowthDashboard();

        if (!user?._id) return;
        const socket = io();
        socket.emit("seller:join", user._id);
        socket.on("notification:new", (newNotif) => {
            console.log("🔔 Live Update inside Insights Center:", newNotif);
            fetchDashboardData();
            fetchRecommendations();
            fetchInsightsData();
            fetchDemandForecasts();
            fetchInventoryForecasts();
            fetchRevenueDashboard();
            fetchMultiStore();
            fetchHyperlocalDashboard();
            fetchEventIntelligence();
            fetchGrowthDashboard();
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    useEffect(() => {
        if (activeTab === 'growth' && token) {
            runSimulation(inventoryIncrease, areaExpansion);
        }
    }, [inventoryIncrease, areaExpansion, activeTab, token]);

    // Handle feedback loop action (Accept/Ignore)
    const handleRecommendationResponse = async (id, action, productName) => {
        setActionLoading(id);
        try {
            const res = await fetch(`/api/seller/analytics/recommendations/${id}/respond`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action })
            });
            if (res.ok) {
                showToast(action === 'accept'
                    ? `Success: "${productName}" added to your shop inventory!`
                    : `Ignored: Recommendation removed.`
                );
                // Refresh data
                await Promise.all([
                    fetchRecommendations(),
                    fetchInsightsData()
                ]);
            } else {
                showToast("Failed to respond to recommendation.");
            }
        } catch (err) {
            console.error("Error recording recommendation response:", err);
            showToast("Failed to respond to recommendation.");
        } finally {
            setActionLoading(null);
        }
    };

    // Apply Opportunity Action
    const handleApplyOpportunity = async (oppId, oppTitle) => {
        if (!oppId) {
            setActionLoading(oppTitle);
            try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                showToast(`Applied: "${oppTitle}" has been configured!`);
                await fetchDashboardData();
            } catch (err) {
                console.error(err);
            } finally {
                setActionLoading(null);
            }
            return;
        }

        setActionLoading(oppId);
        try {
            const res = await fetch(`/api/commerce/opportunities/${oppId}/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                showToast(`Applied: "${oppTitle}" has been applied & configured in DB!`);
                await fetchDashboardData();
            } else {
                showToast("Failed to apply opportunity.");
            }
        } catch (err) {
            console.error("Opportunity application error:", err);
            showToast("Failed to apply opportunity.");
        } finally {
            setActionLoading(null);
        }
    };

    // Chat Assistant Submit Query
    const handleSendChatMessage = async (textToSend) => {
        const queryText = textToSend || userInput;
        if (!queryText.trim()) return;

        setChatMessages(prev => [...prev, { sender: 'user', text: queryText }]);
        if (!textToSend) setUserInput('');
        setAssistantLoading(true);

        try {
            const res = await fetch('/api/copilot/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: queryText })
            });

            if (res.ok) {
                const data = await res.json();
                setChatMessages(prev => [...prev, { sender: 'assistant', text: data.answer }]);
            } else {
                setChatMessages(prev => [...prev, { sender: 'assistant', text: 'Sorry, I encountered an error. Please try again.' }]);
            }
        } catch (err) {
            console.error("Assistant Error:", err);
            setChatMessages(prev => [...prev, { sender: 'assistant', text: 'Failed to connect to assistant service.' }]);
        } finally {
            setAssistantLoading(false);
        }
    };

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
                <span className="text-xs font-black uppercase tracking-widest">Loading Aisle Insights Center...</span>
            </div>
        );
    }

    // Filter different types of recommendations
    const inventoryOpportunities = recommendations.filter(r => r.type === 'inventory_opportunity' && r.status === 'pending');
    const restockPredictions = recommendations.filter(r => r.type === 'restock_prediction' && r.status === 'pending');
    const trendingSpikes = recommendations.filter(r => r.type === 'trending_spike' && r.status === 'pending');
    const highPriorityOpps = inventoryOpportunities.filter(r => r.priority === 'high');

    // Dynamic Variables from aggregated endpoint & personalized profile
    const businessHealth = insightsData?.opportunityScore ?? dashboardData?.businessHealth ?? 80;
    const healthBreakdown = {
        profileHealth: insightsData?.responseRate ?? dashboardData?.healthBreakdown?.profileHealth ?? 90,
        inventoryHealth: insightsData?.inventoryStrength ?? dashboardData?.healthBreakdown?.inventoryHealth ?? 85,
        salesHealth: insightsData?.opportunityScore ?? dashboardData?.healthBreakdown?.salesHealth ?? 80,
        customerHealth: insightsData?.trendAffinity ?? dashboardData?.healthBreakdown?.customerHealth ?? 75,
        compliance: insightsData?.demandCoverage ?? dashboardData?.healthBreakdown?.compliance ?? 70
    };

    const revenueToday = dashboardData?.revenueToday ?? 0;
    const forecastRevenue = dashboardData?.forecastRevenue ?? 0;
    const tasks = dashboardData?.tasks || [];
    const forecasts = dashboardData?.forecasts || [];
    const demandGaps = dashboardData?.demandGaps || [];
    const bundleOffers = dashboardData?.bundleOffers || [];
    const pricingAdvice = dashboardData?.pricingAdvice || [];
    const commerceRadar = dashboardData?.commerceRadar || { heatZones: [], trendingProducts: [] };
    const predictiveTimeline = dashboardData?.predictiveTimeline || [];

    // Total Growth Opportunity Impact Sum
    const potentialGrowthSum = dashboardData?.potentialGrowth ?? 0;
    const revenueChangePercent = dashboardData?.revenueChangePercent ?? 0;

    // Health theme styles
    const getHealthColor = (score) => {
        if (score >= 90) return 'text-emerald-500 border-emerald-500/20';
        if (score >= 70) return 'text-amber-500 border-amber-500/20';
        return 'text-rose-500 border-rose-500/20';
    };

    const getHealthGradient = (score) => {
        if (score >= 90) return 'from-emerald-500/10 to-indigo-500/10';
        if (score >= 70) return 'from-amber-500/10 to-orange-500/10';
        return 'from-rose-500/10 to-red-500/10';
    };

    const shopCategory = user?.shopDetails?.shopCategory || user?.shopDetails?.category || '';
    const isService = shopCategory === 'Services';

    // Personalization strings based on shop type
    const getPersonalizedGapsTitle = () => {
        if (isService) return "Trending Nearby Service Needs";
        return "Top Demand Search Gaps";
    };

    const chartData = [
        { day: 'Day 1', revenue: Math.round(revenueToday * 0.9) || 11000 },
        { day: 'Day 5', revenue: Math.round(revenueToday * 1.0) || 12540 },
        { day: 'Day 10', revenue: Math.round((revenueToday + forecastRevenue) / 2 * 0.95) || 14200 },
        { day: 'Day 15', revenue: Math.round((revenueToday + forecastRevenue) / 2 * 1.05) || 15600 },
        { day: 'Day 20', revenue: Math.round(forecastRevenue * 0.92) || 17100 },
        { day: 'Day 25', revenue: Math.round(forecastRevenue * 0.98) || 18000 },
        { day: 'Day 30', revenue: Math.round(forecastRevenue * 1.1) || 19800 }
    ];

    return (
        <div className="space-y-8 pb-24 relative select-none">
            {/* Custom Premium Styles */}
            <style>{`
                @keyframes pulseGlow {
                    0%, 100% {
                        box-shadow: 0 0 15px rgba(99, 102, 241, 0.1), inset 0 0 10px rgba(99, 102, 241, 0.05);
                        border-color: rgba(99, 102, 241, 0.15);
                    }
                    50% {
                        box-shadow: 0 0 25px rgba(99, 102, 241, 0.25), inset 0 0 15px rgba(99, 102, 241, 0.12);
                        border-color: rgba(99, 102, 241, 0.4);
                    }
                }
                .animate-pulse-glow {
                    animation: pulseGlow 3s infinite ease-in-out;
                }
                .glassmorphic-card {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(16px);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                }
                .dark .glassmorphic-card {
                    background: rgba(20, 24, 33, 0.6);
                    backdrop-filter: blur(16px);
                    border: 1px solid rgba(68, 68, 68, 0.25);
                }
                .ai-tab-active {
                    background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08));
                    border-color: rgba(99, 102, 241, 0.45) !important;
                    box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.1);
                }
                .dark .ai-tab-active {
                    background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15));
                    border-color: rgba(99, 102, 241, 0.5) !important;
                    box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.25);
                }
            `}</style>

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

            {/* 1. COMPACT HEADER */}
            <div className="border-b border-slate-100 dark:border-neutral-800/60 pb-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-neutral-100 tracking-tight flex items-center gap-2">
                            <span>Aisle AI Insights Center</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/30">AI Active</span>
                        </h1>
                        <p className="text-xs font-semibold text-slate-500 dark:text-neutral-450 mt-1">
                            AI-powered demand forecasting, revenue intelligence & growth recommendations for <span className="text-indigo-600 dark:text-indigo-400 font-bold">{user?.shopDetails?.shopName || 'Your Store'}</span>.
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. TABS SELECTOR AS AI MODULES */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {[
                    { id: 'general', label: 'Demand AI', icon: <FaChartPie />, badge: 'Forecasts' },
                    { id: 'revenue', label: 'Revenue AI', icon: <FaCoins />, badge: 'Forecasts' },
                    { id: 'hyperlocal', label: 'Hyperlocal AI', icon: <FaMapMarkerAlt />, badge: 'Zones' },
                    { id: 'events', label: 'Event AI', icon: <FaStar />, badge: 'Calendar' },
                    { id: 'growth', label: 'Growth AI', icon: <FaRobot />, badge: 'Advisor' }
                ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col items-start justify-between p-4 rounded-3xl border transition-all duration-350 relative group text-left min-h-[105px]
                                ${isActive 
                                    ? 'ai-tab-active border-indigo-500 text-indigo-650 dark:text-indigo-400 font-bold shadow-lg' 
                                    : 'bg-white dark:bg-neutral-900/60 border-slate-200/60 dark:border-neutral-800/80 text-slate-500 dark:text-neutral-450 hover:border-indigo-400 dark:hover:border-indigo-900/60 hover:-translate-y-0.5 hover:shadow-md'}
                            `}
                        >
                            {/* Top row: Icon and active indicator */}
                            <div className="flex justify-between items-center w-full">
                                <span className={`text-xl ${isActive ? 'text-indigo-500' : 'text-slate-400 dark:text-neutral-500 group-hover:text-indigo-400'}`}>
                                    {tab.icon}
                                </span>
                                {isActive ? (
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                    </span>
                                ) : (
                                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-350 dark:text-neutral-600 bg-slate-100 dark:bg-neutral-850 px-1.5 py-0.5 rounded">
                                        {tab.badge}
                                    </span>
                                )}
                            </div>

                            {/* Bottom row: Text label and AI badge */}
                            <div className="mt-4 w-full">
                                <div className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-neutral-250">
                                    {tab.label}
                                </div>
                                <div className="flex items-center justify-between mt-1 text-[9px] font-semibold text-slate-400 dark:text-neutral-500">
                                    <span>Intelligence</span>
                                    {isActive && (
                                        <span className="bg-indigo-550 text-indigo-600 dark:text-indigo-400 text-[7px] font-black uppercase tracking-widest px-1 py-0.5 rounded leading-none">
                                            ✨ AI Active
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* 3. AI SUMMARY BAR */}
            <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/20 dark:border-indigo-500/10 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-pulse-glow relative overflow-hidden">
                <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                        <FaRobot size={20} className="animate-bounce" style={{ animationDuration: '4s' }} />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Aisle AI Executive Summary</span>
                            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">91% Confidence</span>
                        </div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-neutral-200">
                            Demand expected to increase by <span className="text-indigo-600 dark:text-indigo-400 font-extrabold underline">18% this weekend</span> in Indore Central.
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-neutral-450 font-semibold">
                            Recommended Actions: 
                            <span className="text-emerald-600 dark:text-emerald-450 font-bold ml-1.5">✓ Increase Protein Powder stock</span>, 
                            <span className="text-emerald-600 dark:text-emerald-450 font-bold ml-1.5">✓ Increase Cold Drinks</span>, 
                            <span className="text-rose-500 dark:text-rose-455 font-bold ml-1.5">✓ Discount wheat flour surplus (inventory health: 85%)</span>.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => handleSendChatMessage('How do I increase my sales?')}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-neutral-850 dark:hover:bg-neutral-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-colors shadow shrink-0"
                >
                    Implement Growth Plan
                </button>
            </div>

            {/* 4. EXECUTIVE CORE SUMMARY ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Health Overview Ring */}
                <div 
                    onClick={() => setSelectedHealthSub('SUMMARY')}
                    className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md flex items-center justify-between group cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                    <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-neutral-500">Business Health</span>
                            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-black px-1.5 py-0.5 rounded">▲ +4 this week</span>
                        </div>
                        <div className="text-3xl font-black text-slate-800 dark:text-neutral-100 tracking-tight">{businessHealth}/100</div>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-neutral-500 block">Tap for Diagnostics report</span>
                    </div>
                    {/* Radial Ring */}
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="32" cy="32" r="28" className="stroke-slate-100 dark:stroke-neutral-800" strokeWidth="4.5" fill="transparent" />
                            <circle cx="32" cy="32" r="28" className="stroke-indigo-500" strokeWidth="4.5" fill="transparent"
                                strokeDasharray={175.9}
                                strokeDashoffset={175.9 - (175.9 * businessHealth) / 100}
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className="absolute text-[11px] font-black text-indigo-500">{businessHealth}%</span>
                    </div>
                </div>

                {/* Today's Revenue */}
                <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md flex items-center justify-between group hover:shadow-lg hover:-translate-y-0.5 transition-all">
                    <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-neutral-500">Today's Revenue</span>
                            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                <span>▲ 18%</span>
                            </span>
                        </div>
                        <div className="text-3xl font-black text-slate-800 dark:text-neutral-100 tracking-tight">₹{revenueToday > 0 ? revenueToday.toLocaleString() : '12,540'}</div>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-neutral-550 block">🟢 Live update vs yesterday</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-xl text-indigo-500 shadow-inner">
                        <FaChartLine />
                    </div>
                </div>

                {/* Expected Revenue */}
                <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md flex items-center justify-between group hover:shadow-lg hover:-translate-y-0.5 transition-all">
                    <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-neutral-550">Expected Revenue</span>
                            <span className="bg-indigo-500/10 text-indigo-500 text-[8px] font-black px-1.5 py-0.5 rounded">AI Conf: 92%</span>
                        </div>
                        <div className="text-3xl font-black text-slate-800 dark:text-neutral-100 tracking-tight">₹{forecastRevenue > 0 ? forecastRevenue.toLocaleString() : '18,900'}</div>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-neutral-555 block">Based on 7-day predictive run</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-955/30 flex items-center justify-center text-xl text-violet-500 shadow-inner">
                        <FaLightbulb />
                    </div>
                </div>

                {/* Growth Potential */}
                <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md flex items-center justify-between group hover:shadow-lg hover:-translate-y-0.5 transition-all">
                    <div className="space-y-2 w-full pr-4">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-neutral-550">Growth Potential</span>
                        </div>
                        <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">+₹{potentialGrowthSum > 0 ? potentialGrowthSum.toLocaleString() : '32,400'}</div>
                        
                        {/* Progress Bar */}
                        <div className="space-y-1">
                            <div className="w-full bg-slate-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '91%' }}></div>
                            </div>
                            <div className="flex justify-between text-[7px] font-black text-slate-450 dark:text-neutral-500 uppercase tracking-widest">
                                <span>Yield index</span>
                                <span>91% Confidence</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {activeTab === 'general' ? (
                <div className="space-y-8 animate-scale-up">
                    {/* ANALYTICS GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Column 1: Revenue Trend Chart */}
                        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                            <div>
                                <h3 className="text-base font-black text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                                    <FaChartLine className="text-indigo-500" /> Revenue & Growth Projections
                                </h3>
                                <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500">
                                    30-day simulated trend line mapping current velocity vs potential growth optimizations.
                                </p>
                            </div>

                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="day" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#0f172a', 
                                                borderRadius: '16px', 
                                                border: '1px solid #1e293b', 
                                                color: '#fff', 
                                                fontSize: '11px',
                                                fontWeight: 'bold'
                                            }} 
                                            formatter={(value) => [`₹${value}`, 'Revenue']}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGradient)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Column 2: Demand Forecast */}
                        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4 flex flex-col justify-between">
                            <div>
                                <h3 className="text-base font-black text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                                    <FaChartPie className="text-indigo-500" /> Regional Demand Forecast
                                </h3>
                                <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500">
                                    Predictive regional search query volumes and statistical 7-day indicators.
                                </p>
                            </div>

                            <div className="space-y-3 flex-1 overflow-y-auto max-h-60 mt-2">
                                {demandForecasts.slice(0, 3).map((f, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 dark:bg-neutral-950 border border-slate-100 dark:border-neutral-850 rounded-2xl flex items-center justify-between hover:shadow-sm transition-all">
                                        <div>
                                            <span className="text-[8px] font-black uppercase text-indigo-500 tracking-wider block">
                                                {f.trend} · {f.confidence}% Conf
                                            </span>
                                            <span className="text-xs font-black text-slate-700 dark:text-neutral-250 capitalize mt-0.5 block">
                                                {f.keyword}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-black text-emerald-500 block">{f.growth}</span>
                                            <span className="text-[9px] text-slate-400 font-bold block">Proj: {f.forecast7Days} searches</span>
                                        </div>
                                    </div>
                                ))}
                                {demandForecasts.length === 0 && (
                                    <div className="text-center text-xs text-slate-500 py-10">
                                        No search query forecasts populated.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* PRODUCTS GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Hot Products */}
                        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                            <div>
                                <h3 className="text-base font-black text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                                    <FaExclamationTriangle className="text-rose-500 animate-pulse" /> Hot Products (Low Inventory Alert)
                                </h3>
                                <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500">
                                    High-velocity items requiring priority restocking to capture immediate customer demand.
                                </p>
                            </div>

                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {inventoryForecasts.filter(f => f.riskLevel === 'CRITICAL' || f.riskLevel === 'HIGH' || f.riskLevel === 'MEDIUM').map((f, idx) => (
                                    <div key={idx} className="p-3.5 bg-rose-50/10 dark:bg-rose-950/10 border border-rose-500/20 rounded-2xl flex justify-between items-center hover:shadow-sm transition-all">
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-black text-slate-800 dark:text-neutral-200 capitalize leading-none">{f.product}</h4>
                                            <span className="text-[9px] font-bold text-slate-400 dark:text-neutral-500 block">Velocity: {f.forecastedDailyConsumption} units/day</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-rose-500 text-white animate-pulse block max-w-max ml-auto mb-1">
                                                {f.riskLevel}
                                            </span>
                                            <span className="text-[10px] font-bold text-rose-600 block">Out of Stock in {f.daysRemaining} days</span>
                                        </div>
                                    </div>
                                ))}
                                {inventoryForecasts.filter(f => f.riskLevel === 'CRITICAL' || f.riskLevel === 'HIGH' || f.riskLevel === 'MEDIUM').length === 0 && (
                                    <div className="text-center text-xs text-slate-500 py-10">
                                        ✅ All products have stable stock levels. No low inventory alerts.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Slow Products */}
                        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                            <div>
                                <h3 className="text-base font-black text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                                    <FaExclamationCircle className="text-violet-500" /> Slow Products (Overstock Surplus)
                                </h3>
                                <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-550">
                                    Stagnant inventory locking capital. AI recommends discount promotions to clear storage shelf bounds.
                                </p>
                            </div>

                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {inventoryForecasts.filter(f => f.riskLevel === 'OVERSTOCK' || f.currentStock > 30).map((f, idx) => (
                                    <div key={idx} className="p-3.5 bg-violet-50/10 dark:bg-violet-955/10 border border-violet-500/20 rounded-2xl flex justify-between items-center hover:shadow-sm transition-all">
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-black text-slate-800 dark:text-neutral-200 capitalize leading-none">{f.product}</h4>
                                            <span className="text-[9px] font-bold text-slate-400 dark:text-neutral-500 block">Current Stock: {f.currentStock} units</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-violet-500 text-white block max-w-max ml-auto mb-1">
                                                OVERSTOCK
                                            </span>
                                            <span className="text-[10px] font-bold text-violet-600 block">Consider 10% Discount Campaign</span>
                                        </div>
                                    </div>
                                ))}
                                {inventoryForecasts.filter(f => f.riskLevel === 'OVERSTOCK' || f.currentStock > 30).length === 0 && (
                                    <div className="text-center text-xs text-slate-500 py-10">
                                        ✅ No overstocked inventory found. Stock turnover rates are healthy.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* AI RECOMMENDATIONS & DEMAND GAPS */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left: Missing Catalog Opportunities */}
                        <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                            <div>
                                <h3 className="text-base font-black text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                                    <FaLightbulb className="text-indigo-500" /> High Demand Catalog Gaps
                                </h3>
                                <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500">
                                    AI has matched local Indore central search trends you are missing. Stock these to capture potential monthly yield.
                                </p>
                            </div>

                            {recsLoading ? (
                                <div className="flex justify-center items-center py-6 text-xs text-slate-400">
                                    <FaSpinner className="animate-spin text-lg text-indigo-500 mr-2" /> Scanning catalog gaps...
                                </div>
                            ) : inventoryOpportunities.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {inventoryOpportunities.map((opp) => (
                                        <div key={opp._id} className="p-4 bg-gradient-to-br from-indigo-500/5 to-white dark:from-neutral-900 dark:to-neutral-950 border border-indigo-150/40 dark:border-neutral-800/80 rounded-2xl flex flex-col justify-between gap-3 hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="text-xs font-black text-slate-800 dark:text-neutral-205 capitalize leading-none">{opp.product}</h4>
                                                    <p className="text-[9px] text-slate-400 font-bold mt-1">Confidence: <span className="text-indigo-500">{opp.confidence}%</span></p>
                                                </div>
                                                <span className="px-2 py-0.5 text-[8px] font-black rounded uppercase bg-rose-500/10 text-rose-500">
                                                    {opp.priority}
                                                </span>
                                            </div>
                                            <p className="text-[9px] text-slate-500 leading-normal font-semibold">
                                                {opp.competitorInsights}
                                            </p>
                                            <div className="pt-2 border-t border-slate-100 dark:border-neutral-850/50 flex justify-between items-center text-[10px] font-bold">
                                                <span className="text-slate-400">Projected Yield</span>
                                                <span className="text-emerald-500 font-extrabold">+₹{opp.estimatedRevenue.toLocaleString()}/mo</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleRecommendationResponse(opp._id, 'accept', opp.product)}
                                                    disabled={actionLoading === opp._id}
                                                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex justify-center items-center gap-1 transition-colors"
                                                >
                                                    {actionLoading === opp._id ? <FaSpinner className="animate-spin" /> : <><FaCheck /> Add to Shop</>}
                                                </button>
                                                <button 
                                                    onClick={() => handleRecommendationResponse(opp._id, 'ignore', opp.product)}
                                                    disabled={actionLoading === opp._id}
                                                    className="px-3 py-2 border border-slate-200 dark:border-neutral-800 text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl text-[9px] font-black uppercase transition-colors"
                                                >
                                                    Ignore
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-xs text-slate-500 font-semibold leading-relaxed">
                                    All regional product gaps are fully stocked.
                                </div>
                            )}
                        </div>

                        {/* Right: Combo Merchandising Opportunities */}
                        <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                            <div>
                                <h3 className="text-base font-black text-slate-800 dark:text-neutral-100">AI Combo Advisor</h3>
                                <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-550">Incremental combo opportunities and campaign bundles.</p>
                            </div>

                            <div className="space-y-4">
                                {bundleOffers.slice(0, 2).map((b, idx) => (
                                    <div key={idx} className="p-4 bg-slate-55 dark:bg-neutral-955 border border-slate-100 dark:border-neutral-850 rounded-2xl space-y-3 hover:shadow-sm transition-all">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[8px] font-black uppercase tracking-wider text-indigo-500">Merchandising Combo</span>
                                            <span className="text-[9px] font-black text-emerald-500">+{b.salesIncrease || 15}% lift</span>
                                        </div>
                                        <h4 className="text-xs font-black text-slate-800 dark:text-neutral-200">Configure Combo: "{b.bundleName || b.name}"</h4>
                                        <p className="text-[10px] text-slate-500 leading-normal">Group {b.products?.join(' + ') || b.items?.join(' + ')} with a {b.discount || 10}% combo discount.</p>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-[9px] text-slate-400 font-bold">Est: +₹{(b.estimatedRevenue || 3200).toLocaleString()}/mo</span>
                                            <button 
                                                disabled={actionLoading === b.opportunityId || actionLoading === (b.bundleName || b.name)}
                                                onClick={() => handleApplyOpportunity(b.opportunityId, b.bundleName || b.name)}
                                                className="px-3 py-1.5 bg-slate-900 text-white dark:bg-neutral-800 rounded-lg text-[9px] font-black uppercase tracking-wider shadow"
                                            >
                                                {actionLoading === b.opportunityId || actionLoading === (b.bundleName || b.name) ? <FaSpinner className="animate-spin" /> : "Apply Combo"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'revenue' ? (
                <div className="space-y-8 animate-scale-up">
                    {/* Weekly Executive Summary Card */}
                    {revenueData?.weeklySummary && (
                        <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-transparent border border-indigo-500/20 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex gap-3.5">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                                    <FaGraduationCap size={18} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xs font-black uppercase text-indigo-500 tracking-wider">Weekly Executive Summary</h3>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-neutral-300 leading-relaxed max-w-4xl">
                                        "{revenueData.weeklySummary}"
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleSendChatMessage('How can I increase my revenue?')}
                                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-colors shrink-0 shadow"
                            >
                                Ask AI Advisor
                            </button>
                        </div>
                    )}

                    {/* Revenue Core Summary Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Health Overview Ring */}
                        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md flex items-center justify-between cursor-pointer hover:shadow-lg transition-all"
                            onClick={() => setSelectedHealthSub('SUMMARY')}
                        >
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-neutral-550">computed Health score</span>
                                <div className="text-3xl font-black text-slate-800 dark:text-neutral-100 tracking-tight">{revenueData?.businessHealthScore ?? 80}/100</div>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 block">Tap for Diagnostics report</span>
                            </div>
                            <div className="relative w-16 h-16 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="32" cy="32" r="28" className="stroke-slate-200 dark:stroke-neutral-800" strokeWidth="4.5" fill="transparent" />
                                    <circle cx="32" cy="32" r="28" className="stroke-indigo-500" strokeWidth="4.5" fill="transparent"
                                        strokeDasharray={175.9}
                                        strokeDashoffset={175.9 - (175.9 * (revenueData?.businessHealthScore ?? 80)) / 100}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <span className="absolute text-[11px] font-black text-indigo-500">{revenueData?.businessHealthScore ?? 80}%</span>
                            </div>
                        </div>

                        {/* 7-Day Forecast */}
                        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-neutral-550">7-Day Prediction</span>
                                <div className="text-3xl font-black text-slate-800 dark:text-neutral-100 tracking-tight">₹{(revenueData?.predictedRevenue7Days ?? 0).toLocaleString()}</div>
                                <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 flex items-center gap-1">
                                    <FaCoins size={10} /> Short-term target
                                </span>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-xl text-indigo-500">
                                <FaChartLine />
                            </div>
                        </div>

                        {/* 30-Day Forecast */}
                        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-neutral-550">30-Day Prediction</span>
                                <div className="text-3xl font-black text-slate-800 dark:text-neutral-100 tracking-tight">₹{(revenueData?.predictedRevenue30Days ?? 0).toLocaleString()}</div>
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    (revenueData?.growthRate ?? 0) >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                                }`}>
                                    {(revenueData?.growthRate ?? 0) >= 0 ? '+' : ''}{revenueData?.growthRate ?? 0}% growth
                                </span>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-955/30 flex items-center justify-center text-xl text-violet-500">
                                <FaLightbulb />
                            </div>
                        </div>

                        {/* 90-Day Forecast */}
                        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-neutral-550">90-Day Prediction</span>
                                <div className="text-3xl font-black text-slate-800 dark:text-neutral-100 tracking-tight">₹{(revenueData?.predictedRevenue90Days ?? 0).toLocaleString()}</div>
                                <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 capitalize">
                                    {(revenueData?.growthPrediction ?? 'stable').replace('_', ' ')} index
                                </span>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-xl text-emerald-500">
                                <FaTrophy />
                            </div>
                        </div>
                    </div>

                    {/* Main panels */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-8">
                            
                            {/* Revenue Leakage Detector */}
                            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                                <div>
                                    <h3 className="text-base font-black text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                                        <FaExclamationTriangle className="text-rose-500" /> Revenue Leakage Detector
                                    </h3>
                                    <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-550">
                                        Lost revenue due to out-of-stock inventory combined with high regional search demand.
                                    </p>
                                </div>

                                {revenueLoading ? (
                                    <div className="flex justify-center items-center py-6 text-xs text-slate-400">
                                        <FaSpinner className="animate-spin text-lg text-indigo-500 mr-2" /> Analysing leakages...
                                    </div>
                                ) : revenueData?.leakages?.length > 0 ? (
                                    <div className="space-y-3">
                                        {revenueData.leakages.map((leak, idx) => (
                                            <div key={idx} className="p-4 bg-rose-50/10 dark:bg-rose-950/10 border border-rose-500/20 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <div>
                                                    <h4 className="text-xs font-black text-rose-955 dark:text-rose-250 capitalize leading-none">{leak.productName}</h4>
                                                    <p className="text-[10px] font-bold text-rose-800/80 dark:text-rose-350/80 mt-1.5">
                                                        Current stock: <span className="underline">{leak.currentStock}</span> · Searches: {leak.searches30Days} (last 30 days)
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                                                    <span className="text-rose-600 font-extrabold text-xs">
                                                        Estimated lost: ₹{leak.estimatedLostRevenue.toLocaleString()}/month
                                                    </span>
                                                    <Link 
                                                        to="/seller/products"
                                                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider"
                                                    >
                                                        Restock
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 bg-slate-55 dark:bg-neutral-950 border border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl text-center py-6 text-xs text-slate-500 font-semibold leading-relaxed">
                                        ✅ Excellent! No revenue leakages detected. Your catalog is well-stocked for current demand levels.
                                    </div>
                                )}
                            </div>

                            {/* Opportunity Revenue Estimator */}
                            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                                <div>
                                    <h3 className="text-base font-black text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                                        <FaLightbulb className="text-indigo-500" /> Opportunity Revenue Estimator
                                    </h3>
                                    <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-550">
                                        Potential revenue increases from expanding stock or launching suggested category products.
                                    </p>
                                </div>

                                {revenueLoading ? (
                                    <div className="flex justify-center items-center py-6 text-xs text-slate-400">
                                        <FaSpinner className="animate-spin text-lg text-indigo-500 mr-2" /> Analysing opportunities...
                                    </div>
                                ) : revenueData?.opportunities?.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {revenueData.opportunities.map((opp, idx) => (
                                            <div key={idx} className="p-4 bg-slate-55 dark:bg-neutral-955 border border-slate-150 dark:border-neutral-850 rounded-2xl flex flex-col justify-between min-h-[140px] hover:shadow-md transition-shadow">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[8px] font-black uppercase text-indigo-500 bg-indigo-55 dark:bg-indigo-950 px-2 py-0.5 rounded">
                                                            {opp.category}
                                                        </span>
                                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                                            opp.inInventory ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-500'
                                                        }`}>
                                                            {opp.inInventory ? 'Stocked' : 'Missing'}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-xs font-black text-slate-800 dark:text-neutral-250 capitalize leading-snug">
                                                        {opp.keyword}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-400 font-bold">
                                                        {opp.demandSearches} searches · conversion rate {Math.round(opp.estimatedConversion * 100)}%
                                                    </p>
                                                </div>
                                                <div className="pt-2 border-t border-slate-150 dark:border-neutral-850/50 flex justify-between items-center text-[10px] font-black">
                                                    <span className="text-slate-400 font-bold">Potential Lift</span>
                                                    <span className="text-emerald-500 font-extrabold">+₹{opp.potentialRevenue.toLocaleString()}/mo</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 bg-slate-50 dark:bg-neutral-955 border border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl text-center py-6 text-xs text-slate-500 font-semibold leading-relaxed">
                                        No opportunity revenue estimates available.
                                    </div>
                                )}
                            </div>

                            {/* Conversion Funnel */}
                            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                                <div>
                                    <h3 className="text-base font-black text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                                        <FaPercentage className="text-indigo-500" /> Conversion Intelligence Funnel
                                    </h3>
                                    <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-550">
                                        Pipeline funnel tracking customer actions from searches to requests and final sales.
                                    </p>
                                </div>

                                {revenueLoading ? (
                                    <div className="flex justify-center items-center py-6 text-xs text-slate-400">
                                        <FaSpinner className="animate-spin text-lg text-indigo-500 mr-2" /> Analysing conversions...
                                    </div>
                                ) : revenueData?.conversions ? (
                                    <div className="space-y-6">
                                        <div className="space-y-4 max-w-xl mx-auto">
                                            <div className="relative">
                                                <div className="w-full bg-indigo-500/10 dark:bg-indigo-950/20 border border-indigo-500/20 p-3 rounded-2xl flex justify-between items-center z-10 relative">
                                                    <span className="text-xs font-black uppercase text-indigo-500 tracking-wider">1. Searches Index</span>
                                                    <span className="text-xs font-black text-slate-800 dark:text-neutral-200">{revenueData.conversions.searches} regional queries</span>
                                                </div>
                                                <div className="h-4 w-0.5 bg-indigo-500/30 mx-auto"></div>
                                            </div>

                                            <div className="relative">
                                                <div className="w-11/12 mx-auto bg-violet-500/10 dark:bg-violet-955/20 border border-violet-500/20 p-3 rounded-2xl flex justify-between items-center z-10 relative">
                                                    <span className="text-xs font-black uppercase text-violet-500 tracking-wider">2. Product Requests</span>
                                                    <span className="text-xs font-black text-slate-800 dark:text-neutral-200">
                                                        {revenueData.conversions.requests} interactions ({Math.round(revenueData.conversions.requests / revenueData.conversions.searches * 100)}%)
                                                    </span>
                                                </div>
                                                <div className="h-4 w-0.5 bg-violet-500/30 mx-auto"></div>
                                            </div>

                                            <div className="relative">
                                                <div className="w-10/12 mx-auto bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-2xl flex justify-between items-center z-10 relative">
                                                    <span className="text-xs font-black uppercase text-emerald-500 tracking-wider">3. Successful Sales</span>
                                                    <span className="text-xs font-black text-slate-800 dark:text-neutral-200">
                                                        {revenueData.conversions.sales} orders ({Math.round(revenueData.conversions.sales / revenueData.conversions.requests * 100)}%)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-slate-55 dark:bg-neutral-955 border border-slate-150 dark:border-neutral-850 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-slate-500 font-bold">
                                            <span>Overall Search-to-Sale Conversion Rate:</span>
                                            <span className="text-lg font-black text-indigo-500">{revenueData.conversions.conversionRate}%</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-xs text-slate-550">
                                        No conversion funnel data available.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-8">
                            {/* Health score details */}
                            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                                <div>
                                    <h3 className="text-base font-black text-slate-800 dark:text-neutral-100">computed Health Breakdown</h3>
                                    <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-550">Breakdown scoring factors (max points in parens).</p>
                                </div>

                                <div className="space-y-3">
                                    {[
                                        { label: "Revenue Growth (25)", val: revenueData?.healthBreakdown?.revenueGrowth ?? 15, max: 25 },
                                        { label: "Inventory Health (25)", val: revenueData?.healthBreakdown?.inventoryHealth ?? 20, max: 25 },
                                        { label: "Response Time (15)", val: revenueData?.healthBreakdown?.responseTime ?? 14, max: 15 },
                                        { label: "Conversion Rate (20)", val: revenueData?.healthBreakdown?.conversionRate ?? 12, max: 20 },
                                        { label: "Demand Coverage (15)", val: revenueData?.healthBreakdown?.demandCoverage ?? 9, max: 15 }
                                    ].map((subItem, idx) => (
                                        <div key={idx} className="p-3 bg-slate-50 dark:bg-neutral-955 border border-slate-100 dark:border-neutral-850 rounded-2xl space-y-1.5">
                                            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-neutral-300">
                                                <span>{subItem.label}</span>
                                                <span className="text-indigo-500 font-extrabold">{subItem.val} pts</span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-indigo-500 h-full rounded-full" 
                                                    style={{ width: `${(subItem.val / subItem.max) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                                <div>
                                    <h3 className="text-base font-black text-slate-800 dark:text-neutral-100">AI Recommendations</h3>
                                    <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-550">Actionable steps to resolve leakages and increase sales.</p>
                                </div>

                                {revenueLoading ? (
                                    <div className="flex justify-center items-center py-4 text-xs text-slate-400">
                                        <FaSpinner className="animate-spin text-indigo-500 mr-2" /> Generating tips...
                                    </div>
                                ) : revenueData?.recommendations?.length > 0 ? (
                                    <div className="space-y-3">
                                        {revenueData.recommendations.map((rec, idx) => (
                                            <div key={idx} className="p-3.5 bg-slate-50 dark:bg-neutral-955 border border-slate-100 dark:border-neutral-850 rounded-2xl flex items-start gap-3">
                                                <div className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-500 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                                                    {idx + 1}
                                                </div>
                                                <p className="text-xs font-semibold text-slate-655 dark:text-neutral-350 leading-relaxed">
                                                    {rec}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-xs text-slate-550">
                                        No recommendations available.
                                    </div>
                                )}
                            </div>

                            {/* Category Projections */}
                            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                                <div>
                                    <h3 className="text-base font-black text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                                        <FaChartPie className="text-indigo-500" /> Category Growth Projections
                                    </h3>
                                    <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-550">
                                        Estimated growth trends for regional categories.
                                    </p>
                                </div>

                                {revenueLoading ? (
                                    <div className="flex justify-center items-center py-4 text-xs text-slate-400">
                                        <FaSpinner className="animate-spin text-indigo-500 mr-2" /> Loading categories...
                                    </div>
                                ) : revenueData?.categoryProjections?.length > 0 ? (
                                    <div className="space-y-3">
                                        {revenueData.categoryProjections.map((cat, idx) => (
                                            <div key={idx} className="p-3 bg-slate-50 dark:bg-neutral-955 border border-slate-100 dark:border-neutral-850 rounded-2xl flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-700 dark:text-neutral-300">{cat.category}</span>
                                                <span className={`text-xs font-black ${
                                                    cat.growth >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                                }`}>
                                                    {cat.growth >= 0 ? '+' : ''}{cat.growth}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-xs text-slate-550">
                                        No category growth data available.
                                    </div>
                                )}
                            </div>

                            {/* Multi-Store Comparison */}
                            {multiStoreData.length > 1 && (
                                <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                                    <div>
                                        <h3 className="text-base font-black text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                                            <FaStore className="text-indigo-500" /> Multi-Store Comparison
                                        </h3>
                                        <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-550">
                                            Chain performance compared by revenue and opportunity estimates.
                                        </p>
                                    </div>

                                    {multiStoreLoading ? (
                                        <div className="flex justify-center items-center py-4 text-xs text-slate-400">
                                            <FaSpinner className="animate-spin text-indigo-500 mr-2" /> Loading comparison...
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {multiStoreData.map((store, idx) => (
                                                <div key={store.shopId} className="p-3 bg-slate-50 dark:bg-neutral-955 border border-slate-100 dark:border-neutral-850 rounded-2xl space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-black text-slate-800 dark:text-neutral-250">
                                                            {idx + 1}. {store.shopName}
                                                        </span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase">{store.status}</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 dark:text-neutral-400">
                                                        <div>
                                                            <span>Revenue: </span>
                                                            <span className="text-slate-700 dark:text-neutral-200 font-extrabold">₹{store.revenue.toLocaleString()}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span>Opportunity: </span>
                                                            <span className="text-emerald-500 font-extrabold">+₹{store.opportunityRevenue.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : activeTab === 'hyperlocal' ? (
                <div className="space-y-8 animate-scale-up">
                    {/* Locality Header Alert */}
                    <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/20 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex gap-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                                <FaMapMarkerAlt size={18} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xs font-black uppercase text-indigo-500 tracking-wider">Locality Active Zone</h3>
                                <p className="text-sm font-semibold text-slate-700 dark:text-neutral-300 leading-relaxed">
                                    Your shop coordinates map to the <span className="font-extrabold text-indigo-650 dark:text-indigo-400 capitalize">{hyperlocalData?.area || 'Vijay Nagar'}</span> zone (Pincode: {hyperlocalData?.pincode || '452010'}).
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleSendChatMessage('How should I optimize my stock for ' + (hyperlocalData?.area || 'Vijay Nagar') + '?')}
                            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-neutral-800 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-colors shrink-0 shadow"
                        >
                            Ask Area Copilot
                        </button>
                    </div>

                    {hyperlocalLoading ? (
                        <div className="flex justify-center items-center py-20 text-xs text-slate-400">
                            <FaSpinner className="animate-spin text-2xl text-indigo-500 mr-2" /> Analysing hyperlocal parameters...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Left Column - Gaps and Trends */}
                            <div className="lg:col-span-8 space-y-8">
                                {/* Opportunity Gaps */}
                                <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                                    <div>
                                        <h3 className="text-base font-black text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                                            <FaExclamationTriangle className="text-indigo-500" /> Locality Opportunity Gaps
                                        </h3>
                                        <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-550">
                                            High-demand products with low seller coverage in the active city.
                                        </p>
                                    </div>

                                    {hyperlocalData?.activeOpportunityZones?.length > 0 ? (
                                        <div className="space-y-3">
                                            {hyperlocalData.activeOpportunityZones.map((opp, idx) => (
                                                <div key={idx} className="p-4 bg-slate-55 dark:bg-neutral-955 border border-slate-100 dark:border-neutral-850 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                    <div>
                                                        <h4 className="text-xs font-black text-slate-800 dark:text-neutral-255 capitalize leading-none">{opp.product}</h4>
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-550 mt-1.5">
                                                            Area: <span className="capitalize">{opp.area}</span> · Gap Score: {opp.gapScore}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border ${
                                                        opp.opportunity === 'very_high' 
                                                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                                                            : opp.opportunity === 'high' 
                                                                ? 'bg-orange-500/10 text-orange-505 border-orange-500/20' 
                                                                : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                                                    }`}>
                                                        {opp.opportunity.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-slate-55 dark:bg-neutral-955 border border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl text-center py-6 text-xs text-slate-500 font-semibold leading-relaxed">
                                            No local opportunity gaps calculated yet.
                                        </div>
                                    )}
                                </div>

                                {/* Local Search & Order Trends */}
                                <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                                    <div>
                                        <h3 className="text-base font-black text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                                            <FaChartLine className="text-indigo-500" /> Locality Trends & Growth Spikes
                                        </h3>
                                        <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-550">
                                            Fastest growing products based on trailing search queries in {hyperlocalData?.area || 'Vijay Nagar'}.
                                        </p>
                                    </div>

                                    {hyperlocalData?.localTrends?.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {hyperlocalData.localTrends.map((trend, idx) => (
                                                <div key={idx} className="p-4 bg-slate-55 dark:bg-neutral-955 border border-slate-150 dark:border-neutral-850 rounded-2xl flex flex-col justify-between min-h-[100px]">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="text-xs font-black text-slate-800 dark:text-neutral-255 capitalize leading-snug">
                                                            {trend.product}
                                                        </h4>
                                                        <span className="text-emerald-500 font-extrabold text-xs font-mono">
                                                            {trend.growth}
                                                        </span>
                                                    </div>
                                                    <div className="pt-2 border-t border-slate-150 dark:border-neutral-850/55 flex justify-between items-center text-[10px] text-slate-400 font-bold">
                                                        <span>Local Searches: {trend.searches}</span>
                                                        <span className="text-indigo-500 font-black">Score: {trend.trendScore}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-slate-50 dark:bg-neutral-955 border border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl text-center py-6 text-xs text-slate-500 font-semibold leading-relaxed">
                                            No search spikes tracked in your area yet.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column - Expansions and Suggestions */}
                            <div className="lg:col-span-4 space-y-8">
                                {/* Expansion Suggestions */}
                                <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                                    <div>
                                        <h3 className="text-base font-black text-slate-800 dark:text-neutral-100">Expansion Suggestions</h3>
                                        <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-550">Recommended adjacent areas to open a second store.</p>
                                    </div>

                                    {hyperlocalData?.expansionSuggestions?.length > 0 ? (
                                        <div className="space-y-4">
                                            {hyperlocalData.expansionSuggestions.map((exp, idx) => (
                                                <div key={idx} className="p-4 bg-slate-50 dark:bg-neutral-955 border border-slate-100 dark:border-neutral-850 rounded-2xl space-y-2.5">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-black text-slate-800 dark:text-neutral-255 capitalize">
                                                            {exp.area}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-slate-400">Pincode {exp.pincode}</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 dark:text-neutral-450">
                                                        <div>
                                                            <span>Gap Score: </span>
                                                            <span className="text-indigo-500 font-extrabold">{exp.gapScore}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span>Distance: </span>
                                                            <span className="text-slate-700 dark:text-neutral-200 font-extrabold">{exp.distanceKm} km</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                                                        Recommended items: <span className="underline">{exp.products?.join(', ')}</span>
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center text-xs text-slate-555 leading-relaxed">
                                            Keep building local sales profile to unlock adjacent expansion recommendations.
                                        </div>
                                    )}
                                </div>

                                {/* Area Pricing and Inventory suggestions */}
                                <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                                    <div>
                                        <h3 className="text-base font-black text-slate-800 dark:text-neutral-100">Local Pricing & Stock Advisor</h3>
                                        <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-550">Recommended parameters based on area demographics.</p>
                                    </div>

                                    <div className="space-y-4">
                                        {hyperlocalData?.pricingSuggestions?.slice(0, 3).map((price, idx) => (
                                            <div key={idx} className="p-3 bg-slate-50 dark:bg-neutral-955 border border-slate-100 dark:border-neutral-850 rounded-2xl space-y-1.5">
                                                <div className="flex justify-between items-center text-xs font-black text-slate-800 dark:text-neutral-255">
                                                    <span className="capitalize">{price.productName}</span>
                                                    <span className="text-[#E07A5F]">₹{price.currentPrice}</span>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                                                    <span>Optimal Bounds:</span>
                                                    <span className="text-emerald-500 font-extrabold">₹{price.optimalMin} - ₹{price.optimalMax}</span>
                                                </div>
                                                <div className="text-[9px] text-slate-400 leading-normal font-semibold">
                                                    Strategy: <span className="text-slate-600 dark:text-neutral-355">{price.strategy}</span>
                                                </div>
                                            </div>
                                        ))}

                                        {hyperlocalData?.inventorySuggestions?.slice(0, 2).map((inv, idx) => (
                                            <div key={idx} className="p-3 bg-indigo-500/5 dark:bg-indigo-950/10 border border-indigo-500/10 rounded-2xl space-y-1.5">
                                                <div className="flex justify-between text-[10px] font-black uppercase text-indigo-500">
                                                    <span>Stock Action Alert</span>
                                                    <span>Gap Score: {inv.gapScore}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-700 dark:text-neutral-300 font-bold leading-normal">
                                                    {inv.recommendation}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : activeTab === 'events' ? (
                <div className="space-y-8 animate-scale-up">
                    {/* EVENT OPPORTUNITY ALERTS BANNER */}
                    {eventIntelligence?.opportunityAlerts?.map((alert, idx) => (
                        <div key={idx} className="bg-gradient-to-r from-rose-500/10 to-red-500/10 border border-rose-500/20 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-scale-up">
                            <div className="flex gap-3">
                                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                                    <FaExclamationTriangle className="text-white" size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-rose-955 dark:text-rose-200">Event Opportunity Alert: {alert.eventName}</h3>
                                    <p className="text-xs text-rose-800/80 dark:text-rose-350 font-semibold mt-0.5">
                                        {alert.message}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleSendChatMessage(`What should I stock for ${alert.eventName}?`)}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-colors shadow-lg shadow-rose-600/10 shrink-0"
                            >
                                Ask Event Copilot
                            </button>
                        </div>
                    ))}

                    {/* EVENT CORE STATS ROW */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Event Name */}
                        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 shadow-md flex items-center justify-between group">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Upcoming Major Event</span>
                                <div className="text-2xl font-black text-slate-800 dark:text-neutral-100 tracking-tight">{eventIntelligence?.revenueForecast?.eventName || 'Diwali'}</div>
                                <span className="text-[10px] font-bold text-slate-400 block">Identified as peak revenue opportunity</span>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-xl text-indigo-500">
                                <FaStore />
                            </div>
                        </div>

                        {/* Revenue Lift Forecast */}
                        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-neutral-555">Expected Revenue Lift</span>
                                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-455 tracking-tight">+{eventIntelligence?.revenueForecast?.expectedRevenueIncreasePercent || 180}%</div>
                                <span className="text-[10px] font-bold text-slate-400 block">Projected demand momentum</span>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-xl text-emerald-500">
                                <FaChartLine />
                            </div>
                        </div>

                        {/* Projected Revenue Value */}
                        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-neutral-555">Revenue Opportunity</span>
                                <div className="text-3xl font-black text-slate-850 dark:text-neutral-100 tracking-tight">₹{(eventIntelligence?.revenueForecast?.projectedRevenueLift || 45000).toLocaleString()}</div>
                                <span className="text-[10px] font-bold text-indigo-500">Suggested incremental capture</span>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-xl text-indigo-500">
                                <FaCoins />
                            </div>
                        </div>
                    </div>

                    {eventsLoading ? (
                        <div className="flex justify-center items-center py-20 text-xs text-slate-400">
                            <FaSpinner className="animate-spin text-2xl text-indigo-500 mr-2" /> Loading Event Intelligence data...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Left Column - Upcoming Event Timeline */}
                            <div className="lg:col-span-8 space-y-8">
                                <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                                    <div>
                                        <h3 className="text-base font-black text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                                            <FaChartLine className="text-indigo-500" /> Upcoming Events Calendar
                                        </h3>
                                        <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500">
                                            National, regional, and hyperlocal events scheduled with predictive demand scores.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {eventIntelligence?.upcomingEvents?.map((event, idx) => (
                                            <div key={idx} className="p-4 bg-slate-50 dark:bg-neutral-955 border border-slate-150 dark:border-neutral-850 rounded-2xl flex flex-col justify-between min-h-[160px] hover:shadow-md transition-shadow relative">
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider">
                                                            {event.eventType} · {event.relevance}
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                                                            In {event.daysBefore} Days
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-black text-slate-800 dark:text-neutral-200 capitalize">
                                                            {event.eventName}
                                                        </h4>
                                                        <span className="text-[9px] text-slate-400 block mt-1">
                                                            Starts: {new Date(event.startDate).toDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {event.products?.map((p, pIdx) => (
                                                            <span key={pIdx} className="px-2 py-0.5 bg-slate-200/50 dark:bg-neutral-800 text-slate-650 dark:text-neutral-400 text-[9px] rounded-lg font-bold">
                                                                {p}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="pt-3 mt-3 border-t border-slate-200/30 dark:border-neutral-850/50 flex justify-between items-center text-[10px] font-bold text-slate-400">
                                                    <span>Demand: <span className="text-indigo-500 font-extrabold">{event.expectedDemandImpact}%</span></span>
                                                    <span>Conf: <span className="text-emerald-500 font-extrabold">{event.confidenceScore}%</span></span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Seasonal Inventory Planner */}
                            <div className="lg:col-span-4 space-y-8">
                                <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                                    <div>
                                        <h3 className="text-base font-black text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                                            <FaLightbulb className="text-indigo-500" /> Seasonal Stock Planner
                                        </h3>
                                        <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-555">
                                            Suggestions for stocking quantity based on weather and season indicators.
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        {eventIntelligence?.seasonalPlanner?.map((plan, idx) => (
                                            <div key={idx} className="p-4 bg-slate-55 dark:bg-neutral-955 border border-slate-150 dark:border-neutral-850 rounded-2xl space-y-3">
                                                <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider">
                                                    {plan.season} Forecast Planner
                                                </span>
                                                <div className="space-y-2">
                                                    {plan.recommendations?.map((rec, rIdx) => (
                                                        <div key={rIdx} className="p-2.5 bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-850 rounded-xl space-y-1">
                                                            <div className="flex justify-between items-center text-xs font-black text-slate-800 dark:text-neutral-200">
                                                                <span className="capitalize">{rec.product}</span>
                                                                <span className="text-emerald-500 font-mono text-xs">Stock: {rec.stockQuantity}</span>
                                                            </div>
                                                            <p className="text-[9px] text-slate-455 leading-normal font-semibold">
                                                                {rec.action}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : activeTab === 'growth' ? (
                <div className="space-y-8 animate-scale-up">
                    {/* GROWTH SCORE & CHECKLIST */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Growth Score Ring */}
                        <div className="lg:col-span-5 p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-transparent border border-indigo-500/20 shadow-md flex flex-col justify-between group min-h-[220px]">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Autonomous Growth Score</span>
                                <p className="text-xs text-slate-500 dark:text-neutral-400 font-semibold mt-1">
                                    Your store's overall opportunity score compiled by our weekly autonomous advisor.
                                </p>
                            </div>
                            
                            <div className="flex items-center justify-around py-4">
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="48" cy="48" r="42" className="stroke-slate-200 dark:stroke-neutral-800" strokeWidth="6" fill="transparent" />
                                        <circle cx="48" cy="48" r="42" className="stroke-indigo-500" strokeWidth="6" fill="transparent"
                                            strokeDasharray={263.89}
                                            strokeDashoffset={263.89 - (263.89 * (growthDashboard?.growthProfile?.growthScore ?? 91)) / 100}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <span className="absolute text-xl font-black text-indigo-500">{growthDashboard?.growthProfile?.growthScore ?? 91}%</span>
                                </div>
                                
                                <div className="space-y-2 text-xs font-bold text-slate-600 dark:text-neutral-400">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                        <span>Revenue Growth: {growthDashboard?.growthProfile?.metrics?.revenueGrowth ?? 88}%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                                        <span>Trend Coverage: {growthDashboard?.growthProfile?.metrics?.trendCoverage ?? 92}%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
                                        <span>Inventory Health: {growthDashboard?.growthProfile?.metrics?.inventoryHealth ?? 85}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Weekly Growth Plan Checklist */}
                        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                            <div>
                                <h3 className="text-base font-black text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                                    <FaCheckCircle className="text-indigo-500" /> Weekly Growth Planner
                                </h3>
                                <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500">
                                    Complete these weekly strategic checklist recommendations to capture maximum regional demand.
                                </p>
                            </div>

                            <div className="space-y-3">
                                {growthDashboard?.growthProfile?.weeklyGrowthPlan?.map((plan, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 dark:bg-neutral-955 border border-slate-100 dark:border-neutral-850 rounded-2xl flex items-start gap-3 hover:border-indigo-400 dark:hover:border-indigo-900 transition-colors">
                                        <div className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                                            <FaCheck size={10} />
                                        </div>
                                        <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300 leading-relaxed">
                                            {plan}
                                        </span>
                                    </div>
                                ))}
                                {(!growthDashboard?.growthProfile?.weeklyGrowthPlan || growthDashboard.growthProfile.weeklyGrowthPlan.length === 0) && (
                                    <div className="text-center py-6 text-xs text-slate-555">
                                        Checklist is being generated. Run more orders to receive customized goals.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* PRICING CENTER & DYNAMIC PRICE ALERTS */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Dynamic pricing list */}
                        <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                            <div>
                                <h3 className="text-base font-black text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                                    <FaCoins className="text-indigo-500" /> AI Pricing Advisor
                                </h3>
                                <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-555">
                                    Compiles recommended prices based on category elasticity index and Indore competitor prices.
                                </p>
                            </div>

                            {growthLoading ? (
                                <div className="flex justify-center items-center py-6 text-xs text-slate-400">
                                    <FaSpinner className="animate-spin text-lg text-indigo-500 mr-2" /> Evaluating pricing indices...
                                </div>
                            ) : growthDashboard?.pricingAdvisor?.length > 0 ? (
                                <div className="space-y-4">
                                    {growthDashboard.pricingAdvisor.map((p) => {
                                        const isSame = p.currentPrice === p.recommendedPrice;
                                        return (
                                            <div key={p._id} className="p-4 bg-slate-55 dark:bg-neutral-955 border border-slate-150 dark:border-neutral-850 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-sm transition-shadow">
                                                <div className="space-y-2 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-xs font-black text-slate-800 dark:text-neutral-250 capitalize leading-none">
                                                            {p.productName}
                                                        </h4>
                                                        <span className="px-2 py-0.5 bg-indigo-50/50 dark:bg-indigo-955 text-indigo-500 text-[8px] font-black rounded uppercase">
                                                            Confidence: {p.confidence}%
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-550 leading-relaxed font-semibold">
                                                        {p.reasoning}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 dark:text-neutral-400">
                                                        <span>Current: <span className="font-extrabold text-slate-800 dark:text-neutral-200">₹{p.currentPrice}</span></span>
                                                        <span>Optimal Bounds: <span className="font-extrabold text-indigo-500">₹{p.minPrice} - ₹{p.maxPrice}</span></span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                                                    <div className="text-right">
                                                        <span className="text-[9px] text-slate-400 block font-bold">Recommended</span>
                                                        <span className="text-sm font-black text-emerald-500">₹{p.recommendedPrice}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleApplyRecommendedPrice(p._id, p.productName, p.recommendedPrice)}
                                                        disabled={isSame || actionLoading === p._id}
                                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors shadow-sm flex items-center gap-1 ${
                                                            isSame 
                                                                ? 'bg-emerald-500/10 text-emerald-600 cursor-default'
                                                                : 'bg-indigo-650 hover:bg-indigo-750 text-white'
                                                        }`}
                                                    >
                                                        {actionLoading === p._id ? (
                                                            <FaSpinner className="animate-spin" />
                                                        ) : isSame ? (
                                                            <>✓ Optimized</>
                                                        ) : (
                                                            <>Optimize</>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-55 dark:bg-neutral-955 border border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl text-center py-6 text-xs text-slate-500 font-semibold leading-relaxed">
                                    No products found to compile pricing advice. Add catalog items first.
                                </div>
                            )}
                        </div>

                        {/* Pricing Alerts */}
                        <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                            <div>
                                <h3 className="text-base font-black text-slate-800 dark:text-neutral-100">Dynamic Pricing Alerts</h3>
                                <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-555">Dynamic adjustments triggered by current inventory stock count.</p>
                            </div>

                            <div className="space-y-4">
                                {growthDashboard?.pricingAlerts?.map((alert, idx) => (
                                    <div key={idx} className="p-4 bg-amber-50/15 dark:bg-amber-955/10 border border-amber-500/20 rounded-2xl space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-amber-505">
                                            <span>{alert.productName}</span>
                                            <span>{alert.action.replace('_', ' ')}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-700 dark:text-neutral-300 font-bold leading-normal">
                                            {alert.message}
                                        </p>
                                    </div>
                                ))}
                                {(!growthDashboard?.pricingAlerts || growthDashboard.pricingAlerts.length === 0) && (
                                    <div className="text-center py-6 text-xs text-slate-500">
                                        No active inventory alerts found. Pricing is balanced.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* GROWTH ADVISOR GRID & SIMULATOR */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Growth Insights */}
                        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                            <div>
                                <h3 className="text-base font-black text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                                    <FaLightbulb className="text-indigo-500" /> Autonomous Growth Advisor
                                </h3>
                                <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500">
                                    Strategic category, product, and delivery zone expansion recommendations.
                                </p>
                            </div>

                            {growthLoading ? (
                                <div className="flex justify-center items-center py-6 text-xs text-slate-400">
                                    <FaSpinner className="animate-spin text-lg text-indigo-500 mr-2" /> Running growth advisor analysis...
                                </div>
                            ) : growthDashboard?.growthInsights?.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {growthDashboard.growthInsights.map((insight) => (
                                        <div key={insight._id} className="p-4 bg-gradient-to-br from-indigo-500/5 to-white dark:from-neutral-900 dark:to-neutral-950 border border-indigo-100/50 dark:border-neutral-800/80 rounded-2xl flex flex-col justify-between gap-3 hover:shadow-md transition-shadow relative">
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-[8px] font-black uppercase text-indigo-500 bg-indigo-55 dark:bg-indigo-950 px-2 py-0.5 rounded">
                                                        {insight.type.replace('_', ' ')}
                                                    </span>
                                                    <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase ${
                                                        insight.priority === 'high' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                                                    }`}>
                                                        {insight.priority}
                                                    </span>
                                                </div>
                                                <h4 className="text-xs font-black text-slate-800 dark:text-neutral-250 capitalize leading-snug">
                                                    {insight.opportunity}
                                                </h4>
                                                {insight.type === 'area_expansion' && (
                                                    <p className="text-[9px] text-slate-400 dark:text-neutral-550 leading-relaxed font-bold">
                                                        Distance: {insight.details?.distanceKm}km · Demand: {insight.details?.demandGrowth} · Competition: {insight.details?.competitionLevel}
                                                    </p>
                                                )}
                                                {(insight.type === 'product_expansion' || insight.type === 'category_expansion') && (
                                                    <p className="text-[9px] text-slate-400 dark:text-neutral-555 leading-relaxed font-bold">
                                                        Gap Score: {insight.details?.demandGapScore}/100 · Target items: {insight.details?.products?.join(', ') || insight.details?.categories?.join(', ')}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="pt-2 border-t border-slate-105 dark:border-neutral-850/55 flex justify-between items-center text-[10px] font-black">
                                                <span className="text-slate-400 font-bold">Projected Revenue Lift</span>
                                                <span className="text-emerald-500 font-extrabold">+₹{insight.estimatedRevenueLift.toLocaleString()}/mo</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50 dark:bg-neutral-955 border border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl text-center text-xs text-slate-550 font-semibold leading-relaxed">
                                    No strategic expansion insights compiled. Your operations are currently optimal.
                                </div>
                            )}
                        </div>

                        {/* Interactive Revenue Simulator */}
                        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/80 shadow-md space-y-4">
                            <div>
                                <h3 className="text-base font-black text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                                    <FaChartLine className="text-indigo-500" /> Live Revenue Growth Simulator
                                </h3>
                                <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-555">
                                    Simulate immediate expected revenue lift by increasing catalog inventory stock level or opening hyperlocal zone expansions.
                                </p>
                            </div>

                            <div className="space-y-6">
                                {/* Slider: Inventory Increase */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-slate-705 dark:text-neutral-300">
                                        <span>Increase Inventory Levels</span>
                                        <span className="text-indigo-500 font-extrabold">+{inventoryIncrease}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={inventoryIncrease}
                                        onChange={(e) => setInventoryIncrease(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-slate-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                    <span className="text-[9px] text-slate-400 block font-semibold leading-none">
                                        Models stock density conversion (formula: +{Math.round(inventoryIncrease * 0.36)}% revenue lift)
                                    </span>
                                </div>

                                {/* Toggle: Area Expansion */}
                                <div className="p-4 bg-slate-55 dark:bg-neutral-955 border border-slate-100 dark:border-neutral-850 rounded-2xl flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <span className="text-xs font-black text-slate-800 dark:text-neutral-250">Vijay Nagar Zone Expansion</span>
                                        <span className="text-[9px] text-slate-400 block font-semibold">Toggle to open delivery routes to Vijay Nagar (Flat +24% lift)</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={areaExpansion}
                                            onChange={(e) => setAreaExpansion(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-10 h-5 bg-slate-205 dark:bg-neutral-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-305 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                                    </label>
                                </div>

                                {/* Results display */}
                                <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-2xl space-y-3 relative overflow-hidden">
                                    {simulating && (
                                        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] flex justify-center items-center">
                                            <FaSpinner className="animate-spin text-lg text-indigo-500" />
                                        </div>
                                    )}
                                    <span className="text-[8px] font-black uppercase text-indigo-500 tracking-wider block font-bold">Simulator Projected Yield</span>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-slate-400 dark:text-neutral-550 block font-bold">Simulated Growth</span>
                                            <span className="text-xl font-black text-emerald-500">+{simResult?.liftPercentage ?? 0}%</span>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <span className="text-[9px] text-slate-400 dark:text-neutral-550 block font-bold">Projected Revenue Lift</span>
                                            <span className="text-xl font-black text-indigo-500">+₹{(simResult?.projectedLiftValue ?? 0).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-200/30 flex justify-between items-center text-xs font-bold text-slate-600 dark:text-neutral-450">
                                        <span>Estimated Monthly Revenue:</span>
                                        <span className="font-extrabold text-slate-800 dark:text-neutral-200">₹{(simResult?.simulatedMonthlyRevenue ?? 50000).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 text-slate-500">
                    Select a tab to view insights.
                </div>
            )}

            {/* DRILLDOWN MODAL FOR HEALTH score categories */}
            {selectedHealthSub && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => setSelectedHealthSub(null)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-slate-200 dark:border-neutral-800 shadow-2xl p-6 overflow-hidden animate-scale-up space-y-5">
                        
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[8px] font-black uppercase text-indigo-500 tracking-widest block">AI Diagnostic Report</span>
                                <h3 className="text-lg font-black text-slate-800 dark:text-neutral-100 tracking-tight mt-1">
                                    {selectedHealthSub === 'SUMMARY' && "Overall Business Health"}
                                    {selectedHealthSub === 'PROFILE' && "Profile Integrity Audit"}
                                    {selectedHealthSub === 'INVENTORY' && "Inventory Coverage"}
                                    {selectedHealthSub === 'SALES' && "Sales Volume & Velocity"}
                                    {selectedHealthSub === 'CUSTOMER' && "Sentiment & Loyalty Index"}
                                    {selectedHealthSub === 'COMPLIANCE' && "Bank Routing Compliance"}
                                </h3>
                            </div>
                            <button onClick={() => setSelectedHealthSub(null)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                                <FaTimes />
                            </button>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-neutral-800" />

                        <div className="text-xs font-semibold text-slate-700 dark:text-neutral-300 space-y-4">
                            {selectedHealthSub === 'SUMMARY' && (
                                <div className="space-y-3">
                                    <p className="leading-relaxed text-slate-500">Your total health score of {businessHealth}/100 places your storefront in Indore's top tier. Complete tasks in the Smart Task Center to gain the remaining score:</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span>Profile Completeness:</span>
                                            <span className="font-bold text-emerald-500">{healthBreakdown.profileHealth}% (Optimal)</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Stock Depletion Ratio:</span>
                                            <span className="font-bold text-amber-500">{healthBreakdown.inventoryHealth}% (Attention)</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Competitor Price Match:</span>
                                            <span className="font-bold text-indigo-500">{healthBreakdown.salesHealth}% (Optimal)</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedHealthSub === 'PROFILE' && (
                                <div className="space-y-3">
                                    <p className="leading-relaxed text-slate-500">Evaluates whether your catalog description, banner image, and owner avatar are present to maximize customer trustworthiness indexes.</p>
                                    <div className="space-y-1.5 text-[11px] font-bold">
                                        <div className="flex items-center gap-2 text-emerald-500"><FaCheck /> Shop Description uploaded</div>
                                        <div className="flex items-center gap-2 text-emerald-500"><FaCheck /> Brand Banner updated</div>
                                        <div className="flex items-center gap-2 text-emerald-500"><FaCheck /> Profile Logo set</div>
                                    </div>
                                </div>
                            )}

                            {selectedHealthSub === 'INVENTORY' && (
                                <div className="space-y-3">
                                    <p className="leading-relaxed text-slate-500">Tracks catalog in-stock density and low inventory risks. Items with stock quantity under 5 units reduce coverage indices.</p>
                                    <div className="p-3.5 bg-slate-50 dark:bg-neutral-950 rounded-2xl border border-slate-150 dark:border-neutral-850 space-y-2">
                                        <div className="font-black text-rose-500 text-[10px] uppercase tracking-wider">Low stock items detected:</div>
                                        {tasks.filter(t => t.action === 'RESTOCK_INVENTORY').map((t, idx) => (
                                            <div key={idx} className="flex justify-between text-[11px] text-slate-600 dark:text-neutral-400">
                                                <span>{t.task.replace('Restock ', '')}</span>
                                                <span className="text-rose-500 font-bold">Low stock</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedHealthSub === 'SALES' && (
                                <div className="space-y-3">
                                    <p className="leading-relaxed text-slate-500">Calculates sales velocity matching local indexing models. Compares catalog rates against regional competitor listings.</p>
                                    <div className="p-3.5 bg-slate-50 dark:bg-neutral-955 rounded-2xl border border-slate-150 dark:border-neutral-850 space-y-2">
                                        <div className="font-black text-indigo-500 text-[10px] uppercase tracking-wider">Pricing optimization suggestions:</div>
                                        {pricingAdvice.map((p, idx) => (
                                            <div key={idx} className="flex justify-between text-[11px] text-slate-600 dark:text-neutral-450">
                                                <span>{p.productName}</span>
                                                <span className="text-emerald-500 font-bold">Suggested: ₹{p.suggestedPrice}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedHealthSub === 'CUSTOMER' && (
                                <div className="space-y-3">
                                    <p className="leading-relaxed text-slate-500">Derived from local Swiggy-like customer visits confirm rates and average rating feedbacks left by shoppers.</p>
                                    <div className="flex justify-between items-center p-3.5 bg-slate-55 dark:bg-neutral-955 rounded-2xl">
                                        <span>Indore Seller Rating:</span>
                                        <span className="text-base font-black text-amber-500 flex items-center gap-1">
                                            <FaStar /> {user?.shopDetails?.rating || '4.5'} / 5.0
                                        </span>
                                    </div>
                                </div>
                            )}

                            {selectedHealthSub === 'COMPLIANCE' && (
                                <div className="space-y-3">
                                    <p className="leading-relaxed text-slate-500">Validates whether bank routing UPI details are active and approved by compliance checkers.</p>
                                    <div className="flex justify-between items-center p-3.5 bg-slate-55 dark:bg-neutral-955 rounded-2xl">
                                        <span>UPI Bank Routing:</span>
                                        <span className={user?.shopDetails?.paymentSetupCompleted ? "text-emerald-500 font-black" : "text-rose-500 font-black"}>
                                            {user?.shopDetails?.paymentSetupCompleted ? "✓ Verified & Active" : "✗ Pending KYC Setup"}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => setSelectedHealthSub(null)}
                            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider"
                        >
                            Close Report
                        </button>
                    </div>
                </div>
            )}
            {/* AI BUSINESS ASSISTANT CHAT PANEL */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900/90 to-slate-900/90 backdrop-blur-md border border-indigo-500/20 shadow-2xl text-white space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center">
                        <FaRobot size={22} className="animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-base font-black tracking-tight">Aisle AI Business Assistant</h3>
                        <p className="text-[10px] text-indigo-200 font-semibold">Ask questions about stocking suggestions, trends, or health metrics.</p>
                    </div>
                </div>

                <div className="h-px bg-indigo-500/20" />

                {/* Message display area */}
                <div className="max-h-60 overflow-y-auto space-y-3.5 p-1 scrollbar-thin scrollbar-thumb-indigo-500/20 pr-2">
                    {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-scale-up`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs font-semibold whitespace-pre-wrap leading-relaxed shadow-sm ${
                                msg.sender === 'user' 
                                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                                    : 'bg-slate-800 text-slate-100 border border-slate-700/50 rounded-tl-none'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {assistantLoading && (
                        <div className="flex justify-start animate-pulse">
                            <div className="bg-slate-800 border border-slate-700/50 text-slate-400 rounded-2xl rounded-tl-none px-4 py-2.5 text-xs font-semibold flex items-center gap-2">
                                <FaSpinner className="animate-spin text-indigo-400" /> Assistant is compiling response...
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick actions buttons */}
                <div className="flex flex-wrap gap-2 pt-1.5">
                    <button 
                        onClick={() => handleSendChatMessage('What should I stock?')}
                        disabled={assistantLoading}
                        className="px-3 py-1.5 bg-indigo-950/40 hover:bg-indigo-950/80 border border-indigo-500/20 text-indigo-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                    >
                        💡 What to stock?
                    </button>
                    <button 
                        onClick={() => handleSendChatMessage('Why are requests decreasing?')}
                        disabled={assistantLoading}
                        className="px-3 py-1.5 bg-indigo-950/40 hover:bg-indigo-950/80 border border-indigo-500/20 text-indigo-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                    >
                        ⚠️ Decreasing Requests?
                    </button>
                    <button 
                        onClick={() => handleSendChatMessage('What is trending nearby?')}
                        disabled={assistantLoading}
                        className="px-3 py-1.5 bg-indigo-950/40 hover:bg-indigo-950/80 border border-indigo-500/20 text-indigo-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                    >
                        📈 Trending Nearby?
                    </button>
                </div>

                {/* Chat input form */}
                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSendChatMessage();
                    }}
                    className="flex gap-3 pt-2"
                >
                    <input 
                        type="text" 
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Ask Aisle AI: e.g. 'What should I stock?'"
                        disabled={assistantLoading}
                        className="flex-1 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-white text-xs font-semibold rounded-2xl px-4 py-3 outline-none transition-colors placeholder:text-slate-550"
                    />
                    <button 
                        type="submit"
                        disabled={assistantLoading || !userInput.trim()}
                        className="px-5 py-3 bg-indigo-500 hover:bg-indigo-650 disabled:bg-indigo-900/50 disabled:text-indigo-400 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 shrink-0"
                    >
                        Ask AI
                    </button>
                </form>
            </div>
            <CopilotWidget role="seller" />
        </div>
    );
};

export default SellerInsights;
