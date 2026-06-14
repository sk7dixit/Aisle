import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
    Plus, Search, Edit2, Trash2, MoreVertical, AlertCircle, Check, X,
    ChevronRight, SlidersHorizontal, Loader, Sparkles, Package, Box,
    TrendingUp, ShoppingBag, Bell, ArrowLeft, RefreshCw, Layers, CheckSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import ProductEditModal from '../ProductEditModal';
import { SHOP_TYPE_CONFIG } from '../../../utils/shopTypeConfig';

const MobileSellerInventory = () => {
    const { token, user, checkUserStatus } = useAuth();
    const [products, setProducts] = useState([]);
    const [metrics, setMetrics] = useState({ totalCount: 0, availableCount: 0, unavailableCount: 0, lastConfirmed: null });
    const [categoryCounts, setCategoryCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [metricsLoading, setMetricsLoading] = useState(true);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'AVAILABLE' | 'UNAVAILABLE'
    const [activeCategory, setActiveCategory] = useState('All');

    // Modals / Bottom Sheets
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
    const [isFabSheetOpen, setIsFabSheetOpen] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [stockChangeVal, setStockChangeVal] = useState('10');

    // UI Interactive states
    const [startingDay, setStartingDay] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Shop Info
    const shopTypeKey = user?.shopDetails?.shopType || 'GROCERY_KIRANA';
    const allowedCategories = SHOP_TYPE_CONFIG[shopTypeKey]?.categories || SHOP_TYPE_CONFIG['GROCERY_KIRANA'].categories;
    const isAvailabilityMode = shopTypeKey && !['HOME_BUSINESS', 'Home Businesses', 'SERVICES', 'Services', 'Service Provider'].includes(shopTypeKey);

    const isConfirmedToday = () => {
        const lastConfirmed = user?.shopDetails?.lastAvailabilityConfirmedAt || user?.shopDetails?.lastOpeningStockSetAt;
        if (!lastConfirmed) return false;
        return new Date(lastConfirmed).toDateString() === new Date().toDateString();
    };

    const formatLastConfirmedTime = (timestamp) => {
        if (!timestamp) return 'Never';
        const date = new Date(timestamp);
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            return `Today • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    // Data Loaders
    const fetchMetrics = async () => {
        try {
            setMetricsLoading(true);
            const res = await fetch(`/api/seller/inventory/metrics?t=${Date.now()}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
            });
            if (res.ok) {
                const data = await res.json();
                setMetrics(data);
            }
        } catch (err) {
            console.error("Failed to load metrics", err);
        } finally {
            setMetricsLoading(false);
        }
    };

    const fetchCategoryCounts = async () => {
        try {
            const res = await fetch(`/api/seller/inventory/category-counts?t=${Date.now()}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
            });
            if (res.ok) {
                const data = await res.json();
                setCategoryCounts(data);
            }
        } catch (err) {
            console.error("Failed to load category counts", err);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/seller/inventory/products?category=${encodeURIComponent(activeCategory)}&t=${Date.now()}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
            });
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (err) {
            console.error("Failed to load products", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchMetrics();
            fetchCategoryCounts();
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchProducts();
        }
    }, [token, activeCategory]);

    // Handlers
    const handleToggleAvailability = async (productId, currentStatus) => {
        const nextStatus = currentStatus === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
        
        // Optimistic Update
        setProducts(prev => prev.map(p => p._id === productId ? { ...p, availability: nextStatus } : p));
        
        try {
            const res = await fetch(`/api/seller/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ availability: nextStatus })
            });

            if (res.ok) {
                const updated = await res.json();
                // Ensure synced with server response
                setProducts(prev => prev.map(p => p._id === productId ? updated : p));
                fetchMetrics();
                toast.success(`${updated.name} is now ${nextStatus.toLowerCase()}`);
            } else {
                // Revert
                setProducts(prev => prev.map(p => p._id === productId ? { ...p, availability: currentStatus } : p));
                toast.error("Failed to toggle availability");
            }
        } catch (err) {
            console.error(err);
            // Revert
            setProducts(prev => prev.map(p => p._id === productId ? { ...p, availability: currentStatus } : p));
            toast.error("Error toggling availability");
        }
    };

    const handleAdjustStock = async (productId, change) => {
        try {
            const res = await fetch(`/api/seller/inventory/${productId}/quantity`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ change })
            });

            if (res.ok) {
                const updated = await res.json();
                setProducts(prev => prev.map(p => p._id === productId ? {
                    ...p,
                    quantity: updated.quantity,
                    stockStatus: updated.stockStatus,
                    status: updated.stockStatus === 'OUT_OF_STOCK' ? 'OUT_OF_STOCK' : 'IN_STOCK'
                } : p));
                fetchMetrics();
                toast.success(`Stock adjusted successfully`);
            } else {
                toast.error("Failed to adjust stock");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error adjusting stock");
        }
    };

    const handleQuickRestock = async (product) => {
        // Optimistically add 20 units
        handleAdjustStock(product._id, 20);
    };

    const handleStartToday = async () => {
        setStartingDay(true);
        try {
            const res = await fetch('/api/seller/inventory/start-day', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success(isAvailabilityMode ? "Availability confirmed for today!" : "Stock confirmed!");
                await checkUserStatus();
                fetchProducts();
                fetchMetrics();
            } else {
                toast.error("Failed to confirm today's inventory");
            }
        } catch (err) {
            console.error(err);
            toast.error("Network error confirming inventory");
        } finally {
            setStartingDay(false);
        }
    };

    const handleDelete = async (productId) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            const res = await fetch(`/api/seller/products/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setProducts(prev => prev.filter(p => p._id !== productId));
                fetchMetrics();
                fetchCategoryCounts();
                toast.success("Product deleted successfully");
                setIsActionSheetOpen(false);
            } else {
                toast.error("Failed to delete product");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error deleting product");
        }
    };

    const handleSaveProduct = async (productId, updatedData) => {
        try {
            const res = await fetch(`/api/seller/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });

            if (res.ok) {
                const updated = await res.json();
                setProducts(prev => prev.map(p => p._id === productId ? updated : p));
                fetchMetrics();
                fetchCategoryCounts();
                toast.success("Product updated successfully");
                setIsEditModalOpen(false);
                setIsActionSheetOpen(false);
            } else {
                toast.error("Failed to save product details");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error saving product changes");
        }
    };

    const handleSaveStockChange = (e) => {
        e.preventDefault();
        const change = parseInt(stockChangeVal);
        if (isNaN(change)) return;
        handleAdjustStock(selectedProduct._id, change);
        setIsStockModalOpen(false);
        setIsActionSheetOpen(false);
    };

    // Filter Logic
    const filteredProducts = products.filter(product => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
            product.name?.toLowerCase().includes(searchLower) ||
            product.sku?.toLowerCase().includes(searchLower)
        );

        if (!matchesSearch) return false;

        if (isAvailabilityMode) {
            if (statusFilter === 'AVAILABLE') {
                return product.availability === 'AVAILABLE';
            }
            if (statusFilter === 'UNAVAILABLE') {
                return product.availability === 'UNAVAILABLE';
            }
        } else {
            // Out of stock logic for legacy
            if (statusFilter === 'AVAILABLE') {
                return product.quantity > 0;
            }
            if (statusFilter === 'UNAVAILABLE') {
                return product.quantity === 0;
            }
        }
        return true;
    });

    const lowStockProducts = products.filter(p => p.quantity <= 10).slice(0, 3);
    const needReviewCount = !isConfirmedToday() ? products.filter(p => p.availability === 'UNAVAILABLE' || p.quantity <= 5).length : 0;

    return (
        <div className="p-4 space-y-4 pb-40 font-sans bg-slate-50 min-h-screen text-slate-800 relative">
            
            {/* --- COMPACT SUMMARY HEADER --- */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-5 shadow-lg border border-indigo-500/20 space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Package className="text-indigo-400" size={20} />
                        <h1 className="font-extrabold text-sm tracking-tight uppercase leading-tight">Inventory summary</h1>
                    </div>
                    <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">
                        Last Confirmed: {formatLastConfirmedTime(metrics?.lastConfirmed || user?.shopDetails?.lastAvailabilityConfirmedAt)}
                    </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5">
                        <span className="text-xs font-black block text-white">{metrics?.totalCount || products.length}</span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Products</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5">
                        <span className="text-xs font-black block text-emerald-500">🟢 {metrics?.availableCount || products.filter(p => p.availability === 'AVAILABLE').length}</span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Available</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5">
                        <span className="text-xs font-black block text-amber-500">
                            {isAvailabilityMode ? `🟡 ${needReviewCount}` : `🔴 ${metrics?.unavailableCount || products.filter(p => p.quantity === 0).length}`}
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                            {isAvailabilityMode ? 'Need Review' : 'Out of Stock'}
                        </span>
                    </div>
                </div>
            </div>

            {/* --- DAILY CONFIRMATION BANNER --- */}
            {isAvailabilityMode && !isConfirmedToday() && (
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs animate-pulse">
                    <div className="flex items-start gap-2.5 min-w-0">
                        <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                        <div className="min-w-0">
                            <h4 className="font-black text-xs text-amber-800">⚠ Daily Availability Check</h4>
                            <p className="text-[10px] text-amber-600 font-semibold mt-0.5 leading-relaxed truncate">
                                {needReviewCount} items need inventory confirmation today
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleStartToday}
                        disabled={startingDay}
                        className="bg-amber-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm shrink-0 active:scale-95 transition-all"
                    >
                        {startingDay ? 'Reviewing...' : 'Review Now'}
                    </button>
                </div>
            )}

            {/* --- AI INVENTORY ASSISTANT --- */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-3xl p-4.5 shadow-lg space-y-3.5 relative overflow-hidden border border-white/15">
                <div className="absolute right-4 top-4.5 bg-white/15 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={10} className="fill-white" /> Inventory AI
                </div>
                
                <div className="space-y-0.5">
                    <h4 className="font-extrabold text-xs tracking-tight">Stock Optimization Alerts</h4>
                    <p className="text-[10px] text-indigo-150 font-semibold">
                        Detected: {lowStockProducts.length} low-stock items • 1 fast-moving item nearby
                    </p>
                </div>

                <button
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="w-full h-9 bg-white text-indigo-700 font-black rounded-xl text-[10px] uppercase tracking-wider shadow active:scale-98 transition-all flex items-center justify-center gap-1"
                >
                    <Sparkles size={12} className="text-indigo-600 fill-indigo-600" />
                    {showSuggestions ? 'Hide suggestions' : 'View Suggestions'}
                </button>

                {showSuggestions && (
                    <div className="bg-black/15 p-3 rounded-2xl border border-white/10 text-[10px] space-y-2 text-indigo-100 font-semibold leading-relaxed animate-slide-up">
                        <p className="flex items-start gap-1">
                            <span className="text-amber-400">🚨</span>
                            <span><strong>Soft drinks</strong> are running very low. High demand is expected in your locality this evening. Restock now to secure ₹1.2k sales.</span>
                        </p>
                        <p className="flex items-start gap-1">
                            <span className="text-emerald-400">💡</span>
                            <span>Set <strong>Amul Milk</strong> status to Available. 4 nearby stores are out of stock.</span>
                        </p>
                    </div>
                )}
            </div>

            {/* --- STICKY SEARCH --- */}
            <div className="bg-white border border-slate-100 rounded-2xl px-3 py-2 flex items-center gap-2 shadow-xs">
                <Search size={16} className="text-slate-400" />
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs font-semibold text-slate-700 w-full placeholder:text-slate-400"
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400">
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* --- CATEGORY CHIPS --- */}
            <div className="flex gap-2 overflow-x-auto pb-1 select-none scrollbar-none">
                <button
                    onClick={() => setActiveCategory('All')}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all whitespace-nowrap ${
                        activeCategory === 'All'
                            ? 'bg-[#433422] text-white border-[#433422] shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    All ({products.length})
                </button>
                {allowedCategories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all whitespace-nowrap ${
                            activeCategory === cat
                                ? 'bg-[#433422] text-white border-[#433422] shadow-sm'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {cat} ({categoryCounts[cat] || 0})
                    </button>
                ))}
            </div>

            {/* --- STATUS FILTERS (SEGMENTED CONTROL) --- */}
            <div className="flex bg-slate-200 p-1 rounded-2xl gap-1">
                {[
                    { id: 'ALL', label: `All (${products.length})` },
                    { id: 'AVAILABLE', label: 'Available' },
                    { id: 'UNAVAILABLE', label: isAvailabilityMode ? 'Unavailable' : 'Out of Stock' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setStatusFilter(tab.id)}
                        className={`flex-1 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            statusFilter === tab.id
                                ? 'bg-white text-slate-900 shadow-sm font-black'
                                : 'text-slate-500 bg-transparent hover:text-slate-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* --- LOW STOCK ALERTS SECTION --- */}
            {lowStockProducts.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">⚠ Low Stock Alerts</h3>
                    <div className="space-y-2">
                        {lowStockProducts.map(prod => (
                            <div key={prod._id} className="bg-white border border-rose-100 rounded-2xl p-3 flex justify-between items-center gap-2 shadow-xs">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 font-extrabold text-[10px]">
                                        {prod.quantity}
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-xs text-slate-800">{prod.name}</h4>
                                        <p className="text-[8px] text-rose-500 font-bold uppercase tracking-wider mt-0.5">{prod.quantity} units left</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleQuickRestock(prod)}
                                    className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shrink-0"
                                >
                                    Restock
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- COMPACT PRODUCT CARD LIST --- */}
            <div className="space-y-2">
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Product Shelves</h3>
                
                {loading ? (
                    <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                        <RefreshCw className="animate-spin text-slate-400" size={20} />
                        <span className="text-[9px] font-black uppercase tracking-wider">Loading items...</span>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center flex flex-col items-center gap-3 py-12">
                        <Box size={36} className="text-slate-300" />
                        <div>
                            <h4 className="font-extrabold text-xs text-slate-800">📦 No Products Found</h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Add products to start receiving customer requests.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredProducts.map(product => {
                            const isAvailable = isAvailabilityMode 
                                ? product.availability === 'AVAILABLE' 
                                : product.quantity > 0;
                            
                            const mainImage = product.images?.[0] || product.image || '/placeholder-product.png';

                            return (
                                <div
                                    key={product._id}
                                    className="bg-white border border-slate-100 rounded-2xl p-3 shadow-xs flex justify-between items-center gap-3 h-[88px] relative overflow-hidden"
                                >
                                    {/* Left Image & Product Details */}
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <img
                                            src={mainImage}
                                            alt={product.name}
                                            className="w-12 h-12 rounded-xl object-cover bg-slate-50 border border-slate-100 shrink-0"
                                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80' }}
                                        />
                                        <div className="min-w-0">
                                            <h4 className="font-extrabold text-xs text-slate-850 truncate">{product.name}</h4>
                                            <p className="text-[10px] text-slate-500 font-bold mt-0.5">₹{product.sellingPrice || product.price}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Stock: {product.quantity}</p>
                                        </div>
                                    </div>

                                    {/* Right Side: Toggle Switch and Options */}
                                    <div className="flex items-center gap-2.5 shrink-0">
                                        {/* Availability Switch Toggle */}
                                        <button
                                            onClick={() => handleToggleAvailability(product._id, product.availability)}
                                            className={`w-12 h-6.5 rounded-full p-1 transition-colors relative cursor-pointer ${
                                                isAvailable ? 'bg-emerald-500' : 'bg-slate-200'
                                            }`}
                                            title={isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                                        >
                                            <span className={`w-4.5 h-4.5 rounded-full bg-white absolute top-1 transition-all shadow-xs ${
                                                isAvailable ? 'left-6.5' : 'left-1'
                                            }`}></span>
                                        </button>

                                        {/* Ellipsis Actions Button */}
                                        <button
                                            onClick={() => {
                                                setSelectedProduct(product);
                                                setIsActionSheetOpen(true);
                                            }}
                                            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer"
                                        >
                                            <MoreVertical size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* --- FLOATING ACTION FAB BUTTON --- */}
            <div className="fixed bottom-20 right-4 z-40">
                <button
                    onClick={() => setIsFabSheetOpen(true)}
                    className="w-12 h-12 rounded-full bg-[#059669] hover:bg-[#047857] text-white shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all border border-white/10 cursor-pointer"
                    title="Add Product"
                >
                    <Plus size={24} className="stroke-[3]" />
                </button>
            </div>

            {/* --- STICKY BOTTOM REVIEW BAR --- */}
            {isAvailabilityMode && !isConfirmedToday() && (
                <div className="fixed bottom-[64px] left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 z-30 shadow-lg flex justify-center">
                    <button
                        onClick={handleStartToday}
                        disabled={startingDay}
                        className="w-full max-w-sm h-11 bg-[#433422] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all disabled:opacity-50"
                    >
                        <CheckSquare size={16} />
                        {startingDay ? 'Confirming...' : "Confirm Today's Inventory"}
                    </button>
                </div>
            )}

            {/* --- ACTION BOTTOM SHEET --- */}
            {isActionSheetOpen && selectedProduct && (
                <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex flex-col justify-end animate-fade-in" onClick={() => setIsActionSheetOpen(false)}>
                    <div className="bg-white rounded-t-[32px] p-6 shadow-2xl z-50 animate-slide-up space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                            <div>
                                <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest">Product options</h3>
                                <h4 className="font-black text-sm text-slate-800 mt-0.5">{selectedProduct.name}</h4>
                            </div>
                            <button onClick={() => setIsActionSheetOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                            {/* Change Stock */}
                            <button
                                onClick={() => {
                                    setStockChangeVal(selectedProduct.quantity.toString());
                                    setIsStockModalOpen(true);
                                }}
                                className="w-full p-3.5 bg-slate-50/70 border border-slate-200 hover:bg-slate-100 rounded-2xl flex items-center gap-3 transition-colors text-left"
                            >
                                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                    <SlidersHorizontal size={16} />
                                </div>
                                <div className="flex-1">
                                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Adjust Stock Level</span>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Current: {selectedProduct.quantity}</span>
                                </div>
                            </button>

                            {/* Edit Info */}
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="w-full p-3.5 bg-slate-50/70 border border-slate-200 hover:bg-slate-100 rounded-2xl flex items-center gap-3 transition-colors text-left"
                            >
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                    <Edit2 size={16} />
                                </div>
                                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Edit Product Details</span>
                            </button>

                            {/* Toggle availability */}
                            <button
                                onClick={() => {
                                    handleToggleAvailability(selectedProduct._id, selectedProduct.availability);
                                    setIsActionSheetOpen(false);
                                }}
                                className="w-full p-3.5 bg-slate-50/70 border border-slate-200 hover:bg-slate-100 rounded-2xl flex items-center gap-3 transition-colors text-left"
                            >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                    selectedProduct.availability === 'AVAILABLE' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                                }`}>
                                    {selectedProduct.availability === 'AVAILABLE' ? <X size={16} /> : <Check size={16} />}
                                </div>
                                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Mark as {selectedProduct.availability === 'AVAILABLE' ? 'Unavailable' : 'Available'}
                                </span>
                            </button>

                            {/* Delete Product */}
                            <button
                                onClick={() => handleDelete(selectedProduct._id)}
                                className="w-full p-3.5 bg-rose-50/40 border border-rose-100 hover:bg-rose-50 rounded-2xl flex items-center gap-3 transition-colors text-left text-rose-600"
                            >
                                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                                    <Trash2 size={16} />
                                </div>
                                <span className="text-xs font-black text-rose-600 uppercase tracking-wider">Delete Product</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- FAB ADD ACTION SHEET --- */}
            {isFabSheetOpen && (
                <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex flex-col justify-end animate-fade-in" onClick={() => setIsFabSheetOpen(false)}>
                    <div className="bg-white rounded-t-[32px] p-6 shadow-2xl z-50 animate-slide-up space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center pb-1">
                            <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest">➕ Add Product Method</h3>
                            <button onClick={() => setIsFabSheetOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { label: 'Add by Voice', desc: 'Speak list to import', path: '/seller/products' },
                                { label: 'Add by Camera / Photo', desc: 'Scan product shelf', path: '/seller/products' },
                                { label: 'Quick Manual Add', desc: 'Standard catalog input', path: '/seller/products' },
                            ].map((opt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setIsFabSheetOpen(false);
                                        window.location.href = opt.path;
                                    }}
                                    className="w-full p-3.5 bg-slate-50/70 border border-slate-200 hover:bg-slate-100 rounded-2xl flex items-center justify-between transition-colors text-left"
                                >
                                    <div>
                                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">{opt.label}</span>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">{opt.desc}</span>
                                    </div>
                                    <ChevronRight size={14} className="text-slate-400" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- QUICK STOCK LEVEL INPUT MODAL --- */}
            {isStockModalOpen && selectedProduct && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <form
                        onSubmit={handleSaveStockChange}
                        className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest">Adjust Stock Count</h3>
                            <button type="button" onClick={() => setIsStockModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div>
                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">New Quantity</label>
                            <input
                                type="number"
                                required
                                value={stockChangeVal}
                                onChange={e => setStockChangeVal(e.target.value)}
                                className="w-full px-4.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => setIsStockModalOpen(false)}
                                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 uppercase tracking-wider hover:bg-slate-100"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-700"
                            >
                                Save Stock
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Product Edit Modal Integration */}
            {selectedProduct && (
                <ProductEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    product={selectedProduct}
                    onSave={handleSaveProduct}
                    shopType={shopTypeKey}
                />
            )}
        </div>
    );
};

export default MobileSellerInventory;
