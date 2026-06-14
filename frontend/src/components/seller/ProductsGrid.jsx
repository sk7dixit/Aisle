import React from 'react';
import { Link } from 'react-router-dom';
import { FaEdit, FaTrash, FaPlus, FaMinus, FaBox } from 'react-icons/fa';
import { CATEGORY_IMAGE_MAP, PRODUCT_IMAGE_MAP } from '../../utils/categoryImageMap';

const ProductsGrid = ({
    products,
    onEdit,
    onDelete,
    onAdjustStock,
    loading,
    isAvailabilityMode = false,
    onToggleAvailability = () => { }
}) => {
    const formatLastConfirmed = (timestamp) => {
        if (!timestamp) return 'Never';
        const date = new Date(timestamp);
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

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
            <div className="bg-white rounded-2xl border border-[#F3E8D3] p-8 flex flex-col items-center justify-center text-center max-w-[500px] mx-auto my-6 shadow-sm w-full">
                <span className="text-3xl mb-3">📦</span>
                <h3 className="text-base font-black text-[#433422] mb-1">
                    No Products Yet
                </h3>
                <p className="text-[13px] text-[#92817A] mb-4 leading-normal max-w-[280px]">
                    Add your first product to start accepting customer requests.
                </p>
                <Link
                    to="/seller/add-product/manual"
                    className="bg-[#433422] hover:bg-[#2D2317] text-white px-5 h-[38px] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                >
                    <FaPlus size={10} />
                    Add Product
                </Link>
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
                    <div
                        key={product._id}
                        className={`bg-white border border-[#F3E8D3] shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow group ${
                            isAvailabilityMode ? 'rounded-[24px]' : 'rounded-2xl'
                        }`}
                    >

                        {/* 1. Image Area */}
                        <div className="h-40 bg-slate-50 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500 flex items-center justify-center">
                            {!productImage || productImage === universalFallback || productImage.includes('photo-1542838132-92c53300491e') ? (
                                <div className="w-full h-full p-4 flex flex-col items-center justify-center bg-gradient-to-br from-amber-500/5 to-slate-100 text-slate-800 text-center font-bold">
                                    <span className="text-[7.5px] font-black uppercase tracking-[0.15em] text-amber-500 mb-1 leading-none">{product.brand || 'Product'}</span>
                                    <span className="text-[10px] font-black text-slate-700 line-clamp-3 leading-snug px-1">{product.name}</span>
                                </div>
                            ) : (
                                <img
                                    src={productImage}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.src = universalFallback; }}
                                />
                            )}
                            {product.needsReview && (
                                <div className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
                                    Review
                                </div>
                            )}
                            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500 border border-slate-100">
                                {product.unit || 'Unit'}
                            </div>

                            {/* Secondary Edit/Delete actions nested cleanly inside top-right of image area for availability mode */}
                            {isAvailabilityMode && (
                                <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onEdit(product);
                                        }}
                                        className="p-2 bg-white/95 hover:bg-white text-slate-700 hover:text-[#433422] rounded-full shadow-md transition-all border border-slate-150 cursor-pointer flex items-center justify-center"
                                        title="Edit"
                                    >
                                        <FaEdit size={12} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onDelete(product._id);
                                        }}
                                        className="p-2 bg-white/95 hover:bg-white text-rose-500 hover:text-rose-700 rounded-full shadow-md transition-all border border-slate-150 cursor-pointer flex items-center justify-center"
                                        title="Delete"
                                    >
                                        <FaTrash size={12} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 2. Content */}
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="mb-4">
                                <h3 className={`font-black text-slate-800 leading-tight mb-1 line-clamp-2 ${isAvailabilityMode ? 'text-lg sm:text-xl' : 'text-lg'}`} title={product.name}>
                                    {product.name}
                                </h3>
                                <p className="text-xs text-[#92817A] font-medium truncate">
                                    {product.subCategory || product.category}
                                </p>
                            </div>

                            <div className="flex items-end justify-between mb-4">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Price</p>
                                    <p className={`font-black text-[#433422] ${isAvailabilityMode ? 'text-2xl' : 'text-xl'}`}>
                                        ₹{(product.sellingPrice || 0).toLocaleString('en-IN')}
                                    </p>
                                    {isAvailabilityMode && product.quantity > 0 && (
                                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                            Internal Qty: {product.quantity}
                                        </p>
                                    )}
                                </div>

                                {isAvailabilityMode ? (
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase ${
                                        product.availability === 'AVAILABLE'
                                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                            : 'bg-rose-50 border-rose-100 text-rose-700'
                                    }`}>
                                        <span>{product.availability === 'AVAILABLE' ? '🟢 Available' : '🔴 Unavailable'}</span>
                                    </div>
                                ) : (
                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${isOutOfStock ? 'bg-red-50 border-red-100 text-red-700' : isLowStock ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                        <span className="text-[10px] font-bold uppercase">
                                            {isOutOfStock ? 'Out' : isLowStock ? 'Low' : 'In Stock'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {isAvailabilityMode && (
                                <div className="mt-1 mb-4 flex items-center justify-between text-xs text-slate-500 border-t border-[#F3E8D3] pt-3">
                                    <div>
                                        <span className="font-bold text-slate-400 uppercase text-[9px] block">Online Orders</span>
                                        <span className="font-extrabold text-slate-700">{product.onlineSalesCount || 0} orders</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-slate-400 uppercase text-[9px] block">Last Confirmed</span>
                                        <span className="font-semibold text-slate-600">{formatLastConfirmed(product.lastConfirmedAt)}</span>
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto pt-4 border-t border-[#F3E8D3]">
                                {isAvailabilityMode ? (
                                    <button
                                        onClick={() => onToggleAvailability(product._id, product.availability === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE')}
                                        className={`w-full h-[52px] text-sm font-black uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center cursor-pointer shadow-sm active:scale-[0.98] ${
                                            product.availability === 'AVAILABLE'
                                                ? 'bg-white text-stone-500 border border-stone-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                        }`}
                                    >
                                        {product.availability === 'AVAILABLE' ? 'Mark Unavailable' : 'Mark Available'}
                                    </button>
                                ) : (
                                    <div className="flex items-center justify-between w-full">
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
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ProductsGrid;
