import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../../context/ChatContext';
import { useAuth } from '../../../context/AuthContext';
import { Search, Send, ArrowLeft, MessageSquare, User, Clock, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const MobileSellerMessages = () => {
    const { user } = useAuth();
    const {
        conversations,
        activeConversation,
        messages,
        sendMessage,
        selectConversation,
        loading
    } = useChat();

    const [searchQuery, setSearchQuery] = useState('');
    const [inputMessage, setInputMessage] = useState('');
    const [showMobileChat, setShowMobileChat] = useState(false);
    const messagesEndRef = useRef(null);

    // Sync mobile slide state with active conversation
    useEffect(() => {
        if (activeConversation) {
            setShowMobileChat(true);
        } else {
            setShowMobileChat(false);
        }
    }, [activeConversation]);

    // Scroll to bottom of chat
    useEffect(() => {
        if (showMobileChat) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, showMobileChat]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !activeConversation) return;

        const textToSend = inputMessage.trim();
        setInputMessage('');
        try {
            await sendMessage(textToSend);
        } catch (err) {
            console.error("Failed to send message:", err);
            toast.error("Message failed to send");
        }
    };

    const handleBackClick = () => {
        selectConversation(null);
        setShowMobileChat(false);
    };

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('data:')) return path;
        if (path.startsWith('http')) return path;
        return `/uploads/${path.startsWith('/') ? path.substring(1) : path}`;
    };

    const formatTime = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const now = new Date();
        const diff = now - date;
        const mins = Math.floor(diff / 60000);
        const hrs = Math.floor(mins / 60);
        const days = Math.floor(hrs / 24);

        if (days > 0) return days === 1 ? 'Yesterday' : `${days}d ago`;
        if (hrs > 0) return `${hrs}h ago`;
        if (mins > 0) return `${mins}m ago`;
        return 'Just now';
    };

    const filteredConversations = conversations.filter(c => {
        const name = c.otherParticipant?.name || '';
        const search = searchQuery.toLowerCase();
        return name.toLowerCase().includes(search);
    });

    return (
        <div className="flex flex-col h-[calc(100vh-124px)] overflow-hidden font-sans relative">
            
            {/* Conversation List View */}
            <div className={`flex flex-col h-full ${showMobileChat ? 'hidden' : 'flex'}`}>
                {/* Search Header */}
                <div className="p-4 border-b border-slate-100 bg-white flex-shrink-0 space-y-3">
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight">Inbox Messages</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Direct buyer discussions & order queries
                        </p>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search contact..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 text-slate-700 placeholder:text-slate-400"
                        />
                    </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto bg-slate-50/30 divide-y divide-slate-100">
                    {loading && conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                            <RefreshCw className="animate-spin text-indigo-600" size={24} />
                            <span className="text-[10px] font-black uppercase tracking-wider">Loading chats...</span>
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="text-center py-20 px-6 text-slate-400 flex flex-col items-center gap-3">
                            <MessageSquare className="w-10 h-10 text-slate-300 opacity-60" />
                            <div>
                                <h4 className="font-extrabold text-sm text-slate-800">No active discussions</h4>
                                <p className="text-[10px] text-slate-400 font-semibold mt-1">When buyers initiate inquiries, they will display here.</p>
                            </div>
                        </div>
                    ) : (
                        filteredConversations.map(conv => {
                            const participant = conv.otherParticipant || {};
                            const clientName = participant.name || 'Aisle Buyer';
                            const avatarLetter = clientName.charAt(0).toUpperCase();

                            return (
                                <button
                                    key={conv._id}
                                    onClick={() => selectConversation(conv)}
                                    className="w-full text-left p-4 hover:bg-slate-50/80 transition-all flex items-center gap-3 bg-white relative active:bg-slate-100/50"
                                >
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-black text-xs shrink-0 flex items-center justify-center border border-slate-100 overflow-hidden relative">
                                        {participant.avatar ? (
                                            <img src={getImageUrl(participant.avatar)} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{avatarLetter}</span>
                                        )}
                                    </div>

                                    {/* Text Info */}
                                    <div className="flex-grow min-w-0 pr-4">
                                        <div className="flex justify-between items-baseline">
                                            <h4 className="font-extrabold text-slate-800 text-xs truncate">
                                                {clientName}
                                            </h4>
                                            <span className="text-[8px] text-slate-400 font-bold">
                                                {formatTime(conv.lastMessageAt)}
                                            </span>
                                        </div>
                                        <p className={`text-[10px] truncate leading-relaxed mt-0.5 ${
                                            conv.unreadCount > 0 ? 'text-slate-800 font-black' : 'text-slate-400 font-semibold'
                                        }`}>
                                            {conv.lastMessage || 'Tap to chat...'}
                                        </p>
                                    </div>

                                    {/* Unread Badge */}
                                    {conv.unreadCount > 0 && (
                                        <span className="absolute right-4 bg-rose-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center">
                                            {conv.unreadCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Frame Slide Over */}
            {showMobileChat && activeConversation && (
                <div className="fixed inset-0 z-50 bg-white flex flex-col animate-slide-in-right">
                    {/* Header */}
                    <div className="h-[60px] px-4 border-b border-slate-100 flex items-center bg-white flex-shrink-0">
                        <button
                            onClick={handleBackClick}
                            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 mr-2 cursor-pointer"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-black text-sm shrink-0 flex items-center justify-center border border-slate-100 overflow-hidden mr-3">
                            {activeConversation.otherParticipant?.avatar ? (
                                <img src={getImageUrl(activeConversation.otherParticipant.avatar)} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span>{(activeConversation.otherParticipant?.name || 'C').charAt(0).toUpperCase()}</span>
                            )}
                        </div>

                        <div>
                            <h3 className="font-extrabold text-xs text-slate-800 leading-none">
                                {activeConversation.otherParticipant?.name || 'Customer'}
                            </h3>
                            <span className="text-[8px] text-emerald-500 font-bold block mt-1">Online</span>
                        </div>
                    </div>

                    {/* Messages Feed */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
                        {messages.map((msg) => {
                            const isSender = msg.sender === user?._id;
                            return (
                                <div
                                    key={msg._id}
                                    className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-xs flex flex-col gap-0.5 ${
                                            isSender
                                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                                : 'bg-white text-slate-850 border border-slate-100 rounded-tl-none'
                                        }`}
                                    >
                                        <p>{msg.text}</p>
                                        <span className={`text-[8px] font-bold text-right leading-none mt-1 ${
                                            isSender ? 'text-indigo-205' : 'text-slate-400'
                                        }`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200/80 bg-white flex gap-2 flex-shrink-0">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={inputMessage}
                            onChange={e => setInputMessage(e.target.value)}
                            className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
                        />
                        <button
                            type="submit"
                            disabled={!inputMessage.trim()}
                            className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow hover:bg-indigo-700 cursor-pointer disabled:opacity-50"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default MobileSellerMessages;
