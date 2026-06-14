import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaTrash, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';

const DEFAULT_PLACEHOLDER = "/placeholder-product.png";

const CatalogReviewPage = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedItems, setSelectedItems] = useState(location.state?.selectedItems || []);
    const [isSyncing, setIsSyncing] = useState(false);

    if (selectedItems.length === 0) {
        return (
            <div className="max-w-2xl mx-auto py-20 text-center px-4">
                <FaExclamationTriangle className="text-6xl text-amber-500 mx-auto mb-6" />
                <h2 className="text-2xl font-black text-slate-900 mb-2">No Items Selected</h2>
                <p className="text-slate-500 mb-8">Please go back and select products from the catalog first.</p>
                <button
                    onClick={() => navigate('/seller/product-add/catalog')}
                    className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm"
                >
                    Back to Catalog
                </button>
            </div>
        );
    }

    const updateItem = (variantId, field, value) => {
        setSelectedItems(prev => prev.map(item =>
            item.variantId === variantId ? { ...item, [field]: value } : item
        ));
    };

    const removeItem = (variantId) => {
        setSelectedItems(prev => prev.filter(item => item.variantId !== variantId));
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            for (const item of selectedItems) {
                await axios.post('/api/catalog/add', {
                    sellerId: user?._id,
                    price: Number(item.price || item.indicativePrice || 50),
                    stock: Number(item.stockStatus === 'OUT_OF_STOCK' ? 0 : 100),
                    productData: {
                        name: item.variantLabel,
                        brand: item.brandName,
                        category: item.category,
                        imageUrl: item.imageUrl,
                        barcode: item.barcode,
                        source: item.source || 'openfoodfacts',
                        externalId: item.externalId
                    }
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            // Redirect to inventory with success message
            navigate('/seller/inventory', { state: { message: 'Catalog products added successfully!' } });
        } catch (error) {
            console.error('Sync Error:', error);
            alert('Failed to sync catalog products. Please try again.');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-32 px-4 pt-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-10">
                <button onClick={() => navigate(-1)} className="p-3 rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-500">
                    <FaArrowLeft />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Review Selection</h1>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Step 2: Customization</p>
                </div>
            </div>

            {/* Selection Table */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product & Category</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Weight</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-28">Unit</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Your Price</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">Stock Status</th>
                                <th className="px-6 py-5 text-center w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {selectedItems.map((item) => (
                                <tr key={item.barcode || item.variantId} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100 flex items-center justify-center">
                                                {!item.imageUrl || item.imageUrl === DEFAULT_PLACEHOLDER || item.imageUrl.includes('photo-1542838132-92c53300491e') ? (
                                                    <div className="w-full h-full bg-amber-500/10 text-amber-600 flex items-center justify-center text-[10px] font-black uppercase">
                                                        {item.variantLabel.substring(0, 2)}
                                                    </div>
                                                ) : (
                                                    <img 
                                                        src={item.imageUrl} 
                                                        alt="" 
                                                        className="w-full h-full object-cover" 
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = DEFAULT_PLACEHOLDER;
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 leading-tight mb-0.5">{item.variantLabel}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-white bg-slate-400 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                        {item.brandName}
                                                    </span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                        • {item.category}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <input
                                            type="number"
                                            defaultValue={item.packSize.match(/\d+/)?.[0] || 1}
                                            onChange={(e) => updateItem(item.variantId, 'weight', e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-3 py-2 font-black text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition-all"
                                        />
                                    </td>
                                    <td className="px-6 py-6">
                                        <select
                                            defaultValue={item.packSize.match(/[a-zA-Z]+/)?.[0]?.toLowerCase() || 'pcs'}
                                            onChange={(e) => updateItem(item.variantId, 'unit', e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-3 py-2 font-black text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="kg">kg</option>
                                            <option value="g">g</option>
                                            <option value="ml">ml</option>
                                            <option value="l">L</option>
                                            <option value="pcs">pcs</option>
                                            <option value="pack">pack</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                                            <input
                                                type="number"
                                                defaultValue={item.indicativePrice}
                                                onChange={(e) => updateItem(item.variantId, 'price', e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-transparent rounded-xl pl-6 pr-3 py-2 font-black text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition-all"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <select
                                            defaultValue="IN_STOCK"
                                            onChange={(e) => updateItem(item.variantId, 'stockStatus', e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-3 py-2 font-black text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="IN_STOCK">In Stock</option>
                                            <option value="LIMITED">Limited</option>
                                            <option value="OUT_OF_STOCK">Out of Stock</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <button
                                            onClick={() => removeItem(item.variantId)}
                                            className="p-2 text-slate-300 hover:text-red-500 transition-colors hover:scale-110 active:scale-90"
                                        >
                                            <FaTrash size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Summary */}
                <div className="bg-slate-50 p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-100">
                    <p className="text-slate-500 font-bold">
                        Confirm details for <span className="text-slate-900">{selectedItems.length} products</span>.
                        They will be added to your live inventory.
                    </p>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex-1 md:flex-none px-8 py-4 rounded-2xl font-black text-slate-500 hover:text-slate-800 uppercase tracking-widest text-sm transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="flex-1 md:flex-none bg-slate-900 border-2 border-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-transparent hover:text-slate-900 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-slate-900/10 disabled:opacity-50"
                        >
                            {isSyncing ? (
                                <>Syncing...</>
                            ) : (
                                <>
                                    Confirm & Add <FaCheckCircle className="group-hover:scale-125 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CatalogReviewPage;
