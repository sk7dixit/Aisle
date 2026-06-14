import React, { useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, ShoppingBag, ClipboardList, MessageSquare, 
  Star, Sparkles, Settings, LogOut, Sun, Moon, Inbox, Headset, User,
  Menu, X, TrendingUp
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { NotificationProvider, useNotifications } from '../../context/NotificationContext';
import { SupportProvider, useSupport } from '../../context/SupportContext';
import AisleLogo from '../../components/AisleLogo';
import AisleSupportPanel from '../../components/seller/AisleSupportPanel';
import NotificationPanel from '../../components/seller/NotificationPanel';
import { useChat } from '../../context/ChatContext';

const HomeBusinessLayoutContent = ({ children, user, logout, modules, location }) => {
    const { theme, toggleTheme } = useTheme();
    const { isSupportOpen, closeSupport, openSupport } = useSupport();
    const { unreadCount, openNotification } = useNotifications();
    const { unreadCount: chatUnreadCount } = useChat();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    return (
        <div className="home-business-theme flex flex-col h-screen bg-[var(--background)] font-sans overflow-hidden relative text-[var(--foreground)]">
            
            {/* 1. GLOBAL HEADER / TOP NAVIGATION */}
            <header className="h-[72px] px-6 md:px-8 bg-[var(--card)]/90 backdrop-blur-md border-b border-[var(--border)] flex items-center justify-between z-[100] flex-shrink-0">
                {/* Left: Branding */}
                <div className="flex items-center gap-3">
                    <AisleLogo className="h-14 w-auto object-contain !justify-start" />
                </div>

                {/* Center: Top Navigation Menu (Desktop Only) */}
                <nav className="hidden lg:flex items-center gap-1.5">
                    {modules.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`text-sm font-extrabold tracking-tight px-4 py-2 rounded-xl transition-all
                                    ${isActive 
                                      ? 'text-[var(--primary-foreground)] bg-[var(--primary)] font-black shadow-sm' 
                                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/20'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                    {/* Theme Switcher */}
                    <button
                        onClick={toggleTheme}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/20 transition-all"
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-500" />}
                    </button>

                    {/* Notification Bell */}
                    <button
                        onClick={openNotification}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative
                                    ${unreadCount > 0 ? 'bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30' : 'bg-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/20'}
                                `}
                        title="Notifications"
                    >
                        <Inbox className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Messages Chat */}
                    <Link
                        to="/seller/messages"
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative
                                    ${location.pathname === '/seller/messages' ? 'bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30' : 'bg-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/20'}
                                `}
                        title="Messages"
                    >
                        <MessageSquare className="w-5 h-5" />
                        {chatUnreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                                {chatUnreadCount}
                            </span>
                        )}
                    </Link>

                    {/* Support Button */}
                    <button
                        onClick={openSupport}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/20 transition-all"
                        title="Support"
                    >
                        <Headset className="w-5 h-5" />
                    </button>

                    {/* Profile Avatar with Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-10 h-10 rounded-full bg-[var(--primary)]/10 border border-[var(--border)] shadow-sm overflow-hidden flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
                        >
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[var(--foreground)] font-bold text-sm bg-[var(--primary)]">
                                    {user?.name?.[0] || 'C'}
                                </div>
                            )}
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                                <div className="absolute right-0 mt-2 w-48 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xl z-50 p-2 py-2 flex flex-col space-y-0.5 animate-fade-in text-left">
                                    <Link 
                                        to="/seller/profile" 
                                        onClick={() => setIsDropdownOpen(false)}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[var(--foreground)] hover:bg-[var(--accent)]/30 transition-colors"
                                    >
                                        <User className="w-4 h-4 text-[var(--muted-foreground)]" />
                                        Profile
                                    </Link>
                                    <Link 
                                        to="/seller/settings" 
                                        onClick={() => setIsDropdownOpen(false)}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[var(--foreground)] hover:bg-[var(--accent)]/30 transition-colors"
                                    >
                                        <Settings className="w-4 h-4 text-[var(--muted-foreground)]" />
                                        Settings
                                    </Link>
                                    <div className="h-px bg-[var(--border)] my-1.5 opacity-60"></div>
                                    <button 
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            logout();
                                        }}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50/50 transition-colors w-full text-left"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/20 transition-all"
                    >
                        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            {/* Mobile Dropdown Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed top-[72px] left-0 right-0 bg-[var(--card)] border-b border-[var(--border)] z-50 flex flex-col p-4 space-y-2 shadow-lg">
                    {modules.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`text-sm font-bold p-3 rounded-xl transition-all flex items-center gap-3
                                    ${isActive 
                                      ? 'text-[var(--primary-foreground)] bg-[var(--primary)]' 
                                      : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)]/10 hover:text-[var(--foreground)]'
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        );
                    })}
                    <div className="h-px bg-[var(--border)] my-2"></div>
                    <button
                        onClick={() => {
                            setIsMobileMenuOpen(false);
                            logout();
                        }}
                        className="text-sm font-bold p-3 rounded-xl text-rose-500 hover:bg-rose-50 flex items-center gap-3 w-full text-left"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            )}

            {/* 2. MAIN CONTENT AREA (Takes full width, no sidebar margins) */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 scroll-smooth p-4 md:p-8 overflow-y-auto custom-scrollbar">
                    <Outlet key={location.pathname} />
                </main>
            </div>

            {/* 3. GLOBAL SUPPORT DRAWER */}
            <AisleSupportPanel isOpen={isSupportOpen} onClose={closeSupport} />
            <NotificationPanel />

        </div>
    );
};

const HomeBusinessLayout = () => {
    const { user, logout, loading } = useAuth();
    const location = useLocation();
    const { unreadCount: chatUnreadCount } = useChat();

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading Creator Studio...</div>;
    if (!user || user.role !== 'seller') return <Navigate to="/login" replace />;

    const modules = [
        { path: '/seller/home', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
        { path: '/seller/insights', label: 'Insights Center', icon: <TrendingUp className="w-5 h-5" /> },
        { path: '/seller/products', label: 'Creations', icon: <ShoppingBag className="w-5 h-5" /> },
        { path: '/seller/customer-visits', label: 'Orders', icon: <ClipboardList className="w-5 h-5" /> },
        { path: '/seller/catalog-requests', label: 'Requests', icon: <Inbox className="w-5 h-5" /> },
        { path: '/seller/feedback', label: 'Reviews', icon: <Star className="w-5 h-5" /> },
    ];

    return (
        <SupportProvider>
            <NotificationProvider>
                <HomeBusinessLayoutContent user={user} logout={logout} modules={modules} location={location} />
            </NotificationProvider>
        </SupportProvider>
    );
};

export default HomeBusinessLayout;
