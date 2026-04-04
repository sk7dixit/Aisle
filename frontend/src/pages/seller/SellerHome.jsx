import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaStore, FaClipboardList, FaUsers, FaBoxOpen, FaEdit, FaPowerOff, FaPlus, FaHistory, FaTag, FaHeadset, FaInbox, FaUser, FaCog, FaLock, FaMapMarkerAlt, FaExclamationCircle, FaStar, FaCreditCard, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import { io } from 'socket.io-client';
import { Link } from 'react-router-dom';
import QRScannerModal from '../../components/seller/QRScannerModal';
// Removed VisitConfirmModal import
// Removed VisitConfirmModal import
import PaymentSetupModal from '../../components/seller/PaymentSetupModal';
import { useSupport } from '../../context/SupportContext';
import { useNotifications } from '../../context/NotificationContext';
import ShopLensLogo from '../../components/ShopLensLogo';

const SellerHome = () => {
    const { user, token, checkUserStatus } = useAuth();
    const { openSupport } = useSupport();
    const { unreadCount, openNotification, refreshData } = useNotifications(); // Use global hooks

    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const [stats, setStats] = useState({
        leadsToday: 0,
        pendingLeadsCount: 0,
        expectedVisits: 0,
        derivedStatus: 'CLOSED',
        isManualOverride: false,
        operatingMode: 'GUARANTEED', // Default
        openingTime: '09:00',
        closingTime: '20:00',
        isVisible: false,
        ordersToday: 0,
        salesToday: 0,
        upcomingVisitsCount: 0,
        activeDisputes: 0 // Ensure default
    });
    const [loading, setLoading] = useState(true);
    const [topProducts, setTopProducts] = useState([]);
    const [isTopProductsLocked, setIsTopProductsLocked] = useState(false);
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [tempTime, setTempTime] = useState({ open: '', close: '' });

    // QR & Visit State
    // QR & Visit State
    const [showScanner, setShowScanner] = useState(false);


    // Location Setting State
    const [settingLocation, setSettingLocation] = useState(false);
    const [isEditingLocation, setIsEditingLocation] = useState(false);
    const [tempAddress, setTempAddress] = useState(user?.shopDetails?.address || '');

    // SOCKET.IO REAL-TIME CONNECTION
    useEffect(() => {
        if (!user?._id) return;

        const socket = io(); // Connects to same host/port, proxied by Vite

        // Join Seller Room
        socket.emit("seller:join", user._id);

        // Listen for new notifications
        socket.on("notification:new", (newNotif) => {
            console.log("🔔 Live Update:", newNotif);
            refreshData(); // Refresh global context
            fetchStats(); // Update dashboard stats instantly on notification
        });

        return () => {
            socket.disconnect();
        };
    }, [user, refreshData]);

    // Fetch Dashboard Stats
    const fetchStats = async () => {
        try {
            const res = await fetch('/api/seller/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                console.error(`Dashboard Fetch Error: ${res.status} ${res.statusText}`);
                const text = await res.text();
                console.log("Error body:", text.slice(0, 100));
                return;
            }

            let data;
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                try {
                    data = await res.json();
                } catch (e) {
                    console.error("Dashboard JSON parse error:", e);
                    return;
                }
            } else {
                console.error("Dashboard received non-JSON response");
                return;
            }

            if (res.ok) {
                setStats(data);
                setTempTime({ open: data.openingTime, close: data.closingTime });
            } else if (res.status === 401) {
                console.warn("Unauthorized dashboard fetch");
            } else {
                console.error("Dashboard Error:", data.message);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        extractCityIfNeeded();
        fetchTopProducts();
        if (user?.shopDetails?.address) {
            setTempAddress(user.shopDetails.address);
        }

        // Real-time Status Polling (Every 60s)
        const statusInterval = setInterval(() => {
            // Re-fetch to update Open/Closed status based on server time
            fetchStats();
        }, 60000);

        return () => clearInterval(statusInterval);
    }, [user]);

    // Set / Update Location
    const handleSetLocation = async (useGeolocation = false) => {
        if (useGeolocation && !navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setSettingLocation(true);

        const updateData = async (lat, lng, address) => {
            try {
                const res = await fetch('/api/seller/set-location', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ lat, lng, address })
                });

                if (res.ok) {
                    await checkUserStatus(); // Refresh global user context
                    await fetchStats();      // Refresh local stats
                    setIsEditingLocation(false);
                } else {
                    const data = await res.json();
                    alert(data.message || 'Failed to update location');
                }
            } catch (error) {
                console.error('Location update error:', error);
                alert('Failed to update location');
            } finally {
                setSettingLocation(false);
            }
        };

        if (useGeolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    await updateData(latitude, longitude, tempAddress);
                },
                (error) => {
                    setSettingLocation(false);
                    alert('Unable to get your location. Please enable location access.');
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            // Manual Address Update (keep existing coordinates if available)
            const coords = user?.shopDetails?.shopLocation?.coordinates || [0, 0];
            await updateData(coords[1], coords[0], tempAddress);
        }
    };

    // Extract city from address if not already set
    const extractCityIfNeeded = async () => {
        try {
            const res = await fetch('/api/seller/extract-city', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                console.log('🏙️ City:', data.city);
            }
        } catch (error) {
            console.error('City extraction failed', error);
        }
    };

    // Fetch Top Products
    const fetchTopProducts = async () => {
        try {
            console.log('🔍 Fetching top products...');
            const res = await fetch('/api/seller/top-products', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('📡 Top Products Response Status:', res.status);

            if (res.ok) {
                const data = await res.json();
                console.log('✅ Top Products Data:', data);
                setTopProducts(data);
                setIsTopProductsLocked(false);
            } else if (res.status === 403) {
                setIsTopProductsLocked(true);
            } else {
                try {
                    const error = await res.json();
                    console.error('❌ Top Products Error:', error);
                } catch (e) {
                    console.error('❌ Top Products Error (Parse Failed):', e);
                }
            }
        } catch (error) {
            console.error('❌ Failed to fetch top products', error);
        }
    };

    // Toggle Operating Mode (New Step 1)
    const toggleOperatingMode = async (mode) => {
        try {
            // Optimistic update
            setStats(prev => ({ ...prev, operatingMode: mode }));

            const res = await fetch('/api/seller/operating-mode', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ mode })
            });

            if (res.ok) {
                const data = await res.json();
                setStats(prev => ({
                    ...prev,
                    operatingMode: data.operatingMode
                }));
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to update mode');
                fetchStats(); // Revert
            }

        } catch (error) {
            console.error("Failed to update operating mode", error);
            fetchStats(); // Revert
        }
    };

    // Toggle Manual Status
    const toggleStatus = async () => {
        const newStatus = !stats.isVisible; // Toggle intent
        try {
            const res = await fetch('/api/seller/visibility', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isVisible: newStatus })
            });

            if (res.status === 401) {
                alert("Session expired or unauthorized. Please log in again.");
                return;
            }

            let data;
            try {
                data = await res.json();
            } catch (e) {
                data = { message: "Failed to parse response" };
            }

            if (res.ok) {
                setStats(prev => ({
                    ...prev,
                    isVisible: data.isVisible,
                    derivedStatus: data.derivedStatus,
                    controlledBy: data.controlledBy,
                    isManualOverride: data.isManualOverride
                }));
            } else {
                console.error("Toggle API Error:", data.message);
                alert(`Failed to update status: ${data.message}`);
            }
        } catch (error) {
            console.error("Failed to toggle status", error);
            alert("Network error. Check console.");
        }
    };

    // Reset Manual Status
    const resetStatus = async () => {
        try {
            const res = await fetch('/api/seller/reset-status', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401) {
                alert("Session expired. Please log in again.");
                return;
            }

            let data;
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                try {
                    data = await res.json();
                } catch (e) {
                    data = { message: "Failed to parse response" };
                }
            } else {
                data = { message: `Server error (${res.status})` };
            }
            if (res.ok) {
                setStats(prev => ({
                    ...prev,
                    derivedStatus: data.derivedStatus,
                    isManualOverride: data.isManualOverride,
                    controlledBy: data.controlledBy,
                    isVisible: data.derivedStatus === 'ONLINE'
                }));
            } else {
                console.error("Reset API Error:", data.message);
                alert(`Failed to reset: ${data.message}`);
            }
        } catch (error) {
            console.error("Failed to reset status", error);
        }
    };

    // Save Schedule
    const saveSchedule = async () => {
        try {
            const res = await fetch('/api/seller/schedule', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ openingTime: tempTime.open, closingTime: tempTime.close })
            });
            let data;
            try {
                data = await res.json();
            } catch (e) {
                data = { message: "Failed to parse response" };
            }
            if (res.ok) {
                setStats(prev => ({
                    ...prev,
                    openingTime: data.openingTime,
                    closingTime: data.closingTime,
                    derivedStatus: data.derivedStatus // Schedule change might affect status
                }));
                setIsEditingTime(false);
            }
        } catch (error) {
            console.error("Update schedule failed", error);
            alert("Failed to save schedule. Check console/logs.");
        }
    };

    // Scan Logic
    const handleScanSuccess = (decodedText) => {
        console.log("Scanned:", decodedText);
        setShowScanner(false);
        alert(`Scanned Code: ${decodedText}`);
    };


    // ... (keep existing handleScanSuccess logic but replace alerts)


    if (loading) return <div className="p-8 text-center text-slate-400">Loading dashboard...</div>;

    const isOpen = stats.derivedStatus === 'ONLINE' || stats.derivedStatus === 'OPEN';
    const statusColor = isOpen ? 'emerald' : 'slate';

    return (
        <div className="space-y-8 animate-fade-in-up pb-20">
            {/* 1️⃣ GREETING + DATE (UNCHANGED) */}
            <div className="flex flex-col mb-2">
                <div className="flex items-center gap-2 mb-2 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                    <span className="px-3 py-1 text-xs font-medium bg-white border border-gray-200 rounded-full text-slate-500 shadow-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                        <span className="text-slate-300">•</span>
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-2">
                        {(new Date().getHours() < 12 ? "Good Morning" : new Date().getHours() < 18 ? "Good Afternoon" : "Good Evening")}, {user.name?.split(' ')[0]}
                        <span className="inline-block ml-2 origin-bottom-right animate-wave cursor-default hover:animate-wave-fast">👋</span>
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight">
                        Here's what's happening at <span className="text-[#78350F] font-bold bg-[#78350F]/5 px-2 py-0.5 rounded-lg border border-[#78350F]/10">{user.shopDetails?.shopName}</span> today.
                    </p>
                </div>
            </div>

            {/* 2️⃣ SECTION 2 — PAYMENT SETUP PROMPT (TOP PRIORITY) - Slim strip */}
            {!user?.shopDetails?.paymentSetupCompleted && (
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in-up">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                            <FaCreditCard size={14} />
                        </div>
                        <div>
                            <h3 className="font-bold text-xs text-blue-900">Set up how customers pay you</h3>
                            <p className="text-[10px] text-blue-700/80">Choose your preferred payment method to start receiving online payments.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowPaymentModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-md shadow-blue-500/20 whitespace-nowrap w-full md:w-auto text-center"
                    >
                        Set Payment Preference
                    </button>
                </div>
            )}

            {/* 3️⃣ SECTION 3 — SHOP OPERATING MODE (PRIMARY CONTROL) */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-black text-slate-800">Shop Operating Mode</h2>
                        <p className="text-xs text-slate-500 font-medium">Control how orders are accepted based on your current rush.</p>
                    </div>
                    {stats.operatingMode === 'RUSH' && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-black uppercase rounded-lg tracking-wider animate-pulse">
                            Rush Mode Active
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Guaranteed Mode */}
                    <button
                        onClick={() => toggleOperatingMode('GUARANTEED')}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all ${stats.operatingMode === 'GUARANTEED'
                            ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500 ring-offset-2'
                            : 'border-slate-100 hover:border-emerald-200 hover:bg-slate-50'
                            }`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${stats.operatingMode === 'GUARANTEED' ? 'border-emerald-500' : 'border-slate-300'}`}>
                                {stats.operatingMode === 'GUARANTEED' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                            </div>
                            <span className={`font-bold text-sm ${stats.operatingMode === 'GUARANTEED' ? 'text-emerald-800' : 'text-slate-600'}`}>Guaranteed</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                            Auto-accept is <span className="font-bold text-emerald-600">ON</span>. Best for normal hours.
                        </p>
                    </button>

                    {/* Best-Effort Mode */}
                    <button
                        onClick={() => toggleOperatingMode('BEST_EFFORT')}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all ${stats.operatingMode === 'BEST_EFFORT'
                            ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-400 ring-offset-2'
                            : 'border-slate-100 hover:border-amber-200 hover:bg-slate-50'
                            }`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${stats.operatingMode === 'BEST_EFFORT' ? 'border-amber-500' : 'border-slate-300'}`}>
                                {stats.operatingMode === 'BEST_EFFORT' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                            </div>
                            <span className={`font-bold text-sm ${stats.operatingMode === 'BEST_EFFORT' ? 'text-amber-800' : 'text-slate-600'}`}>Best-Effort</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                            Auto-accept <span className="font-bold text-amber-600">OFF</span>. Orders need approval.
                        </p>
                    </button>

                    {/* Rush Mode */}
                    <button
                        onClick={() => toggleOperatingMode('RUSH')}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all ${stats.operatingMode === 'RUSH'
                            ? 'border-red-500 bg-red-50/50 ring-1 ring-red-500 ring-offset-2'
                            : 'border-slate-100 hover:border-red-200 hover:bg-slate-50'
                            }`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${stats.operatingMode === 'RUSH' ? 'border-red-500' : 'border-slate-300'}`}>
                                {stats.operatingMode === 'RUSH' && <div className="w-2 h-2 rounded-full bg-red-500" />}
                            </div>
                            <span className={`font-bold text-sm ${stats.operatingMode === 'RUSH' ? 'text-red-800' : 'text-slate-600'}`}>Rush Mode</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                            Auto-accept <span className="font-bold text-red-600">LOCKED OFF</span>. Customers warned of delays.
                        </p>
                    </button>
                </div>
            </div>

            {/* 4️⃣ SECTION 4 — SHOP VISIBILITY / LOCATION STATUS */}
            {!user?.shopDetails?.shopLocation?.coordinates ? (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-4 text-amber-800 shadow-sm animate-fade-in-up">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-xl">
                        <FaMapMarkerAlt />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-sm leading-tight">Shop Location Not Set</p>
                        <p className="text-xs opacity-80">Your shop will not be visible to nearby customers until you set a fixed location.</p>
                    </div>
                    <button
                        onClick={async () => {
                            if (!navigator.geolocation) {
                                alert('Geolocation is not supported by your browser');
                                return;
                            }

                            setSettingLocation(true);
                            navigator.geolocation.getCurrentPosition(
                                async (position) => {
                                    const { latitude, longitude } = position.coords;
                                    try {
                                        const res = await fetch('/api/seller/set-location', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify({
                                                lat: latitude,
                                                lng: longitude,
                                                address: user?.shopDetails?.address || 'Shop Address'
                                            })
                                        });
                                        if (res.ok) {
                                            const data = await res.json();
                                            // Refresh user profile to update location in UI
                                            await checkUserStatus();
                                            await fetchStats(); // Also refresh stats
                                        } else {
                                            const data = await res.json();
                                            alert(data.message || 'Failed to set location');
                                        }
                                    } catch (error) {
                                        console.error('Location set error:', error);
                                        alert('Failed to set location');
                                    } finally {
                                        setSettingLocation(false);
                                    }
                                },
                                (error) => {
                                    setSettingLocation(false);
                                    alert('Unable to get your location. Please enable location access.');
                                },
                                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                            );
                        }}
                        disabled={settingLocation}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors disabled:opacity-50"
                    >
                        {settingLocation ? 'Setting...' : 'Set Location'}
                    </button>
                </div>
            ) : (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-4 text-emerald-800 shadow-sm animate-fade-in-up">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-xl">
                        <FaMapMarkerAlt />
                    </div>
                    <div className="flex-1 min-w-0">
                        {!isEditingLocation ? (
                            <div className="flex items-center gap-2">
                                <FaMapMarkerAlt className="text-emerald-600 flex-shrink-0" size={14} />
                                <p className="text-sm font-bold text-emerald-900 truncate">
                                    {user.shopDetails.shopLocation.address || user.shopDetails.address || `${user.shopDetails.shopLocation.coordinates[1].toFixed(6)}, ${user.shopDetails.shopLocation.coordinates[0].toFixed(6)}`}
                                </p>
                                <button
                                    onClick={() => {
                                        setTempAddress(user.shopDetails.shopLocation.address || user.shopDetails.address || '');
                                        setIsEditingLocation(true);
                                    }}
                                    className="ml-auto text-emerald-600 hover:text-emerald-700 p-2 hover:bg-emerald-100 rounded-lg transition-colors flex-shrink-0"
                                    title="Edit location"
                                >
                                    <FaEdit size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3 animate-fade-in">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={tempAddress}
                                        onChange={(e) => setTempAddress(e.target.value)}
                                        className="flex-1 bg-white border border-emerald-200 rounded-xl px-3 py-2 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                                        placeholder="Enter full shop address..."
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => handleSetLocation(true)}
                                        disabled={settingLocation}
                                        className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-200 transition-all flex items-center gap-1.5 whitespace-nowrap"
                                        title="Auto-fetch GPS coordinates"
                                    >
                                        <FaMapMarkerAlt /> {settingLocation ? 'Locating...' : 'Update GPS'}
                                    </button>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setIsEditingLocation(false)}
                                        className="text-xs font-bold text-slate-400 hover:text-slate-600 px-3 py-1.5"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleSetLocation(false)}
                                        disabled={settingLocation}
                                        className="bg-emerald-600 text-white px-5 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all"
                                    >
                                        {settingLocation ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        )}
                        {!isEditingLocation && <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-tight">Your shop is visible to nearby customers</p>}
                    </div>
                </div>
            )}

            {/* (Optional) Start Today Reminder - Keeping it logically after Visibility */}
            {isOpen && user?.shopDetails?.shopType === 'GROCERY_KIRANA' &&
                (!user?.shopDetails?.lastOpeningStockSetAt || new Date(user.shopDetails.lastOpeningStockSetAt).toDateString() !== new Date().toDateString()) &&
                user?.shopDetails?.operatingMode !== 'RUSH' && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-4 text-amber-900 shadow-sm animate-fade-in-up">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-xl text-amber-600 flex-shrink-0">
                            <FaClipboardList />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-sm">Confirm Today's Stock</p>
                            <p className="text-xs opacity-80">Reset your baseline to ensure accurate customer availability.</p>
                        </div>
                        <Link to="/seller/inventory" className="bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors shadow-sm whitespace-nowrap">
                            Start Today
                        </Link>
                    </div>
                )}

            {/* 5️⃣ SECTION 5 — CORE DASHBOARD METRICS (ONE ROW) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
                {/* 1️⃣ Shop Status (Open / Closed) */}
                <div className={`p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-48 transition-all relative overflow-hidden group
                    ${isOpen ? 'bg-gradient-to-br from-white to-emerald-50/50' : 'bg-white'}
                `}>
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2 pointer-events-none
                        ${isOpen ? 'bg-emerald-400' : 'bg-slate-400'}
                     `}></div>

                    <div className="flex justify-between items-start relative z-10">
                        <div className={`p-2.5 rounded-xl ${isOpen ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                            <FaStore className="text-lg" />
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-2
                            ${isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}
                        `}>
                            <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                            {stats.derivedStatus}
                        </div>
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Shop Status</h3>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${stats.controlledBy === 'MANUAL' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                    {stats.controlledBy || 'AUTO'}
                                </span>
                            </div>
                            {stats.controlledBy === 'MANUAL' && (
                                <button onClick={resetStatus} className="text-[10px] font-bold text-blue-600 hover:underline">Resume Auto</button>
                            )}
                        </div>

                        {!isEditingTime ? (
                            <div className="flex items-center justify-between">
                                <p className="text-xl font-black text-slate-800 tracking-tight">
                                    {isOpen ? 'Open Now' : 'Closed'}
                                </p>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                    {stats.openingTime} - {stats.closingTime}
                                    <button onClick={() => setIsEditingTime(true)} className="hover:text-amber-600"><FaEdit size={10} /></button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white/80 backdrop-blur-sm p-2 rounded-xl border border-slate-200 text-[10px]">
                                <div className="flex gap-1 mb-1">
                                    <input type="time" value={tempTime.open} onChange={e => setTempTime({ ...tempTime, open: e.target.value })} className="bg-slate-50 border rounded p-0.5 w-full" />
                                    <input type="time" value={tempTime.close} onChange={e => setTempTime({ ...tempTime, close: e.target.value })} className="bg-slate-50 border rounded p-0.5 w-full" />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setIsEditingTime(false)} className="text-slate-400">Cancel</button>
                                    <button onClick={saveSchedule} className="text-emerald-600 font-bold">Save</button>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={toggleStatus}
                            className={`w-full mt-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 border transition-all
                                ${isOpen ? 'bg-white border-red-100 text-red-600 hover:bg-red-50' : 'bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600'}
                            `}
                        >
                            <FaPowerOff size={10} /> {isOpen ? 'Force Close' : 'Force Open'}
                        </button>
                    </div>
                </div>

                {/* 2️⃣ Today's Sales */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-48 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="flex justify-between items-start relative z-10">
                        <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
                            <FaBoxOpen className="text-lg" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Live Pulse</span>
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Today's Sales</h3>
                        <p className={`text-4xl font-black tracking-tight ${stats.salesToday > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                            ₹{stats.salesToday || 0}
                        </p>
                        <p className="text-[11px] font-bold text-slate-400 mt-3 flex items-center gap-2">
                            <span className={stats.ordersToday > 0 ? "text-slate-900" : ""}>{stats.ordersToday || 0} orders today</span>
                        </p>
                    </div>
                </div>

                {/* 3️⃣ Scheduled Visits */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-48 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="flex items-center justify-between relative z-10">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                            <FaUsers className="text-lg" />
                        </div>
                        <Link to="/seller/visits" className="text-xs font-black uppercase text-blue-600 hover:underline">View All</Link>
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Scheduled Visits</h3>
                        <p className={`text-4xl font-black tracking-tight ${stats.upcomingVisitsCount > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                            {stats.upcomingVisitsCount || 0}
                        </p>
                        <p className="text-[11px] font-bold text-slate-400 mt-2">
                            Customer(s) expected today
                        </p>
                    </div>

                    <div className="relative z-10 pt-2">
                        <button
                            onClick={() => setShowScanner(true)}
                            className="w-full py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <FaClipboardList size={12} /> Scan QR
                        </button>
                    </div>
                </div>
            </div>

            {/* 6️⃣ SECTION 6 — QUICK ACTIONS (SECONDARY) */}
            <div className="grid grid-cols-3 md:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <Link to="/seller/products" className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-2 hover:border-emerald-200 hover:shadow-md transition-all group cursor-pointer h-24">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <FaPlus className="text-sm" />
                    </div>
                    <span className="text-slate-600 font-bold text-xs">Add Product</span>
                </Link>

                <Link to="/seller/history" className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-2 hover:border-blue-200 hover:shadow-md transition-all group cursor-pointer h-24">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <FaHistory className="text-sm" />
                    </div>
                    <span className="text-slate-600 font-bold text-xs">History</span>
                </Link>

                <Link to="/seller/offers" className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-2 hover:border-purple-200 hover:shadow-md transition-all group cursor-pointer h-24">
                    <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                        <FaTag className="text-sm" />
                    </div>
                    <span className="text-slate-600 font-bold text-xs">Offer</span>
                </Link>
            </div>

            {/* Top Selling Products (Market Insights) — Moved to bottom */}

            {/* QR Scanner Modal */}
            {showScanner && (
                <QRScannerModal
                    onClose={() => setShowScanner(false)}
                    onScanSuccess={handleScanSuccess}
                />
            )}

            {(topProducts.length > 0 || isTopProductsLocked) && (
                <div className="mt-8">
                    <div className="mb-4">
                        <h2 className="text-lg font-black text-slate-800">Top Selling Products Near You</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Based on quantity sold by similar shops in your city this month
                        </p>
                    </div>

                    {isTopProductsLocked ? (
                        <div className="relative bg-white rounded-3xl shadow-sm border border-slate-100 p-6 text-center overflow-hidden">
                            {/* Blurred Background Mockup */}
                            <div className="absolute inset-0 bg-white/60 z-10 backdrop-blur-[2px]"></div>
                            <div className="absolute inset-0 opacity-20 filter blur-sm pointer-events-none">
                                <div className="p-4 flex items-center gap-4 border-b border-slate-50">
                                    <div className="w-16 h-16 bg-slate-200 rounded-xl"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                        <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                                    </div>
                                </div>
                                <div className="p-4 flex items-center gap-4">
                                    <div className="w-16 h-16 bg-slate-200 rounded-xl"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                        <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-20 flex flex-col items-center">
                                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4">
                                    <FaLock className="text-2xl" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2">Unlock Market Insights</h3>
                                <p className="text-slate-500 max-w-md mx-auto mb-6">
                                    See exactly what's selling best in your city. Get the competitive edge with the Pro Plan.
                                </p>
                                <Link to="/seller/subscription" className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all">
                                    Upgrade to Pro
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 divide-y divide-slate-50 overflow-hidden">
                            {topProducts.map((product) => (
                                <div key={product.productId} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                    {/* Product Image */}
                                    <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <FaBoxOpen />
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-800 truncate">{product.name}</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Sold {product.totalQuantitySold} units this month
                                        </p>
                                    </div>

                                    {/* Status / CTA */}
                                    <div className="flex-shrink-0">
                                        {product.status === 'in_shop' ? (
                                            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-2 rounded-lg">
                                                In your shop
                                            </span>
                                        ) : (
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-blue-600 mb-1">Trending near you</p>
                                                <Link
                                                    to={`/seller/inventory?add=${product.productId}`}
                                                    className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors inline-block"
                                                >
                                                    Add to shop
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            )}

            {/* Modals - Moved outside conditional block to ensure they always work */}

            {/* SCAN RESULT MODAL */}




            <PaymentSetupModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onRefresh={() => {
                    checkUserStatus(); // Update user object flags
                    fetchStats();      // Update dashboard stats
                }}
            />
        </div>
    );
};

export default SellerHome;
