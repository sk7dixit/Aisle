import React, { useState } from 'react';
import { FaEdit, FaTrash, FaPlus, FaMinus, FaBox } from 'react-icons/fa';
import StockStatusBadge from './StockStatusBadge';
import StockLevelBar from './StockLevelBar';
import { CATEGORY_IMAGE_MAP, PRODUCT_IMAGE_MAP } from '../../utils/categoryImageMap';

const ProductsTable = ({
    products,
    onEdit,
    onDelete,
    onAdjustStock,
    onRestockDaily, // NEW
    onAddStock,     // NEW
    loading,
    selectedProductIds = new Set(),
    onSelectionChange = () => { },
    onSelectAll = () => { }
}) => {
    const [addStockValues, setAddStockValues] = useState({}); // { id: "10" }
    const [addStockMode, setAddStockMode] = useState({});     // { id: true }
    const [updateBaselineMap, setUpdateBaselineMap] = useState({}); // { id: true }

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-slate-600 mt-4">Loading products...</p>
                </div>
            </div>
        );
    }

    if (!products || products.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-[#F3E8D3] p-12 flex flex-col items-center justify-center text-center h-80">
                <div className="w-20 h-20 bg-[#FFFBEB] rounded-full flex items-center justify-center mb-4">
                    <FaBox className="text-[#D6D3D1]" size={32} />
                </div>
                <h3 className="text-lg font-bold text-[#433422]">No products found</h3>
                <p className="text-[#92817A]">Add products to get started with your inventory</p>
            </div>
        );
    }

    const toggleAddStockMode = (id) => {
        setAddStockMode(prev => ({ ...prev, [id]: !prev[id] }));
        if (!addStockMode[id]) {
            setAddStockValues(prev => ({ ...prev, [id]: '' }));
            setUpdateBaselineMap(prev => ({ ...prev, [id]: false }));
        }
    };

    const submitAddStock = (id) => {
        const val = parseInt(addStockValues[id]);
        if (val > 0) {
            onAddStock(id, val, updateBaselineMap[id]);
            toggleAddStockMode(id);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-[#F3E8D3] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead className="bg-[#FAFAF9] border-b border-[#F3E8D3]">
                        <tr>
                            <th className="px-3 py-2 text-left w-10">
                                <input
                                    type="checkbox"
                                    onChange={onSelectAll}
                                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                />
                            </th>
                            <th className="px-3 py-2 text-left text-[12px] font-bold text-[#433422] uppercase tracking-wider">
                                Product
                            </th>
                            <th className="px-3 py-2 text-left text-[12px] font-bold text-[#433422] uppercase tracking-wider">
                                Category
                            </th>
                            <th className="px-3 py-2 text-left text-[12px] font-bold text-[#433422] uppercase tracking-wider">
                                Price
                            </th>
                            <th className="px-3 py-2 text-left text-[12px] font-bold text-[#433422] uppercase tracking-wider">
                                Unit
                            </th>
                            <th className="px-3 py-2 text-left text-[12px] font-bold text-[#433422] uppercase tracking-wider">
                                Stock
                            </th>
                            <th className="px-3 py-2 text-left text-[12px] font-bold text-[#433422] uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-3 py-2 text-center text-[12px] font-bold text-[#433422] uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3E8D3]">
                        {products.map((product) => {
                            const universalFallback = "/assets/universal_fallback.png";
                            const categoryImage = CATEGORY_IMAGE_MAP[product.subCategory] || CATEGORY_IMAGE_MAP[product.category] || CATEGORY_IMAGE_MAP['Other'];

                            // Helper to find generic image based on name keywords
                            const getGenericProductImage = (name) => {
                                if (!name) return null;
                                const lowerName = name.toLowerCase();
                                const keys = Object.keys(PRODUCT_IMAGE_MAP);
                                for (const key of keys) {
                                    // simple keyword match: "salt" in "Tata Salt" -> match
                                    if (lowerName.includes(key.replace('_', ' '))) {
                                        return PRODUCT_IMAGE_MAP[key];
                                    }
                                }
                                // Fallback mapping for common terms not in map directly
                                if (lowerName.includes("atta") || lowerName.includes("flour")) return PRODUCT_IMAGE_MAP["wheat_flour"];
                                if (lowerName.includes("sunflower") || lowerName.includes("oil")) return PRODUCT_IMAGE_MAP["cooking_oil"];
                                if (lowerName.includes("basmati") || lowerName.includes("rice")) return PRODUCT_IMAGE_MAP["rice"];

                                return null;
                            };

                            const genericProductImage = getGenericProductImage(product.name);

                            // Image Logic Priority: 
                            // 1. User Uploaded (if valid > 10 chars)
                            // 2. Keyword Match from Name (Generic Product Image)
                            // 3. Category Fallback
                            // 4. Universal Fallback
                            const productImage = (product.imageUrl && product.imageUrl.length > 10)
                                ? product.imageUrl
                                : (genericProductImage || categoryImage || universalFallback);

                            // Strict Low Stock Logic
                            const initial = product.initialStock || product.quantity || 0;
                            const threshold = Math.floor(initial / 2);
                            const isLowStock = product.quantity > 0 && product.quantity <= threshold;
                            const isOutOfStock = product.quantity === 0;

                            // RESTOCK UX LOGIC
                            const isDaily = product.restockType === 'DAILY';
                            const isPeriodic = product.restockType === 'PERIODIC';
                            const showRestockAction = isOutOfStock && (isDaily || isPeriodic);

                            return (
                                <tr key={product._id} className={`transition-colors h-[48px] ${selectedProductIds.has(product._id) ? 'bg-emerald-50 hover:bg-emerald-100' : 'hover:bg-[#FFFBEB]/50'}`}>
                                    {/* Checkbox */}
                                    <td className="px-3 py-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedProductIds.has(product._id)}
                                            onChange={() => onSelectionChange(product._id)}
                                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                        />
                                    </td>

                                    {/* Product */}
                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <img
                                                    src={productImage}
                                                    alt={product.name}
                                                    className="w-9 h-9 rounded-md object-cover border border-[#F3E8D3]"
                                                    onError={(e) => { e.target.src = universalFallback; }}
                                                />
                                                {product.needsReview && (
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white" title="Needs Category Review" />
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[#433422] text-[13px] leading-tight">{product.name}</span>
                                                {product.needsReview && (
                                                    <span className="text-[10px] text-amber-600 font-bold uppercase tracking-tighter">Review Req.</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Category */}
                                    <td className="px-3 py-2">
                                        <span className={`text-[13px] ${product.needsReview ? 'text-amber-600 font-medium' : 'text-[#92817A]'}`}>
                                            {product.subCategory || product.category}
                                        </span>
                                    </td>

                                    {/* Price */}
                                    <td className="px-3 py-2">
                                        <span className="text-[#433422] font-bold text-[13px]">
                                            ₹{(product.sellingPrice || 0).toLocaleString('en-IN')}
                                        </span>
                                    </td>

                                    {/* Unit */}
                                    <td className="px-3 py-2">
                                        <span className="text-[#92817A] text-[13px]">{product.unit || 'piece'}</span>
                                    </td>

                                    {/* Stock (The Main UX Change) */}
                                    <td className="px-3 py-2 w-48">
                                        {showRestockAction ? (
                                            isDaily ? (
                                                <button
                                                    onClick={() => onRestockDaily(product._id)}
                                                    className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors border border-emerald-200"
                                                >
                                                    <FaPlus className="text-emerald-600" size={10} />
                                                    Restock Today
                                                </button>
                                            ) : (
                                                /* Periodic: Inline Input */
                                                addStockMode[product._id] ? (
                                                    <div className="flex flex-col gap-1 min-w-[140px] animate-fade-in-up">
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="number"
                                                                value={addStockValues[product._id] || ''}
                                                                onChange={(e) => setAddStockValues(prev => ({ ...prev, [product._id]: e.target.value }))}
                                                                placeholder="Qty"
                                                                className="w-16 h-7 text-xs border border-emerald-300 rounded px-1 focus:outline-none focus:border-emerald-500"
                                                                autoFocus
                                                            />
                                                            <button
                                                                onClick={() => submitAddStock(product._id)}
                                                                className="bg-emerald-600 text-white h-7 px-2 rounded text-xs font-bold hover:bg-emerald-700"
                                                            >
                                                                Add
                                                            </button>
                                                            <button
                                                                onClick={() => toggleAddStockMode(product._id)}
                                                                className="text-slate-400 hover:text-slate-600"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={updateBaselineMap[product._id] || false}
                                                                onChange={(e) => setUpdateBaselineMap(prev => ({ ...prev, [product._id]: e.target.checked }))}
                                                                className="w-3 h-3 text-emerald-600 rounded border-gray-300"
                                                            />
                                                            <span className="text-[10px] text-slate-500">Set as full level</span>
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => toggleAddStockMode(product._id)}
                                                        className="w-full bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors border border-amber-200"
                                                    >
                                                        <FaPlus className="text-amber-600" size={10} />
                                                        Add Stock
                                                    </button>
                                                )
                                            )
                                        ) : (
                                            /* Normal State (+/-) */
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[13px] font-semibold ${isLowStock ? 'text-amber-600' : 'text-[#433422]'}`}>
                                                    {product.quantity || 0}
                                                </span>
                                                <div className="flex items-center bg-[#FAFAF9] border border-[#F3E8D3] rounded-lg overflow-hidden h-7">
                                                    <button
                                                        onClick={() => onAdjustStock(product._id, -1)}
                                                        className="px-2 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors h-full flex items-center"
                                                        disabled={product.quantity <= 0}
                                                    >
                                                        <FaMinus size={10} />
                                                    </button>
                                                    <div className="w-[1px] bg-[#F3E8D3] h-4" />
                                                    <button
                                                        onClick={() => onAdjustStock(product._id, 1)}
                                                        className="px-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 transition-colors h-full flex items-center"
                                                    >
                                                        <FaPlus size={10} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </td>

                                    {/* Status Column */}
                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-1.5 lead-tight">
                                            <div className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-red-500' :
                                                isLowStock ? 'bg-amber-500' :
                                                    'bg-emerald-500'
                                                }`} />
                                            <span className="text-[12px] font-medium text-[#57534E]">
                                                {isOutOfStock ? 'Out of Stock' :
                                                    isLowStock ? 'Limited' :
                                                        'In Stock'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-3 py-2">
                                        <div className="flex justify-center gap-1">
                                            <button
                                                onClick={() => onEdit(product)}
                                                className="p-1.5 text-[#92817A] hover:text-[#433422] hover:bg-white rounded-md transition-all"
                                                title="Edit"
                                            >
                                                <FaEdit size={14} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(product._id)}
                                                className="p-1.5 text-[#92817A] hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                                                title="Delete"
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProductsTable;

