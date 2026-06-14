import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Send, ArrowLeft, MessageSquare, Shield, Store, Palette, Calendar } from 'lucide-react';

// Helper for image URLs
const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('data:')) return path;
    if (path.startsWith('http')) return path;
    return `${path.startsWith('/') ? '' : '/'}${path}`;
};

const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);

    if (days > 0) return days === 1 ? 'Yesterday' : `${days} days ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'Just now';
};

const CustomerMessages = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const {
        conversations,
        activeConversation,
        messages,
        sendMessage,
        selectConversation,
        startConversation,
        loading
    } = useChat();

    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [inputMessage, setInputMessage] = useState('');
    const [showMobileChat, setShowMobileChat] = useState(false);

    const messagesEndRef = useRef(null);

    // Initial load from URL query param
    useEffect(() => {
        const conversationId = searchParams.get('conversationId');
        if (conversationId && conversations.length > 0) {
            const found = conversations.find(c => c._id === conversationId);
            if (found) {
                selectConversation(found);
                setShowMobileChat(true);
            }
        }
    }, [searchParams, conversations, selectConversation]);

    // Handle mobile layout toggling
    useEffect(() => {
        if (activeConversation) {
            setShowMobileChat(true);
        } else {
            setShowMobileChat(false);
        }
    }, [activeConversation]);

    // Scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !activeConversation) return;

        const textToSend = inputMessage.trim();
        setInputMessage('');
        await sendMessage(textToSend);
    };

    const handleBackClick = () => {
        selectConversation(null);
        setShowMobileChat(false);
    };

    // Filter conversations based on other participant's name or shopName
    const filteredConversations = conversations.filter(c => {
        const name = c.otherParticipant?.name || '';
        const shopName = c.otherParticipant?.shopDetails?.shopName || '';
        const search = searchQuery.toLowerCase();
        return name.toLowerCase().includes(search) || shopName.toLowerCase().includes(search);
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[calc(100vh-130px)] overflow-hidden">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl h-full flex overflow-hidden">
                
                {/* 1. LEFT COLUMN: CHATS LIST */}
                <div className={`w-full lg:w-[380px] border-r border-slate-100 flex flex-col flex-shrink-0 h-full ${showMobileChat ? 'hidden lg:flex' : 'flex'}`}>
                    
                    {/* Search Bar */}
                    <div className="p-4 border-b border-slate-50 space-y-3">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            <MessageSquare className="text-[#E07A5F]" size={22} />
                            Messages
                        </h2>
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search chats..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/20 focus:border-[#E07A5F] bg-slate-50/50 text-slate-700 placeholder-slate-450"
                            />
                        </div>
                    </div>

                    {/* Chat Item Lists */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-50/60 custom-scrollbar">
                        {loading && conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#E07A5F] border-t-transparent mb-3" />
                                <span className="text-xs font-bold uppercase tracking-wider">Loading chats...</span>
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="text-center py-20 px-6 text-slate-400">
                                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-400" />
                                <p className="text-xs font-bold uppercase tracking-wider">No conversations yet</p>
                                <p className="text-[11px] text-slate-400 mt-1 font-semibold">Start a chat from creator portfolios or business profiles!</p>
                            </div>
                        ) : (
                            filteredConversations.map(conv => {
                                const isActive = activeConversation && activeConversation._id === conv._id;
                                const participant = conv.otherParticipant || {};
                                const shopName = participant.shopDetails?.shopName || participant.name || 'Artisan Partner';
                                const avatarLetter = shopName.charAt(0).toUpperCase();

                                return (
                                    <button
                                        key={conv._id}
                                        onClick={() => selectConversation(conv)}
                                        className={`w-full text-left p-4.5 transition-all flex items-start gap-3.5 hover:bg-slate-50/50 relative
                                            ${isActive ? 'bg-orange-50/40 border-l-4 border-[#E07A5F]' : 'border-l-4 border-transparent'}
                                        `}
                                    >
                                        {/* Avatar Icon */}
                                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-[#E07A5F] font-black text-sm shrink-0 border border-orange-200/30 overflow-hidden">
                                            {participant.avatar ? (
                                                <img src={getImageUrl(participant.avatar)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{avatarLetter}</span>
                                            )}
                                        </div>

                                        {/* Meta */}
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex justify-between items-baseline">
                                                <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm truncate pr-2">
                                                    {shopName}
                                                </h4>
                                                <span className="text-[9px] text-slate-400 font-bold shrink-0">
                                                    {formatTime(conv.lastMessageAt)}
                                                </span>
                                            </div>
                                            <p className={`text-[11px] truncate leading-normal
                                                ${conv.unreadCount > 0 ? 'text-slate-800 font-extrabold' : 'text-slate-500 font-semibold'}
                                            `}>
                                                {conv.lastMessage || 'Start the conversation...'}
                                            </p>
                                        </div>

                                        {/* Unread Counter Badge */}
                                        {conv.unreadCount > 0 && (
                                            <span className="absolute bottom-4.5 right-4.5 bg-[#E07A5F] text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm shadow-[#E07A5F]/20">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* 2. RIGHT COLUMN: ACTIVE CHAT SCREEN */}
                <div className={`flex-1 flex flex-col h-full bg-slate-50/30 ${!showMobileChat ? 'hidden lg:flex' : 'flex'}`}>
                    {activeConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="bg-white px-6 py-4.5 border-b border-slate-100 flex items-center justify-between z-10 shrink-0">
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <button
                                        onClick={handleBackClick}
                                        className="lg:hidden p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                    
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-[#E07A5F] font-black shrink-0 border border-orange-200/30 overflow-hidden">
                                        {activeConversation.otherParticipant?.avatar ? (
                                            <img src={getImageUrl(activeConversation.otherParticipant.avatar)} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{(activeConversation.otherParticipant?.shopDetails?.shopName || activeConversation.otherParticipant?.name || 'A').charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <h3 className="font-black text-slate-800 text-sm sm:text-base truncate tracking-tight">
                                            {activeConversation.otherParticipant?.shopDetails?.shopName || activeConversation.otherParticipant?.name || 'Artisan Partner'}
                                        </h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            {activeConversation.type === 'creator' && (
                                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                                    <Palette size={8} /> Creator
                                                </span>
                                            )}
                                            {activeConversation.type === 'service' && (
                                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                                    <Calendar size={8} /> Service Provider
                                                </span>
                                            )}
                                            {activeConversation.type === 'business' && (
                                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-amber-50 border border-amber-100 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                                    <Store size={8} /> Shop
                                                </span>
                                            )}
                                            <span className="text-[10px] text-slate-400 font-bold">• Online</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Messages List Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                {messages.map((msg) => {
                                    const isSender = msg.sender === user?._id;
                                    return (
                                        <div
                                            key={msg._id}
                                            className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[75%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm flex flex-col gap-1
                                                    ${isSender
                                                        ? 'bg-slate-900 text-white rounded-tr-sm'
                                                        : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'
                                                    }
                                                `}
                                            >
                                                <span className="whitespace-pre-wrap font-medium">{msg.text}</span>
                                                <span className={`text-[8px] font-bold text-right leading-none mt-1
                                                    ${isSender ? 'text-slate-400' : 'text-slate-455'}
                                                `}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input Form */}
                            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex items-center gap-3 shrink-0">
                                <input
                                    type="text"
                                    placeholder="Type your message, negotiation, or update slot..."
                                    value={inputMessage}
                                    onChange={e => setInputMessage(e.target.value)}
                                    className="flex-grow px-4 py-3 text-xs sm:text-sm font-semibold rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/20 focus:border-[#E07A5F] bg-slate-50 placeholder-slate-400"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputMessage.trim()}
                                    className="p-3 bg-[#E07A5F] hover:bg-[#c96c53] text-white rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                            <div className="w-16 h-16 bg-white border border-slate-150 rounded-full flex items-center justify-center text-slate-350 shadow-md mb-4 animate-pulse">
                                <MessageSquare size={26} />
                            </div>
                            <h3 className="text-sm sm:text-base font-black text-slate-700 tracking-tight">No Active Conversation</h3>
                            <p className="text-[11px] sm:text-xs text-slate-400 font-bold max-w-xs mt-1.5 uppercase tracking-wider leading-relaxed">
                                Select a partner from the sidebar list or browse creator pages to initiate a real-time negotiation.
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default CustomerMessages;
