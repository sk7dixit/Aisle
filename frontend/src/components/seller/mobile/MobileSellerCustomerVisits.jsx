import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { 
    ArrowLeft, Activity, Users, Calendar, Sparkles, MessageSquare, Plus, Send, X, 
    Clock, ShoppingBag, Phone, MapPin, Share2, Megaphone, Zap, Eye, Heart, 
    AlertCircle, Check, Ban, CheckCircle2, ChevronRight, HelpCircle
} from 'lucide-react';
import { FaQrcode, FaTimes, FaMoneyBillWave, FaCheckCircle } from 'react-icons/fa';
import QRScannerModal from '../QRScannerModal';
import toast from 'react-hot-toast';

const MobileSellerCustomerVisits = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    
    const isHomeBusiness = user?.shopDetails?.shopType === 'HOME_BUSINESS' || 
                           user?.shopDetails?.shopCategory === 'Home Businesses' || 
                           user?.shopDetails?.category === 'Home Businesses';

    // Data States
    const [visits, setVisits] = useState([]);
    const [hbOrders, setHbOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    
    // Scanner & Action States
    const [showScanner, setShowScanner] = useState(false);
    const [actionModal, setActionModal] = useState(null); 
    
    // Home Business State
    const [hbTab, setHbTab] = useState('PENDING'); // 'PENDING', 'ACCEPTED', 'ALTERNATIVE_SUGGESTED', 'COMPLETED', 'CANCELLED'
    const [activeChatOrder, setActiveChatOrder] = useState(null);
    const [chatInput, setChatInput] = useState('');
    
    // UI Drawer / Overlay States
    const [showQuickOffer, setShowQuickOffer] = useState(false);
    const [quickOfferText, setQuickOfferText] = useState('');
    const [showPromoteShop, setShowPromoteShop] = useState(false);
    const [showAdBoost, setShowAdBoost] = useState(false);
    const [showNearbyDemandInfo, setShowNearbyDemandInfo] = useState(null);

    const fetchVisits = async () => {
        try {
            setLoading(true);
            if (isHomeBusiness) {
                const res = await fetch('/api/seller/creation-requests', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch creation requests');
                const data = await res.json();
                setHbOrders(Array.isArray(data) ? data : []);
            } else {
                const res = await fetch('/api/seller/customer-visits', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch visits');
                const data = await res.json();
                setVisits(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            setVisits([]);
            setHbOrders([]);
            toast.error("Failed to load activities");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVisits();
    }, []);

    // QR Scan Handling (Kirana Flow)
    const handleScanSuccess = async (decodedText) => {
        setShowScanner(false);
        setProcessing(true);
        try {
            let qrToken = decodedText;
            try {
                const parsed = JSON.parse(decodedText);
                if (parsed.qrToken) qrToken = parsed.qrToken;
            } catch (e) {
                // Keep raw string
            }

            const res = await fetch('/api/customer-visits/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ qrToken })
            });

            const data = await res.json();
            if (res.ok) {
                if (data.type === 'INFO') {
                    toast.success(data.message);
                } else {
                    setActionModal(data);
                }
            } else {
                toast.error(data.message || "Scan Failed");
            }
        } catch (error) {
            console.error("Scan Error:", error);
            toast.error("Network error during scan");
        } finally {
            setProcessing(false);
        }
    };

    // Complete Visit (Kirana Flow)
    const handleComplete = async () => {
        if (!actionModal?.visitId) return;
        setProcessing(true);
        try {
            const res = await fetch(`/api/customer-visits/${actionModal.visitId}/complete`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Visit completed successfully!");
                setActionModal(null);
                fetchVisits();
            } else {
                toast.error(data.message || "Completion failed");
            }
        } catch (error) {
            console.error("Complete Error:", error);
            toast.error("Failed to complete visit");
        } finally {
            setProcessing(false);
        }
    };

    // Home Business Status Transition
    const handleHbStatusChange = async (orderId, newStatus, alternativeProposal = '') => {
        try {
            const res = await fetch(`/api/seller/creation-requests/${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus, alternativeProposal })
            });

            if (res.ok) {
                toast.success(`Request ${newStatus.toLowerCase()} successfully!`);
                setHbOrders(prev => prev.map(order => {
                    if (order.visitId === orderId) {
                        return { 
                            ...order, 
                            visitStatus: newStatus,
                            alternativeProposal: alternativeProposal || order.alternativeProposal
                        };
                    }
                    return order;
                }));
                
                if (activeChatOrder && activeChatOrder.visitId === orderId) {
                    setActiveChatOrder(prev => ({ 
                        ...prev, 
                        visitStatus: newStatus,
                        alternativeProposal: alternativeProposal || prev.alternativeProposal
                    }));
                }
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to update request status.');
            }
        } catch (e) {
            console.error("Failed to update status", e);
            toast.error("Failed to update status.");
        }
    };

    // Send chat message
    const handleSendMessage = () => {
        if (!chatInput.trim() || !activeChatOrder) return;
        
        const newMsg = {
            sender: 'seller',
            text: chatInput.trim(),
            time: 'Just now'
        };

        setHbOrders(prev => prev.map(order => {
            if (order.visitId === activeChatOrder.visitId) {
                return {
                    ...order,
                    chatHistory: [...(order.chatHistory || []), newMsg]
                };
            }
            return order;
        }));

        setActiveChatOrder(prev => ({
            ...prev,
            chatHistory: [...(prev.chatHistory || []), newMsg]
        }));

        setChatInput('');
        toast.success("Message sent");
    };

    // Utilities
    const copyShopLink = () => {
        const url = `https://aisle.com/shop/${user?.shopDetails?.shopName?.toLowerCase().replace(/\s+/g, '-') || 'kirana'}`;
        navigator.clipboard.writeText(url);
        toast.success("Shop Link copied to clipboard!");
    };

    const triggerQuickOffer = (e) => {
        e.preventDefault();
        if (!quickOfferText.trim()) return;
        toast.success(`Offer "${quickOfferText}" published successfully!`);
        setShowQuickOffer(false);
        setQuickOfferText('');
    };

    const triggerAdBoost = () => {
        setProcessing(true);
        setTimeout(() => {
            setProcessing(false);
            setShowAdBoost(false);
            toast.success("Shop Visibility Boosted! +50% expected views today.");
        }, 1200);
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col justify-center items-center gap-3 text-slate-400">
                <div className="w-8 h-8 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-bold uppercase tracking-wider">Analyzing Customer Activity...</span>
            </div>
        );
    }

    // Dynamic stats computation
    const totalPendingCount = isHomeBusiness 
        ? hbOrders.filter(o => o.visitStatus === 'PENDING').length 
        : visits.filter(v => v.visitStatus === 'UPCOMING' || v.visitStatus === 'ARRIVED').length;

    const todayCount = isHomeBusiness
        ? hbOrders.filter(o => o.visitStatus === 'PENDING' || o.visitStatus === 'ACCEPTED').length
        : visits.length;

    const weekCount = isHomeBusiness
        ? hbOrders.length
        : visits.length + 3; // Mocking a few past visits for week summary

    const interestedUsersCount = 12; // Standard requested summary card value

    return (
        <div className="p-4 space-y-6 pb-44 relative select-none">
            
            {/* --- HEADER --- */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/seller/home')}
                        className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-all active:scale-95 cursor-pointer"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight">Customer Activity</h1>
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                            {totalPendingCount} Upcoming Visits
                        </p>
                    </div>
                </div>

                {/* Top Header Scan QR Button (For Kirana checkouts) */}
                {!isHomeBusiness && (
                    <button
                        onClick={() => setShowScanner(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black rounded-xl border border-indigo-150 transition-all active:scale-95 cursor-pointer"
                    >
                        <FaQrcode size={12} />
                        <span>Scan QR</span>
                    </button>
                )}
            </div>

            {/* --- ACTIVITY SUMMARY CARD --- */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>
                
                <div className="flex items-center gap-2 mb-4">
                    <span className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
                        <Users size={16} />
                    </span>
                    <h3 className="font-extrabold text-sm tracking-tight text-indigo-200">Customer Activity</h3>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-b border-indigo-500/10">
                    <div className="text-center border-r border-indigo-500/15">
                        <span className="text-[9px] text-indigo-300 font-black uppercase tracking-wider block">Today's Visits</span>
                        <span className="text-xl font-black text-white mt-1 block">{todayCount}</span>
                    </div>
                    <div className="text-center border-r border-indigo-500/15">
                        <span className="text-[9px] text-indigo-300 font-black uppercase tracking-wider block">This Week</span>
                        <span className="text-xl font-black text-white mt-1 block">{weekCount}</span>
                    </div>
                    <div className="text-center">
                        <span className="text-[9px] text-indigo-300 font-black uppercase tracking-wider block">Interested</span>
                        <span className="text-xl font-black text-white mt-1 block">{interestedUsersCount}</span>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/seller/insights')}
                    className="w-full text-center text-xs font-bold text-indigo-300 hover:text-indigo-200 mt-4 flex items-center justify-center gap-1 transition-all"
                >
                    View Insights <ChevronRight size={14} />
                </button>
            </div>

            {/* --- UPCOMING VISITS SECTION --- */}
            <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                    <Calendar size={12} /> Upcoming Visits
                </h3>

                {/* --- RENDER HOME BUSINESS REQUESTS OR KIRANA VISITS --- */}
                {isHomeBusiness ? (
                    // Home Business Status Navigation Tabs
                    <div className="space-y-4">
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl overflow-x-auto scrollbar-none">
                            {[
                                { id: 'PENDING', label: 'New' },
                                { id: 'ACCEPTED', label: 'Preparing' },
                                { id: 'ALTERNATIVE_SUGGESTED', label: 'Proposed' },
                                { id: 'COMPLETED', label: 'Done' }
                            ].map(tab => {
                                const count = hbOrders.filter(o => o.visitStatus === tab.id).length;
                                const isActive = hbTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setHbTab(tab.id)}
                                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all whitespace-nowrap cursor-pointer
                                            ${isActive 
                                                ? 'bg-white text-slate-800 shadow-sm' 
                                                : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                    >
                                        <span>{tab.label}</span>
                                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black
                                            ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                                        >
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Home Business Creation Orders filtered list */}
                        {hbOrders.filter(o => o.visitStatus === hbTab).length === 0 ? (
                            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-xs flex flex-col items-center justify-center">
                                <ShoppingBag size={24} className="text-slate-300 mb-2" />
                                <p className="text-xs font-bold text-slate-600">No requests in this tab</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {hbOrders.filter(o => o.visitStatus === hbTab).map(order => (
                                    <div key={order.visitId} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>
                                        
                                        <div className="pl-2 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-extrabold text-sm text-slate-800">{order.customerName}</h4>
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5 font-semibold">
                                                        <Phone size={10} />
                                                        {order.customerMobile}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase block">
                                                        {order.orderTime || order.visitTime}
                                                    </span>
                                                    <span className="inline-block mt-1 text-[8px] font-black px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 uppercase">
                                                        Direct Negotiation
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Products Summary */}
                                            <div className="space-y-1.5">
                                                {order.products.map((p, idx) => (
                                                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl text-xs font-semibold text-slate-700">
                                                        <span>{p.name} (Qty: {p.qty})</span>
                                                        <span className="font-bold">₹{p.price * p.qty}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Alternative / Customer Notes */}
                                            {order.customerNote && (
                                                <div className="bg-indigo-50/50 p-2.5 rounded-xl text-[11px] text-indigo-850 font-medium">
                                                    "{order.customerNote}"
                                                </div>
                                            )}

                                            <div className="flex gap-2 pt-2 border-t border-slate-50">
                                                {order.visitStatus === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleHbStatusChange(order.visitId, 'ACCEPTED')}
                                                            className="px-3 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase rounded-xl flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <Check size={10} /> Accept
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const suggestion = prompt("Suggest alternative pickup details:");
                                                                if (suggestion) handleHbStatusChange(order.visitId, 'ALTERNATIVE_SUGGESTED', suggestion);
                                                            }}
                                                            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[10px] uppercase rounded-xl border border-amber-200/40 cursor-pointer"
                                                        >
                                                            Alternative
                                                        </button>
                                                        <button
                                                            onClick={() => handleHbStatusChange(order.visitId, 'CANCELLED')}
                                                            className="px-3 py-2 bg-rose-50 text-rose-600 font-bold text-[10px] uppercase rounded-xl cursor-pointer"
                                                        >
                                                            Decline
                                                        </button>
                                                    </>
                                                )}

                                                {order.visitStatus === 'ACCEPTED' && (
                                                    <button
                                                        onClick={() => handleHbStatusChange(order.visitId, 'COMPLETED')}
                                                        className="px-3 py-2 bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase rounded-xl flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <CheckCircle2 size={10} /> Mark Completed
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => setActiveChatOrder(order)}
                                                    className="ml-auto px-3.5 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[10px] uppercase rounded-xl flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <MessageSquare size={10} /> Chat
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    // Kirana customer visits list
                    <div className="space-y-4">
                        {visits.length === 0 ? (
                            /* --- UPGRADED EMPTY STATE --- */
                            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                                <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                                    <Users size={24} />
                                </div>
                                <h3 className="text-sm font-extrabold text-slate-800">No Customer Visits Yet</h3>
                                <p className="text-slate-500 text-[11px] leading-relaxed mt-1.5 max-w-[240px] mx-auto">
                                    When customers plan visits or interact with your shop, activity will appear here.
                                </p>
                                <div className="flex gap-2 mt-4 w-full justify-center">
                                    <button 
                                        onClick={copyShopLink}
                                        className="flex items-center gap-1 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow active:scale-95 cursor-pointer"
                                    >
                                        <Share2 size={10} /> Share Shop
                                    </button>
                                    <button 
                                        onClick={() => setShowAdBoost(true)}
                                        className="flex items-center gap-1 px-4 py-2 bg-indigo-650 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow active:scale-95 cursor-pointer"
                                    >
                                        <Zap size={10} /> Boost Visibility
                                    </button>
                                </div>
                            </div>
                        ) : (
                            visits.map(visit => {
                                const isArrived = visit.visitStatus === 'ARRIVED';
                                const isPaid = visit.paymentStatus === 'COMPLETED';
                                // Compute stable mock distance based on ID
                                const charSum = visit.visitId ? visit.visitId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 10;
                                const distanceVal = ((charSum % 5) + 1) * 0.4 + 0.2; // 0.6 km to 2.2 km

                                return (
                                    <div 
                                        key={visit.visitId} 
                                        className={`bg-white rounded-3xl p-4 border shadow-sm relative overflow-hidden transition-all ${
                                            isArrived ? 'border-emerald-300 ring-1 ring-emerald-500/20' : 'border-slate-100'
                                        }`}
                                    >
                                        <div className={`absolute top-0 left-0 w-1.5 h-full ${
                                            isArrived ? 'bg-emerald-500' : 'bg-indigo-600'
                                        }`}></div>

                                        <div className="pl-2 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                                                        <span>👤</span> {visit.customerName}
                                                    </h4>
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1 font-semibold">
                                                        <MapPin size={10} className="text-slate-400" />
                                                        <span>{distanceVal.toFixed(1)} km away</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase block">
                                                        {new Date(visit.visitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span className={`inline-block mt-1.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                                        isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-orange-50 text-orange-700 border border-orange-100'
                                                    }`}>
                                                        {visit.paymentMode === 'PAY_ON_VISIT' ? 'Pay on Visit' : 'Prepaid'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Products details */}
                                            <div className="bg-slate-50/70 p-2.5 rounded-2xl space-y-1.5 border border-slate-100">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Interested in:</span>
                                                {visit.products.map((p, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-xs font-semibold text-slate-700">
                                                        <span>{p.name} (Qty: {p.qty})</span>
                                                        <span className="font-bold">₹{p.price * p.qty}</span>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-200/50 font-black text-slate-800 mt-1">
                                                    <span>Total Amount</span>
                                                    <span>₹{visit.totalAmount}</span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2 pt-1 border-t border-slate-50">
                                                <button
                                                    onClick={() => {
                                                        // Fallback direct dial or prompt messaging
                                                        if (visit.customerMobile) {
                                                            window.location.href = `tel:${visit.customerMobile}`;
                                                            toast.success("Calling customer...");
                                                        } else {
                                                            toast.error("No contact number available");
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[10px] uppercase rounded-xl flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Phone size={10} /> Call Customer
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        // Mimic scan completion drawer/modal trigger
                                                        setActionModal({
                                                            visitId: visit.visitId,
                                                            customerName: visit.customerName,
                                                            totalAmount: visit.totalAmount,
                                                            type: isPaid ? 'PAID' : 'PAY_ON_VISIT',
                                                            message: isPaid 
                                                                ? "Payment already completed via UPI. You may hand over the products."
                                                                : "Payment pending. Please collect payment from the customer."
                                                        });
                                                    }}
                                                    className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase rounded-xl flex items-center gap-1 shadow-sm cursor-pointer"
                                                >
                                                    <CheckCircle2 size={10} /> Prepare Order
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        
                        {/* If visits exist, display the CTAs as helper shortcuts at the bottom of visits list */}
                        {visits.length > 0 && (
                            <div className="bg-slate-50 border border-slate-150 p-4 rounded-3xl flex justify-between items-center">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-700">Improve your reach today!</h4>
                                    <p className="text-[9px] text-slate-400 font-semibold">Get more customers scanning and visiting your catalog.</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button 
                                        onClick={() => setShowAdBoost(true)} 
                                        className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-200/50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-lg uppercase cursor-pointer"
                                    >
                                        Run Ad
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* --- AISLE AI SUGGESTIONS --- */}
            <div className="bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-transparent border border-indigo-500/15 rounded-3xl p-4 shadow-xs space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full pointer-events-none"></div>
                
                <div className="flex justify-between items-center pb-2 border-b border-indigo-500/10">
                    <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5">
                        <Sparkles size={12} className="text-violet-600 animate-pulse" /> Aisle AI Suggestions
                    </span>
                    <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Active</span>
                </div>

                <div className="space-y-2.5 pl-1.5">
                    <button 
                        onClick={() => navigate('/seller/products')}
                        className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold hover:text-indigo-700 text-left w-full cursor-pointer"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-650 shrink-0"></span>
                        <span>Add 3 trending products to match local demand</span>
                    </button>
                    <button 
                        onClick={() => navigate('/seller/profile')}
                        className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold hover:text-indigo-700 text-left w-full cursor-pointer"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-650 shrink-0"></span>
                        <span>Upload shop banner to increase profile completion</span>
                    </button>
                    <button 
                        onClick={() => setShowQuickOffer(true)}
                        className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold hover:text-indigo-700 text-left w-full cursor-pointer"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-650 shrink-0"></span>
                        <span>Enable offers to capture weekend buyers</span>
                    </button>
                </div>

                <button 
                    onClick={() => toast.success("AI is updating real-time parameters...")}
                    className="w-full text-center text-[10px] font-black text-indigo-650 hover:text-indigo-700 uppercase tracking-widest pt-1"
                >
                    [ See All ]
                </button>
            </div>

            {/* --- NEARBY CUSTOMER INTEREST (LEAD GEN) --- */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1">
                        <Zap size={12} className="text-orange-500" /> Nearby Demand
                    </h3>
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Hot Leads
                    </span>
                </div>

                <div className="space-y-3 pt-1">
                    {[
                        { name: "Organic Honey", count: 12, reason: "High searches in Palasia region. Users interested in breakfast toppings." },
                        { name: "Brown Bread", count: 8, reason: "Fastest-growing keyword this weekend. High correlation with organic spreads." },
                        { name: "Protein Powder", count: 6, reason: "Spike in searches from health clubs nearby Vadodara gym circles." }
                    ].map((demand, idx) => (
                        <div 
                            key={idx}
                            onClick={() => setShowNearbyDemandInfo(demand)}
                            className="p-3 bg-slate-50/70 border border-slate-100 rounded-2xl flex justify-between items-center hover:bg-indigo-50/30 transition-all cursor-pointer"
                        >
                            <div>
                                <h4 className="text-xs font-bold text-slate-800">{demand.name}</h4>
                                <p className="text-[9px] text-slate-400 font-semibold">Tapping will show buyer metrics</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-black text-slate-700 block">{demand.count} buyers</span>
                                <span className="text-[9px] text-slate-400 font-bold block">searching</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- RECENT ACTIVITY TIMELINE --- */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Recent Activity</h3>
                
                <div className="space-y-4 pl-2 relative">
                    {/* Vertical timeline connector */}
                    <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-100"></div>

                    {[
                        { icon: "👁️", text: "Rahul viewed your shop", time: "5 min ago" },
                        { icon: "❤️", text: "2 customers added products to Interested", time: "20 min ago" },
                        { icon: "📍", text: "New request nearby", time: "2 hours ago" }
                    ].map((act, idx) => (
                        <div key={idx} className="flex gap-4 relative items-start">
                            <span className="w-6 h-6 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] z-10 shrink-0">
                                {act.icon}
                            </span>
                            <div className="space-y-0.5">
                                <p className="text-xs text-slate-700 font-semibold">{act.text}</p>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{act.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- BOTTOM FLOATING ACTIONS --- */}
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex gap-3 w-[90%] max-w-sm">
                <button 
                    onClick={() => setShowPromoteShop(true)}
                    className="flex-1 bg-slate-900 text-white py-3.5 rounded-2xl font-black text-xs shadow-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                    <Megaphone size={14} /> Promote Shop
                </button>
                <button 
                    onClick={() => setShowQuickOffer(true)}
                    className="flex-1 bg-indigo-650 text-white py-3.5 rounded-2xl font-black text-xs shadow-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                    <Plus size={14} /> Create Offer
                </button>
            </div>

            {/* --- MODAL DIALOGS --- */}

            {/* QR Scanner Overlay Modal */}
            {showScanner && (
                <QRScannerModal
                    onScanSuccess={handleScanSuccess}
                    onScan={handleScanSuccess}
                    onClose={() => setShowScanner(false)}
                />
            )}

            {/* Kirana Action Modal (PAY ON VISIT / PAID) */}
            {actionModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white w-full max-w-sm rounded-t-[2.5rem] rounded-b-[2.5rem] p-6 shadow-2xl relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-2 ${actionModal.type === 'PAID' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>

                        <button
                            onClick={() => setActionModal(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 cursor-pointer"
                        >
                            <FaTimes size={16} />
                        </button>

                        <div className="text-center pt-4 mb-6">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${actionModal.type === 'PAID' ? 'bg-emerald-55 text-emerald-600' : 'bg-orange-55 text-orange-600'}`}>
                                {actionModal.type === 'PAID' ? <FaCheckCircle size={32} /> : <FaMoneyBillWave size={32} />}
                            </div>

                            <h3 className="text-xl font-black text-slate-800 mb-1.5">
                                {actionModal.type === 'PAID' ? "Payment Completed" : "Collect Payment"}
                            </h3>

                            <p className="text-slate-500 text-xs font-semibold leading-relaxed px-4">
                                {actionModal.message}
                            </p>

                            <div className="mt-5 bg-slate-50 rounded-2xl p-4 border border-slate-100 max-w-[240px] mx-auto">
                                <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mb-0.5">Total Amount</p>
                                <p className="text-2xl font-black text-slate-900">₹{actionModal.totalAmount}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleComplete}
                            disabled={processing}
                            className={`w-full py-3.5 rounded-2xl font-black text-sm text-white shadow-lg transform transition-all active:scale-95 cursor-pointer ${
                                actionModal.type === 'PAID' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10' : 'bg-slate-900 hover:bg-slate-850'
                            }`}
                        >
                            {processing ? "Processing..." : "Mark Visit Completed"}
                        </button>
                    </div>
                </div>
            )}

            {/* Home Business Message Chat Drawer */}
            {activeChatOrder && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs">
                    <div className="w-full h-[85vh] bg-white rounded-t-[2.5rem] shadow-2xl flex flex-col justify-between">
                        {/* Header */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-650 font-black text-xs">
                                    {activeChatOrder.customerName[0]}
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-xs text-slate-800">{activeChatOrder.customerName}</h3>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Negotiation Chat</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveChatOrder(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-4">
                            <div className="text-center">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                                    Aisle Encrypted chat
                                </span>
                            </div>

                            {activeChatOrder.chatHistory?.map((msg, idx) => {
                                const isSeller = msg.sender === 'seller';
                                return (
                                    <div key={idx} className={`flex flex-col ${isSeller ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed font-semibold shadow-xs
                                            ${isSeller 
                                                ? 'bg-indigo-600 text-white rounded-tr-none' 
                                                : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                                            }`}
                                        >
                                            {msg.text}
                                        </div>
                                        <span className="text-[8px] text-slate-400 font-bold mt-1 px-1">{msg.time}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer Input */}
                        <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Propose pickup details or discounts..."
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                            />
                            <button
                                onClick={handleSendMessage}
                                className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow transition-all active:scale-95 cursor-pointer"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Offer Builder Dialog */}
            {showQuickOffer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative">
                        <button 
                            onClick={() => setShowQuickOffer(false)} 
                            className="absolute top-4 right-4 p-1 rounded-full text-slate-450 hover:bg-slate-100 cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                        
                        <div className="text-center mb-5">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-650 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Plus size={24} />
                            </div>
                            <h3 className="text-lg font-black text-slate-800">Create Quick Offer</h3>
                            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">Broadcast a discount offer to nearby buyers</p>
                        </div>

                        <form onSubmit={triggerQuickOffer} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Offer details</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="e.g. 10% off on Organic Honey"
                                    value={quickOfferText}
                                    onChange={e => setQuickOfferText(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <button 
                                type="submit"
                                className="w-full py-3 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow cursor-pointer"
                            >
                                Publish to Map
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Promote Shop Drawer */}
            {showPromoteShop && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white w-full rounded-t-[2.5rem] p-6 shadow-2xl relative text-center">
                        <button 
                            onClick={() => setShowPromoteShop(false)} 
                            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-450 hover:bg-slate-100 cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                        
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-650 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Megaphone size={20} />
                        </div>
                        
                        <h3 className="text-lg font-black text-slate-800">Promote Your Shop</h3>
                        <p className="text-xs text-slate-400 font-semibold max-w-[280px] mx-auto leading-relaxed mt-1">
                            Share your virtual shelf link with your customers to get them scanning!
                        </p>

                        <div className="my-5 p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-xs text-slate-600 font-semibold">
                            <span className="truncate pr-4">https://aisle.com/shop/{user?.shopDetails?.shopName?.toLowerCase().replace(/\s+/g, '-') || 'kirana'}</span>
                            <button 
                                onClick={copyShopLink}
                                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase shrink-0 cursor-pointer"
                            >
                                Copy Link
                            </button>
                        </div>

                        <button 
                            onClick={() => { setShowPromoteShop(false); setShowAdBoost(true); }}
                            className="w-full py-3.5 bg-slate-900 hover:bg-slate-850 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                        >
                            Launch Location Ads
                        </button>
                    </div>
                </div>
            )}

            {/* Ad Boost Confirmation Modal */}
            {showAdBoost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative text-center">
                        <button 
                            onClick={() => setShowAdBoost(false)} 
                            className="absolute top-4 right-4 p-1 rounded-full text-slate-450 hover:bg-slate-100 cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                        
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-650 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Zap size={24} className="animate-pulse" />
                        </div>

                        <h3 className="text-lg font-black text-slate-800">Boost Store Visibility</h3>
                        <p className="text-xs text-slate-400 font-semibold leading-relaxed mt-1 px-4">
                            Spend budget credits to increase search presence in Palasia/Vijay Nagar by 2.5x today.
                        </p>

                        <div className="mt-5 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 text-left space-y-2 max-w-[260px] mx-auto">
                            <div className="flex justify-between text-xs font-semibold text-slate-650">
                                <span>Budget Credits Available:</span>
                                <span className="font-extrabold text-slate-850">840 Credits</span>
                            </div>
                            <div className="flex justify-between text-xs font-semibold text-slate-650">
                                <span>Boost Cost:</span>
                                <span className="font-extrabold text-rose-600">-50 Credits</span>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button 
                                onClick={() => setShowAdBoost(false)}
                                className="flex-1 py-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-black uppercase rounded-xl cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={triggerAdBoost}
                                disabled={processing}
                                className="flex-1 py-3 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-black uppercase rounded-xl shadow cursor-pointer"
                            >
                                {processing ? "Processing..." : "Confirm Boost"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Nearby Demand Details Popup */}
            {showNearbyDemandInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative text-center">
                        <button 
                            onClick={() => setShowNearbyDemandInfo(null)} 
                            className="absolute top-4 right-4 p-1 rounded-full text-slate-450 hover:bg-slate-100 cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                        
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-650 rounded-full flex items-center justify-center mx-auto mb-3">
                            <HelpCircle size={24} />
                        </div>

                        <h3 className="text-lg font-black text-slate-800">Demand for {showNearbyDemandInfo.name}</h3>
                        <p className="text-xs text-slate-400 font-semibold leading-relaxed mt-1 px-4">
                            {showNearbyDemandInfo.reason}
                        </p>

                        <div className="my-5 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-1.5 max-w-[260px] mx-auto">
                            <div className="flex justify-between text-xs font-bold text-slate-650">
                                <span>Recent Searches:</span>
                                <span className="font-extrabold text-slate-800">{showNearbyDemandInfo.count} buyers</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-slate-650">
                                <span>Conversion potential:</span>
                                <span className="text-emerald-600 font-extrabold">High</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => {
                                setShowNearbyDemandInfo(null);
                                navigate('/seller/products');
                            }}
                            className="w-full py-3 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow cursor-pointer"
                        >
                            Add Product to Catalog
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default MobileSellerCustomerVisits;
