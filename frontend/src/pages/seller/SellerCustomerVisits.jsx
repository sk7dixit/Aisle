import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    FaUser, FaCheckCircle, FaClock, FaMapMarkerAlt, FaMobileAlt, 
    FaBox, FaQrcode, FaTimes, FaMoneyBillWave 
} from 'react-icons/fa';
import { 
    Clock, MessageSquare, Send, Check, AlertCircle, Calendar, 
    User, Phone, CheckCircle2, ShoppingBag, X, Ban 
} from 'lucide-react';
import QRScannerModal from '../../components/seller/QRScannerModal';

const SellerCustomerVisits = () => {
    const { token, user } = useAuth();
    const isHomeBusiness = user?.shopDetails?.shopType === 'HOME_BUSINESS' || user?.shopDetails?.shopCategory === 'Home Businesses' || user?.shopDetails?.category === 'Home Businesses';

    // Original State
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showScanner, setShowScanner] = useState(false);
    const [actionModal, setActionModal] = useState(null); 
    const [processing, setProcessing] = useState(false);

    // Home Business Custom State
    const [hbTab, setHbTab] = useState('PENDING'); // 'PENDING', 'ACCEPTED', 'ALTERNATIVE_SUGGESTED', 'COMPLETED', 'CANCELLED'
    const [hbOrders, setHbOrders] = useState([]);
    const [activeChatOrder, setActiveChatOrder] = useState(null); // The order object currently in chat view
    const [chatInput, setChatInput] = useState('');

    const fetchVisits = async () => {
        try {
            setLoading(true);
            if (isHomeBusiness) {
                const res = await fetch('/api/seller/creation-requests', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) {
                    throw new Error('Failed to fetch creation requests');
                }
                const data = await res.json();
                setHbOrders(Array.isArray(data) ? data : []);
            } else {
                const res = await fetch('/api/seller/customer-visits', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) {
                    throw new Error('Failed to fetch visits');
                }
                const data = await res.json();
                setVisits(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            setVisits([]);
            setHbOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVisits();
    }, []);

    // 1. Handle QR Scan (Original KIRANA Flow)
    const handleScanSuccess = async (decodedText) => {
        setShowScanner(false);
        setProcessing(true);

        try {
            let qrToken = decodedText;
            try {
                const parsed = JSON.parse(decodedText);
                if (parsed.qrToken) qrToken = parsed.qrToken;
            } catch (e) {
                // Raw string
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
                    alert(data.message);
                } else {
                    setActionModal(data);
                }
            } else {
                alert(data.message || "Scan Failed");
            }
        } catch (error) {
            console.error("Scan Error:", error);
            alert("Network Error during Scan");
        } finally {
            setProcessing(false);
        }
    };

    // 2. Complete Visit (Original KIRANA Flow)
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
                setActionModal(null);
                fetchVisits();
            } else {
                alert(data.message || "Completion Failed");
            }
        } catch (error) {
            console.error("Complete Error:", error);
        } finally {
            setProcessing(false);
        }
    };

    // 3. Home Business Status Transition
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
                alert(data.message || 'Failed to update request status.');
            }
        } catch (e) {
            console.error("Failed to update status", e);
            alert("Failed to update status.");
        }
    };


    // 4. Send Message in Customer Conversation
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
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading visits...</div>;

    // --- RENDER HOME BUSINESS EXPERIENCE ---
    if (isHomeBusiness) {
        const filteredHbOrders = hbOrders.filter(order => order.visitStatus === hbTab);

        const tabConfig = [
            { id: 'PENDING', label: 'New Requests', color: 'bg-amber-500 text-white' },
            { id: 'ACCEPTED', label: 'Preparing', color: 'bg-indigo-500 text-white' },
            { id: 'ALTERNATIVE_SUGGESTED', label: 'Proposed Alternatives', color: 'bg-orange-500 text-white' },
            { id: 'COMPLETED', label: 'Completed', color: 'bg-emerald-500 text-white' },
            { id: 'CANCELLED', label: 'Cancelled / Declined', color: 'bg-rose-500 text-white' },
        ];

        return (
            <div className="space-y-6 pb-24 relative min-h-screen font-sans">
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Creations Requests</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Creator Request negotiation desk</p>
                    </div>
                </header>

                {/* Status Navigation Tabs */}
                <div className="flex gap-2 p-1 bg-slate-100/80 rounded-2xl overflow-x-auto custom-scrollbar">
                    {tabConfig.map(tab => {
                        const count = hbOrders.filter(o => o.visitStatus === tab.id).length;
                        const isActive = hbTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setHbTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black tracking-tight uppercase transition-all whitespace-nowrap cursor-pointer
                                    ${isActive 
                                        ? 'bg-white text-slate-800 shadow-md' 
                                        : 'text-slate-550 hover:text-slate-800 hover:bg-white/40'
                                    }`}
                            >
                                <span>{tab.label}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black
                                    ${isActive 
                                        ? tab.color 
                                        : 'bg-slate-200 text-slate-650'
                                    }`}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Orders List */}
                {filteredHbOrders.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-50 text-slate-350 rounded-3xl flex items-center justify-center mb-4 border border-slate-100">
                            <ShoppingBag size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">No Requests in this Tab</h3>
                        <p className="text-slate-500 text-sm mt-1">Incoming creation requests matching this tab status will appear here.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {filteredHbOrders.map(order => (
                            <div key={order.visitId} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg relative flex flex-col justify-between hover:shadow-xl transition-all duration-300">
                                {/* Border stripe depending on status */}
                                <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-3xl
                                    ${order.visitStatus === 'PENDING' ? 'bg-amber-500' : ''}
                                    ${order.visitStatus === 'ACCEPTED' ? 'bg-indigo-500' : ''}
                                    ${order.visitStatus === 'ALTERNATIVE_SUGGESTED' ? 'bg-orange-500' : ''}
                                    ${order.visitStatus === 'COMPLETED' ? 'bg-emerald-500' : ''}
                                    ${order.visitStatus === 'CANCELLED' ? 'bg-rose-500' : ''}
                                `}></div>

                                <div className="pl-3 space-y-4">
                                    {/* Header */}
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                                                Request #{order.visitId.substring(order.visitId.length - 6).toUpperCase()}
                                            </span>
                                            <h3 className="text-lg font-extrabold text-slate-800 mt-2">{order.customerName}</h3>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-semibold">
                                                <Phone size={12} className="text-slate-400" />
                                                {order.customerMobile}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 justify-end">
                                                <Clock size={10} />
                                                {order.orderTime}
                                            </p>
                                            <span className="inline-block mt-2 px-2.5 py-1 rounded-lg text-[9px] font-black bg-indigo-50 text-indigo-700 uppercase tracking-wide border border-indigo-150">
                                                Direct Negotiation
                                            </span>
                                        </div>
                                    </div>

                                    {/* Product items */}
                                    <div className="space-y-2">
                                        {order.products.map((p, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm overflow-hidden">
                                                        {p.image ? (
                                                            <img src={`${p.image.startsWith('/') ? '' : '/'}${p.image}`} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <ShoppingBag size={14} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800">{p.name}</p>
                                                        <p className="text-[10px] text-slate-500 font-semibold">Qty: {p.qty} &bull; Price: ₹{p.price}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-black text-slate-800">₹{p.price * p.qty}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pickup Preference detail */}
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between text-xs font-bold text-slate-700">
                                        <span className="text-slate-400 uppercase tracking-wider text-[9px] font-black">Pickup Preference</span>
                                        <span>⏰ {order.visitTime}</span>
                                    </div>

                                    {/* Alternative Proposal Detail */}
                                    {order.alternativeProposal && (
                                        <div className="bg-orange-50/50 border border-orange-200/50 rounded-2xl p-3 text-xs text-orange-850">
                                            <p className="font-extrabold text-[9px] uppercase tracking-wider mb-0.5">Proposed Alternative</p>
                                            <p className="font-semibold leading-relaxed">"{order.alternativeProposal}"</p>
                                        </div>
                                    )}

                                    {/* Customer Note Box */}
                                    {order.customerNote && (
                                        <div className="bg-indigo-50/30 border border-indigo-100/50 rounded-2xl p-3.5 text-xs text-indigo-750">
                                            <p className="font-extrabold flex items-center gap-1.5 text-[9px] uppercase tracking-wider mb-1">
                                                <AlertCircle size={12} /> Message
                                            </p>
                                            <p className="font-medium leading-relaxed">"{order.customerNote}"</p>
                                        </div>
                                    )}

                                    {/* Action Status buttons & Chat trigger */}
                                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-50 mt-4">
                                        {/* Pending Status Buttons */}
                                        {order.visitStatus === 'PENDING' && (
                                            <>
                                                <button
                                                    onClick={() => handleHbStatusChange(order.visitId, 'ACCEPTED')}
                                                    className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer"
                                                >
                                                    <Check size={12} /> Accept
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const suggestion = prompt("Enter alternative pickup details:");
                                                        if (suggestion) handleHbStatusChange(order.visitId, 'ALTERNATIVE_SUGGESTED', suggestion);
                                                    }}
                                                    className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl border border-amber-200/40 flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <Clock size={12} /> Suggest Alternative
                                                </button>
                                                <button
                                                    onClick={() => handleHbStatusChange(order.visitId, 'CANCELLED')}
                                                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Ban size={12} /> Decline
                                                </button>
                                            </>
                                        )}

                                        {/* Accepted / Preparing status */}
                                        {order.visitStatus === 'ACCEPTED' && (
                                            <>
                                                <button
                                                    onClick={() => handleHbStatusChange(order.visitId, 'COMPLETED')}
                                                    className="bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/10 cursor-pointer"
                                                >
                                                    <CheckCircle2 size={12} /> Mark Completed
                                                </button>
                                                <button
                                                    onClick={() => handleHbStatusChange(order.visitId, 'CANCELLED')}
                                                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Ban size={12} /> Cancel Request
                                                </button>
                                            </>
                                        )}

                                        {/* Alternative Suggested status */}
                                        {order.visitStatus === 'ALTERNATIVE_SUGGESTED' && (
                                            <>
                                                <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl">
                                                    Waiting for Customer Response
                                                </span>
                                                <button
                                                    onClick={() => handleHbStatusChange(order.visitId, 'CANCELLED')}
                                                    className="ml-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Ban size={12} /> Cancel
                                                </button>
                                            </>
                                        )}

                                        {/* Chat/Conversation Button */}
                                        <button
                                            onClick={() => setActiveChatOrder(order)}
                                            className="ml-auto bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl border border-slate-200 flex items-center gap-1.5 cursor-pointer relative"
                                        >
                                            <MessageSquare size={12} />
                                            <span>Chat</span>
                                            {order.chatHistory && (
                                                <span className="w-2 h-2 bg-indigo-500 rounded-full absolute -top-0.5 -right-0.5 animate-pulse" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Customer Conversation Chat Drawer Overlay */}
                {activeChatOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs animate-fade-in">
                        {/* Backdrop Click */}
                        <div className="absolute inset-0" onClick={() => setActiveChatOrder(null)} />

                        {/* Chat Panel Content */}
                        <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col justify-between z-10 animate-slide-left border-l border-slate-100">
                            {/* Chat Header */}
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                        {activeChatOrder.customerName[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-slate-800">{activeChatOrder.customerName}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Order Chat</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setActiveChatOrder(null)}
                                    className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Chat Bubbles Scroll List */}
                            <div className="flex-1 p-5 overflow-y-auto bg-slate-50/50 space-y-4 custom-scrollbar">
                                <div className="text-center py-2">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-full">
                                        Relationship Chat
                                    </span>
                                </div>

                                {activeChatOrder.chatHistory?.map((msg, idx) => {
                                    const isSeller = msg.sender === 'seller';
                                    return (
                                        <div key={idx} className={`flex flex-col ${isSeller ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs
                                                ${isSeller 
                                                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                                                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                                                }`}
                                            >
                                                {msg.text}
                                            </div>
                                            <span className="text-[9px] text-slate-400 font-semibold mt-1 px-1">
                                                {msg.time}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Chat Footer Input */}
                            <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Ask for custom details or preferences..."
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/10 cursor-pointer"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- RENDER ORIGINAL KIRANA / RETAIL CHECKOUT EXPERIENCE ---
    const visitsToUse = visits;

    if (loading) return <div className="p-8 text-center text-slate-500">Loading visits...</div>;

    return (
        <div className="space-y-4 animate-fade-in-up pb-24 relative min-h-screen">
            {/* Header */}
            <header className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Customer Activity</h2>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{visitsToUse.length} Active</span>
            </header>

            {/* Empty State */}
            {visitsToUse.length === 0 && (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaUser size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">No Upcoming Visits</h3>
                    <p className="text-slate-500 text-sm">Customers will appear here when they plan a visit.</p>
                </div>
            )}

            {/* Visit Cards */}
            <div className="grid gap-4">
                {visitsToUse.map(visit => {
                    const isCompleted = visit.visitStatus === 'COMPLETED';
                    const isPaid = visit.paymentStatus === 'COMPLETED';
                    const isArrived = visit.visitStatus === 'ARRIVED';

                    return (
                        <div key={visit.visitId} className={`bg-white rounded-2xl p-5 border shadow-sm relative overflow-hidden transition-all ${isCompleted ? 'opacity-60 border-slate-100' : isArrived ? 'border-emerald-200 ring-1 ring-emerald-500 ring-offset-2' : 'border-slate-100'}`}>
                            {/* Status Stripe */}
                            <div className={`absolute top-0 left-0 w-1 h-full ${isCompleted ? 'bg-slate-300' : isArrived ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>

                            <div className="flex justify-between items-start mb-4 pl-3">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">{visit.customerName}</h3>
                                    {visit.customerMobile && (
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                                            <FaMobileAlt className="text-slate-400" />
                                            {visit.customerMobile}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                                        {new Date(visit.visitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wide ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                                        }`}>
                                        {visit.paymentMode === 'PAY_ON_VISIT' ? 'Pay on Visit' : 'Prepaid'}
                                    </span>
                                </div>
                            </div>

                            {/* Products */}
                            <div className="pl-3 mb-4 space-y-2">
                                {visit.products.map((p, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg">
                                        {p.image ? (
                                            <img src={p.image} alt={p.name} className="w-8 h-8 rounded bg-white object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-slate-300 text-xs">
                                                <FaBox />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-700 line-clamp-1">{p.name}</p>
                                            <p className="text-[10px] text-slate-500">Qty: {p.qty} × ₹{p.price}</p>
                                        </div>
                                        <div className="text-xs font-black text-slate-800">
                                            ₹{p.price * p.qty}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer Status */}
                            <div className="pl-3 flex items-center gap-4 text-xs font-bold border-t border-slate-50 pt-3">
                                <div className={`flex items-center gap-1.5 ${isCompleted ? 'text-slate-500' : isArrived ? 'text-emerald-600' : 'text-blue-600'}`}>
                                    {isCompleted ? <FaCheckCircle /> : <FaMapMarkerAlt />}
                                    <span className="uppercase tracking-wider">{visit.visitStatus}</span>
                                </div>

                                <div className="ml-auto text-slate-400">
                                    Total: <span className="text-slate-800 text-sm font-black ml-1">₹{visit.totalAmount}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Floating Scan Button */}
            <div className="fixed bottom-24 right-6 z-30">
                <button
                    onClick={() => setShowScanner(true)}
                    className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-900/40 hover:scale-105 active:scale-95 transition-all border-2 border-slate-700"
                >
                    <FaQrcode size={28} />
                </button>
            </div>

            {/* QR Scanner Modal */}
            {showScanner && (
                <QRScannerModal
                    onScan={handleScanSuccess}
                    onClose={() => setShowScanner(false)}
                />
            )}

            {/* Action Modal (PAID / PAY ON VISIT) */}
            {actionModal && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-slide-up relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-2 ${actionModal.type === 'PAID' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>

                        <button
                            onClick={() => setActionModal(null)}
                            className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 p-2"
                        >
                            <FaTimes size={20} />
                        </button>

                        <div className="text-center pt-4 mb-6">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${actionModal.type === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                                }`}>
                                {actionModal.type === 'PAID' ? <FaCheckCircle size={40} /> : <FaMoneyBillWave size={40} />}
                            </div>

                            <h3 className="text-2xl font-black text-slate-800 mb-2">
                                {actionModal.type === 'PAID' ? "Payment Completed" : "Collect Payment"}
                            </h3>

                            <p className="text-slate-500 font-medium leading-relaxed">
                                {actionModal.message}
                            </p>

                            <div className="mt-6 bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Total Amount</p>
                                <p className="text-3xl font-black text-slate-900">₹{actionModal.totalAmount}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleComplete}
                            disabled={processing}
                            className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg shadow-slate-200 transform transition-all active:scale-95 ${actionModal.type === 'PAID' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'
                                }`}
                        >
                            {processing ? "Processing..." : "Mark Visit Completed"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerCustomerVisits;
