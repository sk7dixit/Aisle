import React, { useState, useEffect } from 'react';
import {
    FiX, FiAlertTriangle, FiCheckCircle, FiSlash, FiMessageSquare, FiPackage, FiClock, FiUser, FiFlag
} from 'react-icons/fi';
// import GlassCard from '../ui/GlassCard'; // Temporarily removed to rule out import issues

const ProductInspector = ({ product, onClose, onDisable, onFlag, onResolve, ...props }) => {
    const [note, setNote] = useState('');

    useEffect(() => {
        if (product) {
            setNote(''); // Reset note on new product
        }
    }, [product]);

    if (!product) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white/90 backdrop-blur-lg shadow-2xl border-l border-gray-200 z-[60] flex flex-col transform transition-transform duration-300 ease-out h-full">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Product Details</h2>
                    <p className="text-xs text-gray-500">ID: {product.id}</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                >
                    <FiX size={20} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

                {/* Product Header Info */}
                <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-xl bg-gray-100 shrink-0 overflow-hidden border border-gray-200 flex items-center justify-center">
                        {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <FiPackage size={32} className="text-gray-400" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            {product.status === 'Active' && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Active</span>}
                            {product.status === 'Flagged' && <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1"><FiAlertTriangle size={10} /> Flagged</span>}
                            {product.status === 'Disabled' && <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Disabled</span>}
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1">{product.name}</h3>
                        <p className="text-sm text-gray-500">{product.category}</p>
                    </div>
                </div>

                {/* Moderation Alert (If Flagged) */}
                {product.status === 'Flagged' && (
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                        <h4 className="font-bold text-orange-800 text-sm mb-1 flex items-center gap-2">
                            <FiAlertTriangle /> Moderation Alert
                        </h4>
                        <p className="text-xs text-orange-700 mb-2">
                            This product was flagged: <strong>{product.flagReason || 'Potential policy violation'}</strong>
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onDisable(product.id, 'Confirmed Violation')}
                                className="px-3 py-1.5 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
                            >
                                Disable Product
                            </button>
                        </div>
                    </div>
                )}

                {/* Details Grid - Using standard div for stability */}
                <div className="bg-white/50 border border-gray-100 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
                        <div className="p-4">
                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Price</label>
                            <p className="font-semibold text-gray-800">${product.price}</p>
                        </div>
                        <div className="p-4">
                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Stock</label>
                            <p className={`font-semibold ${product.stock > 0 ? 'text-gray-800' : 'text-red-500'}`}>
                                {product.stock > 0 ? `${product.stock} units` : 'Out of Stock'}
                            </p>
                        </div>
                    </div>
                    <div className="p-4 border-b border-gray-100">
                        <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Seller</label>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                                <FiUser />
                            </div>
                            <p className="font-medium text-blue-600 hover:underline cursor-pointer">{product.sellerName}</p>
                            {product.sellerVerified && <FiCheckCircle className="text-blue-500 text-xs" />}
                        </div>
                    </div>
                    <div className="p-4">
                        <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Last Updated</label>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                            <FiClock size={12} /> {product.lastUpdated}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <h4 className="font-bold text-gray-800 text-sm mb-2">Description</h4>
                    <p className="text-sm text-gray-600 leading-relaxed bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                        {product.description || 'No description provided.'}
                    </p>
                </div>

                {/* Admin Internal Notes */}
                <div>
                    <h4 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2">
                        <FiMessageSquare className="text-blue-500" /> Internal Notes
                    </h4>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Add a note..."
                        className="w-full text-sm p-3 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-blue-500 min-h-[80px]"
                    />
                </div>

            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
                {onDisable && !props.readOnly ? (
                    // Moderator Check - Can be refined if role is passed to props or checked from localStorage
                    <div className="grid grid-cols-2 gap-3">
                        {product.status !== 'Disabled' ? (
                            <button
                                onClick={() => onDisable(product.id)}
                                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors"
                            >
                                <FiSlash /> Disable
                            </button>
                        ) : (
                            <button
                                onClick={() => onResolve(product.id)}
                                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-green-200 text-green-600 font-bold hover:bg-green-50 transition-colors"
                            >
                                <FiCheckCircle /> Enable
                            </button>
                        )}

                        {product.status !== 'Flagged' && (
                            <button
                                onClick={() => onFlag(product.id)}
                                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-orange-200 text-orange-600 font-bold hover:bg-orange-50 transition-colors"
                            >
                                <FiFlag /> Flag
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-center">
                        <p className="text-sm text-gray-500 font-medium">Read-Only Mode</p>
                        <p className="text-xs text-gray-400 mt-1">Actions are controlled from the main directory.</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default ProductInspector;
