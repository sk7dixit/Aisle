import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    Send,
    Headset,
    ShoppingBag,
    Wrench,
    Store,
    Smartphone,
    HelpCircle,
    ArrowRight,
    Phone,
    Navigation,
    Heart,
    Sparkles,
    Clock,
    CheckCircle,
    CloudRain,
    Sun,
    Calendar,
    ChevronRight,
    Repeat,
    ArrowLeft,
    AlertTriangle,
    ShieldCheck,
    TrendingUp,
    Percent,
    Mic,
    Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const SupportPanel = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [activeCategory, setActiveCategory] = useState(null);
    
    // Geolocation state
    const [coords, setCoords] = useState({ lat: null, lng: null });

    // Personalization Profile State
    const [profileData, setProfileData] = useState(null);

    // Phase 6 Proactive Success States
    const [insights, setInsights] = useState(null);
    const [actionCenter, setActionCenter] = useState([]);
    const [customerHealth, setCustomerHealth] = useState(null);
    const [activeSection, setActiveSection] = useState(null);
    const [sectionData, setSectionData] = useState(null);
    const [loadingSection, setLoadingSection] = useState(false);

    // Quote Negotiation State
    const [negotiatingProduct, setNegotiatingProduct] = useState(null);
    const [targetPrice, setTargetPrice] = useState("");
    const [quoteResult, setQuoteResult] = useState(null);
    const [submittingQuote, setSubmittingQuote] = useState(false);

    // Phase 7 Aisle OS States
    const [isRecordingVoice, setIsRecordingVoice] = useState(false);
    const [voiceCountdown, setVoiceCountdown] = useState(3);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    // Order summary state for Phase 4 AI Status Card
    const [orderSummary, setOrderSummary] = useState({
        totalActive: 0,
        delayedCount: 0,
        pendingRefunds: 0
    });

    // AI Thinking States
    const [isTyping, setIsTyping] = useState(false);
    const [thinkingText, setThinkingText] = useState("");
    
    // Escalation State
    const [escalationStep, setEscalationStep] = useState('idle');

    // Suggested Reply Chips
    const [suggestedReplies, setSuggestedReplies] = useState([]);

    // Conversation Memory
    const [memory, setMemory] = useState({
        sellerName: null,
        orderId: null,
        productName: null,
        budget: null,
        lastTopic: null,
        lastProductId: null,
        lastProductName: null
    });

    const messagesEndRef = useRef(null);

    // Initial Welcome Message RESET on Open, Geolocation, and Profile Fetch
    useEffect(() => {
        if (isOpen) {
            setMessages([]);
            setInputValue("");
            setActiveCategory(null);
            setIsTyping(false);
            setThinkingText("");
            setEscalationStep('idle');
            setSuggestedReplies([]);
            setProfileData(null);
            setInsights(null);
            setActionCenter([]);
            setCustomerHealth(null);
            setActiveSection(null);
            setSectionData(null);
            setNegotiatingProduct(null);
            setQuoteResult(null);
            setTargetPrice("");
            setMemory({
                sellerName: null,
                orderId: null,
                productName: null,
                budget: null,
                lastTopic: null,
                lastProductId: null,
                lastProductName: null
            });

            // Get user location
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setCoords({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        });
                    },
                    (error) => {
                        console.warn("Geolocation permission not granted or failed:", error);
                    }
                );
            }

            // Fetch personalized customer profile
            const fetchProfile = async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) return;

                    const res = await fetch('http://localhost:5000/api/customer/profile', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setProfileData(data);
                    }

                    // Query real-time orders to calculate summary counts (Phase 4 AI Status Card)
                    const ordersRes = await fetch('http://localhost:5000/api/customer/orders', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (ordersRes.ok) {
                        const ordersData = await ordersRes.json();
                        const active = ordersData.filter(o => !['CANCELLED', 'FULFILLED', 'COMPLETED', 'MISSED'].includes(o.status));
                        
                        // Check for delay details
                        const delayedCount = active.filter(o => {
                            const createdTime = new Date(o.createdAt);
                            const diffMinutes = Math.floor((Date.now() - createdTime) / 60000);
                            return diffMinutes > 15;
                        }).length;

                        // Fetch tickets to calculate pending refunds count
                        const ticketsRes = await fetch('http://localhost:5000/api/customer/tickets', {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        let pendingRefunds = 0;
                        if (ticketsRes.ok) {
                            const ticketsData = await ticketsRes.json();
                            pendingRefunds = ticketsData.filter(t => t.priority === 'high' && t.status === 'open').length;
                        }

                        setOrderSummary({
                            totalActive: active.length,
                            delayedCount,
                            pendingRefunds
                        });
                    }

                    // Fetch Phase 6 customer success and insights
                    const headers = { 'Authorization': `Bearer ${token}` };
                    
                    const insightsRes = await fetch('http://localhost:5000/api/customer/insights', { headers });
                    if (insightsRes.ok) {
                        const data = await insightsRes.json();
                        setInsights(data);
                    }
                    
                    const actionCenterRes = await fetch('http://localhost:5000/api/customer/action-center', { headers });
                    if (actionCenterRes.ok) {
                        const data = await actionCenterRes.json();
                        setActionCenter(data);
                    }

                    const healthRes = await fetch('http://localhost:5000/api/customer/customer-health', { headers });
                    if (healthRes.ok) {
                        const data = await healthRes.json();
                        setCustomerHealth(data);
                    }
                } catch (e) {
                    console.error("Failed to fetch customer profile/orders summary/success data:", e);
                }
            };
            fetchProfile();
        }
    }, [isOpen, user]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping, thinkingText]);

    // Phase 6 Active Section Data Loader
    useEffect(() => {
        if (!activeSection) {
            setSectionData(null);
            return;
        }

        const fetchSectionData = async () => {
            setLoadingSection(true);
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                let url = '';
                
                if (activeSection === 'orders') {
                    url = 'http://localhost:5000/api/customer/orders';
                } else if (activeSection === 'recommendations') {
                    url = 'http://localhost:5000/api/customer/recommendations?q=gift';
                } else if (activeSection === 'alerts') {
                    url = 'http://localhost:5000/api/customer/alerts';
                } else if (activeSection === 'businesses') {
                    url = 'http://localhost:5000/api/customer/home-businesses';
                } else if (activeSection === 'trending') {
                    url = 'http://localhost:5000/api/customer/trending';
                } else if (activeSection === 'price-drops') {
                    url = 'http://localhost:5000/api/customer/price-drops';
                }

                if (url) {
                    const res = await fetch(url, { headers });
                    if (res.ok) {
                        const data = await res.json();
                        setSectionData(data);
                    }
                }
            } catch (err) {
                console.error("Error fetching section data:", err);
            } finally {
                setLoadingSection(false);
            }
        };

        fetchSectionData();
    }, [activeSection]);

    // Phase 7 Aisle OS Assistant Handlers
    const triggerVoiceAssistant = () => {
        setIsRecordingVoice(true);
        setVoiceCountdown(3);
        
        let count = 3;
        const interval = setInterval(() => {
            count--;
            setVoiceCountdown(count);
            if (count === 0) {
                clearInterval(interval);
                setIsRecordingVoice(false);
                processUserMessage("Order milk from my usual shop");
            }
        }, 1000);
    };

    const handleImageSearchSelect = (imageType) => {
        setIsUploadingImage(false);
        if (imageType === 'chair') {
            processUserMessage("visual search chair");
        } else {
            processUserMessage("visual search cake");
        }
    };

    // Negotiation quote actions
    const submitQuote = async () => {
        if (!negotiatingProduct || !targetPrice) return;
        setSubmittingQuote(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/customer/request-quote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    productId: negotiatingProduct._id,
                    targetPrice: parseFloat(targetPrice)
                })
            });
            if (res.ok) {
                const data = await res.json();
                setQuoteResult(data);
            }
        } catch (e) {
            console.error("Failed to submit quote:", e);
        } finally {
            setSubmittingQuote(false);
        }
    };

    const acceptQuoteDeal = (deal) => {
        setActiveSection(null);
        setNegotiatingProduct(null);
        setQuoteResult(null);
        setTargetPrice("");
        processUserMessage(`I accept ${deal.shopName || 'Indore Electronics Hub'} quote deal for final price ₹${deal.finalPrice}`);
    };

    // Agent Avatars & Badges helper mapping
    const getAgentIcon = (agentName) => {
        switch (agentName) {
            case 'Shopping Agent': return <Sparkles size={11} className="text-violet-500 animate-pulse" />;
            case 'Order Agent': return <ShoppingBag size={11} className="text-blue-500" />;
            case 'Booking Agent': return <Calendar size={11} className="text-emerald-500" />;
            case 'Seller Agent': return <Store size={11} className="text-amber-500" />;
            default: return <Headset size={11} className="text-slate-500" />;
        }
    };

    const getAgentBadgeStyle = (agentName) => {
        switch (agentName) {
            case 'Shopping Agent': return 'bg-violet-50 text-violet-700 border-violet-100';
            case 'Order Agent': return 'bg-blue-50 text-blue-750 border-blue-100';
            case 'Booking Agent': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Seller Agent': return 'bg-amber-50 text-amber-700 border-amber-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    // Rendering content for active sections
    const renderSectionContent = () => {
        if (!sectionData) {
            return <p className="text-[10px] text-slate-400 font-bold text-center py-4">No updates found for this section.</p>;
        }

        // Deal Negotiation Form Overlay
        if (negotiatingProduct) {
            return (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 animate-in fade-in duration-300">
                    <div className="flex justify-between items-start">
                        <h5 className="font-bold text-xs text-slate-800">Deal Negotiation Assistant</h5>
                        <button 
                            onClick={() => { setNegotiatingProduct(null); setQuoteResult(null); }}
                            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                        >
                            Cancel
                        </button>
                    </div>
                    <div className="flex gap-3 bg-white p-2.5 rounded-lg border border-slate-100">
                        <img src={negotiatingProduct.imageUrl || "https://images.unsplash.com/photo-1518085023892-ed6b1a13e1f6?w=400"} className="w-12 h-12 rounded object-cover shrink-0" />
                        <div>
                            <span className="text-[11px] font-black text-slate-800 block leading-tight">{negotiatingProduct.name}</span>
                            <span className="text-[9.5px] text-slate-400 font-bold block">{negotiatingProduct.shopName}</span>
                            <span className="text-xs font-black text-[#E07A5F] block mt-1">Current Price: ₹{negotiatingProduct.price}</span>
                        </div>
                    </div>

                    {!quoteResult ? (
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Your Target Offer Price (₹)</label>
                                <input 
                                    type="number"
                                    value={targetPrice}
                                    onChange={(e) => setTargetPrice(e.target.value)}
                                    placeholder={`e.g., ${Math.round(negotiatingProduct.price * 0.9)}`}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#E07A5F]"
                                />
                            </div>
                            <button
                                onClick={submitQuote}
                                disabled={submittingQuote || !targetPrice}
                                className="w-full py-2 bg-[#E07A5F] hover:bg-[#d0684f] text-white font-black rounded-lg text-[10px] uppercase tracking-wider disabled:opacity-50"
                            >
                                {submittingQuote ? 'Negotiating deal...' : 'Submit Quote Offer'}
                            </button>
                        </div>
                    ) : (
                        <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Negotiation Result</span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    quoteResult.approved ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                }`}>
                                    {quoteResult.approved ? 'Approved' : 'Counter Offer'}
                                </span>
                            </div>
                            <div className="text-[10.5px] font-bold text-slate-750 space-y-1">
                                <div className="flex justify-between">
                                    <span>Original Price:</span>
                                    <span className="line-through text-slate-400">₹{quoteResult.originalPrice}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Your Offer:</span>
                                    <span>₹{quoteResult.requestedPrice}</span>
                                </div>
                                <div className="flex justify-between text-indigo-600 font-black">
                                    <span>Final Deal Price:</span>
                                    <span>₹{quoteResult.finalPrice}</span>
                                </div>
                            </div>
                            <p className="text-[9.5px] text-slate-550 font-bold bg-slate-50 p-2 rounded border border-slate-100 leading-normal">
                                {quoteResult.note}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => { setNegotiatingProduct(null); setQuoteResult(null); }}
                                    className="py-1.5 border border-slate-200 text-slate-655 font-bold rounded text-[9px] uppercase tracking-wider"
                                >
                                    Decline
                                </button>
                                <button
                                    onClick={() => acceptQuoteDeal(quoteResult)}
                                    className="py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded text-[9px] uppercase tracking-wider shadow-sm"
                                >
                                    Accept Deal
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        switch (activeSection) {
            case 'orders':
                return (
                    <div className="space-y-3">
                        {!sectionData || sectionData.length === 0 ? (
                            <p className="text-[10.5px] text-slate-500 font-semibold text-center py-4">No active or past orders found.</p>
                        ) : (
                            sectionData.map(order => (
                                <div key={order._id} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h5 className="font-black text-slate-800 text-xs leading-none">
                                                {order.orderType === 'visit' ? '📦 Shop Visit Order' : '📦 Delivery Order'}
                                            </h5>
                                            <span className="text-[10px] text-slate-400 font-bold block mt-1">ID: ...{order._id.slice(-6).toUpperCase()}</span>
                                        </div>
                                        <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full ${
                                            ['CANCELLED', 'MISSED'].includes(order.status) ? 'bg-red-50 text-red-600 border border-red-100' :
                                            ['FULFILLED', 'COMPLETED'].includes(order.status) ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                            'bg-orange-50 text-orange-600 border border-orange-100'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <div className="text-[10.5px] font-semibold text-slate-650">
                                        Merchant: <span className="text-slate-850 font-black">{order.shopName}</span>
                                    </div>
                                    <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-[10px] font-bold text-slate-550">
                                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                                        <span className="text-slate-900 font-black">₹{order.totalAmount}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                                        <button
                                            onClick={() => { setActiveSection(null); handleActionClick(`Track order ${order._id}`); }}
                                            className="py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 font-black rounded-lg text-[9px] uppercase tracking-wider text-center"
                                        >
                                            Track Order
                                        </button>
                                        <button
                                            onClick={() => { setActiveSection(null); handleActionClick(`Dispute order ${order._id}`); }}
                                            className="py-1.5 border border-slate-200 text-slate-600 font-bold rounded-lg text-[9px] uppercase tracking-wider text-center"
                                        >
                                            Dispute Charge
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                );

            case 'recommendations':
                return (
                    <div className="grid grid-cols-2 gap-3">
                        {!sectionData || sectionData.length === 0 ? (
                            <p className="text-[10.5px] text-slate-550 font-semibold text-center py-4 col-span-2">No recommendations available.</p>
                        ) : (
                            sectionData.map(prod => (
                                <div key={prod._id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-sm transition-all flex flex-col justify-between p-2.5">
                                    <div className="h-24 w-full bg-slate-100 rounded-lg overflow-hidden relative">
                                        <img src={prod.imageUrl || "https://images.unsplash.com/photo-1518085023892-ed6b1a13e1f6?w=400"} alt={prod.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        <h5 className="font-black text-slate-800 text-[10.5px] leading-tight line-clamp-2">{prod.name}</h5>
                                        <p className="text-[8.5px] text-slate-500 font-bold">{prod.shopName}</p>
                                        <div className="flex justify-between items-center pt-1">
                                            <span className="text-xs font-black text-slate-900">₹{prod.sellingPrice || prod.price}</span>
                                        </div>
                                    </div>
                                    <div className="mt-2.5 space-y-1.5">
                                        <button
                                            onClick={() => { setNegotiatingProduct({ _id: prod._id, name: prod.name, imageUrl: prod.imageUrl, price: prod.sellingPrice || prod.price, shopName: prod.shopName }); }}
                                            className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-150 border border-indigo-100 text-indigo-750 font-black rounded-lg text-[8.5px] uppercase tracking-wider shadow-xs"
                                        >
                                            Request Quote
                                        </button>
                                        <button
                                            onClick={() => { setActiveSection(null); handleActionClick(`Need ${prod.name}`); }}
                                            className="w-full py-1.5 bg-[#E07A5F] hover:bg-[#d0684f] text-white font-black rounded-lg text-[8.5px] uppercase tracking-wider"
                                        >
                                            Buy Product
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                );

            case 'alerts':
                return (
                    <div className="space-y-2.5">
                        {!sectionData || sectionData.length === 0 ? (
                            <p className="text-[10.5px] text-slate-500 font-semibold text-center py-4">No alerts found.</p>
                        ) : (
                            sectionData.map((alert, idx) => (
                                <div 
                                    key={idx} 
                                    className={`p-3 border rounded-xl flex items-start gap-3 ${
                                        alert.type === 'ORDER_DELAY' ? 'bg-amber-50/70 border-amber-200/50 text-amber-900' :
                                        alert.type === 'PRICE_DROP' ? 'bg-indigo-50/70 border-indigo-200/50 text-indigo-900' :
                                        alert.type === 'EVENT' ? 'bg-violet-50/70 border-violet-200/50 text-violet-900' :
                                        'bg-emerald-50/70 border-emerald-200/50 text-emerald-900'
                                    }`}
                                >
                                    {alert.type === 'ORDER_DELAY' && <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />}
                                    {alert.type === 'PRICE_DROP' && <Percent size={14} className="text-indigo-600 shrink-0 mt-0.5" />}
                                    {alert.type === 'EVENT' && <Calendar size={14} className="text-violet-600 shrink-0 mt-0.5" />}
                                    {alert.type === 'NEW_SELLER' && <Store size={14} className="text-emerald-600 shrink-0 mt-0.5" />}
                                    
                                    <div className="flex-1 min-w-0">
                                        <h5 className="text-[11px] font-black leading-none">{alert.title}</h5>
                                        <p className="text-[9.5px] font-semibold mt-1 leading-normal opacity-90">{alert.message}</p>
                                        {alert.actionLabel && (
                                            <button 
                                                onClick={() => { setActiveSection(null); handleActionClick(alert.query); }}
                                                className="mt-2 text-[9px] font-black uppercase tracking-wider text-inherit underline block"
                                            >
                                                {alert.actionLabel} &rarr;
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                );

            case 'businesses':
                return (
                    <div className="space-y-3">
                        {!sectionData || sectionData.length === 0 ? (
                            <p className="text-[10.5px] text-slate-550 font-semibold text-center py-4">No businesses found nearby.</p>
                        ) : (
                            sectionData.map(shop => (
                                <div key={shop._id} className="bg-white border border-slate-200 rounded-xl p-3 flex gap-3 shadow-xs">
                                    <div className="h-16 w-16 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                        <img src={shop.shopImage || 'https://via.placeholder.com/150'} alt={shop.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h5 className="font-black text-slate-800 text-xs leading-none">{shop.name}</h5>
                                                <span className={`text-[8px] font-black uppercase px-1 rounded-sm ${shop.isOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    {shop.isOpen ? 'Open' : 'Closed'}
                                                </span>
                                            </div>
                                            <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider mt-1">{shop.category}</p>
                                            <p className="text-[9.5px] text-slate-550 font-medium leading-tight mt-1 line-clamp-1">{shop.address}</p>
                                        </div>
                                        <div className="flex justify-between items-center mt-2.5">
                                            {shop.distance !== null && (
                                                <span className="text-[9.5px] text-[#E07A5F] font-bold">{(shop.distance / 1000).toFixed(1)} km away</span>
                                            )}
                                            <button
                                                onClick={() => { setActiveSection(null); handleActionClick(`Find bakery near me`); }}
                                                className="px-2.5 py-1 bg-[#E07A5F] hover:bg-[#d0684f] text-white font-black rounded-lg text-[8.5px] uppercase tracking-wider"
                                            >
                                                Chat Shop
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                );

            case 'trending':
                return (
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block px-1">Top Categories</span>
                            <div className="flex flex-wrap gap-1.5">
                                {sectionData.categories?.map(cat => (
                                    <button 
                                        key={cat.id}
                                        onClick={() => { setActiveSection(null); handleActionClick(cat.name); }}
                                        className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-350 rounded-lg text-[9.5px] font-bold text-slate-650 flex items-center gap-1.5 shadow-xs"
                                    >
                                        <span>{cat.name}</span>
                                        <span className="text-[8px] text-emerald-600 font-black">🔥 {cat.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block px-1">Trending Products</span>
                            <div className="grid grid-cols-2 gap-3">
                                {sectionData.products?.map(prod => (
                                    <div key={prod._id} className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
                                        <div className="h-24 w-full bg-slate-100 rounded-lg overflow-hidden relative">
                                            <img src={prod.imageUrl || "https://images.unsplash.com/photo-1518085023892-ed6b1a13e1f6?w=400"} alt={prod.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="mt-2 space-y-1">
                                            <h5 className="font-black text-slate-800 text-[10.5px] leading-tight line-clamp-2">{prod.name}</h5>
                                            <p className="text-[8.5px] text-slate-500 font-bold">{prod.shopName}</p>
                                            <span className="text-xs font-black text-slate-900 block mt-1">₹{prod.price}</span>
                                        </div>
                                        <div className="mt-2.5 space-y-1">
                                            <button
                                                onClick={() => { setNegotiatingProduct({ _id: prod._id, name: prod.name, imageUrl: prod.imageUrl, price: prod.price, shopName: prod.shopName }); }}
                                                className="w-full py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-750 font-black rounded text-[8.5px] uppercase tracking-wider"
                                            >
                                                Negotiate
                                            </button>
                                            <button
                                                onClick={() => { setActiveSection(null); handleActionClick(`Need ${prod.name}`); }}
                                                className="w-full py-1 bg-[#E07A5F] hover:bg-[#d0684f] text-white font-black rounded text-[8.5px] uppercase tracking-wider"
                                            >
                                                Chat Item
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'price-drops':
                return (
                    <div className="grid grid-cols-2 gap-3">
                        {!sectionData || sectionData.length === 0 ? (
                            <p className="text-[10.5px] text-slate-550 font-semibold text-center py-4 col-span-2">No price drop deals available right now.</p>
                        ) : (
                            sectionData.map(prod => (
                                <div key={prod._id} className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between shadow-xs relative">
                                    <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white font-black text-[7.5px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm z-10">
                                        ₹{prod.dropAmount} OFF
                                    </span>
                                    <div className="h-24 w-full bg-slate-100 rounded-lg overflow-hidden relative">
                                        <img src={prod.imageUrl || "https://images.unsplash.com/photo-1518085023892-ed6b1a13e1f6?w=400"} alt={prod.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        <h5 className="font-black text-slate-800 text-[10.5px] leading-tight line-clamp-2">{prod.name}</h5>
                                        <p className="text-[8.5px] text-slate-500 font-bold">{prod.shopName}</p>
                                        <div className="flex items-center gap-1.5 pt-1">
                                            <span className="text-xs font-black text-slate-900">₹{prod.price}</span>
                                            <span className="text-[9.5px] text-slate-400 line-through font-bold">₹{prod.originalPrice}</span>
                                        </div>
                                    </div>
                                    <div className="mt-2.5 space-y-1">
                                        <button
                                            onClick={() => { setNegotiatingProduct({ _id: prod._id, name: prod.name, imageUrl: prod.imageUrl, price: prod.price, shopName: prod.shopName }); }}
                                            className="w-full py-1 bg-indigo-50 hover:bg-indigo-150 border border-indigo-100 text-indigo-750 font-black rounded text-[8.5px] uppercase tracking-wider shadow-xs"
                                        >
                                            Request Quote
                                        </button>
                                        <button
                                            onClick={() => { setActiveSection(null); handleActionClick(`Need ${prod.name}`); }}
                                            className="w-full py-1 bg-[#E07A5F] hover:bg-[#d0684f] text-white font-black rounded text-[8.5px] uppercase tracking-wider"
                                        >
                                            Chat Item
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    // QUICK ACTION CHIPS (Phase 4 Upgrade)
    const quickActions = [
        { id: 'track_orders', label: 'Track Orders', icon: <ShoppingBag size={14} />, query: 'Track my order' },
        { id: 'refunds', label: 'Refunds', icon: <Clock size={14} />, query: 'Check refund status' },
        { id: 'returns', label: 'Returns', icon: <Repeat size={14} />, query: 'Wrong item delivered' },
        { id: 'report_issue', label: 'Report Issue', icon: <HelpCircle size={14} />, query: 'Resolve order issue' },
        { id: 'bookings', label: 'Manage Bookings', icon: <Wrench size={14} />, query: 'Manage my bookings' },
        { id: 'contact_seller', label: 'Contact Seller', icon: <Headset size={14} />, query: 'Seller is not responding' }
    ];

    // POPULAR SEARCHES (Phase 2 Upgrade)
    const popularSearches = [
        { label: 'Need groceries', query: 'Need groceries' },
        { label: 'Find bakery', query: 'Find bakery near me' },
        { label: 'Birthday gift', query: 'Need a birthday gift' },
        { label: 'Nearby electronics', query: 'Nearby electronics' }
    ];

    // PERSONALIZED QUICK ACTIONS (Phase 3 Upgrade)
    const personalizedActions = [
        { id: 'reorder', label: 'Reorder Groceries', query: 'Need groceries again', icon: <Repeat size={14} />, color: 'bg-orange-50 text-orange-600 border-orange-100' },
        { id: 'favorites', label: 'Favorite Shops', query: 'Show my favorite shops', icon: <Heart size={14} />, color: 'bg-rose-50 text-rose-600 border-rose-100' },
        { id: 'continue', label: 'Continue Shopping', query: 'Continue where I left off', icon: <Clock size={14} />, color: 'bg-sky-50 text-sky-600 border-sky-100' },
        { id: 'recommended', label: 'Recommended For You', query: 'Show my recommendations', icon: <Sparkles size={14} />, color: 'bg-violet-50 text-violet-600 border-violet-100' },
        { id: 'home_biz', label: 'Nearby Home Businesses', query: 'Homemade cake nearby', icon: <Store size={14} />, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        { id: 'track', label: 'Track Orders', query: 'Track my order', icon: <Navigation size={14} />, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' }
    ];

    // SUGGESTED START QUESTIONS
    const suggestedQuestions = [
        { label: 'Where is my order?', query: 'Where is my order?' },
        { label: 'Find nearby bakeries', query: 'Find bakery near me' },
        { label: 'I need a refund', query: 'I need a refund' },
        { label: 'Seller is not replying', query: 'Seller isn\'t responding' }
    ];

    // NEW QUICK CHIPS (Phase 5 Upgrade)
    const newQuickChips = [
        { label: 'Hello 👋', query: 'Hello' },
        { label: 'Find Products', query: '🛍 Shopping Help' },
        { label: 'Track Order', query: 'Track my order' },
        { label: 'Gift Ideas', query: 'Need a birthday gift' },
        { label: 'Nearby Shops', query: 'Find bakery near me' },
        { label: 'Need Help', query: 'Resolve order issue' }
    ];

    // Process a user action click (Chips, Suggested Questions)
    const handleActionClick = (text, category = null) => {
        if (category) setActiveCategory(category);
        processUserMessage(text);
    };

    // Main text message send handler
    const handleSend = () => {
        if (!inputValue.trim()) return;
        const text = inputValue.trim();
        setInputValue("");
        processUserMessage(text);
    };

    // Core message processor
    const processUserMessage = async (userText) => {
        let imageToAttach = null;
        if (userText === "visual search chair") {
            imageToAttach = "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400";
        } else if (userText === "visual search cake") {
            imageToAttach = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400";
        }
        addMessage(userText, 'user', null, null, { uploadedImage: imageToAttach });
        setIsTyping(true);

        // --- ESCALATION FLOW ---
        if (escalationStep === 'awaiting-phone') {
            const phoneRegex = /^[6-9]\d{9}$/;
            if (phoneRegex.test(userText)) {
                try {
                    const validCategories = ['Shopping', 'Services', 'Seller', 'App', 'Other'];
                    const mappedCategory = validCategories.includes(activeCategory) ? activeCategory : 'Other';

                    const payload = {
                        userId: user?._id || null,
                        phone: userText,
                        category: mappedCategory,
                        summary: `User escalated via Support Assistant chat. Context: Seller=${memory.sellerName || 'None'}, Budget=${memory.budget || 'None'}`,
                        logs: messages.map(m => `[${m.sender}] ${m.text}`)
                    };

                    const res = await fetch('http://localhost:5000/api/support/request', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (res.ok) {
                        addMessage("Thank you. Our support team has received your ticket and will call you back within 24 hours.", 'bot');
                        setEscalationStep('done');
                        setSuggestedReplies(['Great, thanks', 'Close Support']);
                    } else {
                        throw new Error();
                    }
                } catch (err) {
                    addMessage("I couldn't save your callback request. Please try raising a request again later.", 'bot');
                    setSuggestedReplies(['Restart Help']);
                }
            } else {
                addMessage("That doesn't look like a valid 10-digit mobile number. Please enter a valid number.", 'bot');
            }
            setIsTyping(false);
            return;
        }

        // --- FETCH BOT RESPONSE FROM BACKEND AI ---
        let responseData = null;
        try {
            const token = localStorage.getItem('token');
            const authHeaders = token ? { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            } : { 
                'Content-Type': 'application/json' 
            };
            const supportRes = await fetch('http://localhost:5000/api/customer/support-chat', {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({ message: userText })
            });
            if (supportRes.ok) {
                responseData = await supportRes.json();
            }
        } catch (e) {
            console.error("Failed to query backend support chat personality, using local engine:", e);
        }

        // Local fallback if server fails
        if (!responseData) {
            responseData = generateResponseWithMemory(userText);
        }

        // Use custom typing steps or fallback
        const thinkingSteps = responseData.typingSteps || [
            "● Understanding your query...",
            "● Searching catalog database...",
            "● Filtering nearby stores..."
        ];

        // Sequentially loop through simulated thinking steps
        for (const step of thinkingSteps) {
            setThinkingText(step);
            await new Promise(resolve => setTimeout(resolve, 400));
        }
        setThinkingText("");

        // Sync context memory
        if (responseData.memory) {
            setMemory(responseData.memory);
        }

        // --- CONVERSATIONAL CORE / STATE MACHINE ---
        let finalReply = responseData.reply;
        let finalChips = responseData.chips || [];
        let fetchedProducts = null;
        let fetchedShops = null;
        let orderListData = null;
        let trackingData = null;
        let bookingData = null;
        let refundData = null;
        let fileUploadSim = null;
        let disputeDetails = null;
        let ticketData = null;

        if (responseData.intent && responseData.intent !== 'none') {
            try {
                let url = '';
                const queryParams = new URLSearchParams();
                if (coords?.lat && coords?.lng) {
                    queryParams.append('lat', coords.lat);
                    queryParams.append('lng', coords.lng);
                }

                const token = localStorage.getItem('token');
                const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

                if (responseData.intent === 'product-search' || responseData.intent === 'visual-search-chair') {
                    queryParams.append('q', responseData.intent === 'visual-search-chair' ? 'chair' : (responseData.query || userText));
                    url = `http://localhost:5000/api/customer/search-products?${queryParams.toString()}`;
                    const res = await fetch(url, { headers: authHeaders });
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.length > 0) {
                            fetchedProducts = data;
                            finalReply = responseData.intent === 'visual-search-chair'
                                ? `I found these matching furniture products nearby for your accent chair visual search:`
                                : (responseData.customReplyPrefix 
                                    ? `${responseData.customReplyPrefix}\n\nI found these popular options nearby:`
                                    : `I found these popular options nearby for "${responseData.query || userText}":`);
                            finalChips = responseData.customChips || ["Show nearby stores", "Shopping Help"];
                        } else {
                            finalReply = responseData.intent === 'visual-search-chair'
                                ? `I couldn't find any accent chairs in our current store inventories. Try another visual search!`
                                : `I couldn't find any products matching "${responseData.query || userText}" nearby. Try another search!`;
                        }
                    }
                } else if (responseData.intent === 'shop-search' || responseData.intent === 'visual-search-cake') {
                    queryParams.append('q', responseData.intent === 'visual-search-cake' ? 'bakery' : (responseData.query || userText));
                    url = `http://localhost:5000/api/customer/search-shops?${queryParams.toString()}`;
                    const res = await fetch(url, { headers: authHeaders });
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.length > 0) {
                            fetchedShops = data;
                            finalReply = responseData.intent === 'visual-search-cake'
                                ? `I found these nearby bakeries that can customize your red velvet cake:`
                                : `I found these shops matching "${responseData.query || userText}" near you:`;
                            finalChips = ["Shopping Help", "Find bakery"];
                        } else {
                            finalReply = `I couldn't find any bakeries matching that cake style nearby.`;
                        }
                    }
                } else if (responseData.intent === 'home-business') {
                    queryParams.append('q', responseData.query || '');
                    url = `http://localhost:5000/api/customer/home-businesses?${queryParams.toString()}`;
                    const res = await fetch(url, { headers: authHeaders });
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.length > 0) {
                            fetchedShops = data;
                            finalReply = `I found these registered home businesses near you:`;
                            finalChips = ["Need homemade cake", "Need homemade snacks"];
                        } else {
                            finalReply = `I couldn't find any home businesses near you at the moment.`;
                        }
                    }
                } else if (responseData.intent === 'recommendation') {
                    queryParams.append('q', responseData.query || '');
                    if (responseData.budget) {
                        queryParams.append('budget', responseData.budget);
                    }
                    url = `http://localhost:5000/api/customer/recommendations?${queryParams.toString()}`;
                    const res = await fetch(url, { headers: authHeaders });
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.length > 0) {
                            fetchedProducts = data;
                            finalReply = responseData.customReplyPrefix 
                                ? `${responseData.customReplyPrefix}\n\nRecommended choices:`
                                : `Here are some recommended choices within your budget:`;
                            finalChips = responseData.customChips || ["Show nearby stores", "Shopping Help"];
                        } else {
                            finalReply = `I couldn't find any specific recommended gifts in that range. Try another budget.`;
                        }
                    }
                } else if (responseData.intent === 'alternatives') {
                    if (memory.lastProductId) {
                        queryParams.append('productId', memory.lastProductId);
                    } else if (memory.lastProductName) {
                        queryParams.append('q', memory.lastProductName);
                    }
                    if (responseData.cheaper) {
                        queryParams.append('cheaper', 'true');
                    }
                    url = `http://localhost:5000/api/customer/alternatives?${queryParams.toString()}`;
                    const res = await fetch(url, { headers: authHeaders });
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.length > 0) {
                            fetchedProducts = data;
                            finalReply = responseData.cheaper 
                                ? `Here are some budget-friendly alternatives:` 
                                : `This item is currently unavailable. Similar alternatives:`;
                            finalChips = ["Shopping Help", "Go to Activity"];
                        } else {
                            finalReply = `I couldn't find any alternative options right now.`;
                        }
                    }
                } else if (responseData.intent === 'favorites') {
                    url = `http://localhost:5000/api/customer/favorites`;
                    const res = await fetch(url, { headers: authHeaders });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.favoriteShops && data.favoriteShops.length > 0) {
                            fetchedShops = data.favoriteShops;
                            finalReply = "Here are your favorite shops:";
                            finalChips = ["Shopping Help", "Reorder Groceries"];
                        } else {
                            finalReply = "You don't have any favorite shops listed yet. Explore some shops nearby!";
                        }
                    }
                } else if (responseData.intent === 'recent-activity') {
                    url = `http://localhost:5000/api/customer/recent-activity`;
                    const res = await fetch(url, { headers: authHeaders });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.recentProducts && data.recentProducts.length > 0) {
                            fetchedProducts = data.recentProducts;
                            finalReply = `Continue where you left off? "${data.recentProducts[0].name}" is available in nearby shops:`;
                            finalChips = ["Shopping Help", "Favorite Shops"];
                        } else {
                            finalReply = "You haven't viewed any products recently. Start exploring products nearby!";
                        }
                    }
                } else if (responseData.intent === 'create-reminder') {
                    url = `http://localhost:5000/api/customer/reminder`;
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            ...authHeaders
                        },
                        body: JSON.stringify({
                            item: responseData.reminderItem,
                            frequency: responseData.reminderFrequency,
                            delayDays: responseData.delayDays || 30
                        })
                    });
                    if (res.ok) {
                        finalReply = `Got it. I've scheduled a reminder for "${responseData.reminderItem}". I'll remind you before your current supply is likely to run out!`;
                        finalChips = ["Shopping Help", "Reorder Groceries"];
                    }
                } else if (responseData.intent === 'reorder-action') {
                    url = `http://localhost:5000/api/customer/orders`;
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            ...authHeaders
                        },
                        body: JSON.stringify({
                            sellerId: responseData.sellerId,
                            items: responseData.items,
                            paymentMode: 'PAY_ON_VISIT',
                            visitDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
                            visitTime: "10:00 AM - 12:00 PM"
                        })
                    });
                    if (res.ok) {
                        const total = responseData.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
                        finalReply = `🎉 **Order successfully placed!**\n\nYour order has been created with **XYZ seller** for a total of **₹${total}**.\n\n📅 **Visit Scheduled**: Tomorrow between 10:00 AM - 12:00 PM\n💳 **Payment Mode**: Pay on Visit\n\nYou can track this and other orders under the **Activity** tab!`;
                        finalChips = ["Track My Order", "Shopping Help"];
                    } else {
                        const err = await res.json().catch(() => ({}));
                        finalReply = `Sorry, I couldn't place the reorder. ${err.message || 'Please try again.'}`;
                        finalChips = ["Reorder Groceries", "Shopping Help"];
                    }
                } else if (responseData.intent === 'track-orders') {
                    url = `http://localhost:5000/api/customer/orders`;
                    const res = await fetch(url, { headers: authHeaders });
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.length > 0) {
                            orderListData = data;
                            finalReply = "Here is a list of your recent Aisle orders and scheduled visits. Select one to track progress or raise a claim:";
                            finalChips = ["Resolve Order Issue", "Shopping Help"];
                        } else {
                            finalReply = "You don't have any active or past orders on your profile yet.";
                            finalChips = ["Shopping Help"];
                        }
                    }
                } else if (responseData.intent === 'order-tracking') {
                    url = `http://localhost:5000/api/customer/order-status/${responseData.orderId}`;
                    const res = await fetch(url, { headers: authHeaders });
                    if (res.ok) {
                        const data = await res.json();
                        trackingData = data;
                        finalReply = `Here is your tracking report for Order #${responseData.orderId.slice(-6).toUpperCase()}:`;
                        finalChips = ["Track Orders", "Report Delay", "Shopping Help"];
                    }
                } else if (responseData.intent === 'refund-eligibility') {
                    url = `http://localhost:5000/api/customer/refund-request`;
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...authHeaders },
                        body: JSON.stringify({ orderId: responseData.orderId })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        refundData = data;
                        finalReply = `Completed automatic refund check for Order #${responseData.orderId.slice(-6).toUpperCase()}:`;
                        finalChips = ["Track Orders", "Report Issue"];
                    }
                } else if (responseData.intent === 'cancel-order-intent') {
                    url = `http://localhost:5000/api/customer/cancel-order`;
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...authHeaders },
                        body: JSON.stringify({ orderId: responseData.orderId })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        finalReply = `❌ **Order Cancelled Successfully!**\n\nRefund status: ${data.refund.eligible ? `Eligible (₹${data.refund.amount})` : 'Ineligible'}\nProcessing window: ${data.refund.processingTime}`;
                        finalChips = ["Track Orders", "Shopping Help"];
                    } else {
                        const err = await res.json().catch(() => ({}));
                        finalReply = `Sorry, cancellation failed: ${err.message || 'Please contact support.'}`;
                        finalChips = ["Track Orders", "Report Issue"];
                    }
                } else if (responseData.intent === 'dispute-flow') {
                    url = `http://localhost:5000/api/customer/dispute`;
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...authHeaders },
                        body: JSON.stringify({
                            orderId: responseData.orderId,
                            note: "Disputed extra charge / price mismatch on items.",
                            items: []
                        })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        disputeDetails = data.dispute;
                        finalReply = `🛡️ **Dispute Report Created**\n\nWe have escalated this report directly to our operations team. ID: ...${data.ticketId.slice(-6).toUpperCase()}`;
                        finalChips = ["Track Orders", "My Complaint Status"];
                    }
                } else if (responseData.intent === 'return-replacement-flow') {
                    fileUploadSim = true;
                    finalReply = `Please verify the items for Order #${responseData.orderId.slice(-6).toUpperCase()} return request below:`;
                    finalChips = ["Track Orders", "Cancel"];
                } else if (responseData.intent === 'create-ticket') {
                    url = `http://localhost:5000/api/customer/escalate`;
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...authHeaders },
                        body: JSON.stringify({
                            category: responseData.category,
                            summary: responseData.summary,
                            priority: responseData.priority,
                            logs: messages.slice(-5).map(m => `[${m.sender}] ${m.text}`)
                        })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        ticketData = {
                            ticketId: data.ticketId,
                            priority: data.priority,
                            status: data.status
                        };
                        finalReply = `Ticket created! Operations ID: ...${data.ticketId.slice(-6).toUpperCase()}. Status: ${data.status.toUpperCase()}.`;
                        finalChips = ["My Complaint Status", "Shopping Help"];
                    }
                } else if (responseData.intent === 'check-tickets') {
                    url = `http://localhost:5000/api/customer/tickets`;
                    const res = await fetch(url, { headers: authHeaders });
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.length > 0) {
                            ticketData = {
                                ticketId: data[0]._id,
                                priority: data[0].priority,
                                status: data[0].status
                            };
                            finalReply = `Here is your latest ticket status report:`;
                            finalChips = ["Track Orders", "Shopping Help"];
                        } else {
                            ticketData = {
                                ticketId: "6a8391839183918391839183",
                                priority: "high",
                                status: "open"
                            };
                            finalReply = `Ticket #ASL-8391 Status Report:`;
                            finalChips = ["Track Orders", "Shopping Help"];
                        }
                    }
                } else if (responseData.intent === 'booking-details') {
                    bookingData = {
                        serviceName: "Home Cleaning",
                        providerName: "CleanPro",
                        date: "8 June",
                        time: "3:00 PM",
                        conflict: true
                    };
                    finalReply = "Showing CleanPro booking conflict status details below:";
                    finalChips = ["Manage Bookings", "Shopping Help"];
                }
            } catch (err) {
                console.error("Commerce AI fetch error:", err);
            }
        }

        if (fetchedProducts && fetchedProducts.length > 0) {
            setMemory(prev => ({
                ...prev,
                lastProductId: fetchedProducts[0]._id,
                lastProductName: fetchedProducts[0].name
            }));
            
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    await fetch('http://localhost:5000/api/customer/preferences', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({})
                    });
                }
            } catch (e) {}
        }

        let conversationInsights = null;
        if (ticketData) {
            conversationInsights = {
                issue: responseData.summary || "Operations Escalation",
                seller: memory.sellerName || "Aisle Operations",
                reference: `ASL-TKT-${ticketData.ticketId.slice(-4).toUpperCase()}`
            };
        } else if (disputeDetails) {
            conversationInsights = {
                issue: "Price Mismatch / Dispute",
                seller: disputeDetails.sellerName || "Aisle Merchant",
                reference: `ASL-DIS-${disputeDetails.orderId.slice(-4).toUpperCase()}`
            };
        }

        const showFeedback = !!(responseData.intent && responseData.intent !== 'none');

        addMessage(finalReply, 'bot', fetchedProducts, fetchedShops, {
            orderListData,
            trackingData,
            bookingData,
            refundData,
            fileUploadSim,
            disputeDetails,
            ticketData,
            conversationInsights,
            showFeedback,
            intent: responseData.intent,
            intentData: responseData.intentData
        });
        setSuggestedReplies(finalChips);
        setIsTyping(false);

        if (responseData.triggerEscalation) {
            setEscalationStep('awaiting-phone');
        }
    };

    // Chat thumbs up/down feedback click handler
    const handleFeedback = async (messageId, type) => {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedbackSubmitted: true } : m));
        
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await fetch('http://localhost:5000/api/customer/support-chat/feedback', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ feedback: type })
                });
            }
        } catch (e) {
            console.error("Failed to post chat feedback:", e);
        }

        setIsTyping(true);
        await new Promise(resolve => setTimeout(resolve, 600));
        setIsTyping(false);

        if (type === 'thumbsUp') {
            addMessage("Great 😊\n\nAnything else I can help with?", 'bot');
            setSuggestedReplies(["Hello 👋", "🛍 Shopping Help", "Close Support"]);
        } else {
            addMessage("Let's try another approach.\n\nWould you like me to check other orders or escalate to operations support?", 'bot');
            setSuggestedReplies(["Resolve Order Issue", "Raise callback ticket", "Close Support"]);
        }
    };

    // Helper to append message to display array with optional products/shops lists
    const addMessage = (text, sender, products = null, shops = null, extra = {}) => {
        setMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            text,
            sender,
            timestamp: new Date(),
            products,
            shops,
            ...extra
        }]);
    };

    // AI BRAIN WITH MEMORY, SENTIMENT, AND ABUSE HANDLING
    const generateResponseWithMemory = (input) => {
        const lower = input.toLowerCase().trim();
        let reply = "";
        let chips = [];
        let triggerEscalation = false;

        const userName = user?.name ? user.name.split(' ')[0] : 'Shashwat';
        const isAngry = /(worst|useless|cheat|scam|garbage|terrible|horrible|angry|hate|frustrated|annoyed)/.test(lower);

        // 1. ABUSIVE / OFFENSIVE LANGUAGE HANDLER
        if (lower.match(/(stupid|idiot|fuck|useless|shit|bitch|dumb|mental)/)) {
            return {
                reply: "I understand you're upset. I'm here to help resolve the issue.\n\nCould you tell me what went wrong?",
                chips: ["Order Issue", "Seller Issue", "App Issue"],
                triggerEscalation: false
            };
        }

        // 2. PERSONALIZED GREETINGS & INTRO HELP
        if (["hi", "hello", "hey", "yo", "test"].includes(lower)) {
            return {
                reply: `Hello ${userName} 👋\n\nI'm here to help with:\n• Orders\n• Sellers\n• Bookings\n• Personal Shopping Companion\n\nWhat can I help you with today?`,
                chips: ["Reorder Groceries", "Show my favorite shops", "Show my recommendations"],
                triggerEscalation: false
            };
        }

        // Conversational Memory Processing
        let currentSeller = memory.sellerName;
        let currentBudget = memory.budget;
        let currentTopic = memory.lastTopic;

        // Extract potential seller name indicators
        if (lower.includes("referring to") || lower.includes("store is") || lower.includes("name is")) {
            const match = input.match(/(referring to|store is|name is)\s+([A-Za-z0-9\s]+)/i);
            if (match && match[2]) {
                currentSeller = match[2].trim();
                setMemory(prev => ({ ...prev, sellerName: currentSeller }));
            }
        }

        // --- ESCALATION TRIGGERS ---
        const isEscalationWord = /(not resolved|didn't help|human|talk to someone|representative|agent)/.test(lower);
        if (isEscalationWord) {
            return {
                reply: "I understand this needs personal assistance. Please share your phone number and our support representative will call you back shortly.",
                chips: [],
                triggerEscalation: true
            };
        }

        // --- OPERATIONS ASSISTANT MODE ---
        if (lower.includes("resolve order issue") || lower.includes("report issue") || lower === "report issue" || lower.includes("resolve issue")) {
            return {
                reply: "⚡ **Operations Assistant Activated**\n\nWhat type of issue would you like to resolve?",
                chips: ["Delayed Order", "Refund Check", "Wrong Product", "Missing Product", "Seller Issue", "Payment Issue"],
                intent: 'none'
            };
        }

        if (lower === "delayed order" || lower === "delayed") {
            return {
                intent: 'track-orders',
                reply: "Checking your active orders for delays..."
            };
        }

        if (lower === "refund check" || lower.includes("check refund status") || lower === "refunds") {
            return {
                intent: 'track-orders',
                reply: "Checking refund eligibility. Please select the order you need a refund check for:"
            };
        }

        if (lower === "wrong product" || lower.includes("wrong item delivered")) {
            return {
                intent: 'track-orders',
                reply: "Please select the order containing the wrong product to initiate a replacement request:"
            };
        }

        if (lower === "missing product") {
            return {
                intent: 'track-orders',
                reply: "Please select the order missing items from your list below to raise an operations ticket:"
            };
        }

        if (lower === "seller issue" || lower.includes("seller is not responding")) {
            return {
                intent: 'track-orders',
                reply: "Please select the order or merchant you are trying to contact:"
            };
        }

        if (lower === "payment issue") {
            return {
                reply: "⚠️ **Payment Issue Support**\n\nIf your account was charged but no order confirmation was created, this is flagged as CRITICAL.\n\nWould you like me to escalate this immediately to the operations team?",
                chips: ["Escalate Payment Issue", "Resolve Order Issue"],
                intent: 'none'
            };
        }

        if (lower === "escalate payment issue") {
            return {
                intent: 'create-ticket',
                category: 'Other',
                priority: 'urgent',
                summary: "Payment charged but no order created. Needs immediate review.",
                reply: "Filing high-priority escalation ticket to resolve the payment issue..."
            };
        }

        // --- TICKET & COMPLAINT STATUS ---
        if (lower === "my complaint status" || lower === "complaint status" || lower === "ticket status" || lower.includes("ticket status")) {
            return {
                intent: 'check-tickets',
                reply: "Fetching your operations complaint status..."
            };
        }

        // --- BOOKINGS ---
        if (lower.includes("bookings") || lower.includes("booking") || lower === "manage my bookings") {
            return {
                intent: 'booking-details',
                reply: "Fetching your service bookings details..."
            };
        }

        if (lower.includes("select slot:") || lower.includes("confirm slot:")) {
            return {
                reply: `📅 **Booking Rescheduled Successfully!**\n\nYour Home Cleaning appointment has been updated to the alternative slot. Provider CleanPro has confirmed.`,
                chips: ["Manage Bookings", "Shopping Help"],
                intent: 'none'
            };
        }

        if (lower === "cancel booking appointment") {
            return {
                reply: "❌ **Booking Cancelled Successfully**\n\nYour CleanPro booking has been cancelled. If any prepayment was charged, a refund has been initiated to your original payment method.",
                chips: ["Manage Bookings", "Shopping Help"],
                intent: 'none'
            };
        }

        // --- SPECIFIC ACTION PATTERNS WITH ORDER ID ---
        const trackOrderMatch = lower.match(/track order\s+([a-f0-9]+)/i);
        if (trackOrderMatch) {
            return {
                intent: 'order-tracking',
                orderId: trackOrderMatch[1].trim(),
                reply: `Fetching live tracking tracking steps...`
            };
        }

        const refundCheckMatch = lower.match(/refund check\s+([a-f0-9]+)/i);
        if (refundCheckMatch) {
            return {
                intent: 'refund-eligibility',
                orderId: refundCheckMatch[1].trim(),
                reply: "Checking refund policy eligibility details..."
            };
        }

        const returnItemsMatch = lower.match(/return items\s+([a-f0-9]+)/i);
        if (returnItemsMatch) {
            return {
                intent: 'return-replacement-flow',
                orderId: returnItemsMatch[1].trim(),
                reply: "Starting replacement wizard. Please verify the uploaded images:"
            };
        }

        const cancelOrderMatch = lower.match(/cancel order\s+([a-f0-9]+)/i);
        if (cancelOrderMatch) {
            return {
                intent: 'cancel-order-intent',
                orderId: cancelOrderMatch[1].trim(),
                reply: "Processing cancellation request..."
            };
        }

        const disputeOrderMatch = lower.match(/dispute order\s+([a-f0-9]+)/i);
        if (disputeOrderMatch) {
            return {
                intent: 'dispute-flow',
                orderId: disputeOrderMatch[1].trim(),
                reply: "Investigating details to submit dispute report..."
            };
        }

        // --- QUICK ESCALATION SHORTCUTS ---
        if (lower === "escalate wrong item delivery replacement" || lower.includes("submit replacement request")) {
            return {
                intent: 'create-ticket',
                category: 'Shopping',
                priority: 'high',
                summary: "Return/replacement requested for wrong product delivered.",
                reply: "Submitting replacement ticket..."
            };
        }

        // --- AI REMINDER CAPTURING ---
        const reminderRegex = /remind me (next month|next week|tomorrow|in \d+ days|in a month|in a week) to buy (.+)/i;
        if (reminderRegex.test(lower)) {
            const match = input.match(reminderRegex);
            const timeFrame = match[1].toLowerCase().trim();
            const item = match[2].trim();
            
            let delayDays = 30;
            if (timeFrame.includes("week")) delayDays = 7;
            else if (timeFrame.includes("tomorrow")) delayDays = 1;
            else if (timeFrame.includes("day")) {
                const daysMatch = timeFrame.match(/\d+/);
                if (daysMatch) delayDays = parseInt(daysMatch[0]);
            }
            
            return {
                intent: 'create-reminder',
                reminderItem: item,
                reminderFrequency: timeFrame.includes("month") || timeFrame.includes("week") ? 'recurring' : 'one-time',
                delayDays: delayDays,
                reply: `Scheduling your reminder to buy "${item}"...`
            };
        }

        // --- PARTY PLANNING MODE ---
        if (lower.includes("party") || lower.includes("plan a party") || lower.includes("help me shop for a party")) {
            setMemory(prev => ({ ...prev, lastTopic: 'party-planning-guests' }));
            return {
                reply: "🎉 Great! Party Planning Mode activated.\n\nFirst, how many guests are you expecting?",
                chips: ["10 guests", "20 guests", "50 guests", "Cancel"],
                intent: 'none'
            };
        }

        if (memory.lastTopic === 'party-planning-guests') {
            if (lower === "cancel") {
                setMemory(prev => ({ ...prev, lastTopic: null }));
                return {
                    reply: "Party planning mode cancelled. What else can I help you with?",
                    chips: ["Shopping Help", "Reorder Groceries"],
                    intent: 'none'
                };
            }
            if (/(10|20|50|guests)/.test(lower)) {
                const guestCount = lower.match(/\d+/) ? lower.match(/\d+/)[0] : '20';
                setMemory(prev => ({ ...prev, lastTopic: null, guestCount: guestCount }));
                
                let softDrinks = guestCount === '10' ? '4 Liters' : guestCount === '20' ? '8 Liters' : '20 Liters';
                let snacks = guestCount === '10' ? '3 Large Packets' : guestCount === '20' ? '6 Large Packets' : '15 Large Packets';
                let cake = guestCount === '10' ? '1.5 kg' : guestCount === '20' ? '3 kg' : '7.5 kg';
                
                return {
                    reply: `For a party of **${guestCount} guests**, here is your estimated catalog checklist:\n\n🥤 **Soft Drinks**: ${softDrinks} (Est. ₹300)\n🍿 **Snacks & Chips**: ${snacks} (Est. ₹450)\n🎂 **Party Cake**: ${cake} (Est. ₹1200)\n🍽️ **Plates & Napkins**: Pack of ${guestCount} (Est. ₹150)\n\nWould you like to search for these items in nearby stores?`,
                    chips: ["Find snacks nearby", "Find homemade cake", "Cancel"],
                    intent: 'none'
                };
            }
        }

        // --- REORDER GROCERIES INTENTS ---
        if (lower.includes("need groceries again") || lower.includes("reorder groceries") || lower === "reorder") {
            return {
                reply: `Based on your previous orders, here are your frequent grocery purchases from **XYZ seller**:\n\n• Tata Salt (1kg) - ₹25\n• Fortune Mustard Oil (1L) - ₹175\n• Ashirvaad Atta (5kg) - ₹260\n• Maggi 2-Minute Noodles (12-pack) - ₹160\n\nWould you like to reorder them now?`,
                chips: ["Reorder All", "Tata Salt Only", "Fortune Oil + Atta", "Cancel"],
                intent: 'none'
            };
        }

        if (lower === "reorder all") {
            return {
                intent: 'reorder-action',
                items: [
                    { productId: "6a265ea64ff762e97a744c26", name: "Tata Salt", quantity: 1, price: 25, image: "https://images.unsplash.com/photo-1518085023892-ed6b1a13e1f6?w=400" },
                    { productId: "6a265ea64ff762e97a744c29", name: "Fortune Mustard Oil", quantity: 1, price: 175, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
                    { productId: "6a265ea64ff762e97a744c2c", name: "Ashirvaad Atta", quantity: 1, price: 260, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400" },
                    { productId: "6a265ea64ff762e97a744c2f", name: "Maggi 2-Minute Noodles", quantity: 1, price: 160, image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400" }
                ],
                sellerId: "6a22678de410c49988759fa5",
                reply: "Placing reorder for all items..."
            };
        }

        if (lower === "tata salt only") {
            return {
                intent: 'reorder-action',
                items: [
                    { productId: "6a265ea64ff762e97a744c26", name: "Tata Salt", quantity: 1, price: 25, image: "https://images.unsplash.com/photo-1518085023892-ed6b1a13e1f6?w=400" }
                ],
                sellerId: "6a22678de410c49988759fa5",
                reply: "Placing reorder for Tata Salt..."
            };
        }

        if (lower === "fortune oil + atta") {
            return {
                intent: 'reorder-action',
                items: [
                    { productId: "6a265ea64ff762e97a744c29", name: "Fortune Mustard Oil", quantity: 1, price: 175, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
                    { productId: "6a265ea64ff762e97a744c2c", name: "Ashirvaad Atta", quantity: 1, price: 260, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400" }
                ],
                sellerId: "6a22678de410c49988759fa5",
                reply: "Placing reorder for Fortune Mustard Oil and Ashirvaad Atta..."
            };
        }

        // --- FAVORITE SHOPS ---
        if (lower.includes("favorite shops") || lower === "show my favorite shops") {
            return {
                intent: 'favorites',
                reply: "Fetching your favorite shops list..."
            };
        }

        // --- CONTINUE SHOPPING ---
        if (lower.includes("continue where i left off") || lower.includes("continue shopping")) {
            return {
                intent: 'recent-activity',
                reply: "Retrieving your recently viewed items..."
            };
        }

        // --- BUDGET INTELLIGENCE & RECOMMENDATIONS ---
        if (lower.includes("show my recommendations") || lower.includes("recommendations") || lower === "recommended for you") {
            const budgetRange = profileData?.avgBudget || '₹500-₹1500';
            const match = budgetRange.match(/₹?(\d+)[-\s]*₹?(\d+)/);
            const budgetMax = match ? match[2] : '1500';
            
            return {
                intent: 'recommendation',
                budget: budgetMax,
                query: 'gift',
                reply: `Finding top recommended products matching your average shopping budget of ${budgetRange}...`,
                customReplyPrefix: `Based on your average budget (${budgetRange}), here are recommendations for you:`
            };
        }

        // 🛍 SHOPPING HELP / GENERAL COMMERCE MODES
        if (lower.includes("shopping help") || lower === "🛍 shopping help") {
            setMemory(prev => ({ ...prev, lastTopic: 'shopping-help' }));
            return {
                reply: "What are you looking for today?",
                chips: ["Need groceries", "Need gift", "Need bakery", "Need electronics", "Need medicine", "Need home decor"],
                intent: 'none'
            };
        }

        // MULTI-STEP DISCOVERY: Shampoo query
        if (lower.includes("shampoo")) {
            setMemory(prev => ({ ...prev, lastTopic: 'shampoo-search' }));
            return {
                reply: "What type of shampoo are you looking for?",
                chips: ["Anti Hair Fall", "Anti Dandruff", "Daily Use", "Herbal"],
                intent: 'none'
            };
        }

        if (memory.lastTopic === 'shampoo-search' && /(hair fall|dandruff|daily|herbal)/.test(lower)) {
            setMemory(prev => ({ ...prev, lastTopic: null }));
            const prefix = isAngry ? "I understand you're frustrated, let's find the shampoo quickly. " : "";
            return {
                reply: "",
                chips: ["Shopping Help", "Find bakery"],
                intent: 'product-search',
                query: `shampoo ${input}`,
                customReplyPrefix: `${prefix}Recommended Shampoo for ${input}:`
            };
        }

        // MULTI-STEP DISCOVERY: Gift query
        if (lower.includes("birthday gift") || lower.includes("need a gift") || lower === "gift" || lower.includes("anniversary gift")) {
            setMemory(prev => ({ ...prev, lastTopic: 'gift-search' }));
            return {
                reply: "What's your budget for the gift?",
                chips: ["₹500", "₹1000", "₹2000+"],
                intent: 'none'
            };
        }

        if (memory.lastTopic === 'gift-search' && /(500|1000|2000)/.test(lower)) {
            const numericBudget = input.replace(/[^0-9]/g, '');
            setMemory(prev => ({ ...prev, budget: numericBudget, lastTopic: null }));
            const prefix = isAngry ? "I understand you're frustrated. Let's find a gift. " : "";
            return {
                reply: "",
                chips: ["Show nearby stores", "Shopping Help"],
                intent: 'recommendation',
                budget: numericBudget,
                query: 'gift',
                customReplyPrefix: `${prefix}For a budget of ₹${numericBudget}, popular choices include Personalized Mug, Decorative Lamp, Indoor Plant, and Photo Frame.`
            };
        }

        // Gift for Mom query
        if (lower.includes("gift for mom") || lower.includes("gift mom")) {
            return {
                reply: "Popular choices for Mom include Scented Candles, Home Decor, Indoor Plants, and Handmade Gifts.",
                chips: ["Show nearby stores", "Shopping Help"],
                intent: 'recommendation',
                query: 'gift',
                customReplyPrefix: "Popular choices for Mom on Aisle:"
            };
        }

        // Milk query
        if (lower.includes("milk") || lower === "need milk") {
            const prefix = isAngry ? "I understand you're frustrated. Let's find milk. " : "";
            return {
                reply: "",
                chips: ["Show nearby stores", "Shopping Help"],
                intent: 'product-search',
                query: 'milk',
                customReplyPrefix: `${prefix}I found these popular milk options nearby (e.g. Amul Gold, Amul Toned, Mother Dairy, Nandini):`
            };
        }

        // Shop discovery
        if (lower.includes("find bakery near me") || lower.includes("find bakery") || lower === "bakery") {
            return {
                reply: "",
                chips: ["Shopping Help", "Find Grocery near me"],
                intent: 'shop-search',
                query: 'bakery'
            };
        }

        if (lower.includes("grocery store") || lower.includes("grocery") || lower === "need a grocery store") {
            return {
                reply: "",
                chips: ["Shopping Help", "Find bakery"],
                intent: 'shop-search',
                query: 'grocery'
            };
        }

        // Alternatives search
        if (lower.includes("product unavailable") || lower.includes("unavailable") || lower.includes("out of stock")) {
            return {
                reply: "",
                chips: ["Shopping Help", "Go to Activity"],
                intent: 'alternatives',
                cheaper: false
            };
        }

        if (lower.includes("cheaper option") || lower.includes("cheaper") || lower.includes("budget alternative")) {
            return {
                reply: "",
                chips: ["Shopping Help", "Go to Activity"],
                intent: 'alternatives',
                cheaper: true
            };
        }

        // Medical category guidance
        if (lower.includes("headache") || lower.includes("something for headache") || lower.includes("medicine")) {
            return {
                reply: "Common headache products available nearby:\n• Crocin\n• Dolo 650\n• Disprin\n\n⚠️ Please consult a healthcare professional if symptoms persist.",
                chips: ["Show nearby pharmacies", "Shopping Help"],
                intent: 'none'
            };
        }

        // School supplies
        if (lower.includes("school supplies") || lower.includes("stationery") || lower.includes("supplies")) {
            return {
                reply: "Popular school and office supply categories nearby:\n• 📚 Notebooks\n• ✏️ Pens\n• 🎒 School Bags\n• 📏 Stationery Kits",
                chips: ["Find stationery store", "Shopping Help"],
                intent: 'none'
            };
        }

        // Proactive weather alerts / Sunday Prep / Diwali
        if (lower.includes("rainy season") || lower.includes("monsoon") || lower.includes("rain") || lower.includes("weather") || lower.includes("umbrella")) {
            return {
                reply: "☔ Weather Alert: There is rain forecast for today. Stock up on umbrellas, raincoats, or warm beverages and snacks from local vendors nearby!",
                chips: ["Find grocery near me", "Shopping Help"],
                intent: 'none'
            };
        }

        if (lower.includes("diwali") || lower.includes("decorations") || lower.includes("festival")) {
            return {
                reply: "🪔 Diwali Festival Mode! Explore local decorations, handmade diyas, sweet boxes, and gift sets for friends & family nearby.",
                chips: ["Diwali gifts", "Find grocery near me"],
                intent: 'none'
            };
        }

        if (lower.includes("sunday") || lower.includes("weekly prep") || lower.includes("grocery stock")) {
            return {
                reply: "🛒 Sunday Weekly Prep Alert: Stock up on your weekly staples like Tata Salt, Atta, and Maggi Noodles ahead of the busy week!",
                chips: ["Reorder Groceries", "Shopping Help"],
                intent: 'none'
            };
        }

        // Home Business Discovery
        if (lower.includes("homemade cake") || lower.includes("priya's bakery") || lower.includes("home bakes") || lower.includes("cake")) {
            return {
                reply: "",
                chips: ["Need homemade snacks", "Shopping Help"],
                intent: 'home-business',
                query: 'cake'
            };
        }

        if (lower.includes("homemade snacks") || lower.includes("homemade")) {
            return {
                reply: "",
                chips: ["Need homemade cake", "Shopping Help"],
                intent: 'home-business',
                query: 'snacks'
            };
        }

        // Comparison Engine
        if (lower.includes("which is better") || lower.includes("compare") || (lower.includes("india gate") && lower.includes("daawat"))) {
            return {
                reply: "Comparison of top Basmati rice options:\n\n**India Gate Basmati**\n✓ Premium quality & aroma\n✓ Extra long grains, perfect for biryani\n\n**Daawat Basmati**\n✓ Better value for money\n✓ Highly popular choice for daily cooking",
                chips: ["Find India Gate", "Find Daawat", "Shopping Help"],
                intent: 'none'
            };
        }

        if (lower.includes("cooking oil") || lower.includes("oil")) {
            return {
                reply: "Popular cooking oil choices based on local customer demand:\n1. Fortune Rice Bran/Mustard Oil\n2. Saffola Gold\n3. Dhara Refined Oil",
                chips: ["Show grocery stores", "Shopping Help"],
                intent: 'none'
            };
        }

        // Traditional support checks
        if (lower.includes("still no response") || lower.includes("still no reply") || lower.includes("not replying")) {
            if (currentSeller) {
                return {
                    reply: `I understand you're referring to "${currentSeller}". Since they are not responding, would you like me to raise a callback ticket so a manager can contact them?`,
                    chips: ["Raise callback ticket", "Cancel my order"],
                    triggerEscalation: false
                };
            } else {
                setMemory(prev => ({ ...prev, lastTopic: 'seller-no-reply' }));
                return {
                    reply: "Could you tell me the seller name so I can check their active hours and status?",
                    chips: [],
                    triggerEscalation: false
                };
            }
        }

        if (lower.includes("track") || lower.includes("where is my order")) {
            const prefix = isAngry ? "I understand you're anxious about your order location. " : "";
            return {
                reply: `${prefix}You can track your order live from the 'Activity' tab on your profile page. Active orders show current dispatch and rider assignment detail.`,
                chips: ["Go to Activity", "Talk to Seller"],
                triggerEscalation: false
            };
        }

        if (lower.includes("booking") || lower.includes("appointment")) {
            return {
                reply: "You can view and cancel all booking appointments under the 'Bookings' tab in your Profile. If the status is pending, the provider has not confirmed it yet.",
                chips: ["View Bookings", "Support Callback"],
                triggerEscalation: false
            };
        }

        if (lower.includes("app") || lower.includes("slow") || lower.includes("crash") || lower.includes("bug")) {
            const prefix = isAngry ? "I understand this app experience is frustrating. " : "";
            return {
                reply: `${prefix}We apologize for the glitch. Please try refreshing or clear your browser cache. If it persists, let us know so we can fix it.`,
                chips: ["Report app bug", "Request manager callback"],
                triggerEscalation: false
            };
        }

        if (lower.includes("raise callback ticket") || lower.includes("callback")) {
            return {
                reply: "Please share your phone number below and our support representative will call you back within 24 hours.",
                chips: [],
                triggerEscalation: true
            };
        }

        // Default Fallback
        const empathyPrefix = isAngry ? "I understand you're frustrated. Let's get this resolved.\n\n" : "";
        return {
            reply: `${empathyPrefix}I can assist you with finding products, discovering local stores, and troubleshooting app issues.\n\nWhat can I find for you today?`,
            chips: ["🛍 Shopping Help", "Track My Order", "Seller Support"],
            intent: 'none',
            triggerEscalation: false
        };
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* BACKDROP */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/15 backdrop-blur-sm z-[2000] cursor-pointer"
                    />

                    {/* AI SUPPORT PANEL */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                        className="fixed top-0 right-0 h-full w-full md:w-[410px] bg-white z-[2001] shadow-2xl flex flex-col border-l border-gray-150"
                    >
                        {/* PANEL HEADER */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-orange-50 rounded-full flex items-center justify-center text-[#E07A5F] relative">
                                    <Headset size={20} />
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-800 text-base leading-none">Aisle Copilot</h3>
                                    <span className="text-[10px] text-[#E07A5F] font-bold uppercase tracking-wider block mt-1">Your Personal Marketplace Assistant</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-700">
                                <X size={18} />
                            </button>
                        </div>

                        {/* PANEL MESSAGES SCROLL AREA */}
                        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50 scroll-smooth space-y-6">

                            {activeSection ? (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    {/* Section Header */}
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-150">
                                        <button 
                                            onClick={() => { setActiveSection(null); setNegotiatingProduct(null); setQuoteResult(null); setTargetPrice(""); }}
                                            className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                                        >
                                            <ArrowLeft size={16} />
                                        </button>
                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                                            {activeSection === 'orders' && '📦 Active Orders'}
                                            {activeSection === 'recommendations' && '🎁 Recommended For You'}
                                            {activeSection === 'alerts' && '⚠ AI Active Alerts'}
                                            {activeSection === 'businesses' && '🏪 New Local Businesses'}
                                            {activeSection === 'trending' && '🔥 Trending Nearby'}
                                            {activeSection === 'price-drops' && '💰 Premium Price Drops'}
                                        </h4>
                                    </div>

                                    {/* Section Content */}
                                    {loadingSection ? (
                                        <div className="py-10 flex flex-col items-center justify-center gap-2">
                                            <div className="w-6 h-6 border-2 border-[#E07A5F] border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-[10px] text-slate-400 font-bold">Loading updates...</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {renderSectionContent()}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* SMART WELCOME CARD & STARTING CHECKS */}
                                    {messages.length === 0 && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            
                                            {/* VIP Welcome Card */}
                                            <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-md space-y-4 relative overflow-hidden">
                                                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="text-sm font-black tracking-tight">{getGreeting()}, {profileData?.userName || user?.name?.split(' ')[0] || 'Shashwat'} 👋</h4>
                                                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Your Shopping Companion</span>
                                                    </div>
                                                    {customerHealth?.vipTier && (
                                                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                                            customerHealth.vipTier === 'GOLD' ? 'bg-amber-400 text-slate-900 shadow-sm font-black' :
                                                            customerHealth.vipTier === 'SILVER' ? 'bg-slate-300 text-slate-800' :
                                                            'bg-slate-700 text-slate-300'
                                                        }`}>
                                                            👑 {customerHealth.vipTier} VIP
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Trust Score Index Progress */}
                                                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[10.5px]">
                                                    <div>
                                                        <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold">Trust Index Score</span>
                                                        <span className="text-xs font-black text-indigo-300">{customerHealth?.score || 95}/100 Success Rating</span>
                                                    </div>
                                                    <div className="w-24 bg-slate-700 rounded-full h-2">
                                                        <div 
                                                            className="bg-indigo-400 h-2 rounded-full transition-all duration-500" 
                                                            style={{ width: `${customerHealth?.score || 95}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                {/* Favorite Categories & Shops List */}
                                                <div className="pt-2 border-t border-white/10 text-[10.5px] space-y-1 text-slate-300 font-semibold">
                                                    <div>
                                                        🏪 <span className="text-slate-400 font-bold">Frequent Stores:</span>{' '}
                                                        {profileData?.favoriteShops?.length > 0
                                                            ? profileData.favoriteShops.map(s => s.shopName).join(', ')
                                                            : 'XYZ seller, Home Accessories'}
                                                    </div>
                                                    <div>
                                                        🏷️ <span className="text-slate-400 font-bold">Favorite Segments:</span>{' '}
                                                        {profileData?.favoriteCategories?.length > 0
                                                            ? profileData.favoriteCategories.join(', ')
                                                            : 'Groceries, Electronics'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* AI Action Center Alerts */}
                                            {actionCenter && actionCenter.length > 0 && (
                                                <div className="space-y-2.5">
                                                    <div className="flex justify-between items-center px-1">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Action Center</span>
                                                        <span className="text-[9px] bg-[#E07A5F]/15 text-[#E07A5F] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Live Radar</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {actionCenter.map((alert, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                className={`p-3.5 border rounded-xl flex items-start gap-3 shadow-xs transition-all hover:shadow-sm ${
                                                                    alert.type === 'ORDER_DELAY' ? 'bg-amber-50/80 border-amber-200/50 text-amber-900' :
                                                                    alert.type === 'PRICE_DROP' ? 'bg-indigo-50/70 border-indigo-200/50 text-indigo-900' :
                                                                    alert.type === 'EVENT' ? 'bg-violet-50/70 border-violet-200/50 text-violet-900' :
                                                                    'bg-emerald-50/70 border-emerald-200/50 text-emerald-900'
                                                                }`}
                                                            >
                                                                {alert.type === 'ORDER_DELAY' && <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />}
                                                                {alert.type === 'PRICE_DROP' && <Percent size={15} className="text-indigo-600 shrink-0 mt-0.5" />}
                                                                {alert.type === 'EVENT' && <Calendar size={15} className="text-violet-600 shrink-0 mt-0.5" />}
                                                                {alert.type === 'NEW_SELLER' && <Store size={15} className="text-emerald-600 shrink-0 mt-0.5" />}
                                                                
                                                                <div className="flex-1 min-w-0">
                                                                    <h5 className="text-[11px] font-black leading-none flex justify-between items-center">
                                                                        <span>{alert.title}</span>
                                                                    </h5>
                                                                    <p className="text-[10px] font-semibold mt-1 leading-normal opacity-90">
                                                                        {alert.message}
                                                                    </p>
                                                                    {alert.actionLabel && (
                                                                        <button 
                                                                            onClick={() => handleActionClick(alert.query)}
                                                                            className="mt-2 text-[9px] font-black uppercase tracking-wider text-inherit underline hover:opacity-80 block"
                                                                        >
                                                                            {alert.actionLabel} &rarr;
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Unified Marketplace Health Dashboard Widgets */}
                                            {insights && (
                                                <div className="space-y-2.5">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Marketplace Operations Health</span>
                                                    <div className="grid grid-cols-2 gap-2.5 text-center font-bold text-slate-700">
                                                        <button 
                                                            onClick={() => setActiveSection('orders')}
                                                            className="bg-white border border-slate-200 p-3 rounded-xl hover:border-slate-350 hover:shadow-xs transition-all text-left flex justify-between items-center"
                                                        >
                                                            <div>
                                                                <span className="block text-base font-black text-indigo-600">{insights.activeOrders || 0}</span>
                                                                <span className="text-[9.5px] text-slate-400 font-bold">Active Orders</span>
                                                            </div>
                                                            <ShoppingBag size={16} className="text-indigo-500 opacity-60" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleActionClick("Manage my bookings")}
                                                            className="bg-white border border-slate-200 p-3 rounded-xl hover:border-slate-350 hover:shadow-xs transition-all text-left flex justify-between items-center"
                                                        >
                                                            <div>
                                                                <span className="block text-base font-black text-emerald-600">{insights.upcomingBookings || 0}</span>
                                                                <span className="text-[9.5px] text-slate-400 font-bold">Bookings</span>
                                                            </div>
                                                            <Calendar size={16} className="text-emerald-500 opacity-60" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleActionClick("Seller is not responding")}
                                                            className="bg-white border border-slate-200 p-3 rounded-xl hover:border-slate-350 hover:shadow-xs transition-all text-left flex justify-between items-center"
                                                        >
                                                            <div>
                                                                <span className="block text-base font-black text-amber-600">{insights.pendingSellerResponse || 0}</span>
                                                                <span className="text-[9.5px] text-slate-400 font-bold">Seller Pending</span>
                                                            </div>
                                                            <Store size={16} className="text-amber-500 opacity-60" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleActionClick("My complaint status")}
                                                            className="bg-white border border-slate-200 p-3 rounded-xl hover:border-slate-350 hover:shadow-xs transition-all text-left flex justify-between items-center"
                                                        >
                                                            <div>
                                                                <span className="block text-base font-black text-red-650">{insights.openDisputes || 0}</span>
                                                                <span className="text-[9.5px] text-slate-400 font-bold">Open Disputes</span>
                                                            </div>
                                                            <ShieldCheck size={16} className="text-red-500 opacity-60" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Aisle Copilot Shortcuts Grid */}
                                            <div className="space-y-2.5 animate-in fade-in duration-300">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Aisle Copilot Shortcuts</span>
                                                <div className="grid grid-cols-2 gap-2.5">
                                                    <button
                                                        onClick={() => triggerVoiceAssistant()}
                                                        className="flex items-center gap-3 px-3.5 py-2.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl text-left hover:shadow-xs transition-all group"
                                                    >
                                                        <span className="p-2 bg-indigo-50 text-indigo-650 border border-indigo-100 rounded-lg shrink-0">
                                                            <Mic size={14} className="animate-pulse" />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <span className="block text-[11px] font-black text-slate-700 leading-tight group-hover:text-slate-900">Voice Assistant</span>
                                                        </div>
                                                    </button>

                                                    <button
                                                        onClick={() => setIsUploadingImage(true)}
                                                        className="flex items-center gap-3 px-3.5 py-2.5 bg-white border border-slate-200 hover:border-violet-400 rounded-xl text-left hover:shadow-xs transition-all group"
                                                    >
                                                        <span className="p-2 bg-violet-50 text-violet-600 border border-violet-100 rounded-lg shrink-0">
                                                            <Camera size={14} />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <span className="block text-[11px] font-black text-slate-700 leading-tight group-hover:text-slate-900">Image Search</span>
                                                        </div>
                                                    </button>

                                                    <button
                                                        onClick={() => handleActionClick("plan gym diet")}
                                                        className="flex items-center gap-3 px-3.5 py-2.5 bg-white border border-slate-200 hover:border-emerald-400 rounded-xl text-left hover:shadow-xs transition-all group"
                                                    >
                                                        <span className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg shrink-0">
                                                            <Sparkles size={14} />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <span className="block text-[11px] font-black text-slate-700 leading-tight group-hover:text-slate-900">Diet Planner</span>
                                                        </div>
                                                    </button>

                                                    <button
                                                        onClick={() => handleActionClick("grocery weekly optimizer")}
                                                        className="flex items-center gap-3 px-3.5 py-2.5 bg-white border border-slate-200 hover:border-amber-400 rounded-xl text-left hover:shadow-xs transition-all group"
                                                    >
                                                        <span className="p-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg shrink-0">
                                                            <ShoppingBag size={14} />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <span className="block text-[11px] font-black text-slate-700 leading-tight group-hover:text-slate-900">Grocery Planner</span>
                                                        </div>
                                                    </button>

                                                    <button
                                                        onClick={() => handleActionClick("birthday party for 30 people")}
                                                        className="flex items-center gap-3 px-3.5 py-2.5 bg-white border border-slate-200 hover:border-pink-400 rounded-xl text-left hover:shadow-xs transition-all group"
                                                    >
                                                        <span className="p-2 bg-pink-50 text-pink-650 border border-pink-100 rounded-lg shrink-0">
                                                            <Store size={14} />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <span className="block text-[11px] font-black text-slate-700 leading-tight group-hover:text-slate-900">Party Planner</span>
                                                        </div>
                                                    </button>

                                                    <button
                                                        onClick={() => handleActionClick("negotiate 50 gift hampers")}
                                                        className="flex items-center gap-3 px-3.5 py-2.5 bg-white border border-slate-200 hover:border-[#E07A5F] rounded-xl text-left hover:shadow-xs transition-all group"
                                                    >
                                                        <span className="p-2 bg-orange-50 text-[#E07A5F] border border-orange-100 rounded-lg shrink-0">
                                                            <Percent size={14} />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <span className="block text-[11px] font-black text-slate-700 leading-tight group-hover:text-slate-900">Negotiations</span>
                                                        </div>
                                                    </button>

                                                    <button
                                                        onClick={() => setActiveSection('orders')}
                                                        className="flex items-center gap-3 px-3.5 py-2.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl text-left hover:shadow-xs transition-all group col-span-2"
                                                    >
                                                        <span className="p-2 bg-indigo-50 text-indigo-650 border border-indigo-100 rounded-lg shrink-0">
                                                            <Repeat size={14} />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <span className="block text-[11px] font-black text-slate-705 leading-tight group-hover:text-slate-900">Track & Manage Orders</span>
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Recent Activity timeline */}
                                            {insights?.timeline && insights.timeline.length > 0 && (
                                                <div className="space-y-3">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Recent Success Activity</span>
                                                    <div className="relative pl-4 border-l border-slate-200 ml-2.5 space-y-4">
                                                        {insights.timeline.map((act, idx) => (
                                                            <div key={idx} className="relative flex items-start gap-3 text-[10.5px]">
                                                                <span className="absolute -left-[23px] top-0.5 bg-white border border-indigo-400 text-[8.5px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold shadow-xs">
                                                                    {act.icon}
                                                                </span>
                                                                <div className="flex-1 font-semibold text-slate-700 leading-normal">
                                                                    {act.desc}
                                                                    <span className="block text-[8.5px] text-slate-400 mt-0.5 font-bold uppercase">{new Date(act.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Chat messages */}
                                    <div className="space-y-4">
                                        {messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                                            >
                                                {msg.sender === 'bot' && (
                                                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-bold mb-1 ml-1 ${getAgentBadgeStyle(msg.agent)}`}>
                                                        {getAgentIcon(msg.agent)}
                                                        <span>{msg.agent || "Support Agent"}</span>
                                                    </div>
                                                )}

                                                {msg.sender === 'user' && msg.uploadedImage && (
                                                    <div className="mb-1.5 w-28 h-28 rounded-lg overflow-hidden border border-slate-200 shadow-xs relative">
                                                        <img src={msg.uploadedImage} alt="Uploaded item" className="w-full h-full object-cover" />
                                                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 py-0.5 rounded font-black uppercase tracking-wider">Visual Input</span>
                                                    </div>
                                                )}

                                                <div
                                                    className={`max-w-[85%] px-4.5 py-3 rounded-2xl text-xs leading-relaxed shadow-sm whitespace-pre-line
                                                    ${msg.sender === 'user'
                                                            ? 'bg-slate-800 text-white rounded-tr-none'
                                                            : 'bg-white border border-slate-100 text-slate-750 rounded-tl-none font-semibold'
                                                        }`}
                                                >
                                                    {msg.text}
                                                </div>

                                        {/* Product Recommendation Cards (visual cards list) */}
                                        {msg.products && msg.products.length > 0 && (
                                            <div className="mt-3 grid grid-cols-2 gap-3 w-full max-w-[360px]">
                                                {msg.products.map(prod => (
                                                    <div key={prod._id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col">
                                                        <div className="h-28 w-full bg-slate-100 relative">
                                                            <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                                                            {prod.isOpen ? (
                                                                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-emerald-500 text-white text-[8px] font-black uppercase rounded-sm">Open</span>
                                                            ) : (
                                                                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-slate-400 text-white text-[8px] font-black uppercase rounded-sm">Closed</span>
                                                            )}
                                                        </div>
                                                        <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1">
                                                            <div>
                                                                <h5 className="font-black text-slate-800 text-[11px] leading-tight line-clamp-2">{prod.name}</h5>
                                                                <p className="text-[9px] text-slate-550 font-bold mt-1">{prod.shopName}</p>
                                                            </div>
                                                            <div>
                                                                <div className="flex justify-between items-center mt-1">
                                                                    <span className="text-xs font-black text-slate-900">₹{prod.price}</span>
                                                                    {prod.distance !== null && (
                                                                        <span className="text-[9px] text-[#E07A5F] font-bold">
                                                                            {(prod.distance / 1000).toFixed(1)} km
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={() => window.location.href = `/shop/${prod.shopId}`}
                                                                    className="w-full mt-2 py-1.5 bg-[#E07A5F] text-white font-bold rounded-lg text-[9px] uppercase tracking-wider hover:bg-[#d0684f] transition-all"
                                                                >
                                                                    View Shop
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Shop Discovery Cards */}
                                        {msg.shops && msg.shops.length > 0 && (
                                            <div className="mt-3 space-y-2.5 w-full max-w-[360px]">
                                                {msg.shops.map(shop => (
                                                    <div key={shop._id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-sm transition-all p-3 flex gap-3">
                                                        <div className="h-16 w-16 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                                            <img src={shop.shopImage || 'https://via.placeholder.com/150'} alt={shop.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="flex-1 flex flex-col justify-between">
                                                            <div>
                                                                <div className="flex justify-between items-start">
                                                                    <h5 className="font-black text-slate-800 text-xs leading-none">{shop.name}</h5>
                                                                    <span className={`text-[8px] font-black uppercase px-1 rounded-sm ${shop.isOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                                        {shop.isOpen ? 'Open' : 'Closed'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider mt-1">{shop.category}</p>
                                                                <p className="text-[9.5px] text-slate-500 font-medium leading-tight mt-1 line-clamp-1">{shop.address}</p>
                                                            </div>
                                                            
                                                            <div className="flex gap-3 text-[9px] font-bold text-slate-550 mt-1.5">
                                                                {shop.distance !== null && (
                                                                    <span>📍 {(shop.distance / 1000).toFixed(1)} km</span>
                                                                )}
                                                                {shop.rating > 0 && (
                                                                    <span>⭐ {shop.rating.toFixed(1)}</span>
                                                                )}
                                                            </div>

                                                            <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100">
                                                                <button
                                                                    onClick={() => window.location.href = `/shop/${shop._id}`}
                                                                    className="flex-1 py-1 bg-[#E07A5F] text-white font-bold rounded-md text-[9px] uppercase tracking-wider text-center"
                                                                >
                                                                    View Shop
                                                                </button>
                                                                {shop.phone && (
                                                                    <button
                                                                        onClick={() => window.open(`tel:${shop.phone}`)}
                                                                        className="px-2 py-1 border border-slate-200 text-slate-600 font-bold rounded-md text-[9px] uppercase tracking-wider"
                                                                    >
                                                                        <Phone size={10} />
                                                                    </button>
                                                                )}
                                                                {shop.coordinates && (
                                                                    <button
                                                                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${shop.coordinates[1]},${shop.coordinates[0]}`)}
                                                                        className="px-2 py-1 border border-slate-200 text-slate-650 font-bold rounded-md text-[9px] uppercase tracking-wider"
                                                                    >
                                                                        <Navigation size={10} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Unified Orders List Card */}
                                        {msg.orderListData && msg.orderListData.length > 0 && (
                                            <div className="mt-3 space-y-2.5 w-full max-w-[360px]">
                                                {msg.orderListData.map(order => (
                                                    <div key={order._id} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs hover:shadow-sm transition-all space-y-3">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h5 className="font-black text-slate-800 text-xs leading-none">
                                                                    {order.orderType === 'visit' ? '📦 Shop Visit Order' : '📦 Delivery Order'}
                                                                </h5>
                                                                <span className="text-[10px] text-slate-400 font-bold block mt-1">ID: ...{order._id.slice(-6).toUpperCase()}</span>
                                                            </div>
                                                            <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                                ['CANCELLED', 'MISSED'].includes(order.status) ? 'bg-red-50 text-red-600 border border-red-100' :
                                                                ['FULFILLED', 'COMPLETED'].includes(order.status) ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                                'bg-orange-50 text-orange-600 border border-orange-100'
                                                            }`}>
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                        <div className="text-[10.5px] font-semibold text-slate-650">
                                                            Merchant: <span className="text-slate-850 font-black">{order.shopName}</span>
                                                        </div>
                                                        <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-[10px] font-bold text-slate-550">
                                                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                                                            <span className="text-slate-900 font-black">₹{order.totalAmount}</span>
                                                        </div>
                                                        
                                                        {/* Operations actions grid */}
                                                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                                                            <button
                                                                onClick={() => handleActionClick(`Track order ${order._id}`)}
                                                                className="py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 font-black rounded-lg text-[9px] uppercase tracking-wider text-center"
                                                            >
                                                                Track Order
                                                            </button>
                                                            {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && order.status !== 'FULFILLED' ? (
                                                                <button
                                                                    onClick={() => handleActionClick(`Cancel order ${order._id}`)}
                                                                    className="py-1.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 font-black rounded-lg text-[9px] uppercase tracking-wider text-center"
                                                                >
                                                                    Cancel Order
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleActionClick(`Refund check ${order._id}`)}
                                                                    className="py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-100 text-amber-600 font-black rounded-lg text-[9px] uppercase tracking-wider text-center"
                                                                >
                                                                    Refund Check
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleActionClick(`Dispute order ${order._id}`)}
                                                                className="py-1.5 border border-slate-200 text-slate-600 font-bold rounded-lg text-[9px] uppercase tracking-wider text-center"
                                                            >
                                                                Dispute Charge
                                                            </button>
                                                            <button
                                                                onClick={() => handleActionClick(`Return items ${order._id}`)}
                                                                className="py-1.5 border border-slate-200 text-slate-600 font-bold rounded-lg text-[9px] uppercase tracking-wider text-center"
                                                            >
                                                                Return / Replace
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Order Tracking Timeline Card */}
                                        {msg.trackingData && (
                                            <div className="mt-3 bg-white border border-slate-200 rounded-xl p-4 shadow-xs w-full max-w-[360px] space-y-4">
                                                <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                                                    <div>
                                                        <h5 className="font-black text-slate-800 text-xs">📦 Live Order Tracking</h5>
                                                        <span className="text-[9.5px] text-slate-400 font-bold block mt-0.5">Seller: {msg.trackingData.shopName}</span>
                                                    </div>
                                                    <span className="text-[9px] bg-indigo-50 text-indigo-600 font-black uppercase px-2 py-0.5 rounded-full">
                                                        {msg.trackingData.status}
                                                    </span>
                                                </div>

                                                {/* Timeline steps */}
                                                <div className="space-y-3 pt-1">
                                                    <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">Order Progress</span>
                                                    <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-500 relative">
                                                        <div className="absolute top-2 left-3 right-3 h-0.5 bg-slate-100 -z-1"></div>
                                                        
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold ${msg.trackingData.steps.placed ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>✓</span>
                                                            <span>Placed</span>
                                                        </div>
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold ${msg.trackingData.steps.confirmed ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>✓</span>
                                                            <span>Confirmed</span>
                                                        </div>
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold ${msg.trackingData.steps.preparing ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>✓</span>
                                                            <span>Prepared</span>
                                                        </div>
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold ${msg.trackingData.steps.outForDelivery ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>🚚</span>
                                                            <span>Out</span>
                                                        </div>
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold ${msg.trackingData.steps.delivered ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>○</span>
                                                            <span>Delivered</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Delay alert banner */}
                                                {msg.trackingData.delay && msg.trackingData.delay.detected && (
                                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5">
                                                        <span className="text-amber-500 text-base">⚠️</span>
                                                        <div>
                                                            <h6 className="text-[10px] font-black text-amber-900 leading-none">Order Delay Detected</h6>
                                                            <p className="text-[9.5px] text-amber-800 font-semibold mt-1 leading-normal">
                                                                Your order is running {msg.trackingData.delay.minutes} minutes behind schedule. Reason: {msg.trackingData.delay.reason}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Driver & ETA details */}
                                                {msg.trackingData.driver && msg.trackingData.driver.distance && (
                                                    <div className="bg-slate-50 p-2.5 rounded-lg flex justify-between items-center text-[10.5px] font-bold text-slate-650">
                                                        <span className="flex items-center gap-1 text-slate-500">📍 Driver Distance: <span className="text-slate-800">{msg.trackingData.driver.distance}</span></span>
                                                        <span className="text-[#E07A5F]">{msg.trackingData.driver.eta}</span>
                                                    </div>
                                                )}

                                                {/* Quick action triggers */}
                                                <div className="grid grid-cols-3 gap-2 pt-1">
                                                    <button
                                                        onClick={() => handleActionClick("Seller has not responded for: 2 Hours 14 Minutes. Would you like me to escalate this conversation?")}
                                                        className="py-1 bg-white border border-slate-200 text-slate-650 font-bold rounded text-[8.5px] uppercase tracking-wider text-center"
                                                    >
                                                        Contact Seller
                                                    </button>
                                                    <button
                                                        onClick={() => handleActionClick(`Track order ${msg.trackingData.orderId}`)}
                                                        className="py-1 bg-[#E07A5F] text-white font-bold rounded text-[8.5px] uppercase tracking-wider text-center"
                                                    >
                                                        Track Order
                                                    </button>
                                                    <button
                                                        onClick={() => handleActionClick(`Seller issue on order ${msg.trackingData.orderId}`)}
                                                        className="py-1 bg-white border border-slate-200 text-red-650 font-bold rounded text-[8.5px] uppercase tracking-wider text-center"
                                                    >
                                                        Report Delay
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Booking Details conflict detection card */}
                                        {msg.bookingData && (
                                            <div className="mt-3 bg-white border border-slate-200 rounded-xl p-4 shadow-xs w-full max-w-[360px] space-y-3.5">
                                                <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                                                    <div>
                                                        <h5 className="font-black text-slate-800 text-xs">📅 Service Booking Details</h5>
                                                        <span className="text-[9.5px] text-slate-400 font-bold block mt-0.5">Service: {msg.bookingData.serviceName}</span>
                                                    </div>
                                                    <span className="text-[9px] bg-emerald-50 text-emerald-600 font-black uppercase px-2 py-0.5 rounded-full">
                                                        Confirmed
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2.5 text-[10.5px] font-bold text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                                    <div>
                                                        <span className="text-slate-400 font-medium block text-[9.5px]">Provider</span>
                                                        <span>{msg.bookingData.providerName}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 font-medium block text-[9.5px]">Scheduled</span>
                                                        <span>{msg.bookingData.date} at {msg.bookingData.time}</span>
                                                    </div>
                                                </div>

                                                {/* Booking conflict options */}
                                                {msg.bookingData.conflict && (
                                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2.5">
                                                        <div className="flex items-start gap-2 text-red-850">
                                                            <span className="text-red-500 font-black">⚠️</span>
                                                            <div>
                                                                <h6 className="text-[10px] font-black leading-none">Scheduling Conflict Detected</h6>
                                                                <p className="text-[9.5px] font-semibold mt-1 leading-normal">
                                                                    CleanPro reported a scheduling conflict. Select an alternate slot below:
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleActionClick("Select slot: Today 4:00 PM")}
                                                                className="flex-1 py-1 bg-white hover:bg-slate-100 border border-red-200 text-red-700 font-bold rounded text-[8.5px] shadow-xs"
                                                            >
                                                                4 PM
                                                            </button>
                                                            <button
                                                                onClick={() => handleActionClick("Select slot: Today 6:00 PM")}
                                                                className="flex-1 py-1 bg-white hover:bg-slate-100 border border-red-200 text-red-700 font-bold rounded text-[8.5px] shadow-xs"
                                                            >
                                                                6 PM
                                                            </button>
                                                            <button
                                                                onClick={() => handleActionClick("Select slot: Tomorrow 11:00 AM")}
                                                                className="flex-1 py-1 bg-white hover:bg-slate-100 border border-red-200 text-red-700 font-bold rounded text-[8.5px] shadow-xs"
                                                            >
                                                                Tomorrow 11 AM
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-3 gap-2 pt-1">
                                                    <button
                                                        onClick={() => handleActionClick("Select slot: Today 4:00 PM")}
                                                        className="py-1 bg-white border border-slate-200 text-slate-650 font-bold rounded text-[8.5px] uppercase tracking-wider text-center"
                                                    >
                                                        Reschedule
                                                    </button>
                                                    <button
                                                        onClick={() => handleActionClick("Cancel booking appointment")}
                                                        className="py-1 bg-white border border-slate-200 text-red-650 font-bold rounded text-[8.5px] uppercase tracking-wider text-center"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleActionClick(`Contact CleanPro service support`)}
                                                        className="py-1 bg-[#E07A5F] text-white font-bold rounded text-[8.5px] uppercase tracking-wider text-center"
                                                    >
                                                        Contact
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Refund eligibility checker card */}
                                        {msg.refundData && (
                                            <div className="mt-3 bg-white border border-slate-200 rounded-xl p-4 shadow-xs w-full max-w-[360px] space-y-3">
                                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                                    <h5 className="font-black text-slate-800 text-xs">💰 Refund Status Inquiry</h5>
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                        msg.refundData.eligible ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                                                    }`}>
                                                        {msg.refundData.eligible ? 'Eligible' : 'Not Eligible'}
                                                    </span>
                                                </div>
                                                
                                                <div className="space-y-1.5 text-[10.5px] font-bold text-slate-650">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 font-medium">Refund Policy Status:</span>
                                                        <span className={msg.refundData.eligible ? 'text-emerald-600' : 'text-red-500'}>
                                                            {msg.refundData.eligible ? '✓ Approved' : '✗ Denied'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 font-medium">Refund Amount:</span>
                                                        <span className="text-slate-900 font-black">₹{msg.refundData.refundAmount}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 font-medium">Processing SLA:</span>
                                                        <span>{msg.refundData.processingTime}</span>
                                                    </div>
                                                </div>
                                                
                                                <p className="text-[10px] text-slate-500 font-semibold leading-normal pt-1.5 border-t border-slate-100">
                                                    {msg.refundData.reason}
                                                </p>
                                            </div>
                                        )}

                                        {/* Return/Replacement image upload simulation wizard */}
                                        {msg.fileUploadSim && (
                                            <div className="mt-3 bg-white border border-slate-200 rounded-xl p-4 shadow-xs w-full max-w-[360px] space-y-3.5">
                                                <h5 className="font-black text-slate-800 text-xs border-b border-slate-100 pb-2">🔄 Returns/Replacement Claim</h5>
                                                
                                                <p className="text-[10.5px] text-slate-500 font-semibold leading-normal">
                                                    Please verify the uploaded item validation snapshots to create ticket:
                                                </p>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-150 text-[10px] font-bold">
                                                        <span className="flex items-center gap-1.5 text-slate-700">📸 Product Image: <span className="text-indigo-600 font-medium">damaged_part.png</span></span>
                                                        <span className="text-emerald-600 font-black">✓ Attached</span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-150 text-[10px] font-bold">
                                                        <span className="flex items-center gap-1.5 text-slate-700">📦 Box Snapshot: <span className="text-indigo-600 font-medium">retail_tag.png</span></span>
                                                        <span className="text-emerald-600 font-black">✓ Attached</span>
                                                    </div>
                                                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-150 text-[10px] font-bold">
                                                        <span className="text-slate-400 font-medium block">Claim Description:</span>
                                                        <span className="text-slate-800">Item received is mismatched, outer seal was already broken.</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleActionClick("Escalate wrong item delivery replacement")}
                                                    className="w-full py-2 bg-[#E07A5F] hover:bg-[#d0684f] text-white font-black rounded-lg text-[9.5px] uppercase tracking-widest text-center shadow-sm"
                                                >
                                                    Submit Replacement Request
                                                </button>
                                            </div>
                                        )}

                                        {/* Dispute center summary report card */}
                                        {msg.disputeDetails && (
                                            <div className="mt-3 bg-white border border-slate-200 rounded-xl p-4 shadow-xs w-full max-w-[360px] space-y-3.5">
                                                <h5 className="font-black text-slate-800 text-xs border-b border-slate-100 pb-2 text-red-600">🛡️ Dispute Report Created</h5>
                                                
                                                <div className="space-y-2 text-[10.5px] font-bold text-slate-650 bg-slate-50 p-3 rounded-lg border border-slate-150">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 font-medium">Issue Category:</span>
                                                        <span className="text-slate-800">Price Mismatch / Extra Fee</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 font-medium">Customer Profile:</span>
                                                        <span className="text-slate-800">Shashwat</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 font-medium">Merchant:</span>
                                                        <span className="text-slate-800">{msg.disputeDetails.sellerName}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 font-medium">Order ID:</span>
                                                        <span className="text-slate-800">...{msg.disputeDetails.orderId.slice(-6).toUpperCase()}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 font-medium">Priority Routing:</span>
                                                        <span className="text-red-500">High Priority</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 font-medium">Receipt Evidence:</span>
                                                        <span className="text-emerald-600">Uploaded</span>
                                                    </div>
                                                </div>

                                                <p className="text-[10px] text-slate-500 font-semibold leading-normal">
                                                    Escalated directly to Aisle Operations for immediate verification. Our team will review the price mismatch within 24 hours.
                                                </p>
                                            </div>
                                        )}

                                        {/* Operations support ticket escalation card */}
                                        {msg.ticketData && (
                                            <div className="mt-3 bg-white border border-slate-200 rounded-xl p-4 shadow-xs w-full max-w-[360px] space-y-3.5">
                                                <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                                                    <div>
                                                        <h5 className="font-black text-slate-800 text-xs">🎫 Ops Escalation Ticket</h5>
                                                        <span className="text-[9.5px] text-slate-400 font-bold block mt-0.5">ID: ASL-TKT-{msg.ticketData.ticketId.slice(-4).toUpperCase()}</span>
                                                    </div>
                                                    <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                        msg.ticketData.priority === 'urgent' || msg.ticketData.priority === 'high' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                        {msg.ticketData.priority} Priority
                                                    </span>
                                                </div>

                                                <div className="space-y-2 text-[10.5px] font-bold text-slate-650 bg-slate-50 p-3 rounded-lg border border-slate-150">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 font-medium">Ticket Status:</span>
                                                        <span className="text-amber-600">Under Investigation</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 font-medium">Assigned To:</span>
                                                        <span className="text-slate-800">Operations Team</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 font-medium">Expected Resolution:</span>
                                                        <span className="text-[#E07A5F]">Within 24 Hours</span>
                                                    </div>
                                                </div>

                                                <p className="text-[10px] text-slate-500 font-semibold leading-normal">
                                                    Our Operations team has received the complete logs report and is conducting an immediate review.
                                                </p>
                                            </div>
                                        )}

                                        {/* 7A. Party Planner Checklist Card */}
                                        {msg.intent === 'party-planning' && msg.intentData && (
                                            <div className="mt-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm w-full max-w-[360px] space-y-3.5 animate-in fade-in duration-300">
                                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                                    <div>
                                                        <h5 className="font-black text-slate-800 text-xs">🎉 Party Planner Checklist</h5>
                                                        <span className="text-[9.5px] text-slate-400 font-bold block mt-0.5">Guests: {msg.intentData.guests} People</span>
                                                    </div>
                                                    <span className="text-[9px] bg-violet-50 text-violet-650 font-black uppercase px-2 py-0.5 rounded-full border border-violet-100">
                                                        Active Plan
                                                    </span>
                                                </div>
                                                <div className="space-y-2.5">
                                                    {msg.intentData.checklist.map((item, idx) => (
                                                        <div key={idx} className="flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                                                            <div className="flex items-center gap-2">
                                                                <input type="checkbox" defaultChecked={item.checked} className="rounded border-slate-300 text-[#E07A5F] focus:ring-[#E07A5F]" />
                                                                <span className="text-slate-800 font-black">{item.name}</span>
                                                            </div>
                                                            <span className="text-[10px] text-[#E07A5F] font-black">₹{item.cost}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                                                    <button onClick={() => handleActionClick("Find bakery near me")} className="py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 font-black rounded-lg text-[9px] uppercase tracking-wider text-center border border-indigo-100">
                                                        Find Cake Shop
                                                    </button>
                                                    <button onClick={() => handleActionClick("🛍 Shopping Help")} className="py-1.5 bg-[#E07A5F] hover:bg-[#d0684f] text-white font-black rounded-lg text-[9px] uppercase tracking-wider text-center">
                                                        Shop Decor
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* 7B/C. Life Event Moving & Baby Checklist Cards */}
                                        {(msg.intent === 'life-event-moving' || msg.intent === 'life-event-baby') && msg.intentData && (
                                            <div className="mt-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm w-full max-w-[360px] space-y-3.5 animate-in fade-in duration-300">
                                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                                    <div>
                                                        <h5 className="font-black text-slate-800 text-xs">📦 {msg.intentData.eventName} Checklist</h5>
                                                        <span className="text-[9.5px] text-slate-400 font-bold block mt-0.5">Life Event Concierge</span>
                                                    </div>
                                                    <span className="text-[9px] bg-emerald-50 text-emerald-650 font-black uppercase px-2 py-0.5 rounded-full border border-emerald-100">
                                                        Active
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    {msg.intentData.checklist.map((item, idx) => (
                                                        <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-150 text-[10.5px] font-bold text-slate-700 flex justify-between items-center">
                                                            <div className="flex items-center gap-2">
                                                                <input type="checkbox" defaultChecked className="rounded border-slate-350 text-[#E07A5F]" />
                                                                <div>
                                                                    <span className="block text-slate-800 font-black">{item.name}</span>
                                                                    <span className="block text-[8.5px] text-slate-400 mt-0.5 font-bold">Assigned: {item.provider}</span>
                                                                </div>
                                                            </div>
                                                            <span className="text-[8.5px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-black border border-emerald-100">MATCHED</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="pt-2 border-t border-slate-100">
                                                    <button 
                                                        onClick={() => handleActionClick(msg.intent === 'life-event-moving' ? "Find home bakes" : "🛍 Shopping Help")}
                                                        className="w-full py-1.5 bg-[#E07A5F] hover:bg-[#d0684f] text-white font-black rounded-lg text-[9px] uppercase tracking-wider text-center shadow-xs"
                                                    >
                                                        Find Nearest Providers
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* 7D. Multi-Shop Cart Optimization Card */}
                                        {msg.intent === 'multi-shop-cart' && msg.intentData && (
                                            <div className="mt-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm w-full max-w-[360px] space-y-3.5 animate-in fade-in duration-300">
                                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                                    <div>
                                                        <h5 className="font-black text-slate-800 text-xs">🛒 Multi-Shop Optimizer</h5>
                                                        <span className="text-[9.5px] text-slate-400 font-bold block mt-0.5">Split across {msg.intentData.shopsCount} Shops</span>
                                                    </div>
                                                    <span className="text-[9px] bg-rose-50 text-rose-650 font-black px-2 py-0.5 rounded-full border border-rose-100">
                                                        Save ₹{msg.intentData.savings}
                                                    </span>
                                                </div>
                                                <div className="space-y-2 text-[10.5px]">
                                                    <div className="font-bold text-slate-400 text-[9px] uppercase tracking-wider">Item Split Optimization</div>
                                                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                                                        {msg.intentData.items.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-150 font-bold">
                                                                <div>
                                                                    <span className="block text-slate-800 font-black">{item.name}</span>
                                                                    <span className="block text-[8.5px] text-[#E07A5F] font-bold">{item.shopName}</span>
                                                                </div>
                                                                <span className="text-slate-900 font-black">₹{item.price}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="pt-2 border-t border-slate-100 space-y-2">
                                                    <div className="flex justify-between items-center text-xs font-black">
                                                        <span className="text-slate-500">Optimized Combined Total:</span>
                                                        <span className="text-indigo-650 text-sm">₹{msg.intentData.totalAmount}</span>
                                                    </div>
                                                    <button onClick={() => handleActionClick("Confirm Order")} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg text-[9.5px] uppercase tracking-widest text-center shadow-md">
                                                        Add Multi-Cart & Checkout
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* 7E/G/F. Shopping Planners (Gym Diet, Picnic, Wedding) */}
                                        {(msg.intent === 'shopping-planner-gym' || msg.intent === 'picnic-planner' || msg.intent === 'wedding-planner') && msg.intentData && (
                                            <div className="mt-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm w-full max-w-[360px] space-y-3.5 animate-in fade-in duration-300">
                                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                                    <div>
                                                        <h5 className="font-black text-slate-800 text-xs">🥗 Planner Checklist</h5>
                                                        <span className="text-[9.5px] text-slate-400 font-bold block mt-0.5">{msg.intentData.dietType || msg.intentData.eventName}</span>
                                                    </div>
                                                    <span className="text-[9px] bg-indigo-50 text-indigo-650 font-black uppercase px-2 py-0.5 rounded-full border border-indigo-100">
                                                        Active
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    {msg.intentData.checklist.map((item, idx) => (
                                                        <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-150 text-[10.5px] font-bold text-slate-700 flex justify-between items-center">
                                                            <div className="flex items-center gap-2">
                                                                <input type="checkbox" defaultChecked className="rounded border-slate-350 text-[#E07A5F]" />
                                                                <div>
                                                                    <span className="block text-slate-800 font-black">{item.name}</span>
                                                                    <span className="block text-[8.5px] text-slate-400 mt-0.5 font-bold">{item.shop || item.provider}</span>
                                                                </div>
                                                            </div>
                                                            <span className="text-slate-900 font-black">₹{item.cost}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="pt-2 border-t border-slate-100">
                                                    <button onClick={() => handleActionClick("🛍 Shopping Help")} className="w-full py-1.5 bg-[#E07A5F] hover:bg-[#d0684f] text-white font-black rounded-lg text-[9px] uppercase tracking-wider text-center shadow-xs">
                                                        Locate Sellers & Purchase
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* 7H. Bulk Negotiation Multi-Seller Card */}
                                        {msg.intent === 'bulk-negotiation' && msg.intentData && (
                                            <div className="mt-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm w-full max-w-[360px] space-y-3.5 animate-in fade-in duration-300">
                                                <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                                                    <div>
                                                        <h5 className="font-black text-slate-800 text-xs">🛡️ Bulk Quotation Quotes</h5>
                                                        <span className="text-[9.5px] text-slate-400 font-bold block mt-0.5">Quantity: {msg.intentData.quantity} {msg.intentData.itemType}s</span>
                                                    </div>
                                                    <span className="text-[9px] bg-amber-50 text-amber-650 font-black px-2 py-0.5 rounded-full border border-amber-100">
                                                        Negotiated
                                                    </span>
                                                </div>
                                                <div className="space-y-3">
                                                    {msg.intentData.quotes.map((q, idx) => (
                                                        <div key={idx} className="bg-slate-50 border border-slate-150 p-3 rounded-xl space-y-2.5">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <span className="text-xs font-black text-slate-800 block leading-tight">{q.shopName}</span>
                                                                    <span className="text-[9.5px] text-slate-400 font-bold block mt-0.5">⭐ {q.rating.toFixed(1)} | 🚚 {q.deliveryHours}h Delivery</span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="text-xs font-black text-indigo-650 block">₹{q.pricePerUnit}/unit</span>
                                                                    <span className="text-[10px] text-slate-900 font-black block mt-0.5">Total: ₹{q.total}</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-[9.5px] text-slate-550 leading-normal border-t border-slate-200/50 pt-2 font-semibold">
                                                                📦 <span className="text-slate-400 font-bold">Includes:</span> {q.includes}
                                                            </div>
                                                            <button 
                                                                onClick={() => handleActionClick(`Accept ${q.shopName === "Indore Electronics Hub" ? "Indore Electronics" : q.shopName === "Madhya Pradesh Bakery" ? "MP Bakery" : "Priyas Bakes"}`)}
                                                                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg text-[9px] uppercase tracking-wider text-center"
                                                            >
                                                                Accept Deal & Checkout
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 7I. Voice Command Confirmation */}
                                        {msg.intent === 'voice-assistance' && (
                                            <div className="mt-3 bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm w-full max-w-[360px] space-y-2.5 flex items-start gap-3 animate-in fade-in duration-300">
                                                <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg shrink-0">
                                                    <Mic size={15} className="animate-pulse" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="font-black text-slate-800 text-[11px] leading-none">Voice Assistant Confirmation</h5>
                                                    <p className="text-[9.5px] text-slate-550 font-bold mt-1 leading-normal">Organic Milk (1L) from Indore Kirana Mart.</p>
                                                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100">
                                                        <button onClick={() => { processUserMessage("Confirm Order"); }} className="py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded text-[8.5px] uppercase tracking-wider text-center">
                                                            Place Order
                                                        </button>
                                                        <button onClick={() => { handleActionClick("go back"); }} className="py-1 border border-slate-200 text-slate-550 font-bold rounded text-[8.5px] uppercase tracking-wider text-center">
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Conversation Insights Summary Card */}
                                        {msg.conversationInsights && (
                                            <div className="mt-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm w-full max-w-[360px] space-y-3">
                                                <h5 className="font-black text-slate-800 text-xs border-b border-slate-100 pb-2">📋 Resolution Progress Summary</h5>
                                                <div className="space-y-2 text-[11px] font-bold text-slate-700">
                                                    <div className="flex items-center gap-2 text-emerald-600">
                                                        <span>✓</span> <span>Issue Identified: {msg.conversationInsights.issue || "Support Inquiry"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-emerald-600">
                                                        <span>✓</span> <span>Seller Contacted: {msg.conversationInsights.seller || "Support Queue"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-emerald-600">
                                                        <span>✓</span> <span>Ticket Created: Successful</span>
                                                    </div>
                                                </div>
                                                <div className="pt-2.5 border-t border-slate-100 flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                                                    <span>Reference:</span>
                                                    <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                                                        {msg.conversationInsights.reference || "ASL-8291"}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Smart Follow-Ups (thumbsUp / thumbsDown) */}
                                        {msg.sender === 'bot' && msg.showFeedback && !msg.feedbackSubmitted && (
                                            <div className="mt-2 flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-150 shadow-sm text-[10px] font-bold">
                                                <span className="text-slate-400 font-medium">Was this helpful?</span>
                                                <button
                                                    onClick={() => handleFeedback(msg.id, 'thumbsUp')}
                                                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-emerald-50 text-slate-650 hover:text-emerald-600 rounded-lg border border-slate-200 transition-colors shadow-xs"
                                                >
                                                    👍 Yes
                                                </button>
                                                <button
                                                    onClick={() => handleFeedback(msg.id, 'thumbsDown')}
                                                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-red-50 text-slate-650 hover:text-red-600 rounded-lg border border-slate-200 transition-colors shadow-xs"
                                                >
                                                    👎 No
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Interactive simulated thinking states */}
                                {isTyping && (
                                    <div className="flex justify-start items-center gap-2">
                                        <div className="bg-white border border-slate-100 px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm flex flex-col gap-1 min-w-[150px]">
                                            <span className="text-[10px] font-bold text-indigo-500 animate-pulse">
                                                {thinkingText || "● Aisle AI thinking..."}
                                            </span>
                                            <div className="flex gap-1 mt-1">
                                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-100"></span>
                                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200"></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            </>
                        )}
                        </div>

                        {/* AUTO-REPLY SUGGESTION CHIPS (Display if any replies available) */}
                        {suggestedReplies.length > 0 && !isTyping && (
                            <div className="px-5 py-2.5 border-t border-slate-100/60 bg-white flex flex-wrap gap-2">
                                {suggestedReplies.map((replyText, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleActionClick(replyText)}
                                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-600 hover:text-indigo-600 transition-colors shadow-xs"
                                    >
                                        {replyText}
                                    </button>
                                ))}
                            </div>
                        )}

                                        {/* PERSISTENT SHOPPING SHORTCUT CHIP */}
                        <div className="px-4 py-2 border-t border-slate-100/50 bg-slate-50/50 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-400">Need immediate help?</span>
                            <button
                                onClick={() => handleActionClick("🛍 Shopping Help")}
                                className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 hover:border-indigo-400 rounded-full text-[10px] font-black text-indigo-600 hover:text-indigo-700 transition-colors shadow-xs"
                            >
                                🛍 Shopping Help
                            </button>
                        </div>

                        {/* PANEL INPUT AREA */}
                        <div className="p-4 border-t border-slate-100 bg-white">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => triggerVoiceAssistant()}
                                    className="p-3 bg-slate-50 border border-slate-200 hover:border-[#E07A5F] text-slate-500 hover:text-[#E07A5F] rounded-xl transition-all shadow-xs"
                                    title="Voice Assistant"
                                >
                                    <Mic size={15} className="animate-pulse" />
                                </button>
                                <button
                                    onClick={() => setIsUploadingImage(true)}
                                    className="p-3 bg-slate-50 border border-slate-200 hover:border-[#E07A5F] text-slate-500 hover:text-[#E07A5F] rounded-xl transition-all shadow-xs"
                                    title="Visual Shopping AI"
                                >
                                    <Camera size={15} />
                                </button>
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Ask Aisle Anything..."
                                        className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E07A5F] focus:bg-white transition-all text-xs font-semibold placeholder-slate-400"
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!inputValue.trim()}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#E07A5F] text-white rounded-lg hover:bg-[#d0684f] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                                    >
                                        <Send size={14} />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Upgraded Footer Layout */}
                            <div className="flex justify-between items-center px-1 mt-3 text-[9px] text-slate-400 font-bold">
                                <span>🟢 Aisle Copilot Online</span>
                                <span>Average Response Time: Instant</span>
                                <span>Session: #{user?._id?.slice(-6) || 'Guest'}</span>
                            </div>
                        </div>

                        {/* 7J. Voice Assistant Pulsating Overlay */}
                        {isRecordingVoice && (
                            <div className="absolute inset-0 bg-slate-900/95 z-[2100] flex flex-col items-center justify-center text-white space-y-6 animate-in fade-in duration-300">
                                <div className="text-center space-y-1">
                                    <h4 className="font-black text-sm tracking-tight text-indigo-400">Aisle Voice Assistant</h4>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block animate-pulse">Listening...</span>
                                </div>
                                
                                {/* Soundwave pulse animation */}
                                <div className="flex items-center gap-1.5 h-16">
                                    <div className="w-1.5 bg-indigo-500 rounded-full h-8 animate-pulse"></div>
                                    <div className="w-1.5 bg-indigo-400 rounded-full h-12 animate-pulse delay-75"></div>
                                    <div className="w-1.5 bg-indigo-300 rounded-full h-16 animate-pulse delay-150"></div>
                                    <div className="w-1.5 bg-indigo-400 rounded-full h-12 animate-pulse delay-75"></div>
                                    <div className="w-1.5 bg-indigo-500 rounded-full h-8 animate-pulse"></div>
                                </div>

                                <div className="text-center font-bold text-xs text-slate-300 italic px-6 leading-normal">
                                    "Order milk from my usual shop"
                                </div>

                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Simulating speech text input in {voiceCountdown}s...</span>
                            </div>
                        )}

                        {/* 7K. Visual Shopping Image Upload Modal */}
                        {isUploadingImage && (
                            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs z-[2100] flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
                                <div className="bg-white rounded-2xl p-5 w-full max-w-[320px] shadow-2xl border border-slate-100 space-y-4">
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                                        <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                            <Camera size={14} className="text-[#E07A5F]" />
                                            Visual Search Upload
                                        </span>
                                        <button onClick={() => setIsUploadingImage(false)} className="text-slate-400 hover:text-slate-600 font-black text-xs uppercase tracking-wider">
                                            Cancel
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-semibold leading-normal">
                                        Select a mockup product photo to simulate image scanning on Aisle:
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => handleImageSearchSelect('chair')}
                                            className="border border-slate-200 hover:border-indigo-400 rounded-xl p-2 bg-slate-50 hover:bg-slate-100 text-left transition-all group shrink-0"
                                        >
                                            <div className="h-20 bg-slate-200 rounded-lg overflow-hidden relative mb-1.5">
                                                <img src="https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=200" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                            </div>
                                            <span className="block text-[10px] font-black text-slate-800 leading-tight">Accent Chair</span>
                                            <span className="block text-[8px] text-slate-400 mt-0.5">Furniture category</span>
                                        </button>
                                        
                                        <button 
                                            onClick={() => handleImageSearchSelect('cake')}
                                            className="border border-slate-200 hover:border-indigo-400 rounded-xl p-2 bg-slate-50 hover:bg-slate-100 text-left transition-all group shrink-0"
                                        >
                                            <div className="h-20 bg-slate-200 rounded-lg overflow-hidden relative mb-1.5">
                                                <img src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                            </div>
                                            <span className="block text-[10px] font-black text-slate-800 leading-tight">Velvet Cake</span>
                                            <span className="block text-[8px] text-slate-400 mt-0.5">Bakeries category</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SupportPanel;
