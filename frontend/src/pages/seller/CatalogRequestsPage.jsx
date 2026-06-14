import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    FaInbox, FaSpinner, FaPaperPlane, FaClock, FaCheckCircle, 
    FaTimesCircle, FaChevronRight, FaComments, FaArrowRight 
} from 'react-icons/fa';
import { 
    MessageSquare, Send, Check, AlertCircle, X, Ban, Calendar, 
    User, Phone, ShoppingBag, Plus, Search, ChevronLeft, Paperclip, 
    DollarSign, Clock, ArrowLeft, Image as ImageIcon, Sparkles, MessageCircle, AlertTriangle, FileText
} from 'lucide-react';
import axios from 'axios';

const CatalogRequestsPage = () => {
    const { token, user } = useAuth();
    const isHomeBusiness = user?.shopDetails?.shopCategory === 'Home Businesses' || user?.shopDetails?.category === 'Home Businesses';

    // Original State
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Home Business State
    const [hbRequests, setHbRequests] = useState([]);
    const [activeChatRequest, setActiveChatRequest] = useState(null);
    const [chatInput, setChatInput] = useState('');
    const [quotePrice, setQuotePrice] = useState('');
    const [quotePrepTime, setQuotePrepTime] = useState('');
    const [declineReason, setDeclineReason] = useState('');
    const [showDeclineInput, setShowDeclineInput] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'PENDING', 'ACCEPTED', 'DECLINED'
    const [showMobileChat, setShowMobileChat] = useState(false);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (activeChatRequest) {
            scrollToBottom();
        }
    }, [activeChatRequest?.id, activeChatRequest?.chatHistory]);

    const fetchRequests = async () => {
        try {
            const { data } = await axios.get('/api/master/requests/my', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(data);

            if (isHomeBusiness) {
                // Seed custom client inquiries for Home Business
                const seeded = [
                    {
                        id: 'req_hb_1',
                        customerName: 'Meera Sen',
                        customerMobile: '9876123456',
                        details: 'Need 50 boxes of Homemade Laddoo for a corporate Diwali gift. Can you deliver them in customized decorative boxes by 20 October?',
                        targetDate: '20 October',
                        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
                        status: 'PENDING',
                        chatHistory: [
                            { sender: 'customer', text: 'Hi! Can you deliver 50 boxes of laddoos by 20 October?', time: '10:00 AM' },
                            { sender: 'seller', text: 'Yes, I can arrange the custom packaging. I will need 5 days. Let me send a quote.', time: '10:15 AM' }
                        ],
                        attachments: [
                            { name: 'diwali_box_sketch.jpg', size: '2.4 MB', type: 'image', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400' },
                            { name: 'logo_branding.pdf', size: '1.1 MB', type: 'pdf', url: '#' }
                        ],
                        estimatedValue: 12500
                    },
                    {
                        id: 'req_hb_2',
                        customerName: 'Karan Johar',
                        customerMobile: '9922334455',
                        details: 'Need a custom blue crochet shoulder bag with a floral print. Can you make it slightly larger than standard size?',
                        targetDate: '12 August',
                        createdAt: new Date(Date.now() - 86400000).toISOString(),
                        status: 'ACCEPTED',
                        quotedPrice: 1500,
                        quotedPrepTime: '4 days',
                        chatHistory: [
                            { sender: 'customer', text: 'Hi Soniya, I\'d love a custom blue bag. Can we make it 12 inches wide?', time: 'Yesterday' },
                            { sender: 'seller', text: 'Yes, sure! I\'ll charge ₹1500 for the customized size.', time: 'Yesterday' },
                            { sender: 'customer', text: 'That works for me. Please accept the request!', time: 'Yesterday' }
                        ],
                        attachments: [
                            { name: 'crochet_pattern_reference.png', size: '3.8 MB', type: 'image', url: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400' }
                        ],
                        estimatedValue: 1500
                    },
                    {
                        id: 'req_hb_3',
                        customerName: 'Pooja Hegde',
                        customerMobile: '9182736450',
                        details: 'Do you make gluten-free chocolate cupcakes? Need 24 pieces for a kids party next Sunday.',
                        targetDate: 'Next Sunday',
                        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
                        status: 'DECLINED',
                        declineReason: 'Cross-contamination risks. Kitchen is not certified gluten-free.',
                        chatHistory: [
                            { sender: 'customer', text: 'Hi, do you offer gluten-free chocolate cupcakes?', time: '3 days ago' },
                            { sender: 'seller', text: 'Sorry Pooja, currently my kitchen is not certified gluten-free, so I cannot guarantee no cross-contamination.', time: '3 days ago' }
                        ],
                        attachments: [],
                        estimatedValue: 2400
                    }
                ];
                setHbRequests(seeded);
                setActiveChatRequest(seeded[0]);
            }
        } catch (err) {
            console.error("Failed to fetch my catalog requests:", err);
            // Fallback for retail
            setRequests([
                {
                    _id: 'req_1',
                    product_name: 'Boat Airdopes 131 Wireless Earbuds',
                    brand_name: 'Boat',
                    pack_size: '1 unit',
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

    // 1. Decline custom request
    const handleDeclineRequest = (id, reason) => {
        const finalReason = reason || declineReason || 'Custom request declined by creator.';
        setHbRequests(prev => prev.map(req => {
            if (req.id === id) {
                const updated = { ...req, status: 'DECLINED', declineReason: finalReason };
                if (activeChatRequest && activeChatRequest.id === id) {
                    setActiveChatRequest(updated);
                }
                return updated;
            }
            return req;
        }));
        setShowDeclineInput(false);
        setDeclineReason('');
    };

    // 2. Accept & Quote custom request
    const handleAcceptRequest = (id, price, prepTime) => {
        const finalPrice = Number(price || quotePrice);
        const finalPrep = prepTime || quotePrepTime || '3 days';
        if (!finalPrice) return;
        
        setHbRequests(prev => prev.map(req => {
            if (req.id === id) {
                const updated = {
                    ...req,
                    status: 'ACCEPTED',
                    quotedPrice: finalPrice,
                    quotedPrepTime: finalPrep
                };
                if (activeChatRequest && activeChatRequest.id === id) {
                    setActiveChatRequest(updated);
                }
                return updated;
            }
            return req;
        }));

        setQuotePrice('');
        setQuotePrepTime('');
    };

    const handleSelectRequest = (req) => {
        setActiveChatRequest(req);
        setQuotePrice(req.quotedPrice || '');
        setQuotePrepTime(req.quotedPrepTime || '');
        setDeclineReason('');
        setShowDeclineInput(false);
        if (window.innerWidth < 1024) {
            setShowMobileChat(true);
        }
    };

    // 3. Send message in chat
    const handleSendMessage = () => {
        if (!chatInput.trim() || !activeChatRequest) return;

        const newMsg = {
            sender: 'seller',
            text: chatInput.trim(),
            time: 'Just now'
        };

        setHbRequests(prev => prev.map(req => {
            if (req.id === activeChatRequest.id) {
                return {
                    ...req,
                    chatHistory: [...(req.chatHistory || []), newMsg]
                };
            }
            return req;
        }));

        setActiveChatRequest(prev => ({
            ...prev,
            chatHistory: [...(prev.chatHistory || []), newMsg]
        }));

        setChatInput('');
    };

    const getElapsedTime = (isoString) => {
        const diff = Date.now() - new Date(isoString).getTime();
        const mins = Math.floor(diff / 60000);
        const hrs = Math.floor(mins / 60);
        const days = Math.floor(hrs / 24);
        if (days > 0) return days === 1 ? 'Yesterday' : `${days} days ago`;
        if (hrs > 0) return `${hrs}h ago`;
        return mins > 0 ? `${mins}m ago` : 'Just now';
    };

    const filteredHbRequests = hbRequests.filter(req => {
        const matchesSearch = req.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.details.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'ALL' || req.status === activeTab;
        return matchesSearch && matchesTab;
    });

    const pendingCount = hbRequests.filter(r => r.status === 'PENDING').length;
    const acceptedCount = hbRequests.filter(r => r.status === 'ACCEPTED').length;
    const declinedCount = hbRequests.filter(r => r.status === 'DECLINED').length;

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <FaSpinner className="animate-spin text-amber-500 mb-4" size={32} />
            <p className="text-slate-400 font-bold text-sm">Loading requests...</p>
        </div>
    );

    // --- RENDER HOME BUSINESS EXPERIENCE ---
    if (isHomeBusiness) {
        return (
            <div className="flex flex-col h-[calc(100vh-104px)] lg:h-[calc(100vh-136px)] overflow-hidden space-y-4">
                {/* Slim Header - to fit height constraint */}
                <div className="flex-shrink-0 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight">Custom Requests</h1>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                            Manage custom order inquiries, pricing quotes, and chat with clients
                        </p>
                    </div>
                </div>

                {/* Main Split View */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-hidden">
                    {/* Left Column: Requests List */}
                    <div className={`lg:col-span-5 flex flex-col h-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden ${showMobileChat ? 'hidden lg:flex' : 'flex'}`}>
                        {/* Search and Tabs */}
                        <div className="p-4 border-b border-slate-50 space-y-3 flex-shrink-0">
                            {/* Search bar */}
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search customer or details..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-slate-50/50 text-slate-700 placeholder-slate-400"
                                />
                            </div>

                            {/* Status Filter Tabs */}
                            <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar scrollbar-none">
                                {[
                                    { id: 'ALL', label: 'All', count: hbRequests.length },
                                    { id: 'PENDING', label: 'Pending', count: pendingCount },
                                    { id: 'ACCEPTED', label: 'Accepted', count: acceptedCount },
                                    { id: 'DECLINED', label: 'Declined', count: declinedCount }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5
                                            ${activeTab === tab.id
                                                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                                : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50 hover:text-slate-700'
                                            }`}
                                    >
                                        {tab.label}
                                        <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black
                                            ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Scrollable list of cards */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/30">
                            {filteredHbRequests.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100 text-slate-300">
                                        <FaInbox size={20} />
                                    </div>
                                    <p className="font-extrabold text-xs text-slate-400">No requests found</p>
                                </div>
                            ) : (
                                filteredHbRequests.map(req => {
                                    const isSelected = activeChatRequest?.id === req.id;
                                    return (
                                        <div
                                            key={req.id}
                                            onClick={() => handleSelectRequest(req)}
                                            className={`relative group bg-white rounded-2xl p-4 border transition-all duration-200 cursor-pointer text-left
                                                ${isSelected 
                                                    ? 'border-amber-500/80 shadow-md bg-amber-500/[0.02]' 
                                                    : 'border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md'
                                                }`}
                                        >
                                            {/* Status indicator tag strip */}
                                            <div className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl
                                                ${req.status === 'PENDING' ? 'bg-amber-500' : ''}
                                                ${req.status === 'ACCEPTED' ? 'bg-emerald-500' : ''}
                                                ${req.status === 'DECLINED' ? 'bg-rose-400' : ''}
                                            `}></div>

                                            <div className="pl-1 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200/50 flex items-center justify-center text-slate-600 font-extrabold text-xs">
                                                            {req.customerName[0]}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-extrabold text-slate-800 text-xs">{req.customerName}</h4>
                                                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                                                {req.customerMobile}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[8px] font-bold text-slate-400">
                                                        {getElapsedTime(req.createdAt)}
                                                    </span>
                                                </div>

                                                <p className="text-[11px] font-semibold text-slate-600 line-clamp-2 leading-relaxed">
                                                    {req.details}
                                                </p>

                                                <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider
                                                        ${req.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600' : ''}
                                                        ${req.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-600' : ''}
                                                        ${req.status === 'DECLINED' ? 'bg-rose-500/10 text-rose-600' : ''}
                                                    `}>
                                                        {req.status}
                                                    </span>

                                                    <div className="text-right">
                                                        <span className="text-[8px] text-slate-400 font-bold block">EST. VALUE</span>
                                                        <span className="text-[10px] font-black text-slate-700">
                                                            ₹{req.quotedPrice || req.estimatedValue || '—'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Column: Detailed Inquiry & Chat */}
                    <div className={`lg:col-span-7 flex flex-col h-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden ${!showMobileChat ? 'hidden lg:flex' : 'flex'}`}>
                        {activeChatRequest ? (
                            <div className="flex flex-col h-full overflow-hidden">
                                {/* Profile Header */}
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                                    <div className="flex items-center gap-3">
                                        {showMobileChat && (
                                            <button
                                                onClick={() => setShowMobileChat(false)}
                                                className="lg:hidden p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors cursor-pointer"
                                            >
                                                <ArrowLeft size={16} />
                                            </button>
                                        )}
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                                            {activeChatRequest.customerName[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-800 text-sm leading-none flex items-center gap-2">
                                                {activeChatRequest.customerName}
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border
                                                    ${activeChatRequest.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600 border-amber-500/10' : ''}
                                                    ${activeChatRequest.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/10' : ''}
                                                    ${activeChatRequest.status === 'DECLINED' ? 'bg-rose-500/10 text-rose-600 border-rose-500/10' : ''}
                                                `}>
                                                    {activeChatRequest.status}
                                                </span>
                                            </h3>
                                            <p className="text-[9px] font-bold text-slate-400 mt-1 flex items-center gap-1.5">
                                                <Phone size={10} />
                                                {activeChatRequest.customerMobile}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Scrollable Detail & History Console */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/20">
                                    
                                    {/* Request Details Card */}
                                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                                            <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs">
                                                <ShoppingBag className="w-4 h-4 text-amber-500" />
                                                Inquiry Details
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">Date Submitted</span>
                                                <span className="text-[10px] font-black text-slate-600">
                                                    {new Date(activeChatRequest.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-xs font-semibold text-slate-700 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                                            {activeChatRequest.details}
                                        </p>

                                        {/* Metadata grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-50/30 p-3 rounded-xl border border-slate-100 flex items-center gap-2.5">
                                                <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                <div>
                                                    <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">Required By</span>
                                                    <span className="text-[10px] font-black text-slate-700">{activeChatRequest.targetDate}</span>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50/30 p-3 rounded-xl border border-slate-100 flex items-center gap-2.5">
                                                <DollarSign className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                <div>
                                                    <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">
                                                        {activeChatRequest.status === 'ACCEPTED' ? 'Quoted Price' : 'Est. Order Value'}
                                                    </span>
                                                    <span className="text-[10px] font-black text-slate-700">
                                                        ₹{activeChatRequest.quotedPrice || activeChatRequest.estimatedValue || '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Attachments Section */}
                                        {activeChatRequest.attachments && activeChatRequest.attachments.length > 0 && (
                                            <div className="space-y-2 pt-2 border-t border-slate-50">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Attachments & References</span>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {activeChatRequest.attachments.map((file, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                {file.type === 'image' ? (
                                                                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200/50 flex-shrink-0">
                                                                        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/50 flex items-center justify-center flex-shrink-0 text-slate-400">
                                                                        <FileText className="w-4 h-4" />
                                                                    </div>
                                                                )}
                                                                <div className="min-w-0">
                                                                    <p className="text-[10px] font-bold text-slate-700 truncate">{file.name}</p>
                                                                    <p className="text-[8px] text-slate-400 font-semibold">{file.size}</p>
                                                                </div>
                                                            </div>
                                                            {file.type === 'image' && (
                                                                <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                                                                    <ImageIcon className="w-3.5 h-3.5" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Quote / Action Card */}
                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                                        {activeChatRequest.status === 'PENDING' && (
                                            <div className="p-5 space-y-4">
                                                <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs">
                                                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                                                    Submit Price Quote
                                                </div>
                                                
                                                {showDeclineInput ? (
                                                    <div className="space-y-3 animate-fade-in">
                                                        <div>
                                                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Decline Reason</label>
                                                            <textarea
                                                                placeholder="Please provide a reason to the client (e.g. scheduling conflicts, material unavailability)..."
                                                                value={declineReason}
                                                                onChange={e => setDeclineReason(e.target.value)}
                                                                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 text-slate-700 min-h-[60px]"
                                                            />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleDeclineRequest(activeChatRequest.id)}
                                                                disabled={!declineReason.trim()}
                                                                className="flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 transition-colors cursor-pointer"
                                                            >
                                                                Confirm Decline
                                                            </button>
                                                            <button
                                                                onClick={() => setShowDeclineInput(false)}
                                                                className="px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Quote Price (₹)</label>
                                                                <div className="relative">
                                                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-xs">₹</span>
                                                                    <input
                                                                        type="number"
                                                                        placeholder="e.g. 1500"
                                                                        value={quotePrice}
                                                                        onChange={e => setQuotePrice(e.target.value)}
                                                                        className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-xs font-bold text-slate-700"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Estimated Prep Time</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="e.g. 4 days"
                                                                    value={quotePrepTime}
                                                                    onChange={e => setQuotePrepTime(e.target.value)}
                                                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-xs font-bold text-slate-700"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 pt-1">
                                                            <button
                                                                onClick={() => handleAcceptRequest(activeChatRequest.id)}
                                                                disabled={!quotePrice}
                                                                className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/10 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                                                            >
                                                                <Check size={12} /> Send Quote & Accept
                                                            </button>
                                                            <button
                                                                onClick={() => setShowDeclineInput(true)}
                                                                className="px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                                            >
                                                                <Ban size={12} /> Decline
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeChatRequest.status === 'ACCEPTED' && (
                                            <div className="bg-emerald-500/5 border-l-4 border-emerald-500 p-4 flex items-start gap-3">
                                                <FaCheckCircle className="text-emerald-500 w-4 h-4 mt-0.5 flex-shrink-0" />
                                                <div className="space-y-1">
                                                    <h4 className="font-extrabold text-emerald-800 text-xs uppercase tracking-wider">Price Quote Approved</h4>
                                                    <p className="text-[11px] font-semibold text-emerald-700">
                                                        You accepted this request with a quote of <span className="font-extrabold">₹{activeChatRequest.quotedPrice}</span> and preparation time of <span className="font-extrabold">{activeChatRequest.quotedPrepTime}</span>.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {activeChatRequest.status === 'DECLINED' && (
                                            <div className="bg-rose-500/5 border-l-4 border-rose-500 p-4 flex items-start gap-3">
                                                <FaTimesCircle className="text-rose-500 w-4 h-4 mt-0.5 flex-shrink-0" />
                                                <div className="space-y-1">
                                                    <h4 className="font-extrabold text-rose-800 text-xs uppercase tracking-wider">Request Declined</h4>
                                                    <p className="text-[11px] font-semibold text-rose-700">
                                                        {activeChatRequest.declineReason || 'This request was declined by the creator.'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Discussion / Chat Divider */}
                                    <div className="flex items-center gap-3 py-2 flex-shrink-0">
                                        <div className="h-[1px] bg-slate-100 flex-1"></div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap bg-slate-100/80 px-3 py-1 rounded-full">
                                            <MessageCircle size={10} />
                                            Requirements Chat
                                        </span>
                                        <div className="h-[1px] bg-slate-100 flex-1"></div>
                                    </div>

                                    {/* Messages list */}
                                    <div className="space-y-4">
                                        {activeChatRequest.chatHistory && activeChatRequest.chatHistory.length > 0 ? (
                                            activeChatRequest.chatHistory.map((msg, idx) => {
                                                const isSeller = msg.sender === 'seller';
                                                return (
                                                    <div key={idx} className={`flex flex-col ${isSeller ? 'items-end' : 'items-start'} animate-fade-in`}>
                                                        <div className={`max-w-[75%] p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-xs
                                                            ${isSeller
                                                                ? 'bg-amber-600 text-white rounded-tr-none'
                                                                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                                            }`}
                                                        >
                                                            {msg.text}
                                                        </div>
                                                        <span className="text-[8px] text-slate-400 font-bold mt-1 px-1 flex items-center gap-1">
                                                            <Clock size={8} />
                                                            {msg.time}
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-6 text-slate-400 text-[11px] font-bold">
                                                No chat messages yet. Send a message below to start the discussion.
                                            </div>
                                        )}
                                        {/* Scroll Anchor */}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </div>

                                {/* Chat Input Footer */}
                                <div className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 flex-shrink-0">
                                    <input
                                        type="text"
                                        placeholder="Type your specifications, queries, or updates..."
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-slate-50 placeholder-slate-400"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        className="p-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors shadow-md shadow-amber-600/10 cursor-pointer"
                                    >
                                        <Send size={14} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 text-slate-300">
                                    <MessageSquare size={28} />
                                </div>
                                <h3 className="font-black text-slate-700 text-sm">No Custom Request Selected</h3>
                                <p className="text-xs text-slate-400 font-bold max-w-xs mt-1.5 leading-relaxed uppercase tracking-wider">
                                    Select an inquiry from the list on the left to view full customer details, attachments, and negotiate terms.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER ORIGINAL CATALOG REQUEST EXPERIENCE ---
    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <FaSpinner className="animate-spin text-amber-500 mb-4" size={32} />
            <p className="text-slate-400 font-bold text-sm">Loading request history...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto pb-24 px-4 animate-fade-in space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Catalog Request History</h1>
                <p className="text-slate-500 text-xs mt-1 font-semibold uppercase tracking-wider">
                    Track the status of custom products requested for addition to the Master Catalog
                </p>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
                {requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-20">
                        <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-4 border border-slate-100">
                            <FaInbox size={28} className="text-slate-400" />
                        </div>
                        <p className="font-bold text-slate-400 font-medium">No catalog addition requests submitted yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="py-4">Product Details</th>
                                    <th className="py-4">Category</th>
                                    <th className="py-4">Date Submitted</th>
                                    <th className="py-4">Status</th>
                                    <th className="py-4">Admin Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requests.map((r) => (
                                    <tr key={r._id} className="group hover:bg-slate-50/40 transition-all">
                                        <td className="py-5 pr-4">
                                            <h4 className="font-black text-slate-800 text-sm leading-tight">{r.product_name}</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                                Brand: {r.brand_name || 'Generic'} &bull; Pack: {r.pack_size || '1 Unit'}
                                            </p>
                                        </td>

                                        <td className="py-5 pr-4">
                                            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider text-[9px]">
                                                {r.category}
                                            </span>
                                        </td>

                                        <td className="py-5 pr-4">
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-bold text-slate-700">
                                                    {new Date(r.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                                    <FaClock size={8} />
                                                    {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </td>

                                        <td className="py-5">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border
                                                ${r.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600 border-amber-500/10' : ''}
                                                ${r.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/10' : ''}
                                                ${r.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-600 border-rose-500/10' : ''}
                                            `}>
                                                <span className={`w-1 h-1 rounded-full 
                                                    ${r.status === 'PENDING' ? 'bg-amber-500 animate-pulse' : ''}
                                                    ${r.status === 'APPROVED' ? 'bg-emerald-500' : ''}
                                                    ${r.status === 'REJECTED' ? 'bg-rose-500' : ''}
                                                `}></span>
                                                {r.status}
                                            </span>
                                        </td>

                                        <td className="py-5 pr-4 text-xs font-bold text-slate-500 max-w-xs">
                                            {r.admin_notes ? (
                                                <p className="leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100 italic">
                                                    "{r.admin_notes}"
                                                </p>
                                            ) : (
                                                <span className="text-slate-400 italic text-[10px]">Awaiting administrator review</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CatalogRequestsPage;
