import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaSearch, FaPlus, FaList, FaTh, FaCamera, FaTrash, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { SHOP_TYPE_CONFIG } from '../../utils/shopTypeConfig';
import InventoryStats from '../../components/seller/InventoryStats';
import ProductsTable from '../../components/seller/ProductsTable';
import ProductsGrid from '../../components/seller/ProductsGrid';
import ProductEditModal from '../../components/seller/ProductEditModal';

const SellerInventory = () => {
    const { user, token, checkUserStatus } = useAuth();

    // State
    const [products, setProducts] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [categoryCounts, setCategoryCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [metricsLoading, setMetricsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('list');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [startingDay, setStartingDay] = useState(false);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null,
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel',
        isDanger: false
    });

    const [toast, setToast] = useState({
        isOpen: false,
        message: '',
        type: 'success'
    });

    const showToast = (message, type = 'success') => {
        setToast({ isOpen: true, message, type });
    };

    useEffect(() => {
        if (toast.isOpen) {
            const timer = setTimeout(() => {
                setToast(prev => ({ ...prev, isOpen: false }));
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.isOpen]);

    const showConfirm = ({ title, message, onConfirm, isDanger = false, confirmLabel = 'Confirm', cancelLabel = 'Cancel' }) => {
        setConfirmState({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                closeConfirm();
            },
            onCancel: closeConfirm,
            confirmLabel,
            cancelLabel,
            isDanger
        });
    };

    const closeConfirm = () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    };

    // Shop Type & Categories
    const shopTypeKey = user?.shopDetails?.shopType || "GROCERY_KIRANA";
    const allowedCategories = SHOP_TYPE_CONFIG[shopTypeKey]?.categories || SHOP_TYPE_CONFIG["GROCERY_KIRANA"].categories;
    const [activeCategory, setActiveCategory] = useState("All");

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
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // Fetch Metrics
    useEffect(() => {
        fetchMetrics();
        fetchCategoryCounts();
    }, []);

    // Fetch Products when category changes
    useEffect(() => {
        fetchProducts();
    }, [activeCategory]);
    const fetchMetrics = async () => {
        try {
            setMetricsLoading(true);
            const res = await fetch(`/api/seller/inventory/metrics?t=${Date.now()}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
            });
            const data = await res.json();
            if (res.ok) setMetrics(data);
        } catch (error) {
            console.error("Failed to fetch metrics", error);
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
            const data = await res.json();
            if (res.ok) setCategoryCounts(data);
        } catch (error) {
            console.error("Failed to fetch category counts", error);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await fetch(
                `/api/seller/inventory/products?category=${encodeURIComponent(activeCategory)}&t=${Date.now()}`,
                { 
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Cache-Control': 'no-cache'
                    } 
                }
            );
            const data = await res.json();
            if (res.ok) setProducts(data);
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setLoading(false);
        }
    };

    const [selectedProductIds, setSelectedProductIds] = useState(new Set());

    // ... (existing handlers)

    const handleSelectionChange = (productId) => {
        const newSelection = new Set(selectedProductIds);
        if (newSelection.has(productId)) {
            newSelection.delete(productId);
        } else {
            newSelection.add(productId);
        }
        setSelectedProductIds(newSelection);
    };

    const handleSelectAll = (isChecked) => {
        if (isChecked) {
            // Select all visible filtered products
            const allIds = filteredProducts.map(p => p._id);
            setSelectedProductIds(new Set(allIds));
        } else {
            setSelectedProductIds(new Set());
        }
    };

    const handleBulkDelete = async () => {
        const count = selectedProductIds.size;
        if (count === 0) return;

        showConfirm({
            title: 'Delete Selected Products',
            message: `Are you sure you want to delete ${count} selected products? This action cannot be undone.`,
            confirmLabel: 'Delete',
            isDanger: true,
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/seller/products/bulk-delete`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ productIds: Array.from(selectedProductIds) })
                    });

                    if (res.ok) {
                        // Remove from local state
                        setProducts(products.filter(p => !selectedProductIds.has(p._id)));
                        setSelectedProductIds(new Set()); // Clear selection
                        fetchMetrics();
                        fetchCategoryCounts();
                        showToast("Products deleted successfully", 'success');
                    } else {
                        const data = await res.json();
                        showToast(data.message || "Failed to delete products", 'error');
                    }
                } catch (error) {
                    console.error("Bulk delete failed", error);
                    showToast("Network error during deletion", 'error');
                }
            }
        });
    };

    const handleDelete = async (productId) => {
        showConfirm({
            title: 'Delete Product',
            message: 'Are you sure you want to delete this product? This action cannot be undone.',
            confirmLabel: 'Delete',
            isDanger: true,
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/seller/products/${productId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (res.ok) {
                        setProducts(products.filter(p => p._id !== productId));
                        fetchMetrics(); // Refresh metrics
                        fetchCategoryCounts(); // Refresh counts
                    }
                } catch (error) {
                    console.error("Failed to delete product", error);
                }
            }
        });
    };

    const handleEdit = (product) => {
        setSelectedProduct(product);
        setIsEditModalOpen(true);
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
                // Refresh list
                setProducts(products.map(p =>
                    p._id === productId ? updated : p
                ));
                fetchMetrics(); // Refresh metrics if quantity/price changed
                fetchCategoryCounts(); // Refresh if category changed
            }
        } catch (error) {
            console.error("Failed to save product", error);
        }
    };

    const handleRestockDaily = async (productId) => {
        try {
            const res = await fetch(`/api/seller/inventory/${productId}/restock-daily`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const updated = await res.json(); // returns { ... quantity } 
                // We need to fetch product to make sure logic is safe, or partial update
                // The endpoint returns message and quantity?
                // Let's refetch or just careful update

                // Better: Optimistic update / Refetch
                fetchProducts(); // Safest for accurate stock status logic
                showToast("Restocked successfully", 'success');
            } else {
                showToast("Failed to restock", 'error');
            }
        } catch (error) {
            console.error("Restock failed", error);
        }
    };

    const handleAddStock = async (productId, amount, updateBaseline) => {
        try {
            const res = await fetch(`/api/seller/inventory/${productId}/add-stock`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount, updateBaseline })
            });

            if (res.ok) {
                fetchProducts(); // Refresh
                showToast("Stock added successfully", 'success');
            }
        } catch (error) {
            console.error("Add Stock failed", error);
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

                // Update State (Sync with Backend)
                setProducts(prevProducts => prevProducts.map(p =>
                    p._id === productId
                        ? { ...p, quantity: updated.quantity, stockStatus: updated.stockStatus, status: updated.stockStatus === 'OUT_OF_STOCK' ? 'OUT_OF_STOCK' : 'IN_STOCK' }
                        : p
                ));

                // Refresh Metrics (Quantities changed)
                fetchMetrics();
                fetchCategoryCounts();
            }
        } catch (error) {
            console.error("Failed to adjust stock", error);
        }
    };

    // Start Today Handler (Confirm Availability)
    const handleStartToday = async () => {
        showConfirm({
            title: isAvailabilityMode ? "Confirm Availability" : "Confirm Today's Stock",
            message: isAvailabilityMode 
                ? "Confirm today's availability status for all products?" 
                : "Confirm today's stock baseline? This assumes current quantities are correct.",
            confirmLabel: 'Confirm',
            isDanger: false,
            onConfirm: async () => {
                setStartingDay(true);
                try {
                    const res = await fetch(`/api/seller/inventory/start-day`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    const data = await res.json();

                    if (res.ok) {
                        showToast(isAvailabilityMode ? "Availability confirmed for today!" : "Today's stock confirmed!", 'success');
                        await checkUserStatus(); // Refresh user state (lastOpeningStockSetAt / lastAvailabilityConfirmedAt)
                        fetchProducts(); // Refresh products
                        fetchMetrics(); // Refresh metrics
                    } else {
                        showToast(data.message || "Failed to confirm today's availability", 'error');
                    }
                } catch (error) {
                    console.error("Start day failed", error);
                    showToast("Network error", 'error');
                } finally {
                    setStartingDay(false);
                }
            }
        });
    };

    const handleToggleAvailability = async (productId, status) => {
        try {
            const res = await fetch(`/api/seller/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ availability: status })
            });

            if (res.ok) {
                const updated = await res.json();
                // Update local state
                setProducts(prevProducts => prevProducts.map(p =>
                    p._id === productId ? updated : p
                ));
                fetchMetrics(); // Refresh stats
            }
        } catch (error) {
            console.error("Failed to toggle availability", error);
        }
    };

    const handleBulkStatusUpdate = async (status) => {
        const count = selectedProductIds.size;
        if (count === 0) return;

        try {
            const res = await fetch(`/api/seller/products/bulk-status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productIds: Array.from(selectedProductIds),
                    status: status
                })
            });

            if (res.ok) {
                fetchProducts();
                fetchMetrics();
                setSelectedProductIds(new Set());
                showToast(`Successfully marked ${count} products as ${status === 'AVAILABLE' ? 'Available' : 'Unavailable'}`, 'success');
            } else {
                const data = await res.json();
                showToast(data.message || "Failed to update products status", 'error');
            }
        } catch (error) {
            console.error("Bulk status update failed", error);
            showToast("Network error during bulk update", 'error');
        }
    };

    // Filter products by search term & status
    const filteredProducts = products.filter(product => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
            product.name?.toLowerCase().includes(searchLower) ||
            product.sku?.toLowerCase().includes(searchLower) ||
            product.description?.toLowerCase().includes(searchLower)
        );

        if (!matchesSearch) return false;

        if (isAvailabilityMode) {
            if (statusFilter === 'AVAILABLE') {
                return product.availability === 'AVAILABLE';
            }
            if (statusFilter === 'UNAVAILABLE') {
                return product.availability === 'UNAVAILABLE';
            }
            if (statusFilter === 'RECENT') {
                if (!product.lastConfirmedAt) return false;
                const limit = 24 * 60 * 60 * 1000;
                return (new Date() - new Date(product.lastConfirmedAt)) < limit;
            }
        }
        return true;
    });

    return (
        <div className="min-h-screen bg-[#faf8f4] py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-[1920px] mx-auto">

                {/* Compact Header */}
                {isAvailabilityMode ? (
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[#F3E8D3] pb-4 mb-5">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Product Availability</h1>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-bold mt-1">
                                <div className="flex items-center gap-1">
                                    <span className={`w-2 h-2 rounded-full ${isConfirmedToday() ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                    <span>{isConfirmedToday() ? 'Confirmed Today' : 'Needs Confirmation'}</span>
                                </div>
                                <span className="text-slate-350">•</span>
                                <span>Last Confirmed: <strong className="text-slate-700">{formatLastConfirmedTime(metrics?.lastConfirmed)}</strong></span>
                                <span className="text-slate-350">•</span>
                                <span className="text-emerald-700">{metrics?.availableCount || 0} Available</span>
                                <span className="text-slate-350">•</span>
                                <span className="text-rose-700">{metrics?.unavailableCount || 0} Unavailable</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-3 md:mt-0">
                            <button
                                onClick={handleStartToday}
                                disabled={startingDay || isConfirmedToday()}
                                className={`px-4 h-[38px] text-xs rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer whitespace-nowrap
                                    ${isConfirmedToday()
                                        ? 'bg-[#E7E5E4] text-[#78716C] border border-[#D6D3D1] cursor-not-allowed'
                                        : 'bg-[#433422] hover:bg-[#2D2317] text-white hover:scale-[1.01] active:scale-[0.99] shadow-sm'
                                    }`}
                            >
                                {startingDay ? 'Confirming...' :
                                    isConfirmedToday()
                                        ? "Availability Confirmed"
                                        : "Confirm Availability"
                                }
                            </button>
                            <Link
                                to="/seller/add-product/manual"
                                className="bg-[#059669] hover:bg-[#047857] text-white px-4 h-[38px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm transform hover:-translate-y-0.5"
                            >
                                <FaPlus size={10} />
                                Add Product
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* Page Header for Legacy Mode */
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[#F3E8D3] pb-4 mb-5">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Inventory Management</h1>
                            <p className="text-xs text-slate-500 font-medium mt-1">Manage your products and stock levels</p>
                        </div>
                        <div className="flex items-center gap-3 mt-3 md:mt-0">
                            {shopTypeKey === 'GROCERY_KIRANA' && (
                                <button
                                    onClick={handleStartToday}
                                    disabled={
                                        startingDay ||
                                        user?.shopDetails?.operatingMode === 'RUSH' ||
                                        (user?.shopDetails?.lastOpeningStockSetAt && new Date(user.shopDetails.lastOpeningStockSetAt).toDateString() === new Date().toDateString())
                                    }
                                    className={`px-4 h-[38px] text-xs rounded-xl font-bold transition-all border 
                                        ${(user?.shopDetails?.lastOpeningStockSetAt && new Date(user.shopDetails.lastOpeningStockSetAt).toDateString() === new Date().toDateString())
                                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                            : user?.shopDetails?.operatingMode === 'RUSH'
                                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                                : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300'
                                        }`}
                                >
                                    {startingDay ? 'Processing...' :
                                        (user?.shopDetails?.lastOpeningStockSetAt && new Date(user.shopDetails.lastOpeningStockSetAt).toDateString() === new Date().toDateString())
                                            ? "Today's Stock Confirmed"
                                            : "Start Today"
                                    }
                                </button>
                            )}
                            <Link
                                to="/seller/add-product/manual"
                                className="bg-[#059669] hover:bg-[#047857] text-white px-4 h-[38px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:shadow-emerald-200 transition-all transform hover:-translate-y-0.5"
                            >
                                <FaPlus size={10} />
                                Add Product
                            </Link>
                        </div>
                    </div>
                )}

                {/* Legacy Stats cards */}
                {!isAvailabilityMode && (
                    <InventoryStats metrics={metrics} loading={metricsLoading} />
                )}

                {/* Category Chips (Single line scroll, height 38px, no title) */}
                {isAvailabilityMode && (
                    <div className="flex gap-2 overflow-x-auto pb-3 mb-4 select-none scrollbar-thin border-b border-[#F3E8D3]">
                        <button
                            onClick={() => setActiveCategory('All')}
                            className={`px-4 h-[38px] text-[13px] font-bold rounded-xl transition-all border whitespace-nowrap cursor-pointer flex items-center justify-center
                                ${activeCategory === 'All'
                                    ? 'bg-[#433422] text-white border-[#433422]'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-350 hover:bg-slate-50'
                                }`}
                        >
                            All ({products.length})
                        </button>
                        {allowedCategories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 h-[38px] text-[13px] font-bold rounded-xl transition-all border whitespace-nowrap cursor-pointer flex items-center justify-center
                                    ${activeCategory === cat
                                        ? 'bg-[#433422] text-white border-[#433422]'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-350 hover:bg-slate-50'
                                    }`}
                            >
                                {cat} ({categoryCounts[cat] || 0})
                            </button>
                        ))}
                    </div>
                )}

                {/* Toolbar Section: Search and Filter Tabs */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                    {/* Status Tabs (Availability Mode Only) */}
                    {isAvailabilityMode ? (
                        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                            {[
                                { id: 'ALL', label: `All (${products.length})` },
                                { id: 'AVAILABLE', label: `Available (${metrics?.availableCount || 0})` },
                                { id: 'UNAVAILABLE', label: `Unavailable (${metrics?.unavailableCount || 0})` }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setStatusFilter(tab.id)}
                                    className={`px-4 py-2 text-[13px] font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                                        statusFilter === tab.id
                                            ? 'border-[#433422] text-[#433422]'
                                            : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    ) : (
                        /* Category dropdown for legacy mode */
                        <div className="relative w-full max-w-xs">
                            <select
                                value={activeCategory}
                                onChange={(e) => setActiveCategory(e.target.value)}
                                className="w-full pl-4 pr-10 h-[38px] bg-white border border-[#F3E8D3] rounded-xl text-[#433422] font-semibold text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#433422]/10 shadow-sm cursor-pointer"
                            >
                                <option value="All">All Categories</option>
                                {allowedCategories.map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat} ({categoryCounts[cat] || 0})
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#92817A]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    )}

                    {/* Search / Bulk actions area */}
                    <div className="flex items-center gap-3 flex-1 max-w-md md:ml-auto">
                        {selectedProductIds.size > 0 ? (
                            <div className="w-full flex items-center gap-2 bg-emerald-50/50 p-1 rounded-xl border border-emerald-100 min-h-[38px] text-[13px] flex-1">
                                <span className="text-emerald-800 font-extrabold ml-2">{selectedProductIds.size} Selected</span>
                                
                                {isAvailabilityMode && (
                                    <>
                                        <button
                                            onClick={() => handleBulkStatusUpdate('AVAILABLE')}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 h-[28px] rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                        >
                                            Mark Available
                                        </button>
                                        <button
                                            onClick={() => handleBulkStatusUpdate('UNAVAILABLE')}
                                            className="bg-rose-600 hover:bg-rose-700 text-white px-3 h-[28px] rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                        >
                                            Mark Unavailable
                                        </button>
                                    </>
                                )}

                                <button
                                    onClick={handleBulkDelete}
                                    className="bg-red-600 hover:bg-[#DC2626] text-white px-3 h-[28px] rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                    <FaTrash size={8} />
                                    Delete
                                </button>
                                <button
                                    onClick={() => setSelectedProductIds(new Set())}
                                    className="text-slate-500 hover:text-slate-700 font-bold underline cursor-pointer ml-auto mr-2"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div className="w-full relative">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#92817A] text-xs" />
                                <input
                                    type="text"
                                    placeholder={isAvailabilityMode ? "Search products..." : "Search by name or SKU..."}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 h-[38px] bg-white border border-[#E7E5E4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#433422]/20 focus:border-[#433422] transition-all text-[#433422] placeholder-[#92817A] text-[13px]"
                                />
                            </div>
                        )}

                        {/* View Mode selection icons for legacy mode */}
                        {!isAvailabilityMode && (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-colors cursor-pointer ${viewMode === 'list'
                                        ? 'bg-[#433422] text-white shadow-sm'
                                        : 'bg-[#FAFAF9] text-[#92817A] hover:bg-[#F5F5F4] border border-[#E7E5E4]'
                                        }`}
                                    title="List View"
                                >
                                    <FaList size={14} />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid'
                                        ? 'bg-[#433422] text-white shadow-sm'
                                        : 'bg-[#FAFAF9] text-[#92817A] hover:bg-[#F5F5F4] border border-[#E7E5E4]'
                                        }`}
                                    title="Grid View"
                                >
                                    <FaTh size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Unified Products Board Layout or Legacy Table/Grid views */}
                {isAvailabilityMode ? (
                    <ProductsGrid
                        products={filteredProducts}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onAdjustStock={handleAdjustStock}
                        loading={loading}
                        isAvailabilityMode={isAvailabilityMode}
                        onToggleAvailability={handleToggleAvailability}
                    />
                ) : (
                    viewMode === 'list' ? (
                        <ProductsTable
                            products={filteredProducts}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onAdjustStock={handleAdjustStock}
                            onRestockDaily={handleRestockDaily}
                            onAddStock={handleAddStock}
                            loading={loading}
                            selectedProductIds={selectedProductIds}
                            onSelectionChange={handleSelectionChange}
                            onSelectAll={handleSelectAll}
                            isAvailabilityMode={isAvailabilityMode}
                            onToggleAvailability={handleToggleAvailability}
                        />
                    ) : (
                        <ProductsGrid
                            products={filteredProducts}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onAdjustStock={handleAdjustStock}
                            loading={loading}
                            isAvailabilityMode={isAvailabilityMode}
                            onToggleAvailability={handleToggleAvailability}
                        />
                    )
                )}

                <ProductEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    product={selectedProduct}
                    onSave={handleSaveProduct}
                    shopType={user?.shopDetails?.shopType}
                />

                {/* Custom Confirmation Modal */}
                {confirmState.isOpen && (
                    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
                        <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100/50 flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-200">
                            {/* Top accent line */}
                            <div className={`absolute top-0 left-0 w-full h-1.5 ${confirmState.isDanger ? 'bg-rose-500' : 'bg-[#ff7a00]'}`}></div>

                            <div className="flex items-start gap-4 mt-2">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${confirmState.isDanger ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-orange-50 text-orange-500 border border-orange-100'}`}>
                                    {confirmState.isDanger ? <FaTrash size={18} /> : <FaCheck size={18} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight leading-tight">{confirmState.title}</h3>
                                    <p className="text-slate-500 text-xs font-semibold mt-2 leading-relaxed">{confirmState.message}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-50">
                                <button
                                    onClick={confirmState.onCancel}
                                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
                                >
                                    {confirmState.cancelLabel}
                                </button>
                                <button
                                    onClick={confirmState.onConfirm}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md cursor-pointer ${confirmState.isDanger ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/10' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/10'}`}
                                >
                                    {confirmState.confirmLabel}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Custom Toast Notification */}
                {toast.isOpen && (
                    <div className="fixed bottom-6 right-6 z-[100000] animate-in fade-in slide-in-from-bottom-5 duration-300">
                        <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md bg-white/95 
                            ${toast.type === 'success' ? 'border-emerald-100 text-emerald-800' : 
                              toast.type === 'error' ? 'border-rose-100 text-rose-800' : 
                              'border-amber-100 text-amber-800'}`}>
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold
                                ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 
                                  toast.type === 'error' ? 'bg-rose-50 text-rose-600' : 
                                  'bg-amber-50 text-amber-600'}`}>
                                {toast.type === 'success' ? <FaCheck /> : <FaExclamationTriangle />}
                            </div>
                            <span className="text-xs font-extrabold leading-none">{toast.message}</span>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default SellerInventory;
