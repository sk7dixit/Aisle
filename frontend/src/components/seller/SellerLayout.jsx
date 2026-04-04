import { useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    FaStore, FaBoxOpen, FaClipboardList, FaInbox,
    FaCalendar, FaUser, FaCog, FaSignOutAlt, FaPlus, FaQrcode, FaComments, FaCrown, FaHeadset
} from 'react-icons/fa';
import './seller-theme.css';
import { NotificationProvider, useNotifications } from '../../context/NotificationContext';

import { SupportProvider, useSupport } from '../../context/SupportContext';
import ShopLensLogo from '../ShopLensLogo';
import ShopLensSupportPanel from './ShopLensSupportPanel';
import NotificationPanel from './NotificationPanel';

const SellerLayoutContent = ({ children, user, logout, modules, location }) => {
    const { isSupportOpen, closeSupport, openSupport } = useSupport();
    const { unreadCount, openNotification } = useNotifications();

    return (
        <div className="flex h-screen bg-[#FFFBEB] font-inter overflow-hidden relative">

            {/* 1. GLOBAL HEADER (Fixed Top, Full Width) */}
            <header className="fixed top-0 left-0 right-0 h-[72px] px-6 md:px-8 bg-[#FFFBEB]/90 backdrop-blur-md border-b border-[#F3E8D3] flex items-center justify-between z-[100]">
                {/* Left: Branding */}
                <div className="flex items-center justify-start">
                    <ShopLensLogo className="h-14 w-auto object-contain !justify-start" />
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-4">
                    {/* Notification Bell */}
                    <button
                        onClick={openNotification}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative
                                    ${unreadCount > 0 ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'bg-transparent text-slate-400 hover:text-slate-600 hover:bg-white/50'}
                                `}
                    >
                        <FaInbox className="text-lg" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-[#FFFBEB]">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Support Button */}
                    <button
                        onClick={openSupport}
                        className="hidden md:flex items-center gap-2 px-3 py-2 bg-white border border-[#E7E5E4] rounded-lg hover:border-indigo-200 hover:shadow-sm transition-all group"
                    >
                        <div className="w-5 h-5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-[10px] text-white shadow-sm group-hover:scale-110 transition-transform">
                            <FaHeadset />
                        </div>
                        <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-700">Support</span>
                    </button>

                    {/* Settings */}
                    <Link
                        to="/seller/settings"
                        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white/50 rounded-xl transition-all"
                        title="Settings"
                    >
                        <FaCog className="text-lg" />
                    </Link>

                    {/* Profile Avatar */}
                    <Link to="/seller/profile" className="relative group">
                        <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold">
                                    {user?.name?.[0] || 'S'}
                                </div>
                            )}
                        </div>
                    </Link>
                </div>
            </header>

            {/* 3. FLOATING CONTROL DECK (Fixed Left Capsule) */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 z-[9999] hidden md:flex flex-col gap-8">

                {/* Branding Bubble - Empty as requested */}
                <div className="w-20 h-20 flex items-center justify-center leading-none rounded-full">
                    {/* Logo removed */}
                </div>

                {/* Navigation Capsule */}
                <nav className="bg-[#1A1C23] text-slate-400 rounded-full py-6 px-2.5 shadow-2xl shadow-slate-900/20 flex flex-col items-center gap-2">
                    {modules.map((item) => {
                        const isActive = location.pathname.includes(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 group
                                        ${isActive ? 'bg-[#78350F] text-white shadow-lg shadow-[#78350F]/40 scale-110' : 'hover:bg-white/10 hover:text-white'}
                                    `}
                            >
                                {/* Icon */}
                                <span className="text-lg">{item.icon}</span>

                                {/* Hover Label (Fade In) */}
                                <div className="absolute left-14 bg-[#1A1C23] text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-white/10">
                                    {item.label}
                                </div>
                            </Link>
                        );
                    })}

                    {/* Divider */}
                    <div className="w-8 h-px bg-white/10 my-2"></div>

                    {/* Logout */}
                    <button
                        onClick={logout}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors text-slate-500"
                    >
                        <FaSignOutAlt />
                    </button>
                </nav>

            </div>

            {/* 4. MAIN CONTENT AREA (Full Canvas) */}
            <div className="flex-1 flex flex-col h-full overflow-hidden ml-0 md:ml-24 pt-[72px]">

                {/* 4.2. SCROLLABLE BODY */}
                <main className={`flex-1 scroll-smooth ${location.pathname.includes('add-product/manual') ? 'p-0 overflow-hidden' : 'p-4 md:p-8 overflow-y-auto'}`}>
                    <Outlet key={location.pathname} />
                </main>
            </div>

            {/* 5. GLOBAL SUPPORT DRAWER (Right Side) */}
            <ShopLensSupportPanel isOpen={isSupportOpen} onClose={closeSupport} />
            <NotificationPanel />

            {/* 6. MOBILE BOTTOM BAR (Fallback) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 flex justify-around items-center px-2 py-3 z-[100] pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                {modules.slice(0, 5).map((item) => { // Show first 5 on mobile
                    const isActive = location.pathname.includes(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-full
                                    ${isActive ? 'text-[#78350F]' : 'text-slate-400'}
                                `}
                        >
                            <span className={`text-xl ${isActive ? 'scale-110 drop-shadow-sm' : ''}`}>
                                {item.icon}
                            </span>
                        </Link>
                    );
                })}
                <Link to="/seller/profile" className={`p-2 ${location.pathname.includes('profile') ? 'text-[#78350F]' : 'text-slate-400'}`}>
                    <FaUser className="text-xl" />
                </Link>
            </div>

        </div>
    );
};

const SellerLayout = () => {
    const { user, logout, loading } = useAuth();
    const location = useLocation();

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>;
    if (!user || user.role !== 'seller') return <Navigate to="/login" replace />;

    // 1. Define Modules (Strict Order)
    const modules = [
        { path: '/seller/home', label: 'Dashboard', icon: <FaStore /> },
        { path: '/seller/products', label: 'Products', icon: <FaBoxOpen /> },
        { path: '/seller/inventory', label: 'Inventory', icon: <FaClipboardList /> },
        { path: '/seller/customer-visits', label: 'Customer Activity', icon: <FaCalendar /> },
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
