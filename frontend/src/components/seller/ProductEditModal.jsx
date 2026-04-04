import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaSave, FaExclamationTriangle, FaMagic } from 'react-icons/fa';
import { getCategoriesForShopType } from '../../utils/shopTypeConfig';

const ProductEditModal = ({ isOpen, onClose, product, onSave, shopType }) => {
    const [formData, setFormData] = useState({
        name: '',
        subCategory: '',
        unit: '',
        sellingPrice: 0,
        mrp: 0,
        quantity: 0,
        restockType: 'MANUAL',
        lowStockThreshold: 0
    });
    const [saving, setSaving] = useState(false);

    const categories = getCategoriesForShopType(shopType || "GROCERY_KIRANA");

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                subCategory: product.subCategory || product.category || '',
                unit: product.unit || 'piece',
                sellingPrice: product.sellingPrice || 0,
                mrp: product.mrp || 0,
                quantity: product.quantity || 0,
                dailyCapacity: product.dailyCapacity || 0, // NEW
                restockType: product.restockType || 'MANUAL',
                lowStockThreshold: product.lowStockThreshold || Math.ceil((product.initialStock || product.quantity || 10) * 0.5)
            });
        }
    }, [product]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(product._id, formData);
            onClose();
        } catch (error) {
            console.error("Save failed", error);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100"
                >
                    {/* Header */}
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-[#FAFAF9]">
                        <div>
                            <h2 className="text-lg font-bold text-[#433422]">Edit Product</h2>
                            <p className="text-sm text-[#92817A]">Correct details for reality-based updates</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                            <FaTimes />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* LEFT COLUMN: Basic Info */}
                        <div className="space-y-4">
                            {/* 1. Product Name */}
                            <div>
                                <label className="block text-xs font-bold text-[#433422] uppercase tracking-wider mb-1.5">Product Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#433422]/10 focus:border-[#433422] outline-none transition-all text-[#433422]"
                                    placeholder="Enter product name"
                                    required
                                />
                            </div>

                            {/* 2. Category & Unit (Grouped) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#433422] uppercase tracking-wider mb-1.5">Category</label>
                                    <select
                                        value={formData.subCategory}
                                        onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#433422]/10 outline-none text-[#433422] appearance-none cursor-pointer"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#433422] uppercase tracking-wider mb-1.5">Unit</label>
                                    <select
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#433422]/10 outline-none text-[#433422] appearance-none cursor-pointer"
                                    >
                                        <option value="piece">piece</option>
                                        <option value="kg">kg</option>
                                        <option value="gm">gm</option>
                                        <option value="litre">litre</option>
                                        <option value="ml">ml</option>
                                        <option value="packet">packet</option>
                                        <option value="box">box</option>
                                    </select>
                                </div>
                            </div>

                            {/* 3. Price (Selling & MRP) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#433422] uppercase tracking-wider mb-1.5">Selling Price (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.sellingPrice}
                                        onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#433422]/10 outline-none text-[#433422]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#433422] uppercase tracking-wider mb-1.5">MRP (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.mrp}
                                        onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#433422]/10 outline-none text-[#433422]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Inventory Logic */}
                        <div className="space-y-4">
                            {/* 4. Inventory: Stock (Product) OR Capacity (Service) */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 h-fit">
                                {/* Heuristic: If it has dailyCapacity defined and > 0, treat as Service */}
                                {product.dailyCapacity !== undefined && product.dailyCapacity > 0 ? (
                                    <div>
                                        <label className="block text-xs font-bold text-[#433422] uppercase tracking-wider mb-1.5 flex justify-between">
                                            <span>Daily Service Capacity</span>
                                            <span className="text-emerald-600">Available: {product.dailyCapacity - (product.bookedCount || 0)}</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.dailyCapacity}
                                            onChange={(e) => setFormData({ ...formData, dailyCapacity: Number(e.target.value) })}
                                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/10 outline-none text-[#433422] font-bold text-lg"
                                            placeholder="Max slots per day"
                                        />
                                        <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                                            <FaMagic className="text-amber-500" />
                                            Auto-resets availability every morning.
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-xs font-bold text-[#433422] uppercase tracking-wider mb-1.5">Current Stock</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={formData.quantity}
                                                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#433422]/10 outline-none text-[#433422] font-bold text-lg"
                                            />
                                            {/* Baseline - moved here inline for better space usage */}
                                            <div className="w-1/3 opacity-60">
                                                <input
                                                    type="number"
                                                    value={product.initialStock || product.quantity || 0}
                                                    disabled
                                                    className="w-full px-3 py-2.5 bg-slate-200 border border-slate-200 rounded-xl text-slate-500 text-sm cursor-not-allowed text-center"
                                                    title="Baseline Stock"
                                                />
                                            </div>
                                        </div>

                                        {/* Step 6: Grocery Inventory Type Selector */}
                                        {shopType === 'GROCERY_KIRANA' && (
                                            <div className="bg-stone-50 p-4 rounded-2xl mt-4 border border-stone-100">
                                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">
                                                    Inventory Handling
                                                </label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {[
                                                        { id: 'COUNTABLE', label: 'Packaged', desc: 'Exact Count (Biscuits, Oil)' },
                                                        { id: 'LOOSE', label: 'Loose', desc: 'Approximate (Atta, Rice)' },
                                                        { id: 'DAILY', label: 'Fresh Daily', desc: 'Resets Daily (Milk, Veg)' }
                                                    ].map((type) => (
                                                        <div
                                                            key={type.id}
                                                            onClick={() => setFormData({ ...formData, inventoryType: type.id })}
                                                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.inventoryType === type.id ? 'border-orange-500 bg-white shadow-sm' : 'border-stone-200 bg-stone-100/50 hover:bg-stone-100'}`}
                                                        >
                                                            <div className="flex flex-col items-center text-center gap-1">
                                                                <div className={`w-3 h-3 rounded-full border-2 ${formData.inventoryType === type.id ? 'border-orange-500 bg-orange-500' : 'border-stone-400'}`}></div>
                                                                <span className={`text-xs font-bold ${formData.inventoryType === type.id ? 'text-stone-900' : 'text-stone-500'}`}>{type.label}</span>
                                                                <span className="text-[9px] text-stone-400 font-medium leading-tight">{type.desc}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* AI Suggestion (Grocery Only) */}
                                        {shopType === 'GROCERY_KIRANA' && formData.restockType === 'DAILY' && formData.quantity === 0 && (
                                            <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-start gap-2.5 animate-fade-in">
                                                <div className="bg-indigo-100 p-1.5 rounded-full text-indigo-600 mt-0.5">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-indigo-900">Smart Suggestion</p>
                                                    <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
                                                        Demand spikes on Mondays. Increase to <strong>15</strong>?
                                                    </p>
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, quantity: 15 })}
                                                            className="text-[10px] font-bold bg-white border border-indigo-200 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                                                        >
                                                            Apply
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* 5. Restock Type (Grocery Only) */}
                            {shopType === 'GROCERY_KIRANA' && (
                                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
                                    <label className="block text-xs font-bold text-[#433422] uppercase tracking-wider mb-2">Restock Logic</label>
                                    <div className="flex flex-col gap-2">
                                        <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer border border-transparent hover:border-emerald-100">
                                            <input
                                                type="radio"
                                                name="restockType"
                                                value="DAILY"
                                                checked={formData.restockType === 'DAILY'}
                                                onChange={(e) => setFormData({ ...formData, restockType: e.target.value })}
                                                className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 ring-offset-0"
                                            />
                                            <div>
                                                <span className="text-sm font-bold text-[#433422] block">Daily Essential</span>
                                                <span className="text-xs text-[#92817A] block leading-tight">Auto-resets to baseline every morning.</span>
                                            </div>
                                        </label>

                                        <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer border border-transparent hover:border-emerald-100">
                                            <input
                                                type="radio"
                                                name="restockType"
                                                value="PERIODIC"
                                                checked={formData.restockType === 'PERIODIC'}
                                                onChange={(e) => setFormData({ ...formData, restockType: e.target.value })}
                                                className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 ring-offset-0"
                                            />
                                            <div>
                                                <span className="text-sm font-bold text-[#433422] block">Periodic / Shelf</span>
                                                <span className="text-xs text-[#92817A] block leading-tight">Manual refill when empty (Rice, Oil).</span>
                                            </div>
                                        </label>

                                        <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer border border-transparent hover:border-emerald-100">
                                            <input
                                                type="radio"
                                                name="restockType"
                                                value="MANUAL"
                                                checked={formData.restockType === 'MANUAL'}
                                                onChange={(e) => setFormData({ ...formData, restockType: e.target.value })}
                                                className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 ring-offset-0"
                                            />
                                            <div>
                                                <span className="text-sm font-bold text-[#433422] block">Manual / Special</span>
                                                <span className="text-xs text-[#92817A] block leading-tight">Full manual control.</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer - Full Width */}
                        <div className="col-span-1 md:col-span-2 pt-2 flex gap-3 border-t border-slate-100 mt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-2 bg-[#433422] hover:bg-[#2D2317] text-white px-8 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-slate-200 transition-all disabled:opacity-50 text-sm"
                            >
                                {saving ? 'Saving...' : <><FaSave /> Save Changes</>}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default ProductEditModal;
