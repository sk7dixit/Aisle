import React, { useState } from 'react';
import { FaTimes, FaInbox, FaSpinner, FaPaperPlane } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const RequestCatalogModal = ({ isOpen, onClose, initialName }) => {
    const { token } = useAuth();
    const [name, setName] = useState(initialName || '');
    const [brand, setBrand] = useState('');
    const [size, setSize] = useState('');
    const [category, setCategory] = useState('Grocery');
    const [image, setImage] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Product name is required.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                product_name: name,
                brand_name: brand,
                pack_size: size,
                category,
                image_url: image,
                notes
            };

            const { data } = await axios.post('/api/master/request', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Request submitted successfully!");
            onClose();
        } catch (err) {
            console.error("Failed to submit catalog request:", err);
            toast.error(err.response?.data?.message || "Failed to submit request.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-50 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-white">
                        <FaInbox className="text-amber-500" size={16} />
                        <h3 className="text-sm font-black uppercase tracking-wider">Request Catalog Addition</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-0"
                    >
                        <FaTimes size={14} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Product Name */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Product Name *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Amul Gold Premium Milk"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:text-white outline-none transition-all placeholder:text-slate-400"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Brand Name */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Brand Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Amul"
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:text-white outline-none transition-all placeholder:text-slate-400"
                            />
                        </div>

                        {/* Pack Size */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pack Size</label>
                            <input
                                type="text"
                                placeholder="e.g. 500ml or 1kg"
                                value={size}
                                onChange={(e) => setSize(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:text-white outline-none transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Category */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Category *</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:text-white outline-none transition-all"
                            >
                                <option value="Grocery">Grocery</option>
                                <option value="Dairy">Dairy</option>
                                <option value="Bakery">Bakery</option>
                                <option value="Vegetables">Vegetables</option>
                                <option value="Fruits">Fruits</option>
                                <option value="Pharma">Pharma</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Image URL */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Image URL</label>
                            <input
                                type="url"
                                placeholder="e.g. https://domain.com/photo.jpg"
                                value={image}
                                onChange={(e) => setImage(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:text-white outline-none transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Notes for Admin</label>
                        <textarea
                            rows={3}
                            placeholder="Add details about packaging type, pricing, or regional availability..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:text-white outline-none transition-all placeholder:text-slate-400 resize-none"
                        />
                    </div>

                    {/* Submit Area */}
                    <div className="flex gap-3 justify-end pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2.5 bg-slate-900 text-white hover:bg-amber-500 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-1.5 border-0"
                        >
                            {submitting ? (
                                <FaSpinner className="animate-spin text-white dark:text-slate-950" size={10} />
                            ) : (
                                <FaPaperPlane size={10} />
                            )}
                            Submit Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RequestCatalogModal;
