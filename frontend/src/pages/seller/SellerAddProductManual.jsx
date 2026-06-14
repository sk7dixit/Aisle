import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaBox, FaCamera, FaTag, FaRupeeSign, FaList, FaCheck, FaExclamationTriangle, FaChevronDown } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES, getCategoriesForShop } from '../../constants/categories';

const SellerAddProductManual = () => {
    const navigate = useNavigate();
    const { token, user, checkUserStatus } = useAuth();
    const subscription = user?.subscriptionStatus || { currentProductCount: 0, productLimit: 120 };
    const limitReached = subscription.productLimit !== null && subscription.currentProductCount >= subscription.productLimit;

    // Custom Category Add States (Only for Seasonal & Festive)
    const [isAddingCat, setIsAddingCat] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [submittingCat, setSubmittingCat] = useState(false);
    const [catError, setCatError] = useState('');

    // 1. Get User's Shop Type (Handle variations matching SellerProfile)
    const shopType = user?.shopDetails?.category || user?.shopDetails?.shopCategory || user?.shopDetails?.shopType || "Grocery / Kirana";
    const isAvailabilityMode = shopType && !['HOME_BUSINESS', 'Home Businesses', 'SERVICES', 'Services', 'Service Provider'].includes(shopType);
    const isFestiveShop = shopType && (shopType.toUpperCase().includes('SEASONAL') || shopType.toUpperCase().includes('FESTIVE'));

    // Helper to slugify custom category names
    const slugify = (text) => {
        return text
            .toString()
            .toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start
            .replace(/-+$/, '');            // Trim - from end
    };

    // 2. Filter Categories & Dynamic Custom Categories
    const customCategories = isFestiveShop ? (user?.shopDetails?.shopCategories || []) : [];
    const formattedCustomCats = customCategories.map(cat => ({
        id: slugify(cat),
        label: cat,
        icon: '🏷️',
        group: 'Custom Categories'
    }));

    const filteredCategories = [
        ...getCategoriesForShop(shopType),
        ...formattedCustomCats
    ];

    const handleAddCategorySubmit = async () => {
        if (!newCatName || newCatName.trim() === '') {
            setCatError('Category name required');
            return;
        }
        setSubmittingCat(true);
        setCatError('');
        try {
            const res = await fetch('/api/seller/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newCatName.trim() })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to add category');
            }
            await checkUserStatus(); // sync profile locally
            setIsAddingCat(false);
            setNewCatName('');
        } catch (err) {
            setCatError(err.message || 'Failed to add category');
        } finally {
            setSubmittingCat(false);
        }
    };

    // 3. Group Categories for Display
    const groupedCategories = filteredCategories.reduce((acc, cat) => {
        if (!acc[cat.group]) acc[cat.group] = [];
        acc[cat.group].push(cat);
        return acc;
    }, {});

    const [form, setForm] = useState({
        name: '',
        price: '',
        countInStock: '',
        unit: 'pc', // Default unit
        category: '', // This will now store categorySlug
        description: '',
        image: null
    });
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm({ ...form, image: file });
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (limitReached) {
            setError("Product limit reached. Upgrade your plan to add more products.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const isStockRequired = !isAvailabilityMode;
        if (!form.name || !form.price || (isStockRequired && !form.countInStock) || !form.category || !form.unit) {
            setError("Please fill all required fields.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('price', form.price);
        formData.append('sellingPrice', form.price);
        formData.append('mrp', form.price);
        
        const qty = form.countInStock ? Number(form.countInStock) : (isAvailabilityMode ? 50 : 0);
        formData.append('countInStock', qty);
        formData.append('quantity', qty);
        
        formData.append('unit', form.unit); // Unit is now mandatory

        // Category Logic (Updated for Global Architecture)
        // 1. Store the SLUG in 'categorySlug' (Schema requirement)
        formData.append('categorySlug', form.category);

        // 2. Store the LABEL in 'category' (Visual/Legacy)
        const selectedCat = filteredCategories.find(c => c.id === form.category);
        formData.append('category', selectedCat?.label || 'General');

        // 3. Keep 'subCategory' for legacy or extra detail if needed, or just allow free text
        // For now, we reuse the label or slug
        formData.append('subCategory', selectedCat?.group || 'General');

        // 4. Shop Type (Backend might infer from Seller, but sending explicitly is safe)
        const shopTypeIdentifier = shopType;
        formData.append('shopType', shopTypeIdentifier);

        // Description is optional
        if (form.description) formData.append('description', form.description);
        if (form.image) formData.append('image', form.image);

        try {
            const res = await fetch('/api/seller/products', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            // Handle non-JSON response gracefully to prevent "body stream already read" or parse errors
            let data;
            try {
                data = await res.json();
            } catch (parseError) {
                // If parsing fails (e.g. 404/500 text response), use text or default message
                data = { message: res.statusText || 'Server error occurred' };
            }

            if (!res.ok) throw new Error(data.message || 'Failed to create product');

            navigate('/seller/products');
        } catch (err) {
            setError(err.message);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* --- HEADER (Floating/Sticky) --- */}
            <div className="shrink-0 z-50 bg-[#FFFBEB]/90 backdrop-blur-md border-b border-[#F3E8D3] px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/seller/products" className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-all">
                            <FaArrowLeft size={14} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 tracking-tight">Add New Product</h1>
                            <p className="text-xs text-slate-500 font-medium">Manually add item to shelf <span className="text-slate-300 mx-1">|</span> <span className="text-emerald-600 font-bold">{shopType}</span></p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Usage Badge */}
                        <div className={`px-4 py-2 rounded-full text-xs font-bold border flex items-center gap-2 ${limitReached ? 'bg-red-50 text-red-600 border-red-100' : 'bg-white text-slate-600 border-slate-200'}`}>
                            <div className={`w-2 h-2 rounded-full ${limitReached ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                            {subscription.currentProductCount} / {subscription.productLimit === null ? '∞' : subscription.productLimit} Used
                        </div>

                        {/* Primary Action */}
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-[1.05] active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide"
                        >
                            {loading ? 'Adding...' : <><FaCheck className="text-xs" /> Add to Shelf</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT (Multi-Column Grid) --- */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto p-6 pb-24">

                    {limitReached && (
                        <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 max-w-3xl">
                            <div className="p-3 bg-red-100 text-red-600 rounded-full shrink-0">
                                <FaExclamationTriangle />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-red-700">Limit Reached</h3>
                                <p className="text-xs text-red-600 font-medium mt-0.5">You cannot add more products on your current plan.</p>
                                <Link to="/seller/subscription" className="text-xs font-bold underline mt-2 block">Upgrade Plan</Link>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-8 p-4 bg-red-50 text-red-755 rounded-2xl text-sm font-bold flex items-center gap-3 border border-red-100 animate-pulse">
                            <FaExclamationTriangle className="flex-shrink-0 text-red-500" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                        {/* LEFT COLUMN: Core Sections (Cols 1-8) */}
                        <div className="lg:col-span-8 space-y-8">

                            {/* Section 1: Core Information Card */}
                            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                        Core Information
                                    </h3>
                                    <div className="h-px flex-1 bg-slate-100 ml-4"></div>
                                </div>

                                <div className="space-y-6">
                                    {/* Product Name */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Product Name</label>
                                        <div className="relative group">
                                            <FaBox className="absolute left-4 top-3.5 text-slate-300 group-focus-within:text-slate-500 transition-colors" size={14} />
                                            <input
                                                type="text"
                                                placeholder="e.g. Tata Salt 1kg"
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-400/20 font-bold text-slate-800 placeholder:font-medium placeholder:text-slate-400 text-sm transition-all outline-none"
                                                value={form.name}
                                                onChange={e => setForm({ ...form, name: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Category Selector */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                                        <div className="relative">
                                            <FaTag className="absolute left-4 top-3.5 text-slate-300" size={14} />
                                            <select
                                                className="w-full pl-10 pr-8 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-400/20 font-bold text-slate-800 appearance-none transition-all cursor-pointer text-sm outline-none"
                                                value={form.category}
                                                onChange={e => setForm({ ...form, category: e.target.value })}
                                            >
                                                <option value="">Select Category</option>
                                                {Object.keys(groupedCategories).map(group => (
                                                    <optgroup key={group} label={group}>
                                                        {groupedCategories[group].map(cat => (
                                                            <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                                                        ))}
                                                    </optgroup>
                                                ))}
                                            </select>
                                            <FaChevronDown className="absolute right-4 top-4 text-slate-400 pointer-events-none" size={10} />
                                        </div>

                                        {/* Add Custom Category Form (Only for Seasonal & Festive) */}
                                        {isFestiveShop && (
                                            <div className="mt-3">
                                                {isAddingCat ? (
                                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">New Custom Category</h4>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Diwali Sweets"
                                                            value={newCatName}
                                                            onChange={(e) => setNewCatName(e.target.value)}
                                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-orange-500 outline-none transition-all"
                                                        />
                                                        {catError && <p className="text-[10px] text-red-500 font-bold">{catError}</p>}
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={handleAddCategorySubmit}
                                                                disabled={submittingCat}
                                                                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold py-2 rounded-xl transition-colors"
                                                            >
                                                                {submittingCat ? 'Adding...' : 'Add'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => { setIsAddingCat(false); setNewCatName(''); setCatError(''); }}
                                                                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 text-[10px] font-bold rounded-xl transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsAddingCat(true)}
                                                        className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors flex items-center gap-1.5 ml-1 mt-1.5"
                                                    >
                                                        + Add Custom Category
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Price & Unit Row */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {/* Price */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Price (₹)</label>
                                            <div className="relative group">
                                                <FaRupeeSign className="absolute left-4 top-3.5 text-slate-300 group-focus-within:text-slate-500 transition-colors" size={12} />
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-400/20 font-bold text-slate-800 text-sm transition-all outline-none"
                                                    value={form.price}
                                                    onChange={e => setForm({ ...form, price: e.target.value })}
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-2 font-semibold ml-1">
                                                Per {form.unit || 'unit'}
                                            </p>
                                        </div>

                                        {/* Unit Selector */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Unit</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-400/20 font-bold text-slate-800 appearance-none transition-all cursor-pointer text-sm outline-none"
                                                    value={form.unit}
                                                    onChange={e => setForm({ ...form, unit: e.target.value })}
                                                >
                                                    <option value="pc">Piece (pc)</option>
                                                    <option value="kg">Kilogram (kg)</option>
                                                    <option value="ltr">Litre (ltr)</option>
                                                    <option value="g">Gram (g)</option>
                                                    <option value="ml">Millilitre (ml)</option>
                                                    <option value="m">Meter (m)</option>
                                                </select>
                                                <FaChevronDown className="absolute right-4 top-4 text-slate-400 pointer-events-none" size={10} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Initial Stock */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                            Initial Stock {isAvailabilityMode ? '(Optional - defaults to 50)' : ''}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                placeholder={isAvailabilityMode ? "50" : "20"}
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-400/20 font-bold text-slate-800 text-sm transition-all outline-none"
                                                value={form.countInStock}
                                                onChange={e => setForm({ ...form, countInStock: e.target.value })}
                                            />
                                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                                <span className="text-xs font-bold text-slate-400 uppercase">Qty</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section 2: Optional Details Card */}
                            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide mb-6 flex items-center justify-between cursor-pointer" onClick={() => document.getElementById('desc-area').classList.toggle('hidden')}>
                                    <span>Optional Details</span>
                                    <span className="px-2 py-1 bg-slate-100 rounded text-[10px] text-slate-500 font-bold tracking-normal hover:bg-slate-200 transition-colors">Click to Expand</span>
                                </h3>
                                <div id="desc-area" className="hidden transition-all">
                                    <textarea
                                        rows="4"
                                        placeholder="Add details about brand, ingredients, storage instructions..."
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-900/10 focus:ring-0 font-medium text-slate-600 text-sm transition-all resize-none outline-none"
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                    />
                                </div>
                            </section>

                            {/* Error block relocated to top of form */}
                        </div>

                        {/* RIGHT COLUMN: Media & Metadata (Cols 9-12) */}
                        <div className="lg:col-span-4 space-y-8">

                            {/* Section 3: Product Image Card */}
                            <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide mb-4">Product Image</h3>

                                <div className="relative w-full aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-orange-50 hover:border-orange-400 transition-all duration-300 group">
                                    <input type="file" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" />

                                    {preview ? (
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center group-hover:scale-105 transition-transform duration-300">
                                            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md mb-3 mx-auto text-slate-300 group-hover:text-orange-500 group-hover:scale-110 transition-all duration-300">
                                                <FaCamera size={20} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-600 group-hover:text-orange-500 block">Click to Upload</span>
                                            <span className="text-[10px] text-slate-400 mt-1 block px-4">Supports JPG, PNG</span>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Category card relocated to core information card */}

                            {/* Stock / Availability Helper */}
                            {isAvailabilityMode ? (
                                <div className="bg-slate-100/50 p-5 rounded-3xl border border-slate-200/50">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <FaList className="text-slate-400" /> Availability Guide
                                    </h4>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3">
                                        As a Kirana/Retail shop, you manage availability instead of exact stock counts.
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-emerald-700">Available</span>
                                            <span className="text-slate-400 font-semibold">Customers can order online</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-red-750">Unavailable</span>
                                            <span className="text-slate-400 font-semibold">Customers see Out of Stock</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-100/50 p-5 rounded-3xl border border-slate-200/50">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <FaList className="text-slate-400" /> Stock Status Guide
                                    </h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-emerald-700">In Stock</span>
                                            <span className="font-bold text-slate-400">{'>'} 50%</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-amber-700">Limited</span>
                                            <span className="font-bold text-slate-400">{'≤'} 50%</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-red-700">Out of Stock</span>
                                            <span className="font-bold text-slate-400">0</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default SellerAddProductManual;
