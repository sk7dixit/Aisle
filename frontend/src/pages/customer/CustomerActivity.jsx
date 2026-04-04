import React, { useState } from 'react';
import { FaBox, FaWalking, FaTools, FaCheckCircle, FaClock, FaTimesCircle, FaMapMarkerAlt, FaCalendarAlt, FaHistory, FaShieldAlt, FaQrcode, FaChevronRight, FaTimes } from 'react-icons/fa';
import EmptyState from '../../components/common/EmptyState';
import { useActivity } from '../../context/ActivityContext';
import { QRCodeSVG } from "qrcode.react";

const CustomerActivity = () => {
    const { activities, trustScore, updateActivityStatus } = useActivity();
    const [filter, setFilter] = useState('all'); // 'all' | 'upcoming' | 'completed'
    const [selectedQR, setSelectedQR] = useState(null); // Visit object for QR modal

    const getFilteredActivity = () => {
        if (filter === 'all') return activities;
        if (filter === 'upcoming') return activities.filter(a => ['UPCOMING', 'VISITED', 'READY', 'pending'].includes(a.status));
        if (filter === 'completed') return activities.filter(a => ['COMPLETED', 'CANCELLED', 'MISSED', 'EXPIRED'].includes(a.status));
        return activities;
    };

    const displayActivities = getFilteredActivity();

    // Helper: Badge Color/Icon
    const getStatusBadge = (status) => {
        const base = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm";
        switch (status) {
            case 'UPCOMING': return <span className={`${base} bg-[var(--accent-orange)]/10 text-[var(--accent-orange)] border-[var(--accent-orange)]/20`}><FaClock /> SCHEDULED</span>;
            case 'VISITED': return <span className={`${base} bg-[var(--accent-green)]/10 text-[var(--accent-green)] border-[var(--accent-green)]/20`}><FaCheckCircle /> VISIT ACKNOWLEDGED</span>;
            case 'READY': return <span className={`${base} bg-[var(--accent-green)]/20 text-[var(--accent-green)] border-[var(--accent-green)]/30`}><FaCheckCircle /> READY</span>;
            case 'COMPLETED': return <span className={`${base} bg-[var(--accent-green)] text-white border-[var(--accent-green)]`}><FaCheckCircle /> COMPLETED</span>;
            case 'MISSED': return <span className={`${base} bg-black/5 text-[var(--text-muted)] border-black/10`}><FaTimesCircle /> NO-SHOW</span>;
            case 'EXPIRED': return <span className={`${base} bg-[var(--accent-red)]/10 text-[var(--accent-red)] border-[var(--accent-red)]/20`}><FaTimesCircle /> EXPIRED</span>;
            default: return <span className={`${base} bg-black/5 text-[var(--text-muted)] border-black/10`}>{status}</span>;
        }
    };

    // Helper: Type Icon
    const getTypeIcon = (type) => {
        const base = "w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner";
        switch (type) {
            case 'VISIT': return <div className={`${base} bg-[var(--accent-orange)]/10 text-[var(--accent-orange)]`}><FaWalking /></div>;
            case 'PAY_NOW': return <div className={`${base} bg-[var(--accent-green)]/10 text-[var(--accent-green)]`}><FaBox /></div>;
            default: return <div className={`${base} bg-black/5 text-[var(--text-muted)]`}><FaClock /></div>;
        }
    };

    return (
        <div className="bg-[var(--page-bg)] min-h-screen pb-24 font-sans text-[var(--text-primary)]">
            {/* Header (Integrated) */}
            <div className="bg-[var(--page-bg)] pt-4 pb-4 px-8 border-b border-black/5 sticky top-0 z-30 shadow-sm">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight uppercase">My Activity</h1>
                            <p className="text-[var(--text-secondary)] font-black uppercase tracking-widest text-[10px] mt-1 opacity-70">Track your shop visits and orders.</p>
                        </div>

                        {/* Internal Trust Score */}
                        <div className="bg-black/5 px-6 py-3 rounded-2xl border border-black/5 flex flex-col items-end shadow-inner">
                            <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1">Account Reliability</span>
                            <div className="flex items-center gap-2">
                                <span className={`text-2xl font-black ${trustScore >= 80 ? 'text-[var(--accent-green)]' : trustScore >= 50 ? 'text-[var(--accent-orange)]' : 'text-[var(--accent-red)]'}`}>
                                    {trustScore}%
                                </span>
                                <FaShieldAlt className={`${trustScore >= 80 ? 'text-[var(--accent-green)]' : trustScore >= 50 ? 'text-[var(--accent-orange)]' : 'text-[var(--accent-red)]'} opacity-50`} />
                            </div>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                        {['all', 'upcoming', 'completed'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${filter === f
                                    ? 'bg-[var(--accent-orange)] text-black border-[var(--accent-orange)]'
                                    : 'bg-[var(--card-bg)] text-[var(--text-muted)] border-black/5 hover:border-black/10'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="max-w-4xl mx-auto p-6 md:px-10 space-y-6 mt-6">
                {/* System Note (Warm) */}
                <div className="bg-[var(--accent-purple)]/10 border border-[var(--accent-purple)]/20 p-5 rounded-[24px] shadow-sm">
                    <p className="text-[11px] text-[var(--accent-purple)] font-black uppercase tracking-tight leading-relaxed">
                        <span className="bg-[var(--accent-purple)] text-white px-2 py-0.5 rounded mr-2 text-[9px]">Note</span>
                        We manage checkout trust scores internally. 100% reliability unlocks priority "Pay on Visit" options.
                        Repeated no-shows may temporarily require online payment.
                    </p>
                </div>

                {displayActivities.length === 0 ? (
                    <EmptyState
                        title="No activity yet"
                        message="Confirmed visits, orders, and service requests will appear here."
                        actionLabel="Browse Shops"
                        actionRoute="/shops"
                        icon={<FaHistory className="text-3xl text-[var(--text-muted)] opacity-30" />}
                    />
                ) : (
                    displayActivities.map(item => (
                        <div key={item.id} className="group flex flex-col bg-[var(--card-bg)] rounded-[24px] border border-black/5 shadow-standard hover:shadow-xl hover:translate-y-[-2px] transition-all relative overflow-hidden">
                            <div className="p-6 md:p-8 flex gap-6 items-start">
                                {/* Left Icon Panel */}
                                <div className="shrink-0">
                                    {getTypeIcon(item.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col-reverse md:flex-row md:items-center justify-between gap-4 mb-3">
                                        <h3 className="font-black text-[var(--text-primary)] text-xl leading-tight truncate uppercase tracking-tight pr-10">
                                            {item.type === 'VISIT' ? `Visit: ${item.shopName}` : `Pre-Pay: ${item.shopName}`}
                                        </h3>
                                        <div className="self-start md:self-auto shrink-0">
                                            {getStatusBadge(item.status)}
                                        </div>
                                    </div>
                                    <p className="text-sm text-[var(--text-secondary)] font-bold mb-6 line-clamp-1 uppercase tracking-tight opacity-80">
                                        {item.items.map(i => i.productName).join(', ')}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.15em] border-t border-black/5 pt-5">
                                        <span className="flex items-center gap-2">
                                            <FaCalendarAlt className="opacity-40" /> {item.visitDate || new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                        {item.visitTime && (
                                            <span className="flex items-center gap-2"><FaClock className="opacity-40" /> {item.visitTime}</span>
                                        )}
                                        <span className="flex items-center gap-2"><FaMapMarkerAlt className="opacity-40" /> {item.shopName}</span>
                                    </div>

                                    {/* Visit Token Section */}
                                    {(item.status === 'UPCOMING' || item.status === 'VISITED') && item.type === 'VISIT' && (
                                        <div className="mt-6 p-6 bg-black/5 rounded-[20px] border-2 border-dashed border-black/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                            <div>
                                                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1.5">Confirmation Token</p>
                                                <p className="text-2xl font-mono font-black text-[var(--text-primary)] tracking-widest">{item.visitId || `VST-${item.id.toString().slice(-6)}`}</p>
                                                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-tight mt-2 opacity-60">
                                                    {item.status === 'VISITED' ? 'Visit Confirmed by Seller' : 'Show this at shop counter'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedQR(item)}
                                                disabled={item.status === 'VISITED'}
                                                className={`flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 ${item.status === 'VISITED' ? 'bg-black/5 text-[var(--text-muted)] border border-black/5 cursor-not-allowed opacity-50' : 'bg-white text-black border border-black/10 hover:bg-black hover:text-white'}`}
                                            >
                                                <FaQrcode className={item.status === 'VISITED' ? 'text-black/20' : 'text-[var(--accent-orange)]'} />
                                                {item.status === 'VISITED' ? 'Used' : 'Show Pass'}
                                            </button>
                                        </div>
                                    )}
                                    {item.status === 'EXPIRED' && (
                                        <div className="mt-6 p-4 bg-[var(--accent-red)]/5 text-[var(--accent-red)] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-[var(--accent-red)]/10">
                                            <FaClock className="shrink-0" /> Visit has expired
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Simulation Controls (Softened) */}
                            {item.status === 'UPCOMING' && (
                                <div className="bg-black/5 p-4 flex items-center justify-between gap-4 border-t border-black/5">
                                    <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2 opacity-50">Simulation Tools</span>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => updateActivityStatus(item.id, 'COMPLETED')}
                                            className="px-4 py-2 bg-black/10 text-[var(--text-primary)] text-[9px] font-black rounded-lg hover:bg-[var(--accent-green)] hover:text-white uppercase tracking-widest transition-all"
                                        >
                                            Force Mark Complete
                                        </button>
                                        <button
                                            onClick={() => updateActivityStatus(item.id, 'MISSED')}
                                            className="px-4 py-2 bg-black/10 text-[var(--text-primary)] text-[9px] font-black rounded-lg hover:bg-[var(--accent-red)] hover:text-white uppercase tracking-widest transition-all"
                                        >
                                            Force Mark Missed
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Type Stripe */}
                            <div className={`absolute left-0 top-0 bottom-0 w-2 
                                ${item.type === 'VISIT' ? 'bg-[var(--accent-orange)]' : 'bg-[var(--accent-green)]'} 
                                transition-all order-first
                            `}></div>
                        </div>
                    ))
                )}
            </div>

            {/* QR MODAL (Warm Shield) */}
            {selectedQR && (
                <div className="fixed inset-0 bg-[#181411]/90 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
                    <div className="bg-[var(--card-bg)] rounded-[40px] p-10 max-w-sm w-full shadow-[0_32px_64px_rgba(0,0,0,0.5)] relative border border-white/5">
                        <button
                            onClick={() => setSelectedQR(null)}
                            className="absolute top-8 right-8 w-11 h-11 flex items-center justify-center bg-black/5 rounded-full text-[var(--text-primary)] hover:bg-black hover:text-white transition-all active:scale-90"
                        >
                            <FaTimes />
                        </button>

                        <div className="text-center space-y-8">
                            <div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-1 uppercase tracking-tight">
                                    {selectedQR.status === 'VISITED' ? 'Pass Confirmed' : 'Visit Pass'}
                                </h3>
                                <p className="text-xs text-[var(--text-secondary)] font-black uppercase tracking-[0.15em] opacity-70">{selectedQR.shopName}</p>
                            </div>

                            <div className={`relative bg-white p-8 rounded-[32px] shadow-standard border-4 border-black/5 flex items-center justify-center mx-auto w-fit transition-all duration-500 ${selectedQR.status === 'VISITED' ? 'opacity-20 grayscale scale-95' : 'opacity-100'}`}>
                                <QRCodeSVG
                                    value={JSON.stringify({
                                        visitId: selectedQR.visitId,
                                        shopId: selectedQR.shopId
                                    })}
                                    size={180}
                                    level="M"
                                />
                                {selectedQR.status === 'VISITED' && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-black text-white px-5 py-2.5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl rotate-[-12deg]">Void / Used</div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Token ID</p>
                                <div className={`bg-black/5 py-4 rounded-[20px] border border-black/5 ${selectedQR.status === 'VISITED' ? 'opacity-40' : 'shadow-inner'}`}>
                                    <span className="text-3xl font-mono font-black text-[var(--text-primary)] tracking-[0.2em]">
                                        {selectedQR.visitId}
                                    </span>
                                </div>
                            </div>

                            {selectedQR.status === 'VISITED' ? (
                                <p className="text-[10px] text-[var(--accent-green)] leading-relaxed font-black uppercase tracking-widest">
                                    Visit Confirmed ✅ Proceed to billing
                                </p>
                            ) : (
                                <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-black uppercase tracking-widest opacity-60">
                                    Verified via ShopLens Trust Protocol
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Trust Policy Footer */}
            <div className="max-w-4xl mx-auto p-12 text-center opacity-30">
                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.4em]">
                    Digital Commitments • Local Trust
                </p>
            </div>
        </div>
    );
};

export default CustomerActivity;
