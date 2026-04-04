import React, { useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    FaThLarge, FaInbox, FaToggleOn, FaToggleOff,
    FaWallet, FaStar, FaUserCog, FaSignOutAlt, FaBell, FaUserCircle
} from 'react-icons/fa';
import './service-theme.css';
import { NotificationProvider } from '../../context/NotificationContext';

const ServiceLayout = () => {
    const { user, logout, loading, token } = useAuth();
    const location = useLocation();
    const [isOnline, setIsOnline] = useState(user?.shopDetails?.isOpen ?? true);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400 bg-[#0F172A]">Loading Service Dashboard...</div>;

    // Safety check: Ensure only service sellers access this
    if (!user || user.role !== 'seller' || (user.shopDetails?.category !== 'Services' && user.shopDetails?.shopCategory !== 'Services')) {
        return <Navigate to="/seller/home" replace />;
    }

    const modules = [
        { path: '/seller/home', label: 'Dashboard', icon: <FaThLarge /> },
        { path: '/seller/requests', label: 'Requests', icon: <FaInbox /> },
        { path: '/seller/earnings', label: 'Earnings', icon: <FaWallet /> },
        { path: '/seller/reviews', label: 'Reviews', icon: <FaStar /> },
        { path: '/seller/profile', label: 'Service Profile', icon: <FaUserCircle /> },
        { path: '/seller/settings', label: 'Settings', icon: <FaUserCog /> },
        { path: '/seller/feedback', label: 'Feedback', icon: <FaStar /> },
    ];

    const toggleAvailability = async () => {
        try {
            const res = await fetch('/api/seller/shop/status', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isOpen: !isOnline })
            });
            if (res.ok) {
                setIsOnline(!isOnline);
            }
        } catch (error) {
            console.error("Failed to toggle status", error);
        }
    };

    return (
        <NotificationProvider>
            <div className="flex h-screen service-dashboard-container overflow-hidden">
                {/* Mesh Gradient Blobs */}
                <div className="mesh-blob blob-1"></div>
                <div className="mesh-blob blob-2"></div>

                <aside className="service-sidebar hidden md:flex flex-col relative z-20">
                    <div className="p-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                                <span className="text-white font-black text-xl nebula-font">S</span>
                            </div>
                            <span className="text-nebula-text-header font-black tracking-tight nebula-font text-xl">NEBULA</span>
                        </div>
                    </div>

                    <nav className="flex-1 px-4 space-y-2 overflow-y-auto service-scrollbar">
                        {modules.map((item) => {
                            const isActive = location.pathname.startsWith(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold service-nav-link ${isActive ? 'active' : 'hover:bg-white/5'}`}
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-6 border-t border-white/5">
                        <button
                            onClick={logout}
                            className="flex items-center gap-4 px-4 py-3.5 w-full text-sm font-semibold text-slate-500 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all"
                        >
                            <FaSignOutAlt className="text-lg" />
                            Sign Out
                        </button>
                    </div>
                </aside>

                {/* Main Area (Floating Panel) */}
                <div className="service-main-panel">
                    {/* Topbar */}
                    <header className="service-topbar flex items-center justify-between px-8">
                        <div className="flex items-center gap-4">
                            {/* Dashboard Title or Context */}
                            <h2 className="text-nebula-text-header font-black text-xl tracking-tight hidden md:block nebula-font">
                                {modules.find(m => location.pathname.startsWith(m.path))?.label || 'Service Hub'}
                            </h2>

                            {/* Slim Status Bar */}
                            <div className="status-bar-slim ml-4 border-indigo-500/20">
                                <div className={`status-dot-glow ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`} style={{ backgroundColor: 'currentColor' }}></div>
                                <span className={isOnline ? 'text-emerald-400' : 'text-rose-400'}>
                                    {isOnline ? 'Live & Online' : 'System Offline'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            {/* Toggle Button (Warrior Style) */}
                            <button
                                onClick={toggleAvailability}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all shadow-lg ${isOnline ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white'}`}
                            >
                                {isOnline ? 'Go Offline' : 'Go Online'}
                            </button>

                            <button className="text-slate-400 hover:text-white transition-colors relative">
                                <FaBell size={18} />
                                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_#6366f1]"></span>
                            </button>

                            <div className="flex items-center gap-3 pl-6 border-l border-white/5">
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs font-bold text-white leading-none mb-1">{user?.name}</p>
                                    <p className="text-[10px] text-slate-500 font-medium">{user?.shopDetails?.shopName}</p>
                                </div>
                                <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 border border-white/5 overflow-hidden">
                                    {user?.profileImage ? <img src={user.profileImage} alt="" className="w-full h-full object-cover" /> : <FaUserCircle size={24} />}
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Content Scroll Area */}
                    <main className="service-main-content service-scrollbar">
                        <Outlet />
                    </main>
                </div>

                {/* Mobile Navigation (Floating Dock) */}
                <div className="mobile-floating-nav md:hidden">
                    {modules.slice(0, 4).map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`p-3 rounded-2xl transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' : 'text-slate-500 hover:text-white'}`}
                            >
                                {isActive ? item.icon : React.cloneElement(item.icon, { size: 20 })}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </NotificationProvider>
    );
};

export default ServiceLayout;
