import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, MessageSquare, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../common/NotificationBell';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import { useLocation } from '../../context/LocationContext';
import { useInterested } from '../../context/InterestedContext';
import AisleLogo from '../AisleLogo';
import { toast } from 'react-hot-toast';
import { useChat } from '../../context/ChatContext';
import { motion } from 'framer-motion';

const CustomerTopBar = ({ onSupportClick }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { unreadCount: chatUnreadCount } = useChat();
    const { items: interestedItems } = useInterested();
    const interestedCount = interestedItems?.length || 0;

    const {
        userLocation,
        status: locationStatus,
        detectLocation
    } = useLocation();

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showLocationChip, setShowLocationChip] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const searchInputRef = useRef(null);

    // Fetch AI Suggestions on query change (200ms debounce)
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSuggestions([]);
            return;
        }
        const delayDebounce = setTimeout(async () => {
            try {
                const res = await fetch(`/api/ai/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data);
                }
            } catch (err) {
                console.error("Failed to fetch search suggestions:", err);
            }
        }, 200);
        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    // Scroll listener for sticky blur effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Ctrl+K / Cmd+K search shortcut key listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleLocationClick = async () => {
        if (locationStatus === 'IDLE' || locationStatus === 'ERROR' || !userLocation) {
            try {
                const delayPromise = new Promise(resolve => setTimeout(resolve, 1500));
                const detectionPromise = detectLocation();
                await Promise.all([delayPromise, detectionPromise]);
                setShowLocationChip(true);
                setTimeout(() => {
                    navigate('/address/add');
                    setShowLocationChip(false);
                }, 2000);
            } catch (error) {
                console.error("Location detection failed", error);
                toast.error(error.message || "Location access denied. Please enable GPS.");
            }
        } else {
            setShowLocationChip(!showLocationChip);
        }
    };

    const handleChangeLocation = () => {
        navigate('/address/add');
        setShowLocationChip(false);
    };

    const navLinks = [
        { name: 'Home', path: '/home' },
        { name: 'Categories', path: '/categories' },
        { name: 'Businesses', path: '/shops' },
        { name: 'Creators', path: '/creators', isNew: true },
        { name: 'Services', path: '/services' },
        { name: 'Interested', path: '/interested', showCount: true },
        { name: 'Bookings', path: '/bookings' },
    ];

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-[1000] w-full bg-white transition-all duration-300 border-b
                ${isScrolled
                    ? 'backdrop-blur-md bg-white/90 border-slate-200/50 shadow-md shadow-slate-100/5'
                    : 'border-slate-100 shadow-sm shadow-slate-150/5'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col pt-3 pb-1">
                {/* Row 1: Logo + Search + Actions (Height: 52px) */}
                <div className="relative z-20 flex justify-between items-center h-[52px] mb-4">
                    {/* 1. Logo Section (Centered alignment, reduced padding) */}
                    <Link to="/home" className="flex-shrink-0 flex items-center cursor-pointer group">
                        <AisleLogo className="group-hover:scale-102 transition-all duration-300" imgClassName="h-[28px]" />
                    </Link>

                    {/* 2. Glassmorphic Search Bar (Width: 500-650px desktop) */}
                    <div className="hidden md:flex flex-1 mx-8 max-w-[550px]">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (!searchQuery.trim()) return;
                                navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                            }}
                            className="relative w-full group"
                        >
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-4.5 w-4.5 text-gray-400 group-focus-within:text-[#E07A5F] transition-colors" />
                            </div>
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                                className="block w-full pl-11 pr-16 py-2.5 border border-slate-200/80 rounded-2xl leading-5 bg-slate-50/50 backdrop-blur-md text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#E07A5F]/5 focus:border-[#E07A5F] transition-all duration-300 shadow-inner text-xs font-semibold"
                                placeholder="What are you looking for today? (e.g. need snacks for party)"
                                autoComplete="off"
                            />
                            {/* Search shortcut badge */}
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-slate-200/40 border border-slate-200/70 px-1.5 py-0.5 rounded-md text-[9px] font-mono text-slate-405 font-bold select-none">
                                <span>⌘</span>
                                <span>K</span>
                            </div>

                            {/* Autocomplete Suggestions Overlay */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden z-[9999] animate-scale-up">
                                    <div className="py-2.5">
                                        <div className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-[#E07A5F]">AI Search suggestions</div>
                                        {suggestions.map((item, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => {
                                                    setSearchQuery(item.text);
                                                    setShowSuggestions(false);
                                                    navigate(`/search?q=${encodeURIComponent(item.text)}`);
                                                }}
                                                className="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-slate-50 dark:hover:bg-neutral-800/60 text-left transition-colors cursor-pointer group"
                                            >
                                                <span className="text-sm shrink-0 group-hover:scale-110 transition-transform">
                                                    {item.type === 'ai_intent' && '🤖'}
                                                    {item.type === 'ai_bundle' && '📦'}
                                                    {item.type === 'category' && '🏷️'}
                                                    {item.type === 'popular_query' && '🔥'}
                                                </span>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-800 dark:text-neutral-200 group-hover:text-[#E07A5F] transition-colors">{item.text}</span>
                                                    <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">
                                                        {item.type === 'ai_intent' && 'AI Shopping Assistant'}
                                                        {item.type === 'ai_bundle' && 'Custom Product Bundle'}
                                                        {item.type === 'category' && 'Storefront Category'}
                                                        {item.type === 'popular_query' && 'Trending Search'}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* 3. Unified Action Group (Location, Chat, Notification, Profile) */}
                    <div className="flex items-center gap-3.5 bg-slate-50/50 border border-slate-200/30 px-3.5 py-1.5 rounded-full shadow-inner backdrop-blur-md">
                        {/* Location Pill */}
                        <div className="relative">
                            <button
                                onClick={handleLocationClick}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 relative text-[10px] font-black uppercase tracking-wider
                                    ${locationStatus === 'READY'
                                        ? 'bg-orange-500/10 border-orange-200 text-[#E07A5F] hover:bg-orange-500/15'
                                        : 'bg-white border-slate-200 text-slate-500 hover:bg-white hover:border-[#E07A5F] hover:text-[#E07A5F]'
                                    }
                                    ${locationStatus === 'DETECTING' ? 'animate-pulse ring-2 ring-orange-100' : ''}
                                `}
                                title={userLocation?.area ? `Current: ${userLocation.area}` : "Click to detect location"}
                            >
                                <MapPin size={11} className={locationStatus === 'READY' ? 'text-[#E07A5F]' : 'text-slate-400'} />
                                <span className="max-w-[80px] truncate">
                                    {locationStatus === 'READY' ? (userLocation?.city || 'Indore') : 'Indore'}
                                </span>
                            </button>

                            {/* Location Mini-Pop */}
                            {showLocationChip && locationStatus === 'READY' && (
                                <div
                                    style={{
                                        backgroundColor: '#ffffff',
                                        opacity: 1,
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08)',
                                        border: '1px solid #F1F3F5'
                                    }}
                                    className="absolute top-full mt-3 right-0 w-[320px] rounded-2xl p-5 z-[9999] animate-in fade-in slide-in-from-top-2 duration-200 text-left"
                                >
                                    {/* Arrow Indicator */}
                                    <div
                                        className="absolute -top-[7px] w-3 h-3 rotate-45 bg-white border-t border-l pointer-events-none"
                                        style={{
                                            right: '28px',
                                            borderColor: '#F1F3F5 transparent transparent #F1F3F5'
                                        }}
                                    ></div>

                                    <div className="flex items-center gap-2 text-[#E07A5F] mb-3">
                                        <MapPin size={16} className="shrink-0" />
                                        <span className="font-extrabold text-gray-800 text-xs tracking-wider uppercase">Current Location</span>
                                    </div>
                                    
                                    <hr className="border-gray-100 my-2" />
                                    
                                    <div className="space-y-1.5 my-3">
                                        {userLocation?.area && (
                                            <p className="text-gray-900 font-extrabold text-sm leading-snug">
                                                {userLocation.area}
                                            </p>
                                        )}
                                        <p className="text-gray-605 text-xs font-semibold">
                                            {userLocation?.city || 'Vadodara'}{userLocation?.state || userLocation?.country ? `, ${userLocation.state || userLocation.country}` : ', Gujarat'}
                                        </p>
                                        <p className="text-gray-400 text-[10px] font-medium mt-1">
                                            ✓ Verified GPS Location
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleChangeLocation}
                                        className="w-full bg-[#E07A5F] hover:bg-[#d0694e] text-white py-2.5 rounded-xl text-xs font-bold uppercase transition-all shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                                    >
                                        Change Location
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Messages Chat Icon */}
                        <button
                            onClick={() => navigate('/messages')}
                            className="relative group p-2 bg-white border border-slate-200/50 rounded-full hover:bg-orange-50 transition-all cursor-pointer shadow-sm hover:border-orange-200"
                            title="Messages"
                        >
                            <MessageSquare className="w-4 h-4 text-slate-500 group-hover:text-[#E07A5F] transition-colors" />
                            {chatUnreadCount > 0 && (
                                <span
                                    className="absolute -top-1 -right-1 flex items-center justify-center text-white bg-red-650 rounded-full text-[9px] font-bold border-2 border-white shadow-sm"
                                    style={{
                                        minWidth: '16px',
                                        height: '16px',
                                        padding: '0 2px'
                                    }}
                                >
                                    {chatUnreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications Bell */}
                        <div className="relative group">
                            <NotificationBell />
                        </div>

                        {/* User Profile Card */}
                        <div className="relative">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/50 rounded-full hover:bg-slate-100/55 hover:border-[#E07A5F]/40 transition-all cursor-pointer shadow-sm"
                            >
                                <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#E07A5F] to-[#F2CC8F] flex items-center justify-center text-white text-xs font-black shadow-inner overflow-hidden">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{user?.name?.charAt(0).toUpperCase() || 'S'}</span>
                                    )}
                                </div>
                                <ChevronDown size={11} className="text-slate-450 mr-1 shrink-0" />
                            </button>

                            {/* Dropdown Options */}
                            {showProfileMenu && (
                                <div
                                    style={{
                                        backgroundColor: '#ffffff',
                                        opacity: 1,
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08)',
                                        border: '1px solid #F1F3F5'
                                    }}
                                    className="absolute top-full mt-3 right-0 w-[340px] rounded-2xl py-4 z-[9999] animate-in fade-in zoom-in-95 duration-100 origin-top-right text-left"
                                >
                                    {/* Arrow Indicator */}
                                    <div
                                        className="absolute -top-[7px] w-3 h-3 rotate-45 bg-white border-t border-l pointer-events-none"
                                        style={{
                                            right: '20px',
                                            borderColor: '#F1F3F5 transparent transparent #F1F3F5'
                                        }}
                                    ></div>

                                    {/* Header section */}
                                    <div className="px-[18px] pb-4.5 border-b border-gray-100 flex flex-col gap-2.5">
                                        <p className="text-sm font-black text-gray-950 truncate flex items-center gap-2">
                                            <span className="text-base">👤</span>
                                            {user?.name || 'Shashwat Dixit'}
                                        </p>
                                        
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-50 text-[#E07A5F] border border-orange-100/60 w-max shadow-sm ml-5">
                                            Customer Account
                                        </span>
                                        
                                        <p className="text-xs text-gray-500 truncate pl-5 font-semibold">
                                            {user?.email || 'shashwatdixit033@gmail.com'}
                                        </p>
                                    </div>

                                    {/* Links section */}
                                    <div className="px-[18px] py-3 flex flex-col gap-2">
                                        <Link
                                            to="/profile"
                                            onClick={() => setShowProfileMenu(false)}
                                            className="flex items-center gap-3 px-[14px] py-[10px] text-xs font-bold text-gray-700 hover:bg-[#FFF7F2] hover:text-[#E67E22] rounded-xl transition-all duration-200"
                                        >
                                            <span className="text-sm">👤</span>
                                            <span>My Profile</span>
                                        </Link>
                                        
                                        <Link
                                            to="/activity"
                                            onClick={() => setShowProfileMenu(false)}
                                            className="flex items-center gap-3 px-[14px] py-[10px] text-xs font-bold text-gray-700 hover:bg-[#FFF7F2] hover:text-[#E67E22] rounded-xl transition-all duration-200"
                                        >
                                            <span className="text-sm">📦</span>
                                            <span>My Activity</span>
                                        </Link>
                                        
                                        <Link
                                            to="/settings"
                                            onClick={() => setShowProfileMenu(false)}
                                            className="flex items-center gap-3 px-[14px] py-[10px] text-xs font-bold text-gray-700 hover:bg-[#FFF7F2] hover:text-[#E67E22] rounded-xl transition-all duration-200"
                                        >
                                            <span className="text-sm">⚙️</span>
                                            <span>Settings</span>
                                        </Link>
                                        
                                        <button
                                            onClick={() => { onSupportClick(); setShowProfileMenu(false); }}
                                            className="w-full text-left flex items-center gap-3 px-[14px] py-[10px] text-xs font-bold text-gray-700 hover:bg-[#FFF7F2] hover:text-[#E67E22] rounded-xl transition-all duration-200 cursor-pointer"
                                        >
                                            <span className="text-sm">❓</span>
                                            <span>Help & Support</span>
                                        </button>
                                    </div>

                                    {/* Logout section */}
                                    <div className="border-t border-gray-100 pt-3 px-[18px]">
                                        <button
                                            onClick={() => { logout(); setShowProfileMenu(false); navigate('/login', { replace: true }); }}
                                            className="w-full text-left flex items-center gap-3 px-[14px] py-[10px] text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 cursor-pointer animate-pulse-slow"
                                        >
                                            <span className="text-sm">🚪</span>
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Row 2: Navigation Links (Height: 40px) */}
                <div className="relative z-10 flex justify-center border-t border-slate-100/60 pt-3 h-10 items-center">
                    <nav className="flex space-x-6 h-full items-center">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.name}
                                to={link.path}
                                className={({ isActive }) => `
                                    relative px-3 py-4 text-xs font-black tracking-wider uppercase transition-colors duration-200 h-full flex items-center
                                    ${isActive ? 'text-[#E07A5F]' : 'text-slate-500 hover:text-[#E07A5F]'}
                                `}
                            >
                                {({ isActive }) => (
                                    <>
                                        <span className="flex items-center">
                                            {link.name}
                                            {link.isNew && (
                                                <span className="ml-1.5 bg-gradient-to-r from-orange-500 to-[#E07A5F] text-white text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded shadow-xs scale-90 select-none">
                                                    NEW
                                                </span>
                                            )}
                                            {link.showCount && (
                                                <span className="ml-1 text-[10px] text-slate-400 font-bold">
                                                    ({interestedCount})
                                                </span>
                                            )}
                                        </span>
                                        {isActive && (
                                            <motion.span
                                                layoutId="activeUnderline"
                                                className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#E07A5F] rounded-full shadow-[0_0_10px_rgba(224,122,95,0.4)]"
                                                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                            />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default CustomerTopBar;
