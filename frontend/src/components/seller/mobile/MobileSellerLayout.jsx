import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';
import { useChat } from '../../../context/ChatContext';
import { useTheme } from '../../../context/ThemeContext';
import {
    Store, Box, ShoppingBag, MessageSquare, Menu as MenuIcon, Bell,
    Crown, User, Settings, LogOut, X, Sparkles, Send,
    Activity, ShieldCheck, Heart, AlertTriangle, ArrowLeft, Package,
    Users, Calendar, Inbox, Star
} from 'lucide-react';
import AisleLogo from '../../AisleLogo';

const MobileSellerLayout = () => {
    const { user, logout } = useAuth();
    const isHomeBusiness = user?.shopDetails?.shopType === 'HOME_BUSINESS' || 
                           user?.shopDetails?.shopCategory === 'Home Businesses' || 
                           user?.shopDetails?.category === 'Home Businesses';
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { unreadCount, notifications, markAsRead, markAllRead } = useNotifications();
    const { unreadCount: chatUnreadCount } = useChat();

    // Menu States
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isAiOpen, setIsAiOpen] = useState(false);
    
    // AI Assistant Tab state: 'chat' | 'suggestions' | 'diagnostics' | 'history'
    const [aiTab, setAiTab] = useState('chat');
    const [chatMessages, setChatMessages] = useState([
        { sender: 'ai', text: "Hello! I am your Ask Aisle assistant. How can I help you optimize your store today?" }
    ]);
    const [chatInput, setChatInput] = useState('');

    // Close overlays on navigation
    useEffect(() => {
        setIsMoreOpen(false);
        setIsNotificationsOpen(false);
        setIsAiOpen(false);
    }, [location.pathname]);

    // Group Notifications Helper
    const getGroupedNotifications = () => {
        const today = [];
        const yesterday = [];
        const older = [];
        const todayStr = new Date().toDateString();
        
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = yesterdayDate.toDateString();

        notifications.forEach(notif => {
            const notifDate = new Date(notif.createdAt).toDateString();
            if (notifDate === todayStr) {
                today.push(notif);
            } else if (notifDate === yesterdayStr) {
                yesterday.push(notif);
            } else {
                older.push(notif);
            }
        });

        return { today, yesterday, older };
    };

    const grouped = getGroupedNotifications();

    const handleSendMessage = () => {
        if (!chatInput.trim()) return;
        const userMsg = chatInput;
        setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setChatInput('');

        // Simulate AI response based on queries
        setTimeout(() => {
            let aiReply = "I am processing your query. We recommend checking your top-selling items in Vadodara to optimize pricing.";
            if (userMsg.toLowerCase().includes('stock') || userMsg.toLowerCase().includes('restock')) {
                aiReply = "Alert: Soft Drinks inventory is running low (under 10 units). We suggest restocking before the evening demand surge.";
            } else if (userMsg.toLowerCase().includes('revenue') || userMsg.toLowerCase().includes('sales')) {
                aiReply = "Your expected revenue for today is ₹8,400, showing a solid +18% growth week-over-week.";
            } else if (userMsg.toLowerCase().includes('premium')) {
                aiReply = "Aisle Premium unlocks AI Autopilot, advanced customer demographics, and priority search placement for your shop.";
            }
            setChatMessages(prev => [...prev, { sender: 'ai', text: aiReply }]);
        }, 800);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col relative pb-[80px] pt-[60px] select-none">
            
            {/* --- TOP MOBILE HEADER --- */}
            <header className="fixed top-0 left-0 right-0 h-[60px] px-4 bg-white border-b border-slate-100 flex items-center justify-between z-45 shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsMoreOpen(true)}
                        className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-all active:scale-95 cursor-pointer"
                    >
                        <MenuIcon size={20} />
                    </button>
                    <AisleLogo imgClassName="h-5" panel="seller" hideSubtitle={true} />
                </div>
                
                <div className="flex items-center gap-1.5">
                    {/* Header Inbox Button */}
                    <button
                        onClick={() => navigate('/seller/messages')}
                        className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-all relative active:scale-95 cursor-pointer"
                        title="Inbox Messages"
                    >
                        <MessageSquare size={20} />
                        {chatUnreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>

                    {/* Header Notifications Button */}
                    <button
                        onClick={() => setIsNotificationsOpen(true)}
                        className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-all relative active:scale-95 cursor-pointer"
                        title="Notifications"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>
                </div>
            </header>

            {/* --- MAIN PAGE OUTLET --- */}
            <main className="flex-1 w-full overflow-y-auto">
                <Outlet />
            </main>

            {/* --- FULL-SCREEN NOTIFICATIONS OVERLAY --- */}
            {isNotificationsOpen && (
                <div className="fixed inset-0 z-50 bg-white flex flex-col animate-slide-in-right">
                    {/* Header */}
                    <div className="h-[60px] px-4 border-b border-slate-100 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsNotificationsOpen(false)}
                                className="p-1 rounded-lg text-slate-500 hover:bg-slate-50 cursor-pointer"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <h2 className="font-extrabold text-lg text-slate-800 tracking-tight">Notifications</h2>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Content Grouped */}
                    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-6">
                        {notifications.length === 0 ? (
                            <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-2">
                                <Bell size={40} className="opacity-20" />
                                <p className="font-medium text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <>
                                {/* TODAY */}
                                {grouped.today.length > 0 && (
                                    <div className="space-y-2.5">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Today</h3>
                                        <div className="space-y-2">
                                            {grouped.today.map(notif => (
                                                <div
                                                    key={notif._id}
                                                    onClick={() => markAsRead(notif._id)}
                                                    className={`p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex gap-3 relative ${
                                                        notif.isRead ? 'opacity-75' : 'border-l-4 border-l-indigo-600'
                                                    }`}
                                                >
                                                    <div className="flex-1">
                                                        <h4 className="text-xs font-black text-slate-800">{notif.title}</h4>
                                                        <p className="text-xs text-slate-500 mt-1 font-semibold leading-relaxed">{notif.message}</p>
                                                    </div>
                                                    {!notif.isRead && (
                                                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1"></span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* YESTERDAY */}
                                {grouped.yesterday.length > 0 && (
                                    <div className="space-y-2.5">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Yesterday</h3>
                                        <div className="space-y-2">
                                            {grouped.yesterday.map(notif => (
                                                <div
                                                    key={notif._id}
                                                    onClick={() => markAsRead(notif._id)}
                                                    className={`p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex gap-3 relative ${
                                                        notif.isRead ? 'opacity-75' : 'border-l-4 border-l-indigo-600'
                                                    }`}
                                                >
                                                    <div className="flex-1">
                                                        <h4 className="text-xs font-black text-slate-800">{notif.title}</h4>
                                                        <p className="text-xs text-slate-500 mt-1 font-semibold leading-relaxed">{notif.message}</p>
                                                    </div>
                                                    {!notif.isRead && (
                                                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1"></span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* OLDER */}
                                {grouped.older.length > 0 && (
                                    <div className="space-y-2.5">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Older Updates</h3>
                                        <div className="space-y-2">
                                            {grouped.older.map(notif => (
                                                <div
                                                    key={notif._id}
                                                    onClick={() => markAsRead(notif._id)}
                                                    className={`p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex gap-3 relative ${
                                                        notif.isRead ? 'opacity-75' : 'border-l-4 border-l-indigo-600'
                                                    }`}
                                                >
                                                    <div className="flex-1">
                                                        <h4 className="text-xs font-black text-slate-800">{notif.title}</h4>
                                                        <p className="text-xs text-slate-500 mt-1 font-semibold leading-relaxed">{notif.message}</p>
                                                    </div>
                                                    {!notif.isRead && (
                                                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1"></span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* --- FULL-SCREEN MORE MENU DRAWER --- */}
            {isMoreOpen && (
                <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex justify-start animate-fade-in" onClick={() => setIsMoreOpen(false)}>
                    <div className="w-[280px] h-full bg-white flex flex-col justify-between p-6 animate-slide-in-left" onClick={e => e.stopPropagation()}>
                        
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                <span className="font-black text-slate-800 text-lg">Menu</span>
                                <button onClick={() => setIsMoreOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Unlock Premium Banner */}
                            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-2xl p-4 shadow-md space-y-3 relative overflow-hidden">
                                <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-indigo-500/10 rounded-full"></div>
                                <span className="text-[9px] font-black uppercase bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 tracking-widest inline-block">
                                    Premium
                                </span>
                                <h4 className="font-extrabold text-sm tracking-tight leading-tight">Unlock AI Automation</h4>
                                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                                    Get priority Placement and Advanced Insights.
                                </p>
                                <button
                                    onClick={() => navigate('/seller/subscription')}
                                    className="w-full h-9 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg cursor-pointer"
                                >
                                    Upgrade &rarr;
                                </button>
                            </div>

                            {/* Menu Links */}
                            <nav className="flex flex-col gap-1">
                                <button
                                    onClick={() => { setIsMoreOpen(false); setIsAiOpen(true); }}
                                    className="flex items-center gap-3 w-full text-left p-3 rounded-2xl hover:bg-slate-50 font-bold text-slate-700 text-xs cursor-pointer"
                                >
                                    <Sparkles size={16} className="text-violet-600" /> Ask Aisle AI
                                </button>
                                <Link to="/seller/messages" className="flex items-center gap-3 w-full text-left p-3 rounded-2xl hover:bg-slate-50 font-bold text-slate-700 text-xs justify-between">
                                    <div className="flex items-center gap-3">
                                        <MessageSquare size={16} className="text-blue-500" /> Inbox Messages
                                    </div>
                                    {chatUnreadCount > 0 && (
                                        <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                                            {chatUnreadCount} new
                                        </span>
                                    )}
                                </Link>
                                <Link to="/seller/orders" className="flex items-center gap-3 w-full text-left p-3 rounded-2xl hover:bg-slate-50 font-bold text-slate-700 text-xs">
                                    <ShoppingBag size={16} className="text-rose-500" /> Orders
                                </Link>
                                <Link to="/seller/customer-visits" className="flex items-center gap-3 w-full text-left p-3 rounded-2xl hover:bg-slate-50 font-bold text-slate-700 text-xs">
                                    <Users size={16} className="text-indigo-650" /> Customer Activity
                                </Link>
                                <Link to="/seller/feedback" className="flex items-center gap-3 w-full text-left p-3 rounded-2xl hover:bg-slate-50 font-bold text-slate-700 text-xs">
                                    <Star size={16} className="text-amber-500" /> Feedback & Ratings
                                </Link>
                                <Link to="/seller/profile" className="flex items-center gap-3 w-full text-left p-3 rounded-2xl hover:bg-slate-50 font-bold text-slate-700 text-xs">
                                    <User size={16} className="text-blue-500" /> Profile
                                </Link>
                                <Link to="/seller/settings" className="flex items-center gap-3 w-full text-left p-3 rounded-2xl hover:bg-slate-50 font-bold text-slate-700 text-xs">
                                    <Settings size={16} className="text-slate-500" /> Settings
                                </Link>
                            </nav>
                        </div>

                        {/* Sign Out */}
                        <button
                            onClick={logout}
                            className="flex items-center gap-3 p-3 w-full rounded-2xl hover:bg-rose-50 font-bold text-rose-600 text-xs cursor-pointer"
                        >
                            <LogOut size={16} /> Sign Out
                        </button>
                    </div>
                </div>
            )}

            {/* --- FULL-SCREEN ASK AISLE AI MODAL --- */}
            {isAiOpen && (
                <div className="fixed inset-0 z-50 bg-white flex flex-col animate-slide-in-right">
                    {/* Header */}
                    <div className="h-[60px] px-4 border-b border-slate-100 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsAiOpen(false)} className="p-1 rounded-lg text-slate-500 hover:bg-slate-50 cursor-pointer">
                                <ArrowLeft size={20} />
                            </button>
                            <h2 className="font-extrabold text-lg text-slate-800 tracking-tight">Ask Aisle AI</h2>
                        </div>
                        <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Copilot
                        </span>
                    </div>

                    {/* Navigation Tabs (ChatGPT like) */}
                    <div className="flex bg-slate-50 border-b border-slate-200/60 p-1 gap-1">
                        {['chat', 'suggestions', 'diagnostics', 'history'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setAiTab(tab)}
                                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    aiTab === tab ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 bg-transparent hover:text-slate-700'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Chat Panel Content */}
                    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4">
                        {aiTab === 'chat' && (
                            <div className="space-y-4">
                                {chatMessages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex flex-col max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed font-semibold shadow-xs ${
                                            msg.sender === 'ai'
                                                ? 'bg-white text-slate-800 border border-slate-100 self-start'
                                                : 'bg-indigo-600 text-white self-end ml-auto'
                                        }`}
                                    >
                                        <p>{msg.text}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {aiTab === 'suggestions' && (
                            <div className="space-y-3 py-2">
                                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-2">
                                    <h4 className="font-black text-xs text-indigo-600">Restock Soft Drinks</h4>
                                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">Indore region is seeing a +24% surge in demand for beverages. Add 20 units to match demand.</p>
                                </div>
                                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-2">
                                    <h4 className="font-black text-xs text-indigo-600">Bundle Offer Strategy</h4>
                                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">Bundle Organic Honey with Ginger Lemon cookies. Customers are searching for healthy breakfast pairs nearby.</p>
                                </div>
                            </div>
                        )}

                        {aiTab === 'diagnostics' && (
                            <div className="space-y-3 py-2">
                                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <h4 className="font-black text-xs text-slate-800">Store Health Index</h4>
                                        <p className="text-[10px] text-emerald-600 font-bold">Excellent • 82/100</p>
                                    </div>
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 font-black flex items-center justify-center text-xs">82</span>
                                </div>
                                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <h4 className="font-black text-xs text-slate-800">Stock Out Risk</h4>
                                        <p className="text-[10px] text-amber-500 font-bold">Moderate Risk • 2 Items Low</p>
                                    </div>
                                    <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 font-black flex items-center justify-center text-xs">Mod</span>
                                </div>
                            </div>
                        )}

                        {aiTab === 'history' && (
                            <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-2">
                                <Activity size={32} className="opacity-20" />
                                <p className="font-semibold text-xs">No chat history found</p>
                            </div>
                        )}
                    </div>

                    {/* Chat Input Bar */}
                    {aiTab === 'chat' && (
                        <div className="p-3 border-t border-slate-200/80 bg-white flex gap-2">
                            <input
                                type="text"
                                placeholder="Ask about sales, stock, or restock..."
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                            <button
                                onClick={handleSendMessage}
                                className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow hover:bg-indigo-700 cursor-pointer"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* --- BOTTOM NAVIGATION FOOTER BAR --- */}
            <div className="fixed bottom-0 left-0 right-0 h-[64px] bg-white border-t border-slate-100 flex items-center justify-around px-2 z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] pb-safe">
                <Link
                    to="/seller/home"
                    className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${
                        location.pathname === '/seller/home' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <Store size={20} className={location.pathname === '/seller/home' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
                    <span className="text-[10px] font-black tracking-tight mt-1 uppercase">Home</span>
                </Link>
                
                <Link
                    to="/seller/products"
                    className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${
                        location.pathname === '/seller/products' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-650'
                    }`}
                >
                    <Box size={20} className={location.pathname === '/seller/products' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
                    <span className="text-[10px] font-black tracking-tight mt-1 uppercase">Products</span>
                </Link>

                <Link
                    to="/seller/inventory"
                    className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${
                        location.pathname === '/seller/inventory' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-650'
                    }`}
                >
                    <Package size={20} className={location.pathname === '/seller/inventory' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
                    <span className="text-[10px] font-black tracking-tight mt-1 uppercase">Stock</span>
                </Link>

                <Link
                    to="/seller/catalog-requests"
                    className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${
                        location.pathname === '/seller/catalog-requests' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-655'
                    }`}
                >
                    {isHomeBusiness ? (
                        <MessageSquare size={20} className={location.pathname === '/seller/catalog-requests' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
                    ) : (
                        <Inbox size={20} className={location.pathname === '/seller/catalog-requests' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
                    )}
                    <span className="text-[10px] font-black tracking-tight mt-1 uppercase">
                        {isHomeBusiness ? 'Tinder' : 'Requests'}
                    </span>
                </Link>

                <Link
                    to="/seller/insights"
                    className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${
                        location.pathname === '/seller/insights' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-650'
                    }`}
                >
                    <Activity size={20} className={location.pathname === '/seller/insights' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
                    <span className="text-[10px] font-black tracking-tight mt-1 uppercase">Insights</span>
                </Link>
            </div>

        </div>
    );
};

export default MobileSellerLayout;
