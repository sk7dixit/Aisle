import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLocation } from '../../context/LocationContext';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { CATEGORIES } from '../../constants/categories';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, Plus, Minus } from 'lucide-react';

// Subtle category themes for visual separation
const GROUP_THEMES = {
    "Daily Needs & Food": {
        gradient: "from-[#FFF8F0] via-white to-white",
        accent: "#E07A5F",
        badge: "bg-orange-50 text-[#E07A5F] border-orange-100",
        cardBg: "bg-orange-50/25"
    },
    "Electrical & Hardware": {
        gradient: "from-[#F5F7FA] via-white to-white",
        accent: "#3D405B",
        badge: "bg-slate-50 text-slate-700 border-slate-200",
        cardBg: "bg-slate-50/20"
    },
    "Tech & Accessories": {
        gradient: "from-[#F5F8FF] via-white to-white",
        accent: "#0077B6",
        badge: "bg-blue-50 text-blue-700 border-blue-150",
        cardBg: "bg-blue-50/15"
    },
    "Student & Office": {
        gradient: "from-[#FFFDF0] via-white to-white",
        accent: "#F2CC8F",
        badge: "bg-yellow-50 text-yellow-755 border-yellow-150",
        cardBg: "bg-yellow-50/15"
    },
    "Home & Lifestyle": {
        gradient: "from-[#F4F9F4] via-white to-white",
        accent: "#81B29A",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-150",
        cardBg: "bg-emerald-50/15"
    },
    "Pharmacy & Wellness": {
        gradient: "from-[#FFF0F0] via-white to-white",
        accent: "#E63946",
        badge: "bg-rose-50 text-rose-700 border-rose-150",
        cardBg: "bg-rose-50/15"
    },
    "Seasonal & Festive": {
        gradient: "from-[#FFFBF0] via-white to-white",
        accent: "#FFB703",
        badge: "bg-amber-50 text-amber-700 border-amber-150",
        cardBg: "bg-amber-50/15"
    }
};

