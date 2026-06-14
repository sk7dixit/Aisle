import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    FaArrowLeft,
    FaCheckCircle,
    FaClock,
    FaTimesCircle,
    FaWalking,
    FaHistory,
    FaQrcode,
    FaBox,
    FaMapMarkerAlt,
    FaRoute,
    FaReceipt,
    FaUndo,
    FaStar,
    FaChevronRight,
    FaSyncAlt
} from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import EReceiptModal from '../../components/customer/EReceiptModal';
import RatingForm from '../../components/customer/RatingForm';

const VisitsOrdersPage = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Tabs: 'active' | 'completed' | 'cancelled' | 'expired'
    const [activeTab, setActiveTab] = useState('active');
    
    // Category filter: 'All' | 'Medicine' | 'Electronics' | 'Services' | 'Visits'
    const [activeCategory, setActiveCategory] = useState('All');

    const [selectedQR, setSelectedQR] = useState(null);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [ratingItem, setRatingItem] = useState(null);
    const [expandedVisits, setExpandedVisits] = useState({});

    const toggleExpandVisit = (visitId) => {
        setExpandedVisits(prev => ({
            ...prev,
            [visitId]: !prev[visitId]
        }));
    };


    const fetchVisits = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        else setRefreshing(true);
        
        try {
            const res = await fetch('/api/customer-visits/my-visits', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setVisits(data);
            }
        } catch (error) {
            console.error("Fetch Visits Error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchVisits();
        }
    }, [token]);

    // Helper: Safely resolve image paths as relative URLs
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            try {
                const url = new URL(imagePath);
                return url.pathname;
            } catch (e) {
                return imagePath;
            }
        }
        return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    };

    // Helper: Safely extract shop details
    const getVisitShopDetails = (visit) => {
        const shopName = visit.sellerId?.shopDetails?.shopName || visit.shopName || 'Local Shop';
        const shopAddress = visit.sellerId?.shopDetails?.address || visit.shopAddress || 'Address not available';
        const shopCategory = visit.sellerId?.shopDetails?.shopCategory || 'General';
        const shopType = visit.sellerId?.shopDetails?.shopType || 'OTHER';
        return { shopName, shopAddress, shopCategory, shopType };
    };

    // Helper: Determine if visit has expired (scheduled time in past but still upcoming/arrived)
    const isExpired = (visit) => {
        if (!['UPCOMING', 'ARRIVED'].includes(visit.visitStatus)) return false;
        if (!visit.visitTime) return false;
        return new Date(visit.visitTime) < new Date();
    };

    // Categorization Mapping for Category Pills
    const getVisitCategory = (visit) => {
        const { shopType, shopCategory } = getVisitShopDetails(visit);
        if (shopType === 'PHARMACY' || shopCategory === 'Medicine') {
            return 'Medicine';
        }
        if (['TECH_ACCESSORIES', 'ELECTRICAL_HARDWARE_AUTO'].includes(shopType) || shopCategory === 'Electronics') {
            return 'Electronics';
        }
        if (shopType === 'HOME_BUSINESS' || shopCategory === 'Services') {
            return 'Services';
        }
        return 'Visits'; // Everything else is general visits/orders
    };

    // Category Style configuration
    const getCategoryIconDetails = (category) => {
        switch (category) {
            case 'Medicine':
                return { emoji: '🏥', colorBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100' };
            case 'Electronics':
                return { emoji: '🔌', colorBg: 'bg-blue-50 text-blue-600 border border-blue-100' };
            case 'Services':
                return { emoji: '🛠️', colorBg: 'bg-orange-50 text-orange-600 border border-orange-100' };
            default:
                return { emoji: '🏪', colorBg: 'bg-purple-50 text-purple-600 border border-purple-100' };
        }
    };

    // Divide visits into mutually exclusive states
    const getVisitsByStatus = (status) => {
        return visits.filter(v => {
            const expired = isExpired(v);
            if (status === 'active') {
                return ['UPCOMING', 'ARRIVED'].includes(v.visitStatus) && !expired;
            }
            if (status === 'completed') {
                return v.visitStatus === 'COMPLETED';
            }
            if (status === 'cancelled') {
                return v.visitStatus === 'CANCELLED';
            }
            if (status === 'expired') {
                return v.visitStatus === 'MISSED' || expired;
            }
            return false;
        });
    };

    const activeVisits = getVisitsByStatus('active');
    const completedVisits = getVisitsByStatus('completed');
    const cancelledVisits = getVisitsByStatus('cancelled');
    const expiredVisits = getVisitsByStatus('expired');

    // Get visits for the selected tab and active category
    const getFilteredVisits = () => {
        let list = [];
        if (activeTab === 'active') list = activeVisits;
        else if (activeTab === 'completed') list = completedVisits;
        else if (activeTab === 'cancelled') list = cancelledVisits;
        else if (activeTab === 'expired') list = expiredVisits;

        if (activeCategory !== 'All') {
            list = list.filter(v => getVisitCategory(v) === activeCategory);
        }
        return list;
    };

    // Sort visits based on active tab
    const sortVisits = (items) => {
        return [...items].sort((a, b) => {
            const timeA = a.visitTime ? new Date(a.visitTime) : new Date(a.createdAt);
            const timeB = b.visitTime ? new Date(b.visitTime) : new Date(b.createdAt);
            if (activeTab === 'active') {
                return timeA - timeB; // Soonest first
            }
            return timeB - timeA; // Most recent first
        });
    };

    // Group sorted visits by date
    const groupVisitsByDate = (items) => {
        const sorted = sortVisits(items);
        const groups = {};

        sorted.forEach(v => {
            const dateObj = v.visitTime ? new Date(v.visitTime) : new Date(v.createdAt);
            const dateStr = dateObj.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            
            const today = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);

            let groupKey = dateStr;
            if (dateObj.toDateString() === today.toDateString()) {
                groupKey = 'Today';
            } else if (dateObj.toDateString() === tomorrow.toDateString()) {
                groupKey = 'Tomorrow';
            } else if (dateObj.toDateString() === yesterday.toDateString()) {
                groupKey = 'Yesterday';
            }

            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(v);
        });

        return groups;
    };

    const groupedVisits = groupVisitsByDate(getFilteredVisits());


    // Extract Unique Recent Shops
    const getRecentShopsList = () => {
        const completed = visits.filter(v => v.visitStatus === 'COMPLETED');
        const list = [];
        const shopIds = new Set();
        
        completed.forEach(v => {
            const sId = v.sellerId?._id || v.sellerId;
            if (sId && !shopIds.has(sId)) {
                shopIds.add(sId);
                list.push(v);
            }
        });
        return list.slice(0, 4);
    };

    const recentShops = getRecentShopsList();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center flex-col gap-4">
                <div className="w-12 h-12 border-4 border-[#E07A5F] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium animate-pulse">Loading your activity dashboard...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCF8] pb-24 font-sans text-slate-800 relative overflow-hidden">
            {/* Ambient Background Blobs */}
            <div className="immersive-blob bg-[#81B29A]/10 w-[350px] h-[350px] top-[-50px] left-[-50px]" />
            <div className="immersive-blob bg-[#E07A5F]/10 w-[450px] h-[450px] bottom-[-150px] right-[-100px] animation-delay-2000" />

            <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(-1)} 
                            className="w-10 h-10 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all hover:shadow-sm active:scale-95"
                            title="Go Back"
                        >
                            <FaArrowLeft size={14} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-slate-900">Activity Hub</h1>
                            <p className="text-sm text-slate-500 font-medium">Track your reservations, visits, and receipts</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => fetchVisits(true)}
                        disabled={refreshing}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200/60 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all active:scale-95 w-fit"
                    >
                        <FaSyncAlt className={`${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Refreshing...' : 'Refresh Activity'}
                    </button>
                </div>

                {/* Glassmorphic Analytics Counters Strip */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { id: 'active', label: 'Active Pass', count: activeVisits.length, color: 'border-blue-200 bg-blue-50/30 text-blue-700', icon: <FaWalking /> },
                        { id: 'completed', label: 'Completed', count: completedVisits.length, color: 'border-[#81B29A]/30 bg-[#81B29A]/5 text-[#55866f]', icon: <FaCheckCircle /> },
                        { id: 'cancelled', label: 'Cancelled', count: cancelledVisits.length, color: 'border-rose-200 bg-rose-50/30 text-rose-700', icon: <FaTimesCircle /> },
                        { id: 'expired', label: 'Expired', count: expiredVisits.length, color: 'border-amber-200 bg-amber-50/30 text-amber-700', icon: <FaClock /> }
                    ].map(card => (
                        <button
                            key={card.id}
                            onClick={() => setActiveTab(card.id)}
                            className={`flex items-center justify-between p-5 bg-white/60 backdrop-blur-md border rounded-3xl text-left transition-all hover:scale-[1.02] hover:shadow-sm ${
                                activeTab === card.id ? `ring-2 ring-slate-900 shadow-sm ${card.color}` : 'border-slate-100'
                            }`}
                        >
                            <div className="space-y-1">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
                                <div className="text-3xl font-black tracking-tight">{card.count}</div>
                            </div>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${card.color}`}>
                                {card.icon}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Navigation and Layout Split */}
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    
                    {/* Left Column (70%) - Timeline Feed */}
                    <div className="w-full lg:w-[70%] space-y-6">
                        
                        {/* Tabs & Filters Control Strip */}
                        <div className="bg-white/60 backdrop-blur-md border border-slate-100 rounded-3xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Tabs */}
                            <div className="flex gap-2 bg-slate-100/80 p-1 rounded-2xl w-fit">
                                {[
                                    { id: 'active', label: 'Active', icon: <FaWalking /> },
                                    { id: 'completed', label: 'Completed', icon: <FaCheckCircle /> },
                                    { id: 'cancelled', label: 'Cancelled', icon: <FaTimesCircle /> },
                                    { id: 'expired', label: 'Expired', icon: <FaClock /> }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveTab(tab.id);
                                            setActiveCategory('All');
                                        }}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                            activeTab === tab.id
                                                ? 'bg-slate-900 text-white shadow-sm'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        {tab.icon}
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Category Filter Pills */}
                            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
                                {[
                                    { id: 'All', label: 'All', emoji: '🌐' },
                                    { id: 'Medicine', label: 'Medicine', emoji: '🏥' },
                                    { id: 'Electronics', label: 'Electronics', emoji: '🔌' },
                                    { id: 'Services', label: 'Services', emoji: '🛠️' },
                                    { id: 'Visits', label: 'General Visits', emoji: '🏪' }
                                ].map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                            activeCategory === cat.id
                                                ? 'bg-[#E07A5F] text-white border-transparent'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <span>{cat.emoji}</span>
                                        <span>{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* List / Feed Area */}
                        {Object.keys(groupedVisits).length === 0 ? (
                            /* Safe Empty State */
                            <div className="bg-white/60 backdrop-blur-md border border-slate-100 rounded-3xl p-12 text-center shadow-sm">
                                <div className="w-20 h-20 bg-slate-100/80 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-400">
                                    {activeTab === 'active' ? <FaWalking size={32} /> : <FaHistory size={32} />}
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2">No visits found</h3>
                                <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8 text-sm leading-relaxed">
                                    {activeCategory === 'All' 
                                        ? `You don't have any ${activeTab} activities listed. Book an appointment or order items from your favorite shops.`
                                        : `No ${activeCategory.toLowerCase()} visits match your current tab selection.`}
                                </p>
                                <button
                                    onClick={() => navigate('/')}
                                    className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95"
                                >
                                    Explore Nearby Shops
                                </button>
                            </div>
                        ) : (
                            /* Chronological Timeline Feed */
                            <div className="space-y-10 pl-2">
                                {Object.keys(groupedVisits).map((dateKey) => (
                                    <div key={dateKey} className="space-y-4">
                                        {/* Date Group Title */}
                                        <h4 className="text-xs font-black uppercase tracking-widest text-[#3D405B]/60 pl-4">
                                            {dateKey}
                                        </h4>
                                        
                                        {/* Timeline Cards Container */}
                                        <div className="relative border-l border-slate-200 pl-6 ml-3 space-y-6">
                                            {groupedVisits[dateKey].map((visit) => {
                                                const { shopName, shopAddress, shopCategory } = getVisitShopDetails(visit);
                                                const totalAmount = visit.products.reduce((acc, p) => acc + ((p.priceAtTime || p.price || 0) * (p.quantity || p.qty || 1)), 0);
                                                const visitTimeFormatted = visit.visitTime 
                                                    ? new Date(visit.visitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : new Date(visit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                
                                                const cat = getVisitCategory(visit);
                                                const catIcon = getCategoryIconDetails(cat);
                                                const expired = isExpired(visit);

                                                return (
                                                    <div key={visit._id} className="relative group/card">
                                                        
                                                        {/* Timeline Dot Node */}
                                                        <div className={`absolute -left-[30.5px] top-6 w-3 h-3 rounded-full border bg-white flex items-center justify-center transition-all group-hover/card:scale-125 z-10 ${
                                                            visit.visitStatus === 'COMPLETED' ? 'border-[#81B29A] ring-4 ring-[#81B29A]/10' :
                                                            visit.visitStatus === 'CANCELLED' ? 'border-rose-400 ring-4 ring-rose-400/10' :
                                                            expired ? 'border-amber-400 ring-4 ring-amber-400/10' : 'border-blue-400 ring-4 ring-blue-400/10'
                                                        }`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                                visit.visitStatus === 'COMPLETED' ? 'bg-[#81B29A]' :
                                                                visit.visitStatus === 'CANCELLED' ? 'bg-rose-400' :
                                                                expired ? 'bg-amber-400' : 'bg-blue-400'
                                                            }`} />
                                                        </div>

                                                        {/* Horizontal Card Body */}
                                                        <div 
                                                            onClick={() => toggleExpandVisit(visit._id)}
                                                            className="flex flex-col p-6 bg-white border border-slate-100 hover:border-slate-200/80 rounded-3xl shadow-sm hover:shadow-md transition-all gap-4 relative overflow-hidden cursor-pointer hover:bg-slate-50/20"
                                                        >
                                                            
                                                            {/* Side Border Status Indicator */}
                                                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                                                                visit.visitStatus === 'COMPLETED' ? 'bg-[#81B29A]' :
                                                                visit.visitStatus === 'ARRIVED' ? 'bg-orange-400' :
                                                                visit.visitStatus === 'CANCELLED' ? 'bg-rose-400' :
                                                                expired ? 'bg-amber-400' : 'bg-blue-400'
                                                            }`}></div>

                                                            {/* Top Row: Info, Preview, and Action Badges */}
                                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                                                                {/* Left: Category Icon, Time & Shop Info */}
                                                                <div className="flex items-start gap-4 min-w-[280px]">
                                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${catIcon.colorBg}`}>
                                                                        {catIcon.emoji}
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                                            {visitTimeFormatted} • {cat}
                                                                        </span>
                                                                        <h3 
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                navigate(`/shop/${visit.sellerId?._id || visit.sellerId}`);
                                                                            }}
                                                                            className="font-bold text-slate-900 text-lg hover:text-[#E07A5F] transition-colors cursor-pointer leading-snug"
                                                                        >
                                                                            {shopName}
                                                                        </h3>
                                                                        <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate max-w-[240px]">
                                                                            <FaMapMarkerAlt className="text-slate-400 flex-shrink-0" size={10} />
                                                                            <span>{shopAddress}</span>
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Center: Products List */}
                                                                <div className="flex-grow flex flex-col gap-2 md:border-l md:border-r border-slate-100 md:px-6 py-2 md:py-0">
                                                                    {!expandedVisits[visit._id] ? (
                                                                        <>
                                                                            <div className="flex flex-wrap gap-1.5">
                                                                                {visit.products.slice(0, 3).map((p, idx) => (
                                                                                    <span key={idx} className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 text-[11px] px-2.5 py-1 rounded-xl border border-slate-100">
                                                                                        <span className="font-semibold">{p.name || 'Product'}</span>
                                                                                        <span className="text-slate-400 font-medium">×{p.quantity || p.qty || 1}</span>
                                                                                    </span>
                                                                                ))}
                                                                                {visit.products.length > 3 && (
                                                                                    <span className="inline-flex items-center text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-lg">
                                                                                        +{visit.products.length - 3} more
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex justify-between items-center text-[11px] text-slate-400 font-semibold mt-1">
                                                                                <span>Total Value: <strong className="text-sm font-black text-slate-950 font-mono">₹{totalAmount}</strong></span>
                                                                                <span className="text-[10px] text-indigo-500 font-extrabold hover:underline">View details ▼</span>
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <div className="flex flex-col justify-center h-full">
                                                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detailed view</span>
                                                                            <div className="flex justify-between items-center text-[11px] text-slate-400 font-semibold mt-1">
                                                                                <span>Total Value: <strong className="text-sm font-black text-slate-950 font-mono">₹{totalAmount}</strong></span>
                                                                                <span className="text-[10px] text-indigo-500 font-extrabold hover:underline">Close details ▲</span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Right: Badges & Actions */}
                                                                <div className="flex flex-row md:flex-col items-center md:items-end gap-3 justify-between md:justify-center min-w-[170px] flex-shrink-0 border-t border-slate-50 md:border-t-0 pt-4 md:pt-0">
                                                                    <div className="flex flex-col gap-1 items-start md:items-end">
                                                                        {/* Status Badge */}
                                                                        {visit.visitStatus === 'COMPLETED' ? (
                                                                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                                                                <FaCheckCircle size={10} /> Completed
                                                                            </span>
                                                                        ) : visit.visitStatus === 'ARRIVED' ? (
                                                                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                                                                                <FaClock size={10} /> Arrived
                                                                            </span>
                                                                        ) : visit.visitStatus === 'CANCELLED' ? (
                                                                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                                                                                <FaTimesCircle size={10} /> Cancelled
                                                                            </span>
                                                                        ) : expired ? (
                                                                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                                                                                <FaClock size={10} /> Expired
                                                                            </span>
                                                                        ) : (
                                                                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                                                                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                                                                                Upcoming
                                                                            </span>
                                                                        )}

                                                                        {/* Payment Badge */}
                                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${
                                                                            visit.paymentMode === 'PAID_ONLINE' ? 'text-emerald-600' : 'text-slate-500'
                                                                        }`}>
                                                                            {visit.paymentMode === 'PAID_ONLINE' ? 'Paid Online' : 'Pay at Shop'}
                                                                        </span>
                                                                    </div>

                                                                    {/* Action Buttons */}
                                                                    <div className="flex gap-2 w-full md:w-auto justify-end">
                                                                        {/* Map Route navigation (always helpful) */}
                                                                        <a
                                                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shopName + ' ' + shopAddress)}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="w-9 h-9 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-xl flex items-center justify-center border border-slate-200/60 transition-all hover:scale-[1.05]"
                                                                            title="Navigate in Google Maps"
                                                                        >
                                                                            <FaRoute size={13} />
                                                                        </a>

                                                                        {/* QR Code Pass */}
                                                                        {!expired && ['UPCOMING', 'ARRIVED'].includes(visit.visitStatus) && visit.qrToken && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setSelectedQR(visit);
                                                                                }}
                                                                                className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-black text-white px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shadow-sm active:scale-95"
                                                                            >
                                                                                <FaQrcode size={11} /> Pass
                                                                            </button>
                                                                        )}

                                                                        {/* E-Receipt for Completed visits */}
                                                                        {visit.visitStatus === 'COMPLETED' && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setSelectedReceipt(visit);
                                                                                }}
                                                                                className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border border-slate-200/60"
                                                                            >
                                                                                <FaReceipt size={11} /> Receipt
                                                                            </button>
                                                                        )}

                                                                        {/* Rate Shop trigger */}
                                                                        {visit.visitStatus === 'COMPLETED' && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setRatingItem(visit);
                                                                                }}
                                                                                className="w-9 h-9 bg-[#E07A5F]/10 hover:bg-[#E07A5F]/20 text-[#d66b4f] rounded-xl flex items-center justify-center border border-[#E07A5F]/20 transition-all"
                                                                                title="Rate your visit"
                                                                            >
                                                                                <FaStar size={13} />
                                                                            </button>
                                                                        )}

                                                                        {/* Rebook for cancelled/expired */}
                                                                        {(visit.visitStatus === 'CANCELLED' || expired) && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    navigate(`/shop/${visit.sellerId?._id || visit.sellerId}`);
                                                                                }}
                                                                                className="flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-[11px] font-bold border border-slate-200 transition-all active:scale-95"
                                                                            >
                                                                                <FaUndo size={10} /> Rebook
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Bottom Row: Detailed Products & Prices List (visible when expanded) */}
                                                            {expandedVisits[visit._id] && (
                                                                <div 
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="mt-4 pt-4 border-t border-slate-100/80 space-y-2 animate-fade-in"
                                                                >
                                                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                                                                        Order Products & Prices
                                                                    </p>
                                                                    <div className="grid grid-cols-1 gap-2">
                                                                        {visit.products.map((p, pIdx) => {
                                                                            const qty = p.quantity || p.qty || 1;
                                                                            const price = p.priceAtTime || p.price || 0;
                                                                            const subtotal = qty * price;

                                                                            return (
                                                                                <div 
                                                                                    key={pIdx}
                                                                                    className="flex items-center justify-between text-xs py-2.5 px-4 bg-slate-50/70 hover:bg-slate-50 border border-slate-100/60 rounded-2xl transition-all"
                                                                                >
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full flex-shrink-0"></span>
                                                                                        <span className="font-bold text-slate-800">{p.name || 'Product'}</span>
                                                                                        <span className="text-slate-400 font-medium font-mono text-[10px]">
                                                                                            ({qty} × ₹{price})
                                                                                        </span>
                                                                                    </div>
                                                                                    <span className="font-black text-slate-900 font-mono text-sm">₹{subtotal}</span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column (30%) - Quick Summary Sidebar */}
                    <div className="w-full lg:w-[30%] space-y-6">
                        

                        {/* Recent Shops Panel */}
                        <div className="bg-white/60 backdrop-blur-md border border-slate-100 rounded-3xl p-6 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 mb-1">Recent Shops</h3>
                            <p className="text-xs text-slate-500 font-medium mb-4">Quick links to shops you've visited</p>
                            
                            {recentShops.length === 0 ? (
                                <div className="py-6 text-center text-slate-400 text-xs font-semibold">
                                    No completed visits yet to show recent shops.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentShops.map((visit) => {
                                        const { shopName, shopAddress, shopCategory } = getVisitShopDetails(visit);
                                        const sellerId = visit.sellerId?._id || visit.sellerId;
                                        
                                        return (
                                            <div 
                                                key={visit._id} 
                                                onClick={() => navigate(`/shop/${sellerId}`)}
                                                className="flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-2xl hover:border-slate-200 transition-all cursor-pointer group/shop"
                                            >
                                                <div className="min-w-0 pr-2">
                                                    <h4 className="text-xs font-bold text-slate-900 group-hover/shop:text-[#E07A5F] transition-colors truncate">
                                                        {shopName}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-400 truncate">{shopCategory} • {shopAddress}</p>
                                                </div>
                                                <FaChevronRight size={10} className="text-slate-300 group-hover/shop:text-slate-600 group-hover/shop:translate-x-0.5 transition-all flex-shrink-0" />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* QR View Modal */}
            {selectedQR && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative animate-scale-in text-center shadow-2xl">
                        <button onClick={() => setSelectedQR(null)} className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors">
                            <FaTimesCircle size={24} />
                        </button>

                        <h3 className="text-xl font-black text-slate-800 mb-1">{getVisitShopDetails(selectedQR).shopName}</h3>
                        <p className="text-sm text-slate-500 mb-6 font-medium">Show this pass to the merchant for scanning</p>

                        <div className="bg-white p-5 border border-slate-200 rounded-2xl inline-block mb-6 relative">
                            {/* Corner Accents */}
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-slate-900 -mt-2 -ml-2 rounded-tl-md"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-slate-900 -mt-2 -mr-2 rounded-tr-md"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-slate-900 -mb-2 -ml-2 rounded-bl-md"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-slate-900 -mb-2 -mr-2 rounded-br-md"></div>

                            <QRCodeSVG value={selectedQR.qrPayload || JSON.stringify({ qrToken: selectedQR.qrToken })} size={200} />
                        </div>

                        <p className="text-xs font-mono bg-slate-100 py-2.5 px-4 rounded-xl text-slate-500 tracking-wider font-semibold">
                            PASS ID: {selectedQR.qrToken?.substring(0, 12).toUpperCase()}...
                        </p>
                    </div>
                </div>
            )}

            {/* Receipt Modal Wrapper */}
            {selectedReceipt && (
                <EReceiptModal
                    visit={selectedReceipt}
                    order={selectedReceipt}
                    onClose={() => setSelectedReceipt(null)}
                />
            )}

            {/* Rating Modal Wrapper */}
            {ratingItem && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative animate-scale-in shadow-2xl">
                        <RatingForm
                            shopId={ratingItem.sellerId?._id || ratingItem.sellerId}
                            onFinish={() => {
                                setRatingItem(null);
                                fetchVisits(true);
                            }}
                            onCancel={() => setRatingItem(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisitsOrdersPage;
