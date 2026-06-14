import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { Search, Send, ArrowLeft, MessageSquare, User } from 'lucide-react';

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

const SellerMessages = () => {
    const { user } = useAuth();
    const {
        conversations,
        activeConversation,
        messages,
        sendMessage,
        selectConversation,
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

    // Filter conversations based on other participant's name
    const filteredConversations = conversations.filter(c => {
        const name = c.otherParticipant?.name || '';
        const search = searchQuery.toLowerCase();
        return name.toLowerCase().includes(search);
    });

    return (
        <div className="flex flex-col h-[calc(100vh-104px)] lg:h-[calc(100vh-136px)] overflow-hidden space-y-4">
            
            {/* Slim Header */}
            <div className="flex-shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-[var(--foreground)] tracking-tight">Messages</h1>
                    <p className="text-[var(--muted-foreground)] text-[10px] font-bold uppercase tracking-wider">
                        Real-time customer discussions, negotiations, and booking clarifications
                    </p>
                </div>
            </div>

            {/* Chat Container Box */}
            <div className="flex-1 bg-[var(--card)] rounded-3xl border border-[var(--border)] shadow-sm flex overflow-hidden min-h-0">
                
                {/* 1. LEFT COLUMN: CHATS LIST */}
                <div className={`w-full lg:w-[350px] border-r border-[var(--border)] flex flex-col flex-shrink-0 h-full ${showMobileChat ? 'hidden lg:flex' : 'flex'}`}>
                    
                    {/* Search bar */}
                    <div className="p-4 border-b border-[var(--border)] flex-shrink-0">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search client..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-2xl border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--accent)]/10 text-[var(--foreground)] placeholder-[var(--muted-foreground)]"
                            />
                        </div>
                    </div>

                    {/* Chat Item List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]/30 custom-scrollbar">
                        {loading && conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-[var(--muted-foreground)]">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-[var(--primary)] border-t-transparent mb-3" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Loading inbox...</span>
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="text-center py-20 px-6 text-[var(--muted-foreground)]">
                                <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-wider">No client chats</p>
                                <p className="text-[10px] mt-1">When customers message your shop, inquiries will appear here.</p>
                            </div>
                        ) : (
                            filteredConversations.map(conv => {
                                const isActive = activeConversation && activeConversation._id === conv._id;
                                const participant = conv.otherParticipant || {};
                                const clientName = participant.name || 'Artisan Partner';
                                const avatarLetter = clientName.charAt(0).toUpperCase();

                                return (
                                    <button
                                        key={conv._id}
                                        onClick={() => selectConversation(conv)}
                                        className={`w-full text-left p-4.5 transition-all flex items-start gap-3.5 hover:bg-[var(--accent)]/20 relative
                                            ${isActive ? 'bg-[var(--primary)]/10 border-l-4 border-[var(--primary)]' : 'border-l-4 border-transparent'}
                                        `}
                                    >
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-2xl bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] font-black text-xs shrink-0 border border-[var(--border)] overflow-hidden">
                                            {participant.avatar ? (
                                                <img src={getImageUrl(participant.avatar)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{avatarLetter}</span>
                                            )}
                                        </div>

                                        {/* Meta */}
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex justify-between items-baseline">
                                                <h4 className="font-extrabold text-[var(--foreground)] text-xs truncate pr-2">
                                                    {clientName}
                                                </h4>
                                                <span className="text-[9px] text-[var(--muted-foreground)] font-bold shrink-0">
                                                    {formatTime(conv.lastMessageAt)}
                                                </span>
                                            </div>
                                            <p className={`text-[11px] truncate leading-normal
                                                ${conv.unreadCount > 0 ? 'text-[var(--foreground)] font-black' : 'text-[var(--muted-foreground)] font-bold'}
                                            `}>
                                                {conv.lastMessage || 'Start conversation...'}
                                            </p>
                                        </div>

                                        {/* Unread Counter Badge */}
                                        {conv.unreadCount > 0 && (
                                            <span className="absolute bottom-4.5 right-4.5 bg-rose-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm">
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
                <div className={`flex-1 flex flex-col h-full bg-[var(--accent)]/5 ${!showMobileChat ? 'hidden lg:flex' : 'flex'}`}>
                    {activeConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="bg-[var(--card)] px-6 py-4 border-b border-[var(--border)] flex items-center justify-between z-10 shrink-0">
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <button
                                        onClick={handleBackClick}
                                        className="lg:hidden p-2 hover:bg-[var(--accent)]/30 rounded-full transition-colors text-[var(--muted-foreground)]"
                                    >
                                        <ArrowLeft size={16} />
                                    </button>
                                    
                                    <div className="w-9 h-9 rounded-2xl bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] font-black shrink-0 border border-[var(--border)] overflow-hidden">
                                        {activeConversation.otherParticipant?.avatar ? (
                                            <img src={getImageUrl(activeConversation.otherParticipant.avatar)} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{(activeConversation.otherParticipant?.name || 'C').charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <h3 className="font-black text-[var(--foreground)] text-sm truncate tracking-tight">
                                            {activeConversation.otherParticipant?.name || 'Customer Partner'}
                                        </h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg text-[9px] font-black uppercase tracking-wider">
                                                <User size={8} /> Customer
                                            </span>
                                            <span className="text-[10px] text-[var(--muted-foreground)] font-bold">• Online</span>
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
                                                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)] rounded-tr-sm'
                                                        : 'bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-tl-sm'
                                                    }
                                                `}
                                            >
                                                <span className="whitespace-pre-wrap font-medium">{msg.text}</span>
                                                <span className={`text-[8px] font-bold text-right leading-none mt-1
                                                    ${isSender ? 'text-[var(--primary-foreground)]/70' : 'text-[var(--muted-foreground)]'}
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
                            <form onSubmit={handleSendMessage} className="p-4 bg-[var(--card)] border-t border-[var(--border)] flex items-center gap-3 shrink-0">
                                <input
                                    type="text"
                                    placeholder="Type your response to client..."
                                    value={inputMessage}
                                    onChange={e => setInputMessage(e.target.value)}
                                    className="flex-grow px-4 py-3 text-xs sm:text-sm font-semibold rounded-2xl border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] bg-[var(--accent)]/10 text-[var(--foreground)] placeholder-[var(--muted-foreground)]"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputMessage.trim()}
                                    className="p-3 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[var(--muted-foreground)]">
                            <div className="w-14 h-14 bg-[var(--card)] border border-[var(--border)] rounded-full flex items-center justify-center text-[var(--muted-foreground)] shadow-sm mb-4">
                                <MessageSquare size={24} />
                            </div>
                            <h3 className="text-sm font-black text-[var(--foreground)] tracking-tight">No Selected Conversation</h3>
                            <p className="text-[10px] text-[var(--muted-foreground)] font-bold max-w-xs mt-1.5 uppercase tracking-wider leading-relaxed">
                                Select a chat from the sidebar list to reply to client inquiries in real-time.
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default SellerMessages;
