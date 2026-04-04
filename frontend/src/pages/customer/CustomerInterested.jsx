import React from 'react';
import { FaPaperPlane, FaStore, FaInfoCircle, FaArrowRight, FaClock, FaHeart, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../../components/common/EmptyState';
import { useInterested } from '../../context/InterestedContext';
import { useSaved } from '../../context/SavedContext';

const CustomerInterested = () => {
    const navigate = useNavigate();
    const { items, updateQuantity } = useInterested();
    const { savedItems, removeSavedItem } = useSaved();

    // Group items by shop
    const shopGroups = items.reduce((acc, item) => {
        if (!acc[item.shopId]) {
            acc[item.shopId] = {
                shopName: item.shopName,
                items: []
            };
        }
        acc[item.shopId].items.push(item);
        return acc;
    }, {});

    const shopIds = Object.keys(shopGroups);
    const hasInterested = shopIds.length > 0;
    const hasSaved = savedItems.length > 0;

    return (
        <div className="pb-24 min-h-screen bg-transparent font-sans">
            {/* Header Area (Integrated) */}
            <div className="bg-transparent px-6 py-8 md:px-12 max-w-6xl mx-auto border-b border-black/5">
                <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Interested</h1>
                <p className="text-sm text-stone-500 font-medium mt-2">
                    Items you're considering. <span className="text-[var(--accent-orange)] font-bold">No commitment yet.</span>
                </p>
            </div>

            <div className="p-6 md:px-12 max-w-6xl mx-auto space-y-10 mt-0">

                {/* 1. SAVED ITEMS (Themed Surface) */}
                {hasSaved && (
                    <div className="space-y-4 fade-in">
                        <div className="flex items-center gap-2 px-2">
                            <FaHeart className="text-[var(--accent-red)]" />
                            <h2 className="font-bold text-[var(--text-primary)] uppercase tracking-tight text-xs">Saved for Later</h2>
                        </div>
                        <div className="bg-[var(--card-bg)] rounded-[18px] shadow-standard overflow-hidden divide-y divide-black/5 border border-black/5">
                            {savedItems.map(item => (
                                <div key={`${item.shopId}-${item.productId}`} className="p-5 flex gap-5 items-center group hover:bg-black/5 transition-all duration-200">
                                    <div className="w-12 h-12 bg-black/5 rounded-xl flex items-center justify-center text-[var(--text-muted)] shrink-0">
                                        <FaStore />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-[var(--text-primary)] truncate">{item.productName}</h3>
                                        <p className="text-xs text-[var(--text-secondary)] font-medium flex items-center gap-1.5 mt-0.5">
                                            {item.shopName} <span className="opacity-30">•</span> {item.price}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => navigate(`/shops/${item.shopId}`)}
                                            className="px-4 py-2 bg-black/5 text-[var(--text-primary)] text-xs font-black rounded-xl hover:bg-black/10 transition-all uppercase tracking-wider"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => removeSavedItem(item.shopId, item.productId)}
                                            className="w-9 h-9 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors active:scale-90"
                                        >
                                            <FaTrash size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. INTERESTED ITEMS (Active Hub) */}
                {hasInterested && (
                    <div className="space-y-4 fade-in mt-8" style={{ animationDelay: '100ms' }}>
                        <div className="flex items-center gap-2 px-0">
                            <FaPaperPlane className="text-[var(--accent-orange)] opacity-80" />
                            <h2 className="font-semibold text-[var(--text-primary)] uppercase tracking-wider text-xs">Active Requests</h2>
                        </div>
                        {shopIds.map(shopId => (
                            <div key={shopId} className="space-y-2">
                                {/* Shop Header */}
                                <div className="flex items-center justify-between px-0 pt-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-[var(--card-bg)] rounded-xl flex items-center justify-center text-[var(--text-primary)] shadow-sm border border-black/5">
                                            <FaStore size={14} />
                                        </div>
                                        <h2 className="font-bold text-[var(--text-primary)] tracking-tight uppercase text-sm">{shopGroups[shopId].shopName}</h2>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/checkout/${shopId}`)}
                                        className="text-[10px] font-black text-[var(--accent-orange)] hover:underline flex items-center gap-1.5 uppercase tracking-widest"
                                    >
                                        Plan Visit <FaArrowRight size={10} />
                                    </button>
                                </div>

                                {/* Item List for this Shop */}
                                <div className="grid gap-3">
                                    {shopGroups[shopId].items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white/70 backdrop-blur-md p-5 rounded-[20px] shadow-sm border border-white/50 flex gap-4 items-center transition-all hover:translate-y-[-2px] duration-200 hover:shadow-lg"
                                        >
                                            <img src={item.image} alt="" className="w-20 h-20 rounded-[16px] object-cover bg-black/5" />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h3 className="font-black text-[var(--text-primary)] leading-tight text-lg tracking-tight uppercase">{item.productName}</h3>
                                                        <span className="text-sm font-bold text-[var(--accent-orange)] mt-1 inline-block">{item.price}</span>
                                                    </div>

                                                    {/* Quantity Control (Themed) */}
                                                    <div className="flex items-center bg-black/5 rounded-xl p-1 gap-1 self-center">
                                                        <button
                                                            onClick={() => updateQuantity({ shopId, productId: item.productId }, -1)}
                                                            className="w-7 h-7 flex items-center justify-center bg-[var(--card-bg)] rounded-lg shadow-sm text-[var(--text-primary)] hover:bg-black/5 text-sm font-black transition-all active:scale-90"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="text-sm font-black text-[var(--text-primary)] min-w-[24px] text-center">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity({ shopId, productId: item.productId }, 1)}
                                                            className="w-7 h-7 flex items-center justify-center bg-[var(--card-bg)] rounded-lg shadow-sm text-[var(--text-primary)] hover:bg-black/5 text-sm font-black transition-all active:scale-90"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-3">
                                                    <span className="flex items-center gap-1.5 border-r border-black/10 pr-3"><FaInfoCircle className="text-[var(--accent-orange)]" /> {item.quantity} UNIT{item.quantity > 1 ? 'S' : ''}</span>
                                                    <span className="flex items-center gap-1.5"><FaClock /> Pre-order</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State (Design System Alignment) */}
                {!hasInterested && !hasSaved && (
                    <div className="py-20 animate-fade-in">
                        <div className="bg-transparent/50 rounded-[24px] p-12 text-center border-none max-w-lg mx-auto">
                            <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FaPaperPlane className="text-4xl text-[var(--text-muted)] opacity-30" />
                            </div>
                            <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight uppercase">Your thinking space is empty</h2>
                            <p className="text-[var(--text-secondary)] font-medium mt-3 mb-8 text-sm leading-relaxed">
                                Browse shops and tap '+' on items you like, or 'Heart' them to save for later.
                            </p>
                            <button
                                onClick={() => navigate('/shops')}
                                className="px-8 py-4 bg-[var(--accent-orange)] text-[#000] rounded-xl text-sm font-black transition-all hover:bg-black hover:text-white uppercase tracking-widest shadow-lg shadow-orange-500/20"
                            >
                                Browse Shops
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerInterested;
