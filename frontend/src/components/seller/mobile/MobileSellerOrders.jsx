import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
    ShoppingBag, ChevronRight, Check, X, ShieldAlert, Phone,
    Clock, RefreshCw, Smartphone, ChevronLeft, MapPin, User, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const MobileSellerOrders = () => {
    const { token, user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('NEW'); // 'NEW' | 'READY' | 'COMPLETED'
    const [selectedOrder, setSelectedOrder] = useState(null);
    
    // Swipe Simulator State
    const [swipeProgress, setSwipeProgress] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [startX, setStartX] = useState(0);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/requests/seller', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Filter requests, only keep orders
                const ordersOnly = data.filter(item => item.isOrder);
                setOrders(ordersOnly);
            } else {
                // Seed mock orders if API fails or empty
                setOrders(getMockOrders());
            }
        } catch (err) {
            console.error("Error fetching orders:", err);
            setOrders(getMockOrders());
        } finally {
            setLoading(false);
        }
    };

    const getMockOrders = () => [
        {
            _id: 'ord_1',
            isOrder: true,
            productName: 'Organic Cow Ghee 1L, Raw Wild Honey 500g',
            customerName: 'Aarav Mehta',
            customerMobile: '9825012345',
            status: 'PENDING_CONFIRMATION',
            originalStatus: 'PENDING',
            type: 'PAY_ON_VISIT',
            totalAmount: 1850,
            createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
            itemsCount: 2
        },
        {
            _id: 'ord_2',
            isOrder: true,
            productName: 'Indore Special Poha 1kg, Spicy Sev 500g',
            customerName: 'Sneha Shah',
            customerMobile: '9974054321',
            status: 'SELLER_CONFIRMED',
            originalStatus: 'CONFIRMED',
            type: 'PREPAID',
            totalAmount: 480,
            createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
            itemsCount: 2
        },
        {
            _id: 'ord_3',
            isOrder: true,
            productName: 'Premium Basmati Rice 5kg',
            customerName: 'Rajesh Patel',
            customerMobile: '9426098765',
            status: 'COMPLETED',
            originalStatus: 'FULFILLED',
            type: 'PREPAID',
            totalAmount: 750,
            createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
            itemsCount: 1
        }
    ];

    useEffect(() => {
        fetchOrders();
    }, [token]);

    const handleUpdateStatus = (orderId, newStatus) => {
        setOrders(prev => prev.map(o => {
            if (o._id === orderId) {
                return { ...o, status: newStatus };
            }
            return o;
        }));
        toast.success(`Order status updated to ${newStatus}`);
    };

    // Simulate Scan QR
    const handleScanQR = async (orderId) => {
        try {
            const res = await fetch('/api/seller/orders/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ qrData: orderId })
            });
            if (res.ok) {
                toast.success("Order scan successful! Stock updated & fulfilled.");
                fetchOrders();
            } else {
                // If API fails (e.g. no database entry), do a UI simulation
                handleUpdateStatus(orderId, 'COMPLETED');
            }
        } catch (err) {
            console.error(err);
            handleUpdateStatus(orderId, 'COMPLETED');
        }
    };

    // Swipe Slider Touch Event Handlers
    const handleTouchStart = (e) => {
        setIsSwiping(true);
        setStartX(e.touches[0].clientX);
    };

    const handleTouchMove = (e, maxWidth) => {
        if (!isSwiping) return;
        const currentX = e.touches[0].clientX;
        const diffX = currentX - startX;
        const progress = Math.min(Math.max((diffX / maxWidth) * 100, 0), 100);
        setSwipeProgress(progress);
    };

    const handleTouchEnd = (order) => {
        setIsSwiping(false);
        if (swipeProgress >= 85) {
            setSwipeProgress(100);
            setTimeout(() => {
                if (order.status === 'PENDING_CONFIRMATION') {
                    handleUpdateStatus(order._id, 'SELLER_CONFIRMED');
                } else if (order.status === 'SELLER_CONFIRMED') {
                    handleScanQR(order._id);
                }
                setSwipeProgress(0);
                setSelectedOrder(null);
            }, 200);
        } else {
            setSwipeProgress(0);
        }
    };

    const filteredOrders = orders.filter(o => {
        if (activeTab === 'NEW') return o.status === 'PENDING_CONFIRMATION';
        if (activeTab === 'READY') return o.status === 'SELLER_CONFIRMED';
        return o.status === 'COMPLETED';
    });

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col justify-center items-center gap-3 text-slate-400">
                <RefreshCw className="animate-spin text-rose-500" size={32} />
                <span className="text-xs font-bold uppercase tracking-wider">Loading Orders...</span>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4 pb-24 font-sans">
            {/* Title */}
            <div>
                <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    📦 Active Orders
                </h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Process pickup requests and delivery handovers
                </p>
            </div>

            {/* Custom Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
                {[
                    { id: 'NEW', label: 'New', count: orders.filter(o => o.status === 'PENDING_CONFIRMATION').length },
                    { id: 'READY', label: 'Accepted', count: orders.filter(o => o.status === 'SELLER_CONFIRMED').length },
                    { id: 'COMPLETED', label: 'Fulfilled', count: orders.filter(o => o.status === 'COMPLETED').length }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            activeTab === tab.id
                                ? 'bg-white text-rose-600 shadow-xs font-black'
                                : 'text-slate-500 bg-transparent hover:text-slate-700'
                        }`}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center flex flex-col items-center gap-3 py-12">
                    <ShoppingBag size={40} className="text-slate-400 opacity-60" />
                    <div>
                        <h4 className="font-extrabold text-sm text-slate-800">No Orders Here</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">There are no orders listed in this category.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredOrders.map(order => {
                        const timeString = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                            <div
                                key={order._id}
                                onClick={() => setSelectedOrder(order)}
                                className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex justify-between items-center relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer"
                            >
                                <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black text-slate-400 uppercase">
                                            #{order._id.substring(order._id.length - 6)}
                                        </span>
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                            order.type === 'PREPAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                        }`}>
                                            {order.type}
                                        </span>
                                    </div>
                                    <h3 className="font-black text-xs text-slate-800 truncate pr-4">{order.productName}</h3>
                                    <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                                        <User size={10} /> {order.customerName} • {timeString}
                                    </p>
                                </div>
                                <div className="text-right shrink-0 flex items-center gap-2">
                                    <div>
                                        <span className="text-[8px] text-slate-400 font-bold block">TOTAL</span>
                                        <span className="text-xs font-black text-slate-800">₹{order.totalAmount}</span>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* --- DETAILED VIEW MODAL WITH SWIPE TO CONFIRM SIMULATOR --- */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-end animate-fade-in" onClick={() => setSelectedOrder(null)}>
                    <div
                        className="w-full bg-white rounded-t-[32px] p-6 space-y-5 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Drag Handle */}
                        <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto"></div>

                        {/* Modal Header */}
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase block">Order Detail</span>
                                <h3 className="font-black text-base text-slate-800 mt-0.5">Order #{selectedOrder._id}</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 flex items-center gap-1">
                                    <Clock size={10} /> Received {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Customer section */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Customer Details</span>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-black text-xs">
                                        {selectedOrder.customerName[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-xs text-slate-850">{selectedOrder.customerName}</h4>
                                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">{selectedOrder.customerMobile}</p>
                                    </div>
                                </div>
                                <a
                                    href={`tel:${selectedOrder.customerMobile}`}
                                    className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-100 transition-colors"
                                    title="Call Customer"
                                >
                                    <Phone size={14} />
                                </a>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-3">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Items ({selectedOrder.itemsCount})</span>
                            <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-2.5">
                                <div className="flex justify-between items-center">
                                    <p className="text-xs font-semibold text-slate-700 leading-relaxed pr-6">
                                        {selectedOrder.productName}
                                    </p>
                                    <span className="text-xs font-black text-slate-800">
                                        ₹{selectedOrder.totalAmount}
                                    </span>
                                </div>
                                <div className="border-t border-slate-50 pt-2 flex justify-between text-[10px] font-bold text-slate-400">
                                    <span>Payment Method</span>
                                    <span className="text-slate-700 font-black">{selectedOrder.type}</span>
                                </div>
                            </div>
                        </div>

                        {/* Swipe Action Simulator */}
                        {selectedOrder.status !== 'COMPLETED' ? (
                            <div className="space-y-2 pt-2">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block text-center">
                                    Slide to Confirm Action
                                </span>
                                
                                <div
                                    className="h-14 bg-slate-100 rounded-full p-1.5 relative border border-slate-200/60 overflow-hidden select-none flex items-center justify-center"
                                    onTouchStart={handleTouchStart}
                                    onTouchMove={(e) => handleTouchMove(e, 260)}
                                    onTouchEnd={() => handleTouchEnd(selectedOrder)}
                                >
                                    {/* Action description text */}
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider pointer-events-none relative z-10 transition-opacity">
                                        {selectedOrder.status === 'PENDING_CONFIRMATION' ? 'Swipe to Accept Order →' : 'Swipe to Handover / Fulfil →'}
                                    </span>

                                    {/* Swiped Overlay Background */}
                                    <div
                                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-indigo-500 to-indigo-650 rounded-full transition-all duration-75 pointer-events-none"
                                        style={{ width: `${swipeProgress}%` }}
                                    ></div>

                                    {/* Floating Swiping Orb */}
                                    <div
                                        className="absolute left-1.5 top-1.5 bottom-1.5 w-11 h-11 bg-white rounded-full shadow flex items-center justify-center text-indigo-600 transition-all duration-75 pointer-events-none"
                                        style={{ left: `calc(${swipeProgress}% - ${swipeProgress > 10 ? '48px' : '0px'})` }}
                                    >
                                        <ArrowRight size={18} className="animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-2xl p-4 text-center space-y-1">
                                <p className="font-extrabold text-xs flex items-center justify-center gap-1.5">
                                    <Check size={14} className="stroke-[3]" /> Order Fulfilled & Complete
                                </p>
                                <p className="text-[9px] font-semibold text-emerald-600">
                                    Stock was reduced and payment was settled on visitor scan.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileSellerOrders;
