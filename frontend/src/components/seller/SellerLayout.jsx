import { useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    FaStore, FaBoxOpen, FaClipboardList, FaInbox,
    FaCalendar, FaUser, FaCog, FaSignOutAlt, FaPlus, FaQrcode, FaComments, FaCrown, FaHeadset,
    FaSun, FaMoon, FaChartLine
} from 'react-icons/fa';
import './seller-theme.css';
import { NotificationProvider, useNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';

import { SupportProvider, useSupport } from '../../context/SupportContext';
import AisleLogo from '../AisleLogo';
import AisleSupportPanel from './AisleSupportPanel';
import NotificationPanel from './NotificationPanel';
import { useChat } from '../../context/ChatContext';

const SellerLayoutContent = ({ children, user, logout, modules, location }) => {
    const { theme, toggleTheme } = useTheme();
    const { isSupportOpen, closeSupport, openSupport } = useSupport();
    const { unreadCount, openNotification } = useNotifications();
    const { unreadCount: chatUnreadCount } = useChat();

    const [showQuickPrompts, setShowQuickPrompts] = useState(false);

    return (
        <div className="seller-theme flex h-screen seller-background-bg font-inter overflow-hidden relative text-[var(--foreground)]">

            {/* 1. GLOBAL HEADER (Fixed Top, Full Width) */}
            <header className="fixed top-0 left-0 right-0 h-[72px] px-6 md:px-8 seller-header border-b seller-border-color flex items-center justify-between z-[100]">
                {/* Left: Branding */}
                <div className="flex items-center justify-start">
                    <AisleLogo className="h-14 w-auto object-contain !justify-start" />
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-4">
                    {/* Theme Switcher */}
                    <button
                        onClick={toggleTheme}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/50 transition-all border border-transparent hover:border-[var(--border)]"
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? <FaSun className="text-lg text-amber-500" /> : <FaMoon className="text-lg text-slate-500" />}
                    </button>

                    {/* Insights Center Link */}
                    <Link
                        to="/seller/insights"
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative
                                    ${location.pathname.includes('/seller/insights') ? 'seller-card-bg seller-primary-text shadow-sm border seller-border-color' : 'bg-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/50'}
                                `}
                        title="Insights Center"
                    >
                        <FaChartLine className="text-lg" />
                    </Link>

                    {/* Notification Bell */}
                    <button
                        onClick={openNotification}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative
                                    ${unreadCount > 0 ? 'seller-card-bg seller-primary-text shadow-sm border seller-border-color' : 'bg-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/50'}
                                `}
                        title="Notifications"
                    >
                        <FaInbox className="text-lg" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 seller-border-color">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Messages Chat */}
                    <Link
                        to="/seller/messages"
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative
                                    ${location.pathname.includes('/seller/messages') ? 'seller-card-bg seller-primary-text shadow-sm border seller-border-color' : 'bg-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/50'}
                                `}
                        title="Messages"
                    >
                        <FaComments className="text-lg" />
                        {chatUnreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 seller-border-color">
                                {chatUnreadCount}
                            </span>
                        )}
                    </Link>

                    {/* Support / Business Center Button -> AI Copilot Button */}
                    <button
                        onClick={openSupport}
                        className="hidden md:flex items-center gap-2 px-3 py-2 seller-card-bg border seller-border-color rounded-lg hover:border-[var(--primary)] hover:shadow-sm transition-all group"
                    >
                        <div className="w-5 h-5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full flex items-center justify-center text-[10px] shadow-sm group-hover:scale-110 transition-transform">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                        </div>
                        <span className="text-xs font-bold text-[var(--foreground)] group-hover:text-[var(--primary)]">Ask Aisle</span>
                    </button>

                    {/* Settings */}
                    <Link
                        to="/seller/settings"
                        className="w-10 h-10 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/50 rounded-xl transition-all"
                        title="Settings"
                    >
                        <FaCog className="text-lg" />
                    </Link>

                    {/* Profile Avatar */}
                    <Link to="/seller/profile" className="relative group">
                        <div className="w-10 h-10 rounded-full bg-[var(--secondary)] border-2 seller-border-color shadow-sm overflow-hidden">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center seller-primary-bg/10 seller-primary-text font-bold">
                                    {user?.name?.[0] || 'S'}
                                </div>
                            )}
                        </div>
                    </Link>
                </div>
            </header>

            {/* 3. DOCKED EXPANDING SIDEBAR (Left Pinned SaaS Sidebar) */}
            <div className="fixed left-0 top-[72px] bottom-0 z-[99] hidden md:flex flex-col justify-between py-6 bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] transition-all duration-300 w-20 hover:w-60 shadow-2xl group/sidebar">
                
                {/* Navigation Items */}
                <nav className="flex flex-col gap-1 w-full">
                    {modules.map((item) => {
                        const isActive = location.pathname.includes(item.path);
                        
                        // Map labels to concise proper title labels with emojis for collapsed view
                        let shortLabel = item.label;
                        if (item.label === 'Command Center') shortLabel = '🏪 Shop';
                        else if (item.label === 'Products') shortLabel = '📦 Products';
                        else if (item.label === 'Inventory') shortLabel = '📋 Orders';
                        else if (item.label === 'Customer Activity') shortLabel = '📅 Events';
                        else if (item.label === 'Catalog Requests') shortLabel = '💬 Requests';
                        else if (item.label === 'Feedback') shortLabel = '💬 Feedback';
                        else if (item.label === 'Subscription') shortLabel = '⭐ Premium';

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3.5 p-3.5 mx-3 my-0.5 rounded-2xl transition-all duration-300 relative overflow-hidden group/item h-14 group-hover/sidebar:h-12 group-hover/sidebar:flex-row flex-col justify-center group-hover/sidebar:justify-start
                                        ${isActive 
                                            ? 'bg-gradient-to-r from-indigo-500 to-indigo-650 text-white shadow-lg shadow-indigo-500/20' 
                                            : 'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]'}
                                    `}
                            >
                                {/* Icon */}
                                <span className="text-xl shrink-0 w-8 h-8 flex items-center justify-center">{item.icon}</span>

                                {/* Expanded Label (Horizontal) */}
                                <span className="text-xs font-bold whitespace-nowrap transition-all duration-300 opacity-0 group-hover/sidebar:opacity-100 w-0 group-hover/sidebar:w-auto overflow-hidden">
                                    {item.label}
                                </span>

                                {/* Collapsed Label (Vertical Stack below Icon) */}
                                <span className="absolute bottom-1 text-[8.5px] font-extrabold text-center w-full left-0 opacity-100 group-hover/sidebar:opacity-0 transition-opacity duration-200 pointer-events-none text-slate-600 dark:text-neutral-350">
                                    {shortLabel}
                                </span>
                            </Link>
                        );
                    })}

                    {/* Divider */}
                    <div className="w-[calc(100%-1.5rem)] h-px bg-[var(--sidebar-border)] my-4 mx-3"></div>

                    {/* Logout */}
                    <button
                        onClick={logout}
                        className="flex items-center gap-3.5 p-3.5 mx-3 rounded-2xl transition-all duration-300 relative h-14 group-hover/sidebar:h-12 group-hover/sidebar:flex-row flex-col justify-center group-hover/sidebar:justify-start text-[var(--muted-foreground)] hover:bg-rose-500/10 hover:text-rose-500"
                    >
                        <span className="text-xl shrink-0 w-8 h-8 flex items-center justify-center"><FaSignOutAlt /></span>
                        <span className="text-xs font-bold whitespace-nowrap transition-all duration-300 opacity-0 group-hover/sidebar:opacity-100 w-0 group-hover/sidebar:w-auto overflow-hidden">
                            Sign Out
                        </span>
                        <span className="absolute bottom-1 text-[8px] font-black uppercase tracking-wider text-center w-full left-0 opacity-100 group-hover/sidebar:opacity-0 transition-opacity duration-200 pointer-events-none scale-[0.85]">
                            Exit
                        </span>
                    </button>
                </nav>

            </div>

            {/* 4. MAIN CONTENT AREA (Adjusted left margin to match collapsed sidebar) */}
            <div className="flex-1 flex flex-col h-full overflow-hidden ml-0 md:ml-20 pt-[72px]">

                {/* 4.2. SCROLLABLE BODY */}
                <main className={`flex-1 scroll-smooth ${location.pathname.includes('add-product/manual') ? 'p-0 overflow-hidden' : 'p-4 md:p-8 overflow-y-auto'}`}>
                    <Outlet key={location.pathname} />
                </main>
            </div>

            {/* 5. GLOBAL SUPPORT DRAWER (Right Side) */}
            <AisleSupportPanel isOpen={isSupportOpen} onClose={closeSupport} />
            <NotificationPanel />

            {/* Floating AI Copilot Dock Button / Expandable Assistant */}
            <div 
                className="fixed bottom-20 md:bottom-8 right-6 z-[9999] flex flex-col items-end gap-3"
                onMouseEnter={() => setShowQuickPrompts(true)}
                onMouseLeave={() => setShowQuickPrompts(false)}
            >
                {/* Quick Prompts Panel */}
                {showQuickPrompts && (
                    <div className="bg-slate-900/95 dark:bg-neutral-950/95 backdrop-blur-md border border-slate-800 text-white rounded-2xl p-4 shadow-2xl w-64 animate-scale-up border-indigo-500/30">
                        <div className="text-[10px] font-black uppercase tracking-wider text-indigo-400 mb-2 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                            <span>✨ Ask Aisle AI Advisor</span>
                        </div>
                        <div className="space-y-1.5">
                            {[
                                { text: "What should I restock?", label: "What should I restock?" },
                                { text: "Predict tomorrow sales", label: "Predict tomorrow sales" },
                                { text: "Show slow moving items", label: "Show slow moving items" },
                                { text: "What should I charge?", label: "What should I charge?" }
                            ].map((prompt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        openSupport();
                                        setTimeout(() => {
                                            window.dispatchEvent(new CustomEvent('aisle:copilot:send-prompt', { detail: { promptText: prompt.text } }));
                                        }, 400);
                                    }}
                                    className="w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-xl hover:bg-indigo-600/20 hover:text-indigo-400 transition-colors border border-transparent hover:border-indigo-500/10 flex items-center justify-between text-slate-200"
                                >
                                    <span>{prompt.label}</span>
                                    <span className="text-[10px] text-indigo-400/50">→</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Floating Button Wrapper with Pulse Suggestion Badge */}
                <div className="relative flex items-center">
                    {/* Pulsing Suggestion Tooltip Badge */}
                    {!showQuickPrompts && (
                        <div className="absolute right-32 md:right-36 bg-slate-900/95 dark:bg-neutral-950/95 backdrop-blur-md border border-indigo-500/80 text-white rounded-full px-4 py-2 shadow-2xl whitespace-nowrap text-[9px] md:text-[10px] font-black uppercase tracking-wider flex items-center gap-2 animate-pulse shadow-indigo-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                            <span className="hidden sm:inline">✨ Ask Aisle | Restock Protein Powder? Indore demand rising</span>
                            <span className="inline sm:hidden">✨ Ask Aisle | 3 Suggestions Available</span>
                        </div>
                    )}
                    
                    <button
                        onClick={openSupport}
                        className="flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white rounded-full shadow-2xl shadow-indigo-500/30 transition-all duration-300 transform hover:scale-105 active:scale-95 group border border-white/20"
                        title="Ask Aisle"
                    >
                        <span className="relative flex h-3.5 w-3.5 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500"></span>
                        </span>
                        <span className="text-xs font-black uppercase tracking-wider">Ask Aisle</span>
                    </button>
                </div>
            </div>

            {/* 6. MOBILE BOTTOM BAR (Fallback) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--card)]/90 backdrop-blur-lg border-t border-[var(--border)] flex justify-around items-center px-2 py-3 z-[100] pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                {modules.slice(0, 5).map((item) => { // Show first 5 on mobile
                    const isActive = location.pathname.includes(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-full
                                    ${isActive ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}
                                `}
                        >
                            <span className={`text-xl ${isActive ? 'scale-110 drop-shadow-sm' : ''}`}>
                                {item.icon}
                            </span>
                        </Link>
                    );
                })}
                <Link to="/seller/profile" className={`p-2 ${location.pathname.includes('profile') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}>
                    <FaUser className="text-xl" />
                </Link>
            </div>

        </div>
    );
};

const SellerLayout = () => {
    const { user, logout, loading } = useAuth();
    const location = useLocation();
    const { unreadCount: chatUnreadCount } = useChat();

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>;
    if (!user || user.role !== 'seller') return <Navigate to="/login" replace />;

    // 1. Define Modules (Strict Order)
    const modules = [
        { path: '/seller/home', label: 'Command Center', icon: <FaStore /> },
        { path: '/seller/products', label: 'Products', icon: <FaBoxOpen /> },
        { path: '/seller/inventory', label: 'Inventory', icon: <FaClipboardList /> },
        { path: '/seller/customer-visits', label: 'Customer Activity', icon: <FaCalendar /> },
        { path: '/seller/catalog-requests', label: 'Catalog Requests', icon: <FaInbox /> },
        { path: '/seller/feedback', label: 'Feedback', icon: <FaComments /> },
        { path: '/seller/subscription', label: 'Subscription', icon: <FaCrown /> },
    ];

    return (
        <SupportProvider>
            <NotificationProvider>
                <SellerLayoutContent user={user} logout={logout} modules={modules} location={location} />
            </NotificationProvider>
        </SupportProvider>
    );
};

export default SellerLayout;
