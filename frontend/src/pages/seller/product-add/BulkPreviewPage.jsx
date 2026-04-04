import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaTrash, FaExclamationCircle, FaBoxOpen, FaCamera, FaImage } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import { CATEGORIES, getCategoriesForShop } from "@/constants/categories";
import { CATEGORY_IMAGE_MAP } from "@/utils/categoryImageMap";
import BulkUploadStepper from './BulkUploadStepper';

const BulkPreviewPage = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const locationState = useLocation().state || {};

    const [uploadId] = useState(searchParams.get('uploadId') || locationState.uploadId);
    const [products, setProducts] = useState(locationState.products || []);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Get allowed categories based on seller's shop type
    const shopType = user?.shopDetails?.shopType || "Grocery / Kirana";
    const allowedCategories = getCategoriesForShop(shopType);

    // If no products loaded (reload case), we might need to fetch (optional enhancement)
    useEffect(() => {
        if (!products.length && uploadId) {
            // In a full implementation, we'd fetch the staged products from backend here.
            // For now, warn user to restart if state is lost.
            if (!locationState.products) {
                // setError("Session expired. Please restart upload.");
            }
        }
    }, [uploadId, products.length, locationState.products]);

    const handleFieldChange = (index, field, value) => {
        const updated = [...products];
        let val = value;
        if (field === 'price' || field === 'quantity') {
            val = Number(value);
        }
        updated[index] = { ...updated[index], [field]: val };

        // Re-validate
        const p = updated[index];
        const isValid = p.name && Number(p.price) > 0 && Number(p.quantity) >= 0 && p.unit;
        updated[index]._isValid = isValid;

        setProducts(updated);
    };

    const handleRemoveProduct = (index) => {
        if (window.confirm("Remove this product?")) {
            const updated = products.filter((_, i) => i !== index);
            setProducts(updated);
        }
    };

    const handleSaveAll = async () => {
        const invalidCount = products.filter(p => !p._isValid).length;
        if (invalidCount > 0) {
            alert(`Please fix ${invalidCount} invalid products before saving.`);
            return;
        }

        if (products.length === 0) {
            alert("No products to save.");
            return;
        }

        setSaving(true);
        try {
            // Step 2: Sanitize Data (Force Number, Filter NaNs)
            const payload = products.map(p => {
                const catInfo = CATEGORIES.find(c => c.id === p.category || c.label === p.category);
                const price = Number(String(p.price).replace(/[^0-9.]/g, ""));
                const qty = Number(String(p.quantity).replace(/[^0-9.-]/g, ""));

                return {
                    name: (p.name || "").trim(),
                    category: catInfo?.label || p.category || 'General Provision / Kirana',
                    categorySlug: catInfo?.id || 'general-provision',
                    price: isNaN(price) ? 0 : price,
                    quantity: isNaN(qty) ? 0 : qty,
                    unit: p.unit || "Piece",
                    brand: (p.brand || "").trim(),
                };
            });

            const res = await fetch('http://127.0.0.1:5000/api/seller/bulk-upload/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    uploadId,
                    products: payload
                })
            });

            // Step 1: Read response EXACTLY ONCE
            const data = await res.json();

            if (res.ok) {
                alert(`Successfully added ${data.summary?.created || 0} products!`);
                navigate('/seller/inventory');
            } else {
                console.error("Save failed:", data);
                alert(data.message || data.error || "Save failed");
            }
        } catch (err) {
            console.error("Save Error:", err);
            alert("Network error during save. Please check your connection.");
        } finally {
            setSaving(false);
        }
    };

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-12 text-center text-red-600">
                <h2 className="text-xl font-bold">{error}</h2>
                <button onClick={() => navigate('/seller/add-product/bulk')} className="mt-4 underline">Restart Upload</button>
            </div>
        );
    }

    const validCount = products.filter(p => p._isValid).length;

    const [activeImageIndex, setActiveImageIndex] = useState(null);
    const fileInputRef = React.useRef(null);

    const handleTriggerImageUpload = (index) => {
        setActiveImageIndex(index);
        fileInputRef.current.click();
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file && activeImageIndex !== null) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleFieldChange(activeImageIndex, 'imageUrl', reader.result);
                setActiveImageIndex(null);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-40 p-6">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
            />
            <BulkUploadStepper currentStep={3} />
            {/* Header */}
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-slate-50/90 backdrop-blur-sm py-4 z-10 border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-3 rounded-full bg-white shadow-sm border border-slate-100 text-slate-500 hover:text-slate-800">
                        <FaArrowLeft />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Review Products</h1>
                        <p className="text-slate-500 text-sm font-medium">
                            {validCount}/{products.length} Valid • Ready to Save
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleSaveAll}
                    disabled={saving || validCount < products.length}
                    className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg
                        ${saving || validCount < products.length
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-200'
                        }`}
                >
                    {saving ? "Saving..." : "Save All Products"} <FaSave />
                </button>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 gap-6">
                {products.map((product, index) => (
                    <div key={index} className={`bg-white rounded-3xl border shadow-sm p-6 flex flex-col md:flex-row gap-6
                        ${product._isValid ? 'border-slate-100' : 'border-red-300 ring-4 ring-red-50'}`}>

                        {/* Left: Image Placeholder */}
                        <div className="w-full md:w-48 h-48 bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-2 shrink-0 relative overflow-hidden group hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200 border-dashed">

                            {/* Priority: Assigned Image -> Category Image -> Placeholder Icon */}
                            {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : CATEGORY_IMAGE_MAP[product.category] ? (
                                <img src={CATEGORY_IMAGE_MAP[product.category] || CATEGORY_IMAGE_MAP['Other']} alt="Category Default" className="w-full h-full object-cover opacity-80" />
                            ) : (
                                <div className="flex flex-col items-center">
                                    <FaImage className="text-4xl mb-2" />
                                    <span className="text-xs font-bold">Add Image</span>
                                </div>
                            )}

                            {/* Camera Overlay (On Hover) */}
                            <div
                                onClick={() => handleTriggerImageUpload(index)}
                                className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] cursor-pointer"
                            >
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2 backdrop-blur-md shadow-lg">
                                    <FaCamera className="text-white text-xl" />
                                </div>
                                <span className="text-white text-xs font-bold uppercase tracking-wider">Change Photo</span>
                            </div>
                        </div>

                        {/* Right: Fields */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">

                            {/* Name */}
                            <div className="col-span-1 md:col-span-2 lg:col-span-3">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Product Name</label>
                                <input
                                    type="text"
                                    value={product.name || ""}
                                    onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                                    className={`w-full p-3 rounded-xl border font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 ${!product.name ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                    placeholder="e.g. Tata Salt"
                                />
                                <div className="h-4 mt-1">
                                    {!product.name && <span className="text-xs text-red-500 font-bold">Required</span>}
                                </div>
                            </div>

                            {/* Price */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">MRP / Price</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    <input
                                        type="number"
                                        value={product.price || ""}
                                        onChange={(e) => handleFieldChange(index, 'price', e.target.value)}
                                        className={`w-full p-3 pl-8 rounded-xl border font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 ${Number(product.price) <= 0 ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stock Qty</label>
                                <input
                                    type="number"
                                    value={product.quantity !== undefined ? product.quantity : ""}
                                    onChange={(e) => handleFieldChange(index, 'quantity', e.target.value)}
                                    className={`w-full p-3 rounded-xl border font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 ${Number(product.quantity) < 0 ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                    placeholder="0"
                                />
                            </div>

                            {/* Unit */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unit</label>
                                <select
                                    value={product.unit || ""}
                                    onChange={(e) => handleFieldChange(index, 'unit', e.target.value)}
                                    className={`w-full p-3 rounded-xl border font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 ${!product.unit ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                >
                                    <option value="" disabled>Select...</option>
                                    <option value="pc">Piece (pc)</option>
                                    <option value="kg">Kilogram (kg)</option>
                                    <option value="g">Gram (g)</option>
                                    <option value="l">Litre (l)</option>
                                    <option value="ml">Millilitre (ml)</option>
                                    <option value="pack">Pack</option>
                                </select>
                            </div>

                            {/* Optional: Brand */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Brand</label>
                                <input
                                    type="text"
                                    value={product.brand || ""}
                                    onChange={(e) => handleFieldChange(index, 'brand', e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-200 font-medium text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100"
                                    placeholder="Optional"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                                <select
                                    value={product.category || allowedCategories[0]?.id}
                                    onChange={(e) => handleFieldChange(index, 'category', e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-200 font-medium text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100"
                                >
                                    {allowedCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>

                        </div>

                        {/* Remove Button */}
                        <div className="flex flex-col justify-between items-end pl-4 border-l border-slate-100">
                            {!product._isValid && <FaExclamationCircle className="text-red-500 text-xl" />}
                            <button
                                onClick={() => handleRemoveProduct(index)}
                                className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {products.length === 0 && (
                <div className="text-center py-20 text-slate-400">
                    <FaBoxOpen className="text-6xl mx-auto mb-4 opacity-50" />
                    <p>No products to review.</p>
                </div>
            )}
        </div>
    );
};

export default BulkPreviewPage;
