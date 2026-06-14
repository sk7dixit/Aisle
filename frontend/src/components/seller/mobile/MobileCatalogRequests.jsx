import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
    Plus, Search, Edit2, Trash2, MoreVertical, AlertCircle, Check, X,
    ChevronRight, Loader, Sparkles, Package, Box, TrendingUp, ShoppingBag,
    Bell, ArrowLeft, RefreshCw, MessageSquare, Send, Calendar, Clock,
    Phone, FileText, Inbox, Heart, Image as ImageIcon, CheckCircle2,
    ShieldCheck, Info, Share2, Star
} from 'lucide-react';
import { FaTimesCircle, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';

const MobileCatalogRequests = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    const isHomeBusiness = user?.shopDetails?.shopCategory === 'Home Businesses' || 
                           user?.shopDetails?.category === 'Home Businesses' || 
                           user?.shopDetails?.shopType === 'HOME_BUSINESS';

    // --- SHARED DATA STATES ---
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // --- HOME BUSINESS STATES ---
    const [hbRequests, setHbRequests] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [swipeDir, setSwipeDir] = useState(null);
    const [showHbChat, setShowHbChat] = useState(false);
    const [activeHbChatRequest, setActiveHbChatRequest] = useState(null);
    const [chatInput, setChatInput] = useState('');
    const [quotePrice, setQuotePrice] = useState('');
    const [quotePrepTime, setQuotePrepTime] = useState('');

    // --- RETAIL/GROCERY STATES ---
    const [requests, setRequests] = useState([]);
    const [showRequestSheet, setShowRequestSheet] = useState(false);
    const [selectedRequestForTimeline, setSelectedRequestForTimeline] = useState(null);
    
    // Request Form Fields
    const [formName, setFormName] = useState('');
    const [formCategory, setFormCategory] = useState('Grocery');
    const [formBrand, setFormBrand] = useState('');
    const [formDescription, setFormDescription] = useState('');

    // Pre-computed Trending Counts
    const [trendingCount1, setTrendingCount1] = useState(43);
    const [trendingCount2, setTrendingCount2] = useState(27);
    const [joinedTrend1, setJoinedTrend1] = useState(false);
    const [joinedTrend2, setJoinedTrend2] = useState(false);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get('/api/master/requests/my', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(data || []);

            if (isHomeBusiness) {
                // Seed custom client inquiries for Home Business (Tinder Style)
                const seeded = [
                    {
                        id: 'req_hb_1',
                        customerName: 'Meera Sen',
                        customerMobile: '9876123456',
                        details: 'Need 50 boxes of Homemade Laddoo for a corporate Diwali gift. Can you deliver them in customized decorative boxes by 20 October?',
                        targetDate: '20 Oct',
                        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
                        status: 'PENDING',
                        chatHistory: [
                            { sender: 'customer', text: 'Hi! Can you deliver 50 boxes of laddoos by 20 October?', time: '10:00 AM' },
                            { sender: 'seller', text: 'Yes, I can arrange the custom packaging. I will need 5 days. Let me send a quote.', time: '10:15 AM' }
                        ],
                        attachments: [
                            { name: 'diwali_box_sketch.jpg', size: '2.4 MB', type: 'image', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400' }
                        ],
                        estimatedValue: 12500,
                        distance: '1.2 km away'
                    },
                    {
                        id: 'req_hb_2',
                        customerName: 'Karan Johar',
                        customerMobile: '9922334455',
                        details: 'Need a custom blue crochet shoulder bag with a floral print. Can you make it slightly larger than standard size?',
                        targetDate: '12 Aug',
                        createdAt: new Date(Date.now() - 86400000).toISOString(),
                        status: 'PENDING',
                        chatHistory: [
                            { sender: 'customer', text: 'Hi, I\'d love a custom blue bag. Can we make it 12 inches wide?', time: 'Yesterday' }
                        ],
                        attachments: [],
                        estimatedValue: 1500,
                        distance: '2.8 km away'
                    },
                    {
                        id: 'req_hb_3',
                        customerName: 'Pooja Hegde',
                        customerMobile: '9182736450',
                        details: 'Gluten-free chocolate cupcakes needed for a kids birthday party. 24 pieces with pastel icing.',
                        targetDate: 'Next Sun',
                        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
                        status: 'PENDING',
                        chatHistory: [],
                        attachments: [],
                        estimatedValue: 2400,
                        distance: '4.5 km away'
                    }
                ];
                setHbRequests(seeded);
            }
        } catch (err) {
            console.error("Failed to fetch my catalog requests:", err);
            // Fallback mock requests for Kirana if API fails or offline
            setRequests([
                {
                    _id: 'req_1',
                    product_name: 'Boat Airdopes 131 Wireless Earbuds',
                    brand_name: 'Boat',
                    pack_size: '1 Unit',
                    category: 'Other',
                    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
                    status: 'PENDING',
                    admin_notes: ''
                },
                {
                    _id: 'req_2',
                    product_name: 'Amul Organic Cow Ghee',
                    brand_name: 'Amul',
                    pack_size: '1L Tetrapack',
                    category: 'Dairy',
                    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
                    status: 'APPROVED',
                    admin_notes: 'Successfully mapped under Dairy -> Ghee.'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    useEffect(() => {
        if (showHbChat) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [showHbChat, activeHbChatRequest?.chatHistory]);

    // --- HOME BUSINESS SWIPER ACTIONS ---
    const handleHbSwipe = (direction) => {
        if (currentIndex >= hbRequests.length) return;
        setSwipeDir(direction);
        
        setTimeout(() => {
            const currentReq = hbRequests[currentIndex];
            if (direction === 'right') {
                setActiveHbChatRequest(currentReq);
                setShowHbChat(true);
            } else {
                toast.error(`Declined request from ${currentReq.customerName}`);
                setCurrentIndex(prev => prev + 1);
            }
            setSwipeDir(null);
        }, 300);
    };

    const handleHbSendMessage = () => {
        if (!chatInput.trim() || !activeHbChatRequest) return;
        const newMsg = {
            sender: 'seller',
            text: chatInput.trim(),
            time: 'Just now'
        };

        setActiveHbChatRequest(prev => ({
            ...prev,
            chatHistory: [...prev.chatHistory, newMsg]
        }));
        setChatInput('');

        setTimeout(() => {
            if (activeHbChatRequest) {
                const autoMsg = {
                    sender: 'customer',
                    text: 'Thank you! The quote looks good. Please proceed and I will visit the store once ready.',
                    time: 'Just now'
                };
                setActiveHbChatRequest(prev => ({
                    ...prev,
                    chatHistory: [...prev.chatHistory, autoMsg]
                }));
            }
        }, 1200);
    };

    const handleHbAcceptQuote = () => {
        if (!quotePrice || !activeHbChatRequest) return;
        toast.success(`Quote of ₹${quotePrice} sent to ${activeHbChatRequest.customerName}!`);
        
        const newMsg = {
            sender: 'seller',
            text: `Price Quote Sent: ₹${quotePrice} • Preparation Time: ${quotePrepTime || '3 days'}`,
            time: 'Just now'
        };
        
        setActiveHbChatRequest(prev => ({
            ...prev,
            chatHistory: [...prev.chatHistory, newMsg]
        }));
        
        setQuotePrice('');
        setQuotePrepTime('');
    };

    // --- RETAIL/KIRANA CATALOG REQUEST ACTIONS ---
    const handleAddRequest = async (e) => {
        e.preventDefault();
        if (!formName.trim() || !formCategory) {
            toast.error("Name and Category are required");
            return;
        }

        setProcessing(true);
        try {
            const res = await axios.post('/api/master/request', {
                product_name: formName.trim(),
                category: formCategory,
                brand_name: formBrand.trim() || 'Generic',
                pack_size: formDescription.trim() || '1 Unit'
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.status === 201) {
                toast.success("Request submitted to Aisle Admin!");
                setShowRequestSheet(false);
                // Reset form
                setFormName('');
                setFormBrand('');
                setFormDescription('');
                // Refresh request history
                await fetchRequests();
            }
        } catch (err) {
            console.error("Submit Request Error:", err);
            toast.error("Failed to submit request");
        } finally {
            setProcessing(false);
        }
    };

    // Join community request
    const handleJoinRequest = async (productName, category, brandName, trendIndex) => {
        try {
            const res = await axios.post('/api/master/request', {
                product_name: productName,
                category: category,
                brand_name: brandName,
                pack_size: 'Joined Community Request'
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.status === 201) {
                toast.success(`Successfully joined request for ${productName}!`);
                if (trendIndex === 1) {
                    setTrendingCount1(prev => prev + 1);
                    setJoinedTrend1(true);
                } else {
                    setTrendingCount2(prev => prev + 1);
                    setJoinedTrend2(true);
                }
                await fetchRequests();
            }
        } catch (err) {
            console.error("Join Request Error:", err);
            toast.error("Failed to join request");
        }
    };

    // Pre-fill suggestions handler
    const handleSuggestionClick = (name, cat) => {
        setFormName(name);
        setFormCategory(cat || 'Grocery');
        setFormBrand('Generic');
        setFormDescription('Standard size');
        setShowRequestSheet(true);
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col justify-center items-center gap-3 text-slate-400">
                <Loader className="animate-spin text-indigo-650" size={32} />
                <span className="text-xs font-bold uppercase tracking-wider">Loading Requests Center...</span>
            </div>
        );
    }

    // Statistics computation for Kirana
    const pendingCount = requests.filter(r => r.status === 'PENDING').length;
    const approvedCount = requests.filter(r => r.status === 'APPROVED').length;
    const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;
    const totalCount = requests.length;

    // --- 1. RENDER HOME BUSINESS EXPERIENCE (Preserved Tinder swipe-deck) ---
    if (isHomeBusiness) {
        const currentCard = hbRequests[currentIndex];
        return (
            <div className="p-4 flex flex-col h-[calc(100vh-124px)] overflow-hidden font-sans relative">
                {/* Header */}
                <div className="flex justify-between items-center flex-shrink-0 mb-4">
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate('/seller/home')} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-700">
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                                ✨ Aisle Swipe <span className="text-xs bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-extrabold uppercase">Beta</span>
                            </h1>
                            <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
                                Swipe right to Quote, left to Pass
                            </p>
                        </div>
                    </div>
                </div>

                {/* Swipe Deck */}
                <div className="flex-1 flex items-center justify-center relative min-h-0 overflow-hidden mb-6">
                    {currentIndex < hbRequests.length ? (
                        <div
                            className={`w-full max-w-sm bg-white rounded-3xl border border-slate-100 shadow-xl p-5 flex flex-col justify-between h-[360px] relative transition-all duration-300 ${
                                swipeDir === 'left' ? '-translate-x-full rotate-[-12deg] opacity-0' :
                                swipeDir === 'right' ? 'translate-x-full rotate-[12deg] opacity-0' : 'scale-100'
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-[8px] font-black uppercase text-amber-650 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 tracking-wider">
                                    {currentCard.distance}
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold">
                                    Value: ₹{currentCard.estimatedValue.toLocaleString()}
                                </span>
                            </div>

                            <div className="space-y-1.5 mt-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                                        {currentCard.customerName[0]}
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-extrabold text-sm text-slate-850">{currentCard.customerName}</h3>
                                        <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">Buyer Inquiry</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 mt-4 overflow-y-auto pr-1">
                                <p className="text-xs font-semibold text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100/50 text-left">
                                    "{currentCard.details}"
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-50">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-slate-400" />
                                    <div className="text-left">
                                        <span className="text-[8px] font-bold text-slate-400 block uppercase">Deliver By</span>
                                        <span className="text-[10px] font-black text-slate-700">{currentCard.targetDate}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-slate-400" />
                                    <div className="text-left">
                                        <span className="text-[8px] font-bold text-slate-400 block uppercase">Urgency</span>
                                        <span className="text-[10px] font-black text-rose-500">Medium</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-4 py-16 flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center text-slate-300">
                                <Inbox size={32} />
                            </div>
                            <div>
                                <h3 className="font-black text-sm text-slate-800">You are all caught up!</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                    Check back later for new custom inquiries.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Swiper Action Buttons */}
                {currentIndex < hbRequests.length && (
                    <div className="flex items-center justify-center gap-6 pb-4 flex-shrink-0">
                        <button
                            onClick={() => handleHbSwipe('left')}
                            className="w-14 h-14 rounded-full bg-white border border-slate-100 shadow-md text-rose-505 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                        >
                            <X size={24} />
                        </button>
                        <button
                            onClick={() => handleHbSwipe('right')}
                            className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 flex items-center justify-center active:scale-95 transition-all cursor-pointer animate-pulse"
                        >
                            <Heart size={26} className="fill-white" />
                        </button>
                    </div>
                )}

                {/* Swiper Chat Panel Overlay */}
                {showHbChat && activeHbChatRequest && (
                    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-slide-in-right">
                        <div className="h-[60px] px-4 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        setShowHbChat(false);
                                        setCurrentIndex(prev => prev + 1);
                                    }}
                                    className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 cursor-pointer"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-sm">
                                    {activeHbChatRequest.customerName[0]}
                                </div>
                                <div className="text-left">
                                    <h3 className="font-extrabold text-xs text-slate-800 leading-none">{activeHbChatRequest.customerName}</h3>
                                    <span className="text-[8px] text-emerald-600 font-bold block mt-1">Active Inquiry Chat</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 flex flex-col">
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-left">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-450 block mb-1">Inquiry specs</span>
                                <p className="text-xs font-semibold text-slate-700 leading-relaxed">"{activeHbChatRequest.details}"</p>
                            </div>

                            {/* Quote Submission form in chat */}
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-left space-y-3">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-450 block">Submit Pricing Proposal</span>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-[10px]">₹</span>
                                        <input
                                            type="number"
                                            placeholder="Price"
                                            value={quotePrice}
                                            onChange={e => setQuotePrice(e.target.value)}
                                            className="w-full pl-6 pr-2 py-2 rounded-xl border border-slate-250 bg-slate-50 text-[10px] font-bold text-slate-750"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Prep (e.g. 3 days)"
                                        value={quotePrepTime}
                                        onChange={e => setQuotePrepTime(e.target.value)}
                                        className="w-full px-2.5 py-2 rounded-xl border border-slate-250 bg-slate-50 text-[10px] font-bold text-slate-750"
                                    />
                                </div>
                                <button
                                    onClick={handleHbAcceptQuote}
                                    disabled={!quotePrice}
                                    className="w-full h-8 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow cursor-pointer disabled:opacity-50"
                                >
                                    Send Quote
                                </button>
                            </div>

                            <div className="flex items-center gap-2 py-1 flex-shrink-0">
                                <div className="h-[1px] bg-slate-200 flex-1"></div>
                                <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest">Discussion logs</span>
                                <div className="h-[1px] bg-slate-200 flex-1"></div>
                            </div>

                            <div className="space-y-3 flex-1">
                                {activeHbChatRequest.chatHistory?.map((msg, idx) => {
                                    const isSeller = msg.sender === 'seller';
                                    return (
                                        <div key={idx} className={`flex flex-col ${isSeller ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-xs ${
                                                isSeller ? 'bg-amber-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                            }`}>
                                                {msg.text}
                                            </div>
                                            <span className="text-[8px] text-slate-400 font-bold mt-1 px-1">{msg.time}</span>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Input bar */}
                        <div className="p-3 border-t border-slate-200/80 bg-white flex gap-2 flex-shrink-0">
                            <input
                                type="text"
                                placeholder="Type a message to the customer..."
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleHbSendMessage(); }}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                            <button
                                onClick={handleHbSendMessage}
                                className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow hover:bg-amber-700 cursor-pointer"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- 2. RENDER NEW MOBILE CATALOG REQUEST MANAGEMENT CENTER (Kirana/Grocery) ---
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
                        <h1 className="text-xl font-black text-slate-800 tracking-tight">Catalog Requests</h1>
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                            Track requested products
                        </p>
                    </div>
                </div>

                {/* Counter Badge */}
                <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200/60 px-2.5 py-1 rounded-xl">
                    <span className="text-[9px] font-black text-amber-600 uppercase">Pending {pendingCount}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    <span className="text-[9px] font-black text-emerald-600 uppercase">Approved {approvedCount}</span>
                </div>
            </div>

            {/* --- QUICK REQUEST CARD --- */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-955 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>
                <div className="flex items-start gap-4 text-left">
                    <span className="text-3xl">📦</span>
                    <div className="space-y-1">
                        <h3 className="font-extrabold text-sm tracking-tight text-indigo-100">Can't find a product?</h3>
                        <p className="text-[10px] text-indigo-300 font-medium leading-relaxed">
                            Request a new product to be added to the Aisle master catalog.
                        </p>
                        <button
                            onClick={() => {
                                setFormName('');
                                setFormBrand('');
                                setFormDescription('');
                                setShowRequestSheet(true);
                            }}
                            className="inline-block mt-3 px-4 py-2 bg-white text-indigo-900 font-black rounded-xl text-[10px] uppercase shadow-md active:scale-95 transition-all cursor-pointer"
                        >
                            + Request Product
                        </button>
                    </div>
                </div>
            </div>

            {/* --- REQUEST STATISTICS GRID --- */}
            <div className="space-y-2 text-left">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Request Statistics</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Pending</span>
                        <h4 className="text-lg font-black text-slate-800 mt-1">{pendingCount}</h4>
                    </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Approved</span>
                        <h4 className="text-lg font-black text-slate-800 mt-1">{approvedCount}</h4>
                    </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Rejected</span>
                        <h4 className="text-lg font-black text-slate-800 mt-1">{rejectedCount}</h4>
                    </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Total</span>
                        <h4 className="text-lg font-black text-slate-800 mt-1">{totalCount}</h4>
                    </div>
                </div>
            </div>

            {/* --- AI SUGGESTIONS --- */}
            <div className="bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-transparent border border-indigo-500/15 rounded-3xl p-4 shadow-xs text-left space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full pointer-events-none"></div>
                
                <div className="flex justify-between items-center pb-2 border-b border-indigo-500/10">
                    <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5">
                        <Sparkles size={12} className="text-violet-650" /> Aisle AI Suggestions
                    </span>
                    <span className="text-[8px] font-black uppercase text-indigo-650 bg-indigo-50 px-1.5 py-0.5 rounded">Nearby Needs</span>
                </div>

                <p className="text-[10px] text-slate-500 font-semibold pl-1">Frequently requested nearby:</p>

                <div className="grid grid-cols-2 gap-2">
                    {[
                        { name: "Organic Honey", cat: "Grocery" },
                        { name: "Brown Bread", cat: "Bakery" },
                        { name: "Sugar Free Cookies", cat: "Bakery" },
                        { name: "Protein Powder", cat: "Other" }
                    ].map((sug, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSuggestionClick(sug.name, sug.cat)}
                            className="p-2.5 bg-white border border-slate-100 rounded-xl text-[10px] font-bold text-slate-700 hover:border-indigo-400 text-left hover:bg-slate-50 transition-all flex items-center justify-between group cursor-pointer"
                        >
                            <span className="truncate pr-1">{sug.name}</span>
                            <span className="text-[8px] bg-slate-50 text-slate-400 px-1 py-0.5 rounded uppercase group-hover:bg-indigo-50 group-hover:text-indigo-600 font-black">{sug.cat}</span>
                        </button>
                    ))}
                </div>

                <button 
                    onClick={() => {
                        setFormName('');
                        setFormBrand('');
                        setFormDescription('');
                        setShowRequestSheet(true);
                    }}
                    className="w-full text-center text-[10px] font-black text-indigo-650 hover:text-indigo-700 uppercase tracking-widest pt-1 cursor-pointer"
                >
                    [ Request Product ]
                </button>
            </div>

            {/* --- TRENDING COMMUNITY REQUESTS --- */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs text-left space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1">
                        <TrendingUp size={12} className="text-orange-500" /> Trending Requests
                    </h3>
                    <span className="text-[9px] font-black text-slate-400 uppercase">
                        Community
                    </span>
                </div>

                <div className="space-y-3 pt-1">
                    {/* Trend 1 */}
                    <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-2xl flex justify-between items-center">
                        <div>
                            <h4 className="text-xs font-extrabold text-slate-800">Protein Powder</h4>
                            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Requested by {trendingCount1} sellers</p>
                        </div>
                        <button
                            disabled={joinedTrend1}
                            onClick={() => handleJoinRequest("Protein Powder", "Other", "Generic", 1)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer
                                ${joinedTrend1 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                        >
                            {joinedTrend1 ? "Joined" : "Join Request"}
                        </button>
                    </div>

                    {/* Trend 2 */}
                    <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-2xl flex justify-between items-center">
                        <div>
                            <h4 className="text-xs font-extrabold text-slate-800">Sugar Free Biscuits</h4>
                            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Requested by {trendingCount2} sellers</p>
                        </div>
                        <button
                            disabled={joinedTrend2}
                            onClick={() => handleJoinRequest("Sugar Free Biscuits", "Bakery", "Generic", 2)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer
                                ${joinedTrend2 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                        >
                            {joinedTrend2 ? "Joined" : "Join Request"}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- RECENT REQUESTS SECTION --- */}
            <div className="space-y-3 text-left">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Recent Requests</h3>

                {requests.length === 0 ? (
                    <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                        <Package size={24} className="text-slate-350 mb-2" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No recent requests.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {requests.map(req => {
                            const dateStr = new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
                            return (
                                <div 
                                    key={req._id}
                                    onClick={() => setSelectedRequestForTimeline(req)}
                                    className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex justify-between items-center hover:border-slate-200 transition-all cursor-pointer"
                                >
                                    <div>
                                        <h4 className="text-xs font-extrabold text-slate-800">{req.product_name}</h4>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                            Submitted {dateStr} &bull; {req.brand_name || 'Generic'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border
                                            ${req.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200/50' : ''}
                                            ${req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' : ''}
                                            ${req.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-200/50' : ''}
                                        `}>
                                            {req.status === 'PENDING' ? 'Under Review' : req.status}
                                        </span>
                                        <ChevronRight size={12} className="text-slate-300" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* --- FLOATING ACTION BUTTON --- */}
            <div className="fixed bottom-20 right-4 z-40">
                <button
                    onClick={() => {
                        setFormName('');
                        setFormBrand('');
                        setFormDescription('');
                        setShowRequestSheet(true);
                    }}
                    className="flex items-center gap-2 bg-indigo-650 hover:bg-indigo-700 text-white px-5 py-3.5 rounded-2xl font-black text-xs shadow-xl active:scale-95 transition-all border border-indigo-500/10 cursor-pointer"
                >
                    <Plus size={16} />
                    <span>Request Product</span>
                </button>
            </div>

            {/* --- MODAL OVERLAYS --- */}

            {/* 1. Request Product Bottom Sheet Modal */}
            {showRequestSheet && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white w-full rounded-t-[2.5rem] p-6 shadow-2xl relative text-left">
                        <button 
                            onClick={() => setShowRequestSheet(false)} 
                            className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                        
                        <div className="flex items-center gap-3 mb-5">
                            <span className="p-1.5 bg-indigo-50 text-indigo-750 rounded-xl">
                                <Plus size={18} />
                            </span>
                            <div>
                                <h3 className="text-base font-black text-slate-800 leading-none">Request Product</h3>
                                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-1">Submit to Aisle Catalog</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddRequest} className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Product Name</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="e.g. Organic Raw Honey 500g"
                                    value={formName}
                                    onChange={e => setFormName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Category</label>
                                    <select
                                        value={formCategory}
                                        onChange={e => setFormCategory(e.target.value)}
                                        className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold cursor-pointer"
                                    >
                                        {['Grocery', 'Dairy', 'Bakery', 'Vegetables', 'Fruits', 'Pharma', 'Other'].map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Brand (Optional)</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Dabur"
                                        value={formBrand}
                                        onChange={e => setFormBrand(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Description / Size details</label>
                                <textarea 
                                    placeholder="Specify product volume, packaging type or ingredients..."
                                    value={formDescription}
                                    onChange={e => setFormDescription(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold min-h-[60px]"
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={processing}
                                className="w-full py-3.5 bg-indigo-650 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow shadow-indigo-600/10 cursor-pointer"
                            >
                                {processing ? "Submitting..." : "Submit Request"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. Visual Request Timeline Modal Drawer */}
            {selectedRequestForTimeline && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative text-left">
                        <button 
                            onClick={() => setSelectedRequestForTimeline(null)} 
                            className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
                        >
                            <X size={16} />
                        </button>

                        <div className="text-center mb-6">
                            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[9px] font-black uppercase tracking-wider mb-2 border border-indigo-100">
                                Request Timeline
                            </span>
                            <h3 className="text-base font-black text-slate-800">{selectedRequestForTimeline.product_name}</h3>
                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                                Brand: {selectedRequestForTimeline.brand_name || 'Generic'} &bull; Category: {selectedRequestForTimeline.category}
                            </p>
                        </div>

                        {/* Visual Timeline Stepper */}
                        <div className="space-y-5 pl-4 relative my-6">
                            {/* Vertical connector line */}
                            <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-slate-100"></div>

                            {/* Step 1: Submitted */}
                            <div className="flex gap-4 relative">
                                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold z-10 shrink-0 shadow-sm shadow-emerald-500/30">
                                    ✓
                                </span>
                                <div>
                                    <h4 className="text-xs font-black text-slate-800 leading-none">Submitted</h4>
                                    <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">
                                        {new Date(selectedRequestForTimeline.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            {/* Step 2: Review Started */}
                            <div className="flex gap-4 relative">
                                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold z-10 shrink-0 shadow-sm shadow-emerald-500/30">
                                    ✓
                                </span>
                                <div>
                                    <h4 className="text-xs font-black text-slate-800 leading-none">Review Started</h4>
                                    <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">Admin assigned</p>
                                </div>
                            </div>

                            {/* Step 3: Approved */}
                            <div className="flex gap-4 relative">
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold z-10 shrink-0
                                    ${selectedRequestForTimeline.status === 'APPROVED' 
                                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' 
                                        : selectedRequestForTimeline.status === 'REJECTED' 
                                            ? 'bg-rose-500 text-white' 
                                            : 'bg-slate-200 text-slate-400'
                                    }`}
                                >
                                    {selectedRequestForTimeline.status === 'APPROVED' ? '✓' : selectedRequestForTimeline.status === 'REJECTED' ? '✕' : '3'}
                                </span>
                                <div>
                                    <h4 className="text-xs font-black text-slate-800 leading-none">
                                        {selectedRequestForTimeline.status === 'REJECTED' ? 'Rejected' : 'Approved'}
                                    </h4>
                                    <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">
                                        {selectedRequestForTimeline.status === 'APPROVED' 
                                            ? 'Catalog insertion complete' 
                                            : selectedRequestForTimeline.status === 'REJECTED' 
                                                ? 'Declined by administrator' 
                                                : 'Awaiting admin decision'
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Step 4: Catalog Publishing */}
                            <div className="flex gap-4 relative">
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold z-10 shrink-0
                                    ${selectedRequestForTimeline.status === 'APPROVED' 
                                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' 
                                        : 'bg-slate-100 text-slate-300'
                                    }`}
                                >
                                    {selectedRequestForTimeline.status === 'APPROVED' ? '✓' : '4'}
                                </span>
                                <div>
                                    <h4 className="text-xs font-black text-slate-800 leading-none">Catalog Publishing</h4>
                                    <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">
                                        {selectedRequestForTimeline.status === 'APPROVED' ? 'Available for stock addition' : 'Pending approval'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Admin Notes Section */}
                        {selectedRequestForTimeline.admin_notes && (
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-5 text-left">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Admin Feedback</span>
                                <p className="text-xs font-semibold text-slate-700 italic">
                                    "{selectedRequestForTimeline.admin_notes}"
                                </p>
                            </div>
                        )}

                        <button 
                            onClick={() => setSelectedRequestForTimeline(null)}
                            className="w-full mt-6 py-3 bg-slate-900 hover:bg-slate-850 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default MobileCatalogRequests;
