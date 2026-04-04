import React, { useState } from 'react';
import { Search, MapPin, Bell, Headphones, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../common/NotificationBell';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import { useLocation } from '../../context/LocationContext';
import ShopLensLogo from '../ShopLensLogo';
import { toast } from 'react-hot-toast';

const CustomerTopBar = ({ onSupportClick }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const {
        userLocation,
        locationStatus,
        detectLocation
    } = useLocation();

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showLocationChip, setShowLocationChip] = useState(false);

    const handleLocationClick = async () => {
        // Case 1: No location or Error -> Detect & Redirect
        if (locationStatus === 'IDLE' || locationStatus === 'ERROR' || !userLocation) {
            try {
                // FORCE: Show detecting state for at least 1.5 seconds so user sees pulsing
                const delayPromise = new Promise(resolve => setTimeout(resolve, 1500));

                // Actual Detection
                const detectionPromise = detectLocation();

                await Promise.all([delayPromise, detectionPromise]);

                setShowLocationChip(true); // Show confirmation result

                // Wait 2s to let user read the "Location Detected" popup
                setTimeout(() => {
                    navigate('/address/add');
                    setShowLocationChip(false);
                }, 2000);

            } catch (error) {
                console.error("Location detection failed", error);

                // CRITICAL: Show error to user so they know why it "failed"
                toast.error(error.message || "Location access denied. Please enable GPS.");
            }
        }
        // Case 2: Already has location -> Toggle Chip
        else {
            setShowLocationChip(!showLocationChip);
        }
    };

    const handleChangeLocation = () => {
        // Manual override click
        navigate('/address/add');
        setShowLocationChip(false);
    };

    const navLinks = [
        { name: 'Home', path: '/home' },
        { name: 'Categories', path: '/categories' },
        { name: 'Shops', path: '/shops' },
        { name: 'Services', path: '/services' },
        { name: 'Interested', path: '/interested' },
        { name: 'Bookings', path: '/bookings' },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-[1000] w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">

                    {/* 1. Logo Section */}
                    <Link to="/home" className="flex-shrink-0 flex items-center cursor-pointer group">
                        <ShopLensLogo className="group-hover:scale-105 transition-transform duration-300" />
                    </Link>

                    {/* 2. Search Bar - Center */}
                    <div className="hidden md:flex flex-1 mx-10 max-w-lg">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (!searchQuery.trim()) return;
                                navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                            }}
                            className="relative w-full group"
                        >
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#E07A5F] transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-full leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#E07A5F]/20 focus:border-[#E07A5F] transition-all duration-300 shadow-inner sm:text-sm"
                                placeholder="Search for products, shops..."
                            />
                        </form>
                    </div>

                    {/* 3. Right Actions */}
                    <div className="flex items-center space-x-6">
                        <div className="relative">
                            <button
                                onClick={handleLocationClick}
                                className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300 relative
                                    ${locationStatus === 'READY'
                                        ? 'bg-orange-50 border-orange-200 text-[#E07A5F] shadow-sm'
                                        : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-white hover:border-[#E07A5F] hover:text-[#E07A5F] hover:shadow-md'
                                    }
                                    ${locationStatus === 'DETECTING' ? 'animate-pulse ring-2 ring-orange-100' : ''}
                                `}
                                title={userLocation?.area ? `Current: ${userLocation.area}` : "Click to detect location"}
                            >
                                <MapPin className={`w-5 h-5 transition-transform duration-300 ${locationStatus === 'READY' || locationStatus === 'DETECTING' ? 'scale-110' : 'scale-100 group-hover:scale-110'}`} />

                                {/* Status Indicator Dot */}
                                {locationStatus === 'READY' && (
                                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#81B29A] rounded-full border-2 border-white shadow-sm transform translate-x-1/4 -translate-y-1/4"></span>
                                )}
                            </button>

                            {/* Location Mini-Pop */}
                            {showLocationChip && locationStatus === 'READY' && (
                                <div className="absolute top-12 right-0 w-64 bg-white text-gray-800 rounded-xl shadow-xl border border-gray-100 py-4 px-4 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-orange-50 rounded-full text-[#E07A5F]">
                                            <MapPin size={16} />
                                        </div>
                                        <span className="font-bold truncate text-sm">{userLocation?.city}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mb-4 truncate pl-11">{userLocation?.area}</div>
                                    <button
                                        onClick={handleChangeLocation}
                                        className="w-full bg-gray-900 text-white hover:bg-[#E07A5F] py-2 rounded-lg text-xs font-bold uppercase transition-all shadow-sm"
                                    >
                                        Update Location
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Support Icon (NEW) */}
                        <button
                            onClick={onSupportClick}
                            className="relative group p-2 rounded-full hover:bg-orange-50 transition-colors"
                            title="Help & Support"
                        >
                            <MessageCircle className="w-6 h-6 text-gray-600 group-hover:text-[#E07A5F] transition-colors" />
                            {/* Online Dot */}
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
                        </button>

                        <div className="relative group">
                            <NotificationBell />
                        </div>

                        {/* Profile Dropdown Trigger */}
                        <div className="relative">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#E07A5F] to-[#F2CC8F] flex items-center justify-center text-white font-bold shadow-lg cursor-pointer transform hover:ring-4 hover:ring-[#E07A5F]/10 transition-all overflow-hidden"
                            >
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                                )}
                            </button>

                            {/* Profile Menu Dropdown (Re-integrated) */}
                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                    <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                        <p className="text-sm font-bold text-gray-800 truncate">{user?.name || 'User'}</p>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                                    </div>
                                    <div className="py-2">
                                        <Link to="/profile" onClick={() => setShowProfileMenu(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#E07A5F]">My Profile</Link>
                                        <Link to="/activity" onClick={() => setShowProfileMenu(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#E07A5F]">My Activity</Link>
                                        <Link to="/settings" onClick={() => setShowProfileMenu(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#E07A5F]">Settings</Link>
                                    </div>
                                    <div className="border-t border-gray-50 pt-2 pb-1">
                                        <button onClick={() => { logout(); setShowProfileMenu(false); navigate('/login', { replace: true }); }} className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 font-medium">Logout</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. Navigation Bar - Integrated */}
                <div className="hidden md:flex justify-center space-x-8 pb-3">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.name}
                            to={link.path}
                            className={({ isActive }) => `
                                relative px-3 py-2 text-sm font-medium transition-colors duration-200
                                ${isActive ? 'text-[#E07A5F]' : 'text-gray-600 hover:text-[#E07A5F]'}
                            `}
                        >
                            {({ isActive }) => (
                                <>
                                    {link.name}
                                    {isActive && (
                                        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E07A5F] rounded-full shadow-[0_0_10px_rgba(224,122,95,0.5)] animate-in fade-in duration-300" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </div>
        </header>
    );
};

export default CustomerTopBar;
