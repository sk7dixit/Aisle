import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaSearch, FaPlus, FaList, FaTh, FaCamera, FaTrash } from 'react-icons/fa';
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

    // Shop Type & Categories
    const shopTypeKey = user?.shopDetails?.shopType || "GROCERY_KIRANA";
    const allowedCategories = SHOP_TYPE_CONFIG[shopTypeKey]?.categories || SHOP_TYPE_CONFIG["GROCERY_KIRANA"].categories;
    const [activeCategory, setActiveCategory] = useState("All");

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
            const res = await fetch(`/api/seller/inventory/metrics`, {
                headers: { 'Authorization': `Bearer ${token}` }
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
            const res = await fetch(`/api/seller/inventory/category-counts`, {
                headers: { 'Authorization': `Bearer ${token}` }
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
                `/api/seller/inventory/products?category=${encodeURIComponent(activeCategory)}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
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

        if (!window.confirm(`Are you sure you want to delete ${count} selected products? This cannot be undone.`)) return;

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
                alert("Products deleted successfully");
            } else {
                const data = await res.json();
                alert(data.message || "Failed to delete products");
            }
        } catch (error) {
            console.error("Bulk delete failed", error);
            alert("Network error during deletion");
        }
    };

    const handleDelete = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

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
                alert("Restocked successfully");
            } else {
                alert("Failed to restock");
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
                alert("Stock added successfully");
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

    // Start Today Handler (Step 2)
    const handleStartToday = async () => {
        if (!window.confirm("Confirm today's stock baseline? This assumes current quantities are correct.")) return;

        setStartingDay(true);
        try {
            const res = await fetch(`/api/seller/inventory/start-day`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();

            if (res.ok) {
                alert("Today's stock confirmed!");
                await checkUserStatus(); // Refresh user state (lastOpeningStockSetAt)
                fetchProducts(); // Refresh products
            } else {
                alert(data.message || "Failed to start day");
            }
        } catch (error) {
            console.error("Start day failed", error);
            alert("Network error");
        } finally {
            setStartingDay(false);
        }
    };

    // Filter products by search term
    const filteredProducts = products.filter(product => {
        const searchLower = searchTerm.toLowerCase();
        return (
            product.name?.toLowerCase().includes(searchLower) ||
            product.sku?.toLowerCase().includes(searchLower) ||
            product.description?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="min-h-screen">
            <div className="max-w-[1920px] mx-auto">

                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Inventory Management</h1>
                            <p className="text-sm text-slate-500 font-medium mt-1">Manage your products and stock levels</p>
                        </div>
                        <div className="flex items-start gap-4">
                            {/* Start Today Button (Step 2) */}
                            {shopTypeKey === 'GROCERY_KIRANA' && (
                                <div className="flex flex-col items-end">
                                    <button
                                        onClick={handleStartToday}
                                        disabled={
                                            startingDay ||
                                            user?.shopDetails?.operatingMode === 'RUSH' ||
                                            (user?.shopDetails?.lastOpeningStockSetAt && new Date(user.shopDetails.lastOpeningStockSetAt).toDateString() === new Date().toDateString())
                                        }
                                        className={`px-4 py-2.5 text-sm rounded-lg font-bold transition-all shadow-sm border 
                                            ${(user?.shopDetails?.lastOpeningStockSetAt && new Date(user.shopDetails.lastOpeningStockSetAt).toDateString() === new Date().toDateString())
                                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                                : user?.shopDetails?.operatingMode === 'RUSH'
                                                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' // Disabled in Rush
                                                    : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300'
                                            }`}
                                    >
                                        {startingDay ? 'Processing...' :
                                            (user?.shopDetails?.lastOpeningStockSetAt && new Date(user.shopDetails.lastOpeningStockSetAt).toDateString() === new Date().toDateString())
                                                ? "Today's Stock Confirmed"
                                                : "Start Today"
                                        }
                                    </button>
                                    {/* Helper Text */}
                                    {!user?.shopDetails?.lastOpeningStockSetAt || new Date(user.shopDetails.lastOpeningStockSetAt).toDateString() !== new Date().toDateString() ? (
                                        <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider text-center w-full">
                                            {user?.shopDetails?.operatingMode === 'RUSH' ? 'Disabled in Rush Mode' : 'Confirm Today\'s Availability'}
                                        </span>
                                    ) : null}
                                </div>
                            )}

                            <Link
                                to="/seller/add-product/manual"
                                className="bg-[#059669] hover:bg-[#047857] text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-100/50 hover:shadow-emerald-200/60 transition-all transform hover:-translate-y-0.5"
                            >
                                <FaPlus />
                                Add Product
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Metrics Cards */}
                <InventoryStats metrics={metrics} loading={metricsLoading} />

                {/* Category Filter Dropdown */}
                <div className="mb-6 flex items-center gap-4">
                    <div className="relative w-full max-w-xs">
                        <select
                            value={activeCategory}
                            onChange={(e) => setActiveCategory(e.target.value)}
                            className="w-full pl-4 pr-10 py-2.5 bg-white border border-[#F3E8D3] rounded-xl text-[#433422] font-semibold text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#433422]/10 shadow-sm cursor-pointer"
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
                </div>

                {/* Search + View Toggle Toolbar */}
                <div className="bg-white rounded-xl border border-[#F3E8D3] p-4 mb-6 flex items-center justify-between gap-4 shadow-sm">
                    {selectedProductIds.size > 0 ? (
                        <div className="flex-1 flex items-center gap-4 bg-red-50 p-2 rounded-lg border border-red-100 animate-fade-in">
                            <span className="text-red-700 font-bold ml-2">{selectedProductIds.size} Selected</span>
                            <button
                                onClick={handleBulkDelete}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <FaTrash size={14} />
                                Delete Selected
                            </button>
                            <button
                                onClick={() => setSelectedProductIds(new Set())}
                                className="text-slate-500 hover:text-slate-700 text-sm underline"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 max-w-md relative">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#92817A]" />
                            <input
                                type="text"
                                placeholder="Search by name or SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#433422]/20 focus:border-[#433422] transition-all text-[#433422] placeholder-[#92817A]"
                            />
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        {/* ... view buttons ... */}
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-lg transition-colors ${viewMode === 'list'
                                ? 'bg-[#433422] text-white shadow-sm'
                                : 'bg-[#FAFAF9] text-[#92817A] hover:bg-[#F5F5F4] border border-[#E7E5E4]'
                                }`}
                            title="List View"
                        >
                            <FaList size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 rounded-lg transition-colors ${viewMode === 'grid'
                                ? 'bg-[#433422] text-white shadow-sm'
                                : 'bg-[#FAFAF9] text-[#92817A] hover:bg-[#F5F5F4] border border-[#E7E5E4]'
                                }`}
                            title="Grid View"
                        >
                            <FaTh size={18} />
                        </button>
                    </div>
                </div>

                {/* Products View (List or Grid) */}
                {viewMode === 'list' ? (
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
                    />
                ) : (
                    <ProductsGrid
                        products={filteredProducts}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onAdjustStock={handleAdjustStock}
                        loading={loading}
                    />
                )}

                <ProductEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    product={selectedProduct}
                    onSave={handleSaveProduct}
                    shopType={user?.shopDetails?.shopType}
                />

            </div>
        </div>
    );
};

export default SellerInventory;
