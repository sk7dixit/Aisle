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
        availability: 'AVAILABLE',
        restockType: 'MANUAL',
        lowStockThreshold: 0,
        homeBusinessType: 'READY_STOCK',
        preparationTime: '1 Day',
        productStory: '',
        images: []
    });
    const [saving, setSaving] = useState(false);
    const [newFiles, setNewFiles] = useState([]);
    const [newPreviews, setNewPreviews] = useState([]);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const categories = getCategoriesForShopType(shopType || "GROCERY_KIRANA");
    const isHomeBusiness = shopType === 'HOME_BUSINESS' || shopType === 'Home Businesses';
    const isAvailabilityMode = shopType && !['HOME_BUSINESS', 'Home Businesses', 'SERVICES', 'Services', 'Service Provider'].includes(shopType);

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                subCategory: product.subCategory || product.category || '',
                unit: product.unit || 'piece',
                sellingPrice: product.sellingPrice || 0,
                mrp: product.mrp || 0,
                quantity: product.quantity || 0,
                availability: product.availability || 'AVAILABLE',
                dailyCapacity: product.dailyCapacity || 0, // NEW
                restockType: product.restockType || 'MANUAL',
                lowStockThreshold: product.lowStockThreshold || Math.ceil((product.initialStock || product.quantity || 10) * 0.5),
                homeBusinessType: product.homeBusinessType || 'READY_STOCK',
                preparationTime: product.preparationTime || '1 Day',
                productStory: product.productStory || '',
                images: product.images || []
            });
            setNewFiles([]);
            setNewPreviews([]);
            setShowAdvanced(false);
        }
    }, [product]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isHomeBusiness) {
                const data = new FormData();
                data.append('name', formData.name);
                data.append('sellingPrice', formData.sellingPrice);
                data.append('mrp', formData.sellingPrice);
                data.append('unit', formData.unit);
                data.append('homeBusinessType', formData.homeBusinessType);
                data.append('subCategory', formData.subCategory);
                
                if (formData.homeBusinessType === 'READY_STOCK') {
                    data.append('quantity', formData.quantity);
                } else {
                    data.append('quantity', 0);
                    data.append('preparationTime', formData.preparationTime);
                }
                data.append('productStory', formData.productStory);
                
                // Existing images
                data.append('images', JSON.stringify(formData.images));

                // Append new files
                newFiles.forEach(file => {
                    data.append('images', file);
                });

                await onSave(product._id, data);
            } else {
                await onSave(product._id, formData);
            }
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

                    <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto max-h-[70vh]">
                        {isHomeBusiness ? (
                            <>
                                {/* --- HOME BUSINESS EDIT FORM --- */}
                                {/* LEFT COLUMN: Basic Info */}
                                <div className="space-y-4">
                                    {/* 1. Product Name */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Product Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-800 font-bold"
                                            required
                                        />
                                    </div>

                                    {/* 2. Category & Unit (Grouped) */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Category</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.subCategory}
                                                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 outline-none text-slate-800 font-bold appearance-none cursor-pointer"
                                                >
                                                    {categories.map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Unit</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.unit}
                                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 outline-none text-slate-800 font-bold appearance-none cursor-pointer"
                                                >
                                                    {['Per Piece', 'Per Box', 'Per Kg', 'Per Gram', 'Per Packet', 'Per Bottle', 'Per Set', 'Custom'].map(u => (
                                                        <option key={u} value={u}>{u}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Price */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Selling Price (₹)</label>
                                        <input
                                            type="number"
                                            value={formData.sellingPrice}
                                            onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value), mrp: Number(e.target.value) })}
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 outline-none text-slate-800 font-bold"
                                        />
                                    </div>

                                    {/* 4. Product Story */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Product Story</label>
                                        <textarea
                                            rows="3"
                                            value={formData.productStory}
                                            onChange={(e) => setFormData({ ...formData, productStory: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 outline-none text-slate-600 font-medium text-xs resize-none"
                                            placeholder="Tell the story of how you made this creation..."
                                        />
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: Production Parameters */}
                                <div className="space-y-4">
                                    {/* 5. Production Type */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Production Type</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div
                                                onClick={() => setFormData({ ...formData, homeBusinessType: 'READY_STOCK' })}
                                                className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center flex flex-col items-center gap-1
                                                    ${formData.homeBusinessType === 'READY_STOCK'
                                                        ? 'border-indigo-600 bg-indigo-50/20 text-indigo-950 font-bold'
                                                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'
                                                    }`}
                                            >
                                                <span>📦</span>
                                                <span className="text-xs">Ready Stock</span>
                                            </div>
                                            <div
                                                onClick={() => setFormData({ ...formData, homeBusinessType: 'MADE_TO_ORDER' })}
                                                className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center flex flex-col items-center gap-1
                                                    ${formData.homeBusinessType === 'MADE_TO_ORDER'
                                                        ? 'border-indigo-600 bg-indigo-50/20 text-indigo-950 font-bold'
                                                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'
                                                    }`}
                                            >
                                                <span>🎂</span>
                                                <span className="text-xs">Made To Order</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 6. Quantity (Ready Stock) or Prep Time (Made To Order) */}
                                    {formData.homeBusinessType === 'READY_STOCK' ? (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Available Stock Quantity</label>
                                            <input
                                                type="number"
                                                value={formData.quantity}
                                                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 outline-none text-slate-800 font-bold text-lg"
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Preparation Time</label>
                                                <div className="relative">
                                                    <select
                                                        value={formData.preparationTime === '1 Day' || formData.preparationTime === '2 Days' || formData.preparationTime === '3 Days' || formData.preparationTime === '5 Days' ? formData.preparationTime : 'Custom'}
                                                        onChange={(e) => {
                                                            if (e.target.value === 'Custom') {
                                                                setFormData({ ...formData, preparationTime: 'Custom' });
                                                            } else {
                                                                setFormData({ ...formData, preparationTime: e.target.value });
                                                            }
                                                        }}
                                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 outline-none text-slate-800 font-bold appearance-none cursor-pointer"
                                                    >
                                                        {['1 Day', '2 Days', '3 Days', '5 Days', 'Custom'].map(t => (
                                                            <option key={t} value={t}>{t}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            {(formData.preparationTime === 'Custom' || (!['1 Day', '2 Days', '3 Days', '5 Days'].includes(formData.preparationTime))) && (
                                                <div className="animate-fade-in">
                                                    <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">Specify Custom Preparation Time</label>
                                                    <input
                                                        type="text"
                                                        value={formData.preparationTime === 'Custom' ? '' : formData.preparationTime}
                                                        onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 outline-none text-slate-800 font-bold"
                                                        placeholder="e.g. 2-3 Days, 1 Week"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 7. Image Gallery Management */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                                            Creation Gallery ({(formData.images?.length || 0) + newFiles.length}/4)
                                        </label>
                                        <div className="flex flex-wrap gap-3 items-center">
                                            {/* Existing Images */}
                                            {formData.images && formData.images.map((img, i) => (
                                                <div key={`exist-${i}`} className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden group">
                                                    <img
                                                        src={img.startsWith('data:') || img.startsWith('http') ? img : `${img.startsWith('/') ? '' : '/'}${img}`}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newImages = formData.images.filter((_, idx) => idx !== i);
                                                            setFormData({ ...formData, images: newImages });
                                                        }}
                                                        className="absolute inset-0 bg-rose-500/90 text-white flex items-center justify-center font-bold text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}

                                            {/* New Upload Previews */}
                                            {newPreviews.map((preview, i) => (
                                                <div key={`new-${i}`} className="relative w-16 h-16 rounded-xl border border-dashed border-indigo-300 overflow-hidden group">
                                                    <img
                                                        src={preview}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setNewFiles(newFiles.filter((_, idx) => idx !== i));
                                                            setNewPreviews(newPreviews.filter((_, idx) => idx !== i));
                                                        }}
                                                        className="absolute inset-0 bg-rose-500/90 text-white flex items-center justify-center font-bold text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}

                                            {/* Add Button if < 4 */}
                                            {((formData.images?.length || 0) + newFiles.length) < 4 && (
                                                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 flex items-center justify-center cursor-pointer transition-colors">
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                setNewFiles([...newFiles, file]);
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => {
                                                                    setNewPreviews([...newPreviews, reader.result]);
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                    />
                                                    <span className="text-slate-400 font-bold text-lg">+</span>
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* --- DEFAULT RETAIL EDIT FORM --- */}
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
                                    {isAvailabilityMode ? (
                                        <>
                                            {/* 1. Availability Toggle Group */}
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 h-fit">
                                                <label className="block text-xs font-bold text-[#433422] uppercase tracking-wider mb-2.5">
                                                    Available Today?
                                                </label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, availability: 'AVAILABLE' })}
                                                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center flex flex-col items-center gap-1
                                                            ${formData.availability === 'AVAILABLE'
                                                                ? 'border-emerald-600 bg-emerald-50/20 text-emerald-950 font-bold'
                                                                : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'
                                                            }`}
                                                    >
                                                        <span className="text-lg">✅</span>
                                                        <span className="text-xs font-bold">Yes, Available</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, availability: 'UNAVAILABLE' })}
                                                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center flex flex-col items-center gap-1
                                                            ${formData.availability === 'UNAVAILABLE'
                                                                ? 'border-rose-600 bg-rose-50/20 text-rose-950 font-bold'
                                                                : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'
                                                            }`}
                                                    >
                                                        <span className="text-lg">❌</span>
                                                        <span className="text-xs font-bold">No, Out of Stock</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Collapsible Advanced Settings for Quantity & Restock */}
                                            <div className="border border-slate-150 rounded-xl overflow-hidden">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between text-xs font-bold text-[#433422] border-b border-slate-100 cursor-pointer"
                                                >
                                                    <span>⚙️ ADVANCED STOCK SETTINGS (OPTIONAL)</span>
                                                    <span>{showAdvanced ? '▲' : '▼'}</span>
                                                </button>

                                                {showAdvanced && (
                                                    <div className="p-4 bg-white space-y-4 border-t border-slate-100">
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                                                Internal Stock Quantity
                                                            </label>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="number"
                                                                    value={formData.quantity}
                                                                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#433422]/10 outline-none text-[#433422] font-semibold text-sm"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Step 6: Grocery Inventory Type Selector */}
                                                        {shopType === 'GROCERY_KIRANA' && (
                                                            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                                                                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">
                                                                    Inventory Handling
                                                                </label>
                                                                <div className="grid grid-cols-3 gap-1.5">
                                                                    {[
                                                                        { id: 'COUNTABLE', label: 'Packaged', desc: 'Exact Count' },
                                                                        { id: 'LOOSE', label: 'Loose', desc: 'Approximate' },
                                                                        { id: 'DAILY', label: 'Fresh Daily', desc: 'Resets Daily' }
                                                                    ].map((type) => (
                                                                        <div
                                                                            key={type.id}
                                                                            onClick={() => setFormData({ ...formData, inventoryType: type.id })}
                                                                            className={`p-2 rounded-lg border cursor-pointer transition-all ${formData.inventoryType === type.id ? 'border-orange-500 bg-white shadow-sm font-bold text-orange-600' : 'border-stone-200 bg-stone-100/50 hover:bg-stone-100 text-stone-500'}`}
                                                                        >
                                                                            <div className="flex flex-col items-center text-center gap-0.5">
                                                                                <span className="text-[10px]">{type.label}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Restock Type (Grocery Only) */}
                                                        {shopType === 'GROCERY_KIRANA' && (
                                                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
                                                                <label className="block text-[10px] font-bold text-[#433422] uppercase tracking-wider mb-2">Restock Logic</label>
                                                                <div className="flex flex-col gap-1.5">
                                                                    <label className="flex items-start gap-2 cursor-pointer">
                                                                        <input
                                                                            type="radio"
                                                                            name="restockType"
                                                                            value="DAILY"
                                                                            checked={formData.restockType === 'DAILY'}
                                                                            onChange={(e) => setFormData({ ...formData, restockType: e.target.value })}
                                                                            className="mt-0.5 w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500"
                                                                        />
                                                                        <div>
                                                                            <span className="text-xs font-bold text-[#433422] block">Daily Essential</span>
                                                                            <span className="text-[10px] text-[#92817A] block leading-tight">Auto-resets every morning.</span>
                                                                        </div>
                                                                    </label>
                                                                    <label className="flex items-start gap-2 cursor-pointer">
                                                                        <input
                                                                            type="radio"
                                                                            name="restockType"
                                                                            value="PERIODIC"
                                                                            checked={formData.restockType === 'PERIODIC'}
                                                                            onChange={(e) => setFormData({ ...formData, restockType: e.target.value })}
                                                                            className="mt-0.5 w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500"
                                                                        />
                                                                        <div>
                                                                            <span className="text-xs font-bold text-[#433422] block">Periodic / Shelf</span>
                                                                            <span className="text-[10px] text-[#92817A] block leading-tight">Manual refill when empty.</span>
                                                                        </div>
                                                                    </label>
                                                                    <label className="flex items-start gap-2 cursor-pointer">
                                                                        <input
                                                                            type="radio"
                                                                            name="restockType"
                                                                            value="MANUAL"
                                                                            checked={formData.restockType === 'MANUAL'}
                                                                            onChange={(e) => setFormData({ ...formData, restockType: e.target.value })}
                                                                            className="mt-0.5 w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500"
                                                                        />
                                                                        <div>
                                                                            <span className="text-xs font-bold text-[#433422] block">Manual / Special</span>
                                                                            <span className="text-[10px] text-[#92817A] block leading-tight">Full manual control.</span>
                                                                        </div>
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
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
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 5. Restock Type (Grocery Only, Legacy Mode) */}
                                    {!isAvailabilityMode && shopType === 'GROCERY_KIRANA' && (
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
                            </>
                        )}

                        {/* Footer - Full Width */}
                        <div className="col-span-1 md:col-span-2 pt-2 flex gap-3 border-t border-slate-100 mt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className={`flex-1 px-4 border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all text-sm flex items-center justify-center ${
                                    isAvailabilityMode ? 'h-[52px] rounded-2xl text-base' : 'py-2.5 rounded-xl'
                                }`}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className={`flex-2 bg-[#433422] hover:bg-[#2D2317] text-white px-8 font-bold flex items-center justify-center gap-2 shadow-lg shadow-slate-200 transition-all disabled:opacity-50 text-sm flex items-center justify-center ${
                                    isAvailabilityMode ? 'h-[52px] rounded-2xl text-base' : 'py-2.5 rounded-xl'
                                }`}
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