const CustomerCategories = () => {
    const navigate = useNavigate();
    const { userLocation, refreshLocation, isLocating } = useLocation();

    // Redesign State
    const [activeGroup, setActiveGroup] = useState('Daily Needs & Food'); // Currently selected sidebar group
    const [expandedSubgroups, setExpandedSubgroups] = useState({}); // Track expandable triggers (+X More)
    const INITIAL_LIMIT = 6; // Limit visible items inside grid initially

    // Live Database Stats State
    const [realStats, setRealStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    // Group Categories
    const groupedCategories = useMemo(() => {
        return CATEGORIES.reduce((groups, category) => {
            const groupName = category.group || 'Other';
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(category);
            return groups;
        }, {});
    }, []);

    // Fetch live statistics on mount
    useEffect(() => {
        const fetchStats = async () => {
            setLoadingStats(true);
            try {
                const res = await axios.get('/api/categories/stats');
                setRealStats(res.data);
            } catch (error) {
                console.error("Failed to load real category stats:", error);
            } finally {
                setLoadingStats(false);
            }
        };
        fetchStats();
    }, []);

    // Statistics Count Up Logic using live data
    const [stats, setStats] = useState({ categories: 0, businesses: 0, creators: 0 });
    useEffect(() => {
        if (!userLocation || loadingStats || !realStats) return;
        
        const duration = 1200; // ms
        const endCats = realStats.categoriesCount || CATEGORIES.length;
        const endBiz = realStats.shopsCount || 0;
        const endCreators = realStats.creatorsCount || 0;
        
        const startTime = performance.now();
        
        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out quad
            const easeProgress = progress * (2 - progress);
            
            setStats({
                categories: Math.floor(easeProgress * endCats),
                businesses: Math.floor(easeProgress * endBiz),
                creators: Math.floor(easeProgress * endCreators)
            });
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }, [userLocation, realStats, loadingStats]);

    const toggleExpandSubgroup = (groupName) => {
        setExpandedSubgroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    // Get icon for category group
    const getGroupIcon = (groupName) => {
        switch (groupName) {
            case 'Daily Needs & Food': return '🥕';
            case 'Electrical & Hardware': return '🔌';
            case 'Tech & Accessories': return '💻';
            case 'Student & Office': return '🎒';
            case 'Home & Lifestyle': return '🍳';
            case 'Pharmacy & Wellness': return '💊';
            case 'Seasonal & Festive': return '🪔';
            default: return '📁';
        }
    };

    // Helper for live trending store counts
    const getTrendStoresText = (id) => {
        const count = realStats?.categoryStats?.[id]?.stores ?? 0;
        return `${count} ${count === 1 ? 'Store' : 'Stores'}`;
    };

    // CASE A: No location selected
    if (!userLocation && !isLocating) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
                <div className="w-24 h-24 bg-black/5 rounded-[40px] flex items-center justify-center text-[var(--accent-orange)] text-4xl mb-8 shadow-inner border border-black/5">
                    <FaMapMarkerAlt />
                </div>
                <h2 className="text-2xl font-black text-[var(--text-primary)] mb-3 uppercase tracking-tight">Choose your location</h2>
                <p className="text-[var(--text-muted)] text-[11px] font-black uppercase tracking-widest max-w-xs mx-auto mb-10 opacity-60 leading-relaxed">
                    Set your location to explore local providers and categories nearby.
                </p>
                <button
                    onClick={() => refreshLocation(true)}
                    className="bg-[var(--accent-orange)] text-black font-black py-4 px-10 rounded-2xl shadow-xl hover:bg-black hover:text-white transition-all active:scale-95 flex items-center gap-3 uppercase tracking-widest text-[11px]"
                >
                    <FaMapMarkerAlt className="text-lg" /> Set Location
                </button>
            </div>
        );
    }

    const activeTheme = GROUP_THEMES[activeGroup] || {
        gradient: "from-slate-50 to-white",
        accent: "#1f2937",
        badge: "bg-slate-50 text-slate-800 border-slate-200",
        cardBg: "bg-slate-50/10"
    };

    const activeItems = groupedCategories[activeGroup] || [];
    const isExpanded = expandedSubgroups[activeGroup];
    const hasMore = activeItems.length > INITIAL_LIMIT;
    const visibleItems = (hasMore && !isExpanded) ? activeItems.slice(0, INITIAL_LIMIT) : activeItems;

    return (
        <div className="min-h-screen font-sans bg-transparent pb-24 relative overflow-x-hidden">
            
            {/* 1. HERO SECTION */}
            <div className="max-w-[1400px] mx-auto px-6 md:px-8 pt-8 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-8 text-left">
                <div className="flex flex-col items-start text-left max-w-xl">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/50 text-[#E07A5F] text-[10px] font-black uppercase tracking-wider mb-3.5"
                    >
                        <Sparkles className="w-3 h-3" /> Explore Everything Around You
                    </motion.div>
                    
                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-4.5xl font-black text-slate-900 tracking-tight leading-none mb-3"
                    >
                        Browse Categories
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.8 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-555 text-xs md:text-sm font-semibold leading-relaxed"
                    >
                        Explore local businesses, artisan creations, and services by category around you.
                    </motion.p>
                </div>

                {/* Floating Statistics Count-Up */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-3 gap-6 max-w-md w-full border border-slate-200/55 bg-white/60 backdrop-blur-md px-6 py-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow shrink-0"
                >
                    <div className="flex flex-col items-center">
                        <span className="text-xl font-black text-slate-800 tracking-tight">{stats.categories}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Categories</span>
                    </div>
                    <div className="flex flex-col items-center border-x border-slate-200/50">
                        <span className="text-xl font-black text-[#E07A5F] tracking-tight">{stats.businesses}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Shops</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-xl font-black text-indigo-600 tracking-tight">{stats.creators}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Creators</span>
                    </div>
                </motion.div>
            </div>

            {/* 2. SPLIT LAYOUT CONTAINER */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                    
                    {/* Left Rail Pane: Sidebar (horizontal pills scroll on mobile) */}
                    <div className="lg:col-span-1 bg-white border border-slate-150 rounded-3xl p-4 lg:p-5 shadow-2xs sticky top-24 z-20">
                        <h2 className="hidden lg:block text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-2">
                            Category Groups
                        </h2>
                        
                        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 scrollbar-hide">
                            {Object.keys(groupedCategories).map((groupName) => {
                                const isActive = activeGroup === groupName;
                                
                                return (
                                    <button
                                        key={groupName}
                                        onClick={() => {
                                            setActiveGroup(groupName);
                                            // Reset scroll to top of details pane on mobile
                                            if (window.innerWidth < 1024) {
                                                const gridEl = document.getElementById('categories-grid-pane');
                                                gridEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                            }
                                        }}
                                        className={`flex items-center justify-between px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 shrink-0 cursor-pointer text-left lg:w-full border ${
                                            isActive
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                                : 'bg-slate-50/50 hover:bg-orange-50/20 text-slate-650 hover:text-[#E07A5F] border-slate-200/80 hover:border-orange-200/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-base">{getGroupIcon(groupName)}</span>
                                            <span>{groupName}</span>
                                        </div>
                                        <ChevronRight size={14} className={`hidden lg:block transition-transform duration-200 ${
                                            isActive ? 'translate-x-1 text-white' : 'text-slate-400'
                                        }`} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Grid Pane: Subcategories */}
                    <div id="categories-grid-pane" className="lg:col-span-3">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeGroup}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.25 }}
                                className={`rounded-3xl p-6 md:p-8 bg-gradient-to-b ${activeTheme.gradient} border border-slate-150/70 shadow-2xs`}
                            >
                                {/* Active Group Title */}
                                <div className="flex items-baseline justify-between border-b border-slate-100 pb-4 mb-6">
                                    <div>
                                        <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                            {getGroupIcon(activeGroup)} {activeGroup}
                                        </h2>
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-500 shadow-2xs">
                                        {activeItems.length} subcategories
                                    </span>
                                </div>

                                {/* Subcategories Responsive Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {visibleItems.map((cat) => {
                                        const preview = realStats?.categoryStats?.[cat.id] || { stores: 0, products: 0 };
                                        
                                        return (
                                            <div
                                                key={cat.id}
                                                onClick={() => navigate(`/category/${cat.id}`)}
                                                className="group bg-white rounded-3xl p-4 border border-slate-150 shadow-2xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[160px] max-h-[180px] hover:border-orange-200"
                                            >
                                                {/* Icon squircle with scaling on hover */}
                                                <div className={`h-9 w-9 rounded-xl flex items-center justify-center border transition-all duration-355 text-base
                                                              ${activeTheme.cardBg} group-hover:scale-105`}
                                                     style={{ borderColor: `${activeTheme.accent}25`, color: activeTheme.accent }}>
                                                    {cat.icon}
                                                </div>

                                                {/* Category Info */}
                                                <div className="mt-3 space-y-1 flex-1 flex flex-col justify-end">
                                                    <div>
                                                        <h3 className="text-xs font-black text-slate-800 leading-tight group-hover:text-[#E07A5F] transition-colors truncate">
                                                            {cat.label}
                                                        </h3>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 leading-normal">
                                                            <div>{preview.stores} {preview.stores === 1 ? 'Store' : 'Stores'}</div>
                                                            <div>{preview.products} {preview.products === 1 ? 'Item' : 'Items'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Expandable limit toggle button card */}
                                    {hasMore && (
                                        <div
                                            onClick={() => toggleExpandSubgroup(activeGroup)}
                                            className="flex flex-col items-center justify-center p-4 bg-slate-50/50 hover:bg-slate-50 border border-dashed border-slate-200 hover:border-slate-350 rounded-3xl min-h-[160px] max-h-[180px] cursor-pointer transition-all active:scale-95 group text-center"
                                        >
                                            <div className="h-8 w-8 rounded-full bg-slate-100 group-hover:bg-[#E07A5F]/10 flex items-center justify-center text-slate-655 group-hover:text-[#E07A5F] transition-colors mb-2">
                                                {isExpanded ? <Minus size={14} /> : <Plus size={14} />}
                                            </div>
                                            <span className="text-xs font-black text-slate-800 group-hover:text-[#E07A5F] transition-colors">
                                                {isExpanded ? 'Show Less' : `+${activeItems.length - INITIAL_LIMIT} More`}
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                                Subcategories
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                </div>
            </div>
            
        </div>
    );
};

export default CustomerCategories;
