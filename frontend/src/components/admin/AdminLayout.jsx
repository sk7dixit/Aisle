import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    FiGrid, FiCheckSquare, FiShoppingBag, FiUsers, FiBarChart2, FiSettings,
    FiLogOut, FiBell, FiPackage, FiFlag, FiActivity, FiSpeaker, FiMenu, FiX,
    FiHome, FiAlertCircle, FiFileText, FiMoreHorizontal, FiAlertTriangle, FiUserCheck, FiMapPin
} from 'react-icons/fi';
import ShopLensLogo from '../ShopLensLogo';

const AdminLayout = () => {
    const [isDockExpanded, setIsDockExpanded] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // For "More" tab
    const location = useLocation();
    const navigate = useNavigate();

    // Protect Admin Route
    const storedUser = JSON.parse(localStorage.getItem('shoplensUser') || '{}');
    const role = storedUser.role?.toLowerCase();

    React.useEffect(() => {
        if (!storedUser || !storedUser.token) {
            navigate('/login', { replace: true });
            return;
        }

        // Case-insensitive role check (Allow both super_admin, admin and moderator)
        if (role !== 'super_admin' && role !== 'admin' && role !== 'moderator') {
            console.warn('Unauthorized access attempt by:', storedUser.email);
            navigate('/admin/login', { replace: true });
        }
        // Note: Specific redirects for restricted pages handled by filtering/routing, 
        // but we can add a guard here if needed.
    }, [navigate, location.pathname, role]);

    // Desktop Menu Items (GROUPED)
    const menuGroups = [
        {
            title: 'OPERATIONS',
            items: [
                { icon: FiGrid, label: 'Dashboard', path: '/admin', roles: ['super_admin', 'admin', 'moderator'] },
                { icon: FiCheckSquare, label: 'Verifications', path: '/admin/verifications', roles: ['super_admin', 'admin'] }, // Mods moved to limited operations
                // Location Verification Removed
                { icon: FiUserCheck, label: 'Face Requests', path: '/admin/face-requests', roles: ['super_admin', 'admin', 'moderator'] },
                { icon: FiShoppingBag, label: 'Shops', path: '/admin/shops', roles: ['super_admin', 'admin'] },
                { icon: FiUsers, label: 'Users', path: '/admin/users', roles: ['super_admin', 'admin'] },
                { icon: FiPackage, label: 'Products', path: '/admin/products', roles: ['super_admin', 'admin'] },
                { icon: FiFlag, label: 'Reports', path: '/admin/reports', roles: ['super_admin', 'admin', 'moderator'] },
            ]
        },
        {
            title: 'OVERSIGHT',
            items: [
                { icon: FiActivity, label: 'Activity Logs', path: '/admin/activity-logs', roles: ['super_admin', 'admin', 'moderator'] },
                { icon: FiSpeaker, label: 'Announcements', path: '/admin/announcements', roles: ['super_admin', 'admin', 'moderator'] },
                { icon: FiBarChart2, label: 'Analytics', path: '/admin/analytics', roles: ['super_admin', 'admin'] }, // Mods don't see deep analytics
            ]
        },
        {
            title: 'GOVERNANCE',
            items: [
                { icon: FiSettings, label: 'Settings', path: '/admin/settings', roles: ['super_admin'] },
            ]
        }
    ];

    // Mobile Bottom Bar Items (Simplified for Mobile)
    // Need to filter these too ideally, but for now we keep generic safe ones
    const mobileTabs = [
        { icon: FiHome, label: 'Home', path: '/admin' },
        { icon: FiCheckSquare, label: 'Verify', path: '/admin/verifications' }, // Check role before Nav?
        { icon: FiFlag, label: 'Reports', path: '/admin/reports' },
        { icon: FiActivity, label: 'Logs', path: '/admin/activity-logs' },
        { icon: FiMoreHorizontal, label: 'More', action: () => setIsMobileMenuOpen(true) },
    ];

    const moreMenuItems = [];

    const handleLogout = () => {
        localStorage.removeItem('shoplensUser');
        localStorage.removeItem('shoplensToken');
        window.location.href = '/admin/login';
    };

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="min-h-screen bg-[#F2F2F2] text-gray-800 font-sans flex overflow-hidden">

            {/* --- DESKTOP: Sidebar Dock --- */}
            <aside
                className={`hidden md:flex flex-col h-screen bg-white z-40 transition-all duration-300 fixed left-0 top-0 border-r border-[#CBCBCB] ${isDockExpanded ? 'w-64' : 'w-24'}`}
                onMouseEnter={() => setIsDockExpanded(true)}
                onMouseLeave={() => setIsDockExpanded(false)}
            >
                {/* Logo Area */}
                <div className="h-[80px] flex items-center justify-center border-b border-[#CBCBCB] mb-2 px-4">
                    <ShopLensLogo className="h-12 w-40" />
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 flex flex-col gap-6 px-3 py-6 overflow-y-auto custom-scrollbar">
                    {menuGroups.map((group, gIdx) => {
                        const visibleItems = group.items.filter(item => {
                            if (!role) return false;
                            return item.roles.includes(role);
                        });

                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={gIdx} className="flex flex-col gap-1">
                                {isDockExpanded && (
                                    <p className="px-3 text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">
                                        {group.title}
                                    </p>
                                )}

                                {visibleItems.map((item) => {
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <button
                                            key={item.label}
                                            onClick={() => navigate(item.path)}
                                            className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${isActive
                                                ? 'bg-gray-100 text-[#174D38] font-bold'
                                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                        >
                                            <div className={`transition-colors ${isActive ? 'text-[#174D38]' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                                <item.icon size={20} />
                                            </div>

                                            {isDockExpanded && (
                                                <span className="text-sm border-l-2 border-transparent pl-0">{item.label}</span>
                                            )}

                                            {/* Tooltip for collapsed state */}
                                            {!isDockExpanded && (
                                                <div className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                                                    {item.label}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })}
                </nav>
            </aside>

            {/* --- MOBILE: Main Content Wrapper --- */}
            <div className={`flex-1 flex flex-col h-screen transition-all duration-300 md:ml-28 ${isDockExpanded ? 'md:ml-72' : ''} md:mr-4 pb-24 md:pb-0`}>

                {/* Desktop Header */}
                <header className="hidden md:flex h-20 items-center justify-between px-6 py-4 mt-4 mb-2 relative z-30">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Admin Control Center</h1>
                        <p className="text-sm text-gray-500 font-medium mt-1">Monitor platform health and pending actions</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/notifications')}
                            className="p-2 rounded-full bg-white/50 hover:bg-white/80 transition-all text-gray-600 relative"
                        >
                            <FiBell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>

                        {/* 2. Clickable Profile Dropdown */}
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-3 pl-4 border-l border-[#CBCBCB] group outline-none"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-gray-800">
                                        {JSON.parse(localStorage.getItem('shoplensUser') || '{}').name || 'Admin User'}
                                    </p>
                                </div>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-[#174D38] text-white font-bold`}>
                                    {(JSON.parse(localStorage.getItem('shoplensUser') || '{}').name || 'A').charAt(0).toUpperCase()}
                                </div>
                            </button>

                            {/* Enhanced Dropdown Menu */}
                            {isProfileOpen && (
                                <div className="absolute right-0 top-14 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 animate-fade-in-down origin-top-right overflow-hidden z-50">
                                    {/* Identity Header */}
                                    <div className="p-4 bg-gray-50 rounded-xl mb-2 flex items-center gap-3 border border-gray-100">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-[#174D38]`}>
                                            {(JSON.parse(localStorage.getItem('shoplensUser') || '{}').name || 'A').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="overflow-hidden">
                                            <h4 className="font-bold text-gray-800 truncate">
                                                {JSON.parse(localStorage.getItem('shoplensUser') || '{}').name || 'Admin User'}
                                            </h4>
                                            <p className="text-xs text-gray-500 truncate">
                                                {JSON.parse(localStorage.getItem('shoplensUser') || '{}').email || 'admin@shoplens.com'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Links (Role Based Visibility) */}
                                    <div className="space-y-1 mb-2">
                                        <button
                                            onClick={() => { navigate('/admin/profile'); setIsProfileOpen(false); }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                        >
                                            <FiUsers size={16} /> View Profile
                                        </button>
                                        {/* Security Settings: Often distinct from System Settings. Let's allowing viewing profile/security for self. */}
                                        <button
                                            onClick={() => { navigate('/admin/profile'); setIsProfileOpen(false); }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                        >
                                            <FiSettings size={16} /> Security & Sessions
                                        </button>
                                    </div>

                                    {/* Logout */}
                                    <div className="border-t border-gray-100 pt-2">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                        >
                                            <FiLogOut size={16} /> Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Mobile Header */}
                <header className="flex md:hidden h-[72px] items-center justify-between px-4 bg-white/50 backdrop-blur-md sticky top-0 z-30 border-b border-gray-100">
                    <ShopLensLogo className="h-12 w-40" />
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/admin/notifications')} className="relative p-2">
                            <FiBell size={20} className="text-gray-600" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 p-[1.5px]">
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                                <span className="font-bold text-blue-600 text-xs">A</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto px-4 py-4 md:px-2 md:py-0 custom-scrollbar">
                    <Outlet />
                </main>
            </div>

            {/* --- MOBILE: Bottom Command Bar --- */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50 flex items-center justify-around h-16 shadow-lg-up">
                {mobileTabs.map((tab, idx) => {
                    const isActive = tab.path ? location.pathname === tab.path : false;
                    return (
                        <button
                            key={idx}
                            onClick={() => tab.action ? tab.action() : navigate(tab.path)}
                            className={`flex flex-col items-center justify-center gap-1 w-full h-full ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                        >
                            <div className={`p-1 rounded-full ${isActive ? 'bg-blue-50' : ''}`}>
                                <tab.icon size={20} />
                            </div>
                            <span className="text-[10px] font-bold">{tab.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* --- MOBILE: "More" Menu Overlay --- */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[60] flex flex-col md:hidden">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                    <div className="absolute bottom-0 left-0 right-0 bg-[#F5F7FA] rounded-t-[30px] p-6 animate-fade-up max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-gray-800">More Options</h2>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-500">
                                <FiX size={20} />
                            </button>
                        </div>

                        {/* Admin Profile Summary */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 mb-6">
                            <div className={`w-12 h-12 rounded-full p-[2px] shrink-0 ${JSON.parse(localStorage.getItem('shoplensUser') || '{}').role === 'moderator'
                                ? 'bg-gradient-to-tr from-purple-500 to-pink-600'
                                : 'bg-gradient-to-tr from-blue-500 to-indigo-600'
                                }`}>
                                <div className={`w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-lg ${JSON.parse(localStorage.getItem('shoplensUser') || '{}').role === 'moderator'
                                    ? 'text-purple-600'
                                    : 'text-blue-600'
                                    }`}>
                                    {(JSON.parse(localStorage.getItem('shoplensUser') || '{}').name || 'A').charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">{JSON.parse(localStorage.getItem('shoplensUser') || '{}').name || 'Admin User'}</h3>
                                <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded uppercase mt-1 ${JSON.parse(localStorage.getItem('shoplensUser') || '{}').role === 'moderator'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {JSON.parse(localStorage.getItem('shoplensUser') || '{}').role === 'moderator' ? 'Moderator' : 'Super Admin'}
                                </span>
                            </div>
                        </div>

                        {/* Actions List */}
                        <div className="space-y-3 mb-6">
                            <button className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 text-gray-700 font-medium active:scale-98 transition-transform">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-50 rounded-lg text-gray-600"><FiBell size={18} /></div>
                                    <span>Notifications</span>
                                </div>
                                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                                    <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                                </div>
                            </button>

                            {/* Super Admin Only: Maintenance Mode */}
                            {role !== 'moderator' && (
                                <button className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 text-gray-700 font-medium active:scale-98 transition-transform">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-50 rounded-lg text-red-600"><FiAlertTriangle size={18} /></div>
                                        <span>Maintenance Mode</span>
                                    </div>
                                    <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                                        <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                                    </div>
                                </button>
                            )}
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 text-red-600 font-bold rounded-2xl border border-red-100 active:scale-95 transition-transform"
                        >
                            <FiLogOut size={20} />
                            Log Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLayout;
