import React from 'react';
import { FaEdit, FaTrash, FaPlus, FaMinus, FaBox } from 'react-icons/fa';
import { CATEGORY_IMAGE_MAP, PRODUCT_IMAGE_MAP } from '../../utils/categoryImageMap';

const ProductsGrid = ({
    products,
    onEdit,
    onDelete,
    onAdjustStock,
    loading
}) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 h-80"></div>
                ))}
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
                <p className="text-[#92817A]">Add products to get started</p>
            </div>
        );
    }

    const universalFallback = "/assets/universal_fallback.png";

    // Helper to find generic image based on name keywords (Copied from Table logic)
    const getGenericProductImage = (name) => {
        if (!name) return null;
        const lowerName = name.toLowerCase();
        const keys = Object.keys(PRODUCT_IMAGE_MAP);
        for (const key of keys) {
            if (lowerName.includes(key.replace('_', ' '))) {
                return PRODUCT_IMAGE_MAP[key];
            }
        }
        if (lowerName.includes("atta") || lowerName.includes("flour")) return PRODUCT_IMAGE_MAP["wheat_flour"];
        if (lowerName.includes("sunflower") || lowerName.includes("oil")) return PRODUCT_IMAGE_MAP["cooking_oil"];
        if (lowerName.includes("basmati") || lowerName.includes("rice")) return PRODUCT_IMAGE_MAP["rice"];
        return null;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            {products.map((product) => {
                const categoryImage = CATEGORY_IMAGE_MAP[product.subCategory] || CATEGORY_IMAGE_MAP[product.category] || CATEGORY_IMAGE_MAP['Other'];
                const genericProductImage = getGenericProductImage(product.name);

                const productImage = (product.imageUrl && product.imageUrl.length > 10)
                    ? product.imageUrl
                    : (genericProductImage || categoryImage || universalFallback);

                // Stock Logic
                const isOutOfStock = product.quantity === 0;
                const isLowStock = product.quantity > 0 && product.quantity <= (product.initialStock ? Math.floor(product.initialStock / 2) : 10);

                return (
                    <div key={product._id} className="bg-white rounded-2xl border border-[#F3E8D3] shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow group">

                        {/* 1. Image Area */}
                        <div className="h-40 bg-slate-50 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                            <img
                                src={productImage}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = universalFallback; }}
                            />
                            {product.needsReview && (
                                <div className="absolute top-2 right-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
                                    Review
                                </div>
                            )}
                            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500 border border-slate-100">
                                {product.unit || 'Unit'}
                            </div>
                        </div>

                        {/* 2. Content */}
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="mb-4">
                                <h3 className="font-black text-slate-800 text-lg leading-tight mb-1 line-clamp-2" title={product.name}>
                                    {product.name}
                                </h3>
                                <p className="text-xs text-[#92817A] font-medium truncate">
                                    {product.subCategory || product.category}
                                </p>
                            </div>

                            <div className="flex items-end justify-between mb-6">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Price</p>
                                    <p className="text-xl font-black text-[#433422]">
                                        ₹{(product.sellingPrice || 0).toLocaleString('en-IN')}
                                    </p>
                                </div>

                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${isOutOfStock ? 'bg-red-50 border-red-100 text-red-700' : isLowStock ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                    <span className="text-[10px] font-bold uppercase">
                                        {isOutOfStock ? 'Out' : isLowStock ? 'Low' : 'In Stock'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-[#F3E8D3] flex items-center justify-between">
                                {/* Stock Control */}
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg overflow-hidden h-8">
                                        <button
                                            onClick={() => onAdjustStock(product._id, -1)}
                                            className="px-2.5 h-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center border-r border-[#E7E5E4]"
                                            disabled={product.quantity <= 0}
                                        >
                                            <FaMinus size={10} />
                                        </button>
                                        <span className={`px-3 text-sm font-bold min-w-[3rem] text-center ${isLowStock ? 'text-amber-600' : 'text-[#433422]'}`}>
                                            {product.quantity || 0}
                                        </span>
                                        <button
                                            onClick={() => onAdjustStock(product._id, 1)}
                                            className="px-2.5 h-full hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 transition-colors flex items-center justify-center border-l border-[#E7E5E4]"
                                        >
                                            <FaPlus size={10} />
                                        </button>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => onEdit(product)}
                                        className="p-2 text-slate-400 hover:text-[#433422] hover:bg-slate-50 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <FaEdit size={16} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(product._id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <FaTrash size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ProductsGrid;
