import React, { useState } from 'react';
import { FaPaperPlane, FaStore, FaInfoCircle, FaArrowRight, FaClock, FaHeart, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useInterested } from '../../context/InterestedContext';
import { useSaved } from '../../context/SavedContext';

const CustomerInterested = () => {
    const navigate = useNavigate();
    const { items, updateQuantity } = useInterested();
    const { savedItems, removeSavedItem } = useSaved();

    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'ready' | 'need_confirm' | 'saved'

    // Helper to parse price string to number
    const parsePrice = (priceStr) => {
        if (!priceStr) return 0;
        const clean = priceStr.toString().replace(/[^0-9.]/g, '');
        const num = parseFloat(clean);
        return isNaN(num) ? 0 : num;
    };

    // Calculate metrics
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueShopsCount = new Set(items.map(item => item.shopId)).size;
    const estimatedBudget = items.reduce((sum, item) => sum + (parsePrice(item.price) * item.quantity), 0);

    const readyItemsCount = items.filter(item => item.stockConfidence === 'HIGH' || item.stockConfidence === undefined).length;
    const needConfirmCount = items.filter(item => item.stockConfidence === 'LOW' || item.stockConfidence === 'MEDIUM').length;
    const savedCount = savedItems.length;

    // Filter items based on selected tab
    const filteredItems = items.filter(item => {
        if (activeTab === 'all') return true;
        if (activeTab === 'ready') return item.stockConfidence === 'HIGH' || item.stockConfidence === undefined;
        if (activeTab === 'need_confirm') return item.stockConfidence === 'LOW' || item.stockConfidence === 'MEDIUM';
        return false;
    });

    // Group items by shop
    const shopGroups = filteredItems.reduce((acc, item) => {
        if (!acc[item.shopId]) {
            acc[item.shopId] = {
                shopName: item.shopName,
                shopPhone: item.shopPhone || "9876543210",
                shopAddress: item.shopAddress || "Nearby Local Shop",
                shopIsOpen: item.shopIsOpen !== undefined ? item.shopIsOpen : true,
                shopHours: item.shopHours || "9:00 AM - 9:00 PM",
                shopLastActive: item.shopLastActive || null,
                items: []
            };
        }
        acc[item.shopId].items.push(item);
        return acc;
    }, {});

    const shopIds = Object.keys(shopGroups);
    const hasInterested = items.length > 0;
    const hasSaved = savedItems.length > 0;
    const isPageEmpty = !hasInterested && !hasSaved;

    const handleWhatsAppSeller = (shopId) => {
        const shopGroup = shopGroups[shopId];
        const phone = shopGroup ? shopGroup.shopPhone : "9876543210";
        const targetItems = shopGroup ? shopGroup.items : [];
        
        const itemsText = targetItems
            .map(item => `${item.quantity} x ${item.productName || item.name || "Product"}`)
            .join('\n');
            
        const message = `Hi,\n\nI need:\n\n${itemsText}\n\nAre these available?\n\n- Sent via Aisle`;
        const encodedText = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${phone}?text=${encodedText}`;
        window.open(whatsappUrl, '_blank');
    };

    // Main Page Empty State Redesign
    if (isPageEmpty) {
        return (
            <div className="min-h-screen bg-transparent py-20 flex items-center justify-center font-sans">
                <div className="max-w-lg w-full text-center px-6">
                    <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl grayscale opacity-60 shadow-inner">
                        📦
                    </div>
                    <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight uppercase">No Saved Products Yet</h2>
                    <p className="text-stone-500 font-medium mt-3 mb-8 text-sm leading-relaxed max-w-sm mx-auto">
                        Products you save from nearby shops will appear here. Start exploring local businesses.
                    </p>
                    <button
                        onClick={() => navigate('/shops')}
                        className="px-8 py-4 bg-[var(--accent-orange)] text-black rounded-2xl text-sm font-black transition-all hover:bg-black hover:text-white uppercase tracking-widest shadow-lg shadow-orange-500/10 active:scale-95"
                    >
                        Explore Shops
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-24 min-h-screen bg-transparent font-sans">
            {/* Header Area */}
            <div className="bg-transparent px-6 py-8 md:px-12 max-w-7xl mx-auto border-b border-black/5">
                <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Shopping Planner</h1>
                <p className="text-sm text-stone-500 font-medium mt-2">
                    Plan your visits, check availability, and secure products from nearby merchants.
                </p>
            </div>

            {/* Desktop 2-Column Split Grid */}
            <div className="p-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
                
                {/* 1. LEFT SIDEBAR (Summary, Notices, and Saved Items) */}
                <div className="space-y-6 lg:col-span-1">
                    
                    {/* Purchase Summary Card */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-4">
                        <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest">Purchase Summary</h3>
                        
                        <div className="pt-2">
                            <span className="text-stone-400 text-xs font-medium">Estimated Budget</span>
                            <div className="text-3xl font-black text-stone-900 mt-1">₹{estimatedBudget.toLocaleString('en-IN')}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-100">
                            <div>
                                <span className="text-stone-400 text-[10px] font-black uppercase tracking-wider">Products</span>
                                <div className="text-lg font-bold text-stone-800 mt-0.5">{totalQty}</div>
                            </div>
                            <div>
                                <span className="text-stone-400 text-[10px] font-black uppercase tracking-wider">Shops</span>
                                <div className="text-lg font-bold text-stone-800 mt-0.5">{uniqueShopsCount}</div>
                            </div>
                        </div>
                    </div>

                    {/* Availability Notice compact card */}
                    <div className="bg-amber-50/60 backdrop-blur-md rounded-3xl p-6 border border-amber-200/50 space-y-4">
                        <div className="flex items-start gap-3">
                            <FaInfoCircle className="text-amber-700 mt-0.5 shrink-0" size={16} />
                            <div>
                                <h4 className="font-bold text-amber-900 text-sm">Availability Notice</h4>
                                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                                    Product availability may change due to in-store purchases. Need exact quantities? Contact the seller before payment.
                                </p>
                            </div>
                        </div>
                        {shopIds.length > 0 && (
                            <div className="flex gap-2 pt-1">
                                <a
                                    href={`tel:${shopGroups[shopIds[0]]?.shopPhone}`}
                                    className="flex-1 py-2 bg-white text-stone-800 border border-stone-200 rounded-xl text-[11px] font-bold transition-all hover:bg-stone-50 text-center flex items-center justify-center gap-1 shadow-sm"
                                >
                                    📞 Call Seller
                                </a>
                                <button
                                    onClick={() => handleWhatsAppSeller(shopIds[0])}
                                    className="flex-1 py-2 bg-[#25D366] text-white rounded-xl text-[11px] font-bold transition-all hover:bg-[#20ba56] flex items-center justify-center gap-1 shadow-sm"
                                >
                                    💬 WhatsApp
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Saved for Later Sidebar Card */}
                    {activeTab !== 'saved' && hasSaved && (
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-4">
                            <div className="flex items-center gap-2">
                                <FaHeart className="text-[var(--accent-red)]" />
                                <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest">Saved for Later</h3>
                            </div>
                            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                                {savedItems.map(item => (
                                    <div key={`${item.shopId}-${item.productId}`} className="flex gap-3 items-center justify-between py-1">
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-bold text-stone-800 text-xs truncate uppercase">{item.productName || item.name}</h4>
                                            <p className="text-[10px] text-stone-400 mt-0.5">{item.shopName} • {item.price}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => navigate(`/shops/${item.shopId}`)}
                                                className="px-2.5 py-1 bg-stone-50 hover:bg-stone-100 text-[10px] font-bold text-stone-700 rounded-lg"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => removeSavedItem(item.shopId, item.productId)}
                                                className="text-stone-300 hover:text-red-500 p-1"
                                            >
                                                <FaTrash size={10} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. RIGHT MAIN PANEL (Smart Tabs, Shop Lists & Cards) */}
                <div className="space-y-6 lg:col-span-2">
                    
                    {/* Smart Tabs Selector */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide border-b border-stone-100">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`whitespace-nowrap px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                                activeTab === 'all'
                                    ? 'bg-black text-white shadow-sm'
                                    : 'bg-white text-stone-500 hover:bg-stone-50 border border-stone-100'
                            }`}
                        >
                            All <span>({items.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('ready')}
                            className={`whitespace-nowrap px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                                activeTab === 'ready'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-white text-stone-500 hover:bg-stone-50 border border-stone-100'
                            }`}
                        >
                            Ready to Buy <span>({readyItemsCount})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('need_confirm')}
                            className={`whitespace-nowrap px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                                activeTab === 'need_confirm'
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'bg-white text-stone-500 hover:bg-stone-50 border border-stone-100'
                            }`}
                        >
                            Need Confirmation <span>({needConfirmCount})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('saved')}
                            className={`whitespace-nowrap px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                                activeTab === 'saved'
                                    ? 'bg-[var(--accent-orange)] text-black shadow-sm'
                                    : 'bg-white text-stone-500 hover:bg-stone-50 border border-stone-100'
                            }`}
                        >
                            Saved <span>({savedCount})</span>
                        </button>
                    </div>

                    {/* Saved Tab Specific View */}
                    {activeTab === 'saved' && (
                        <div className="space-y-4">
                            {!hasSaved ? (
                                <div className="bg-white rounded-3xl p-12 text-center border border-stone-100">
                                    <div className="w-16 h-16 bg-stone-55 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300">
                                        <FaHeart size={24} />
                                    </div>
                                    <h4 className="font-bold text-stone-800 text-sm">No saved products yet</h4>
                                    <p className="text-xs text-stone-400 mt-1">Products you mark as saved will appear here.</p>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {savedItems.map(item => (
                                        <div
                                            key={`${item.shopId}-${item.productId}`}
                                            className="bg-white p-5 rounded-[24px] shadow-sm border border-stone-100 flex gap-4 items-center"
                                        >
                                            <div className="w-16 h-16 bg-stone-50 rounded-xl flex items-center justify-center text-stone-400 shrink-0">
                                                <FaStore size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-stone-900 truncate uppercase text-sm">{item.productName || item.name}</h3>
                                                <p className="text-xs text-stone-500 font-medium mt-1">{item.shopName} • {item.price}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/shops/${item.shopId}`)}
                                                    className="px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-xl hover:bg-stone-800"
                                                >
                                                    View Shop
                                                </button>
                                                <button
                                                    onClick={() => removeSavedItem(item.shopId, item.productId)}
                                                    className="w-10 h-10 flex items-center justify-center text-stone-300 hover:text-red-500 transition-colors"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Filtered Active Shops List */}
                    {activeTab !== 'saved' && (
                        <div className="space-y-6">
                            {shopIds.length === 0 ? (
                                <div className="bg-white rounded-3xl p-12 text-center border border-stone-100">
                                    <h4 className="font-bold text-stone-800 text-sm">No planner items found</h4>
                                    <p className="text-xs text-stone-400 mt-1">There are no items under this planner filter.</p>
                                </div>
                            ) : (
                                shopIds.map(shopId => {
                                    const shopGroup = shopGroups[shopId];
                                    return (
                                        <div key={shopId} className="bg-white border border-stone-100 shadow-sm rounded-3xl p-6 space-y-5">
                                            
                                            {/* Seller Contact Card Header */}
                                            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-stone-100 pb-4 gap-4">
                                                <div className="space-y-1 text-left">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h2 className="font-black text-stone-900 text-base uppercase tracking-tight">{shopGroup.shopName}</h2>
                                                        <span className="text-[10px] font-black bg-stone-50 text-stone-500 px-2 py-0.5 rounded-full border border-stone-100">
                                                            📍 1.2 km
                                                        </span>
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${shopGroup.shopIsOpen ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                                            {shopGroup.shopIsOpen ? '🟢 Open Now' : '🔴 Closed'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                                                        ⏰ {shopGroup.shopHours} • {shopGroup.shopAddress}
                                                    </p>
                                                </div>

                                                {/* Badge: Seller Active Badge */}
                                                <div className="flex items-center gap-2 self-start md:self-center">
                                                    <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[10px] px-3 py-1 rounded-xl font-bold uppercase tracking-wide border border-emerald-100">
                                                        ✓ Seller Active Today
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Products under this shop */}
                                            <div className="space-y-4">
                                                {shopGroup.items.map((item, idx) => (
                                                    <div key={idx} className="flex gap-4 items-center justify-between py-2 border-b border-stone-50 last:border-b-0">
                                                        <div className="flex gap-4 items-center min-w-0">
                                                            <img src={item.image} alt="" className="w-14 h-14 rounded-2xl object-cover bg-stone-50 border border-stone-100" />
                                                            <div className="min-w-0 text-left">
                                                                <h4 className="font-bold text-stone-900 uppercase text-sm truncate">{item.productName || item.name}</h4>
                                                                <p className="text-xs text-stone-500 font-medium mt-0.5">{item.price}</p>
                                                                
                                                                {/* Item verification warnings if confidence is low */}
                                                                {(item.stockConfidence === 'LOW' || item.stockConfidence === 'MEDIUM') && (
                                                                    <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md mt-1 uppercase border border-amber-100">
                                                                        ⚠️ Confirm stock
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Quantity selector */}
                                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                                            <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Required</span>
                                                            <div className="flex items-center bg-stone-50 rounded-xl p-1 gap-1 border border-stone-100">
                                                                <button
                                                                    onClick={() => updateQuantity({ shopId, productId: item.productId }, -1)}
                                                                    className="w-6 h-6 flex items-center justify-center bg-white rounded-lg shadow-sm text-stone-700 hover:bg-stone-100 text-xs font-black transition-all active:scale-90"
                                                                >
                                                                    -
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={item.quantity}
                                                                    onChange={(e) => {
                                                                        const val = parseInt(e.target.value) || 1;
                                                                        const delta = val - item.quantity;
                                                                        updateQuantity({ shopId, productId: item.productId }, delta);
                                                                    }}
                                                                    className="w-8 bg-transparent text-center text-xs font-black text-stone-900 focus:outline-none focus:ring-0 border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                />
                                                                <button
                                                                    onClick={() => updateQuantity({ shopId, productId: item.productId }, 1)}
                                                                    className="w-6 h-6 flex items-center justify-center bg-white rounded-lg shadow-sm text-stone-700 hover:bg-stone-100 text-xs font-black transition-all active:scale-90"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Shop Group Action Buttons */}
                                            <div className="flex gap-3 pt-3 border-t border-stone-100">
                                                <button
                                                    onClick={() => handleWhatsAppSeller(shopId)}
                                                    className="flex-1 py-3 border border-[#25D366] text-[#25D366] hover:bg-[#25D366]/5 active:scale-95 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                                >
                                                    💬 Contact Seller
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/checkout/${shopId}`)}
                                                    className="flex-1 py-3 bg-stone-900 text-white hover:bg-stone-800 active:scale-95 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
                                                >
                                                    Proceed to Checkout <FaArrowRight size={10} />
                                                </button>
                                            </div>

                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                </div>

            </div>
        </div>
    );
};

export default CustomerInterested;
