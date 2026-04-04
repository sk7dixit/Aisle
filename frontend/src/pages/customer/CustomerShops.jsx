import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaMapMarkerAlt, FaMap, FaList, FaLeaf, FaMapPin, FaBullseye } from 'react-icons/fa';
import { detectUserLocation } from '../../services/locationService';
import { getShopsByCity, fetchNearbyShops } from '../../services/shopService';
import { calculateDistance } from '../../utils/distance';
import { filterByRadius } from '../../utils/filterByRadius';
import { DEFAULT_RADIUS_KM } from '../../constants/location';
import ShopCard from '../../components/customer/ShopCard';
import LocationModal from '../../components/customer/LocationModal';
import RadiusSelector from '../../components/customer/RadiusSelector';
import { clearCacheByPrefix } from '../../utils/cache';
import { SHOPS_CACHE_PREFIX } from '../../constants/cacheKeys';

const CATEGORIES = [
    { id: 'GROCERY_KIRANA', label: 'Grocery / Kirana' },
    { id: 'ELECTRICAL_HARDWARE_AUTO', label: 'Electronics & Tools' },
    { id: 'TECH_ACCESSORIES', label: 'Tech & Accessories' },
    { id: 'STUDENT_OFFICE', label: 'Student & Office' },
    { id: 'HOME_LIFESTYLE', label: 'Home & Lifestyle' },
    { id: 'PHARMACY', label: 'Pharmacy' },
    { id: 'HOME_BUSINESS', label: 'Home Businesses' },
    { id: 'SEASONAL_FESTIVE', label: 'Seasonal / Festive Store' },
    { id: 'SERVICES', label: 'Services' },
];

const CustomerShops = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();

    // State
    const [shops, setShops] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [isNearestSort, setIsNearestSort] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [currentCity, setCurrentCity] = useState(user?.customerLocation?.city || localStorage.getItem('userCity') || "Vadodara");
    const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);

    // Initial Filter from URL
    useEffect(() => {
        const urlFilter = searchParams.get('filter');
        if (urlFilter) setSelectedCategories([urlFilter]);
    }, [searchParams]);

    // Context - City Scope
    const isLocationSet = !!currentCity;

    useEffect(() => {
        const fetchShopsData = async () => {
            setLoading(true);
            try {
                // 1. Detect location (auto)
                const location = await detectUserLocation();
                const cityName = location.city;
                setCurrentCity(cityName);
                localStorage.setItem('userCity', cityName);

                // 2. Fetch shops nearby strictly if we have lat/lng
                if (location.lat && location.lng) {
                    const data = await fetchNearbyShops(location.lat, location.lng, radiusKm);
                    setShops(data);
                } else {
                    // Fallback to city-based if no GPS
                    const data = await getShopsByCity(cityName);
                    setShops(data);
                }
            } catch (error) {
                console.error("Discovery fetch failed", error);
                if (currentCity) {
                    try {
                        const data = await getShopsByCity(currentCity);
                        setShops(data);
                    } catch (innerError) {
                        setShops([]);
                    }
                }
            } finally {
                setLoading(false);
            }
        };
        fetchShopsData();
    }, [radiusKm, currentCity]);

    const handleManualLocation = async (cityName) => {
        setLoading(true);
        setCurrentCity(cityName);
        localStorage.setItem('userCity', cityName);
        setRadiusKm(DEFAULT_RADIUS_KM);
        clearCacheByPrefix(SHOPS_CACHE_PREFIX);

        try {
            const data = await getShopsByCity(cityName);
            setShops(data);
        } catch (error) {
            setShops([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleCategory = (catId) => {
        if (catId === 'ALL') {
            setSelectedCategories([]);
            return;
        }
        setSelectedCategories(prev =>
            prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
        );
    };

    // --- REAL-TIME STATUS UPDATE (Step 4) ---
    useEffect(() => {
        import('../../utils/socket').then(({ socket }) => {
            if (!socket.connected) socket.connect();

            const handleStatusUpdate = (payload) => {
                console.log(`[Socket] Shop Status Update: ${payload.shopId} -> ${payload.status}`);
                setShops(prevShops => prevShops.map(shop => {
                    if (shop._id === payload.shopId) {
                        return {
                            ...shop,
                            isOpen: payload.isOpen,
                            operatingMode: payload.status === 'ONLINE' ? 'NORMAL' : 'CLOSED' // Simple mapping
                        };
                    }
                    return shop;
                }));
            };

            socket.on('shop:status', handleStatusUpdate);

            return () => {
                socket.off('shop:status', handleStatusUpdate);
            };
        });
    }, []);

    // --- SORTING LOGIC (SMART TRUST ORDER) ---
    const getSmartScore = (shop) => {
        const distMeters = shop.distanceMeters || (parseFloat(shop.distanceKm) * 1000) || 5000;

        // 1. Distance Weight (Closer -> Higher)
        const distanceScore = Math.max(0, 100 - (distMeters / 100));

        // 2. Subscription Weight
        const subScore = shop.planId === 'pro' ? 30 : (shop.planId === 'growth' ? 15 : 0);

        // 3. Trust weight
        const trustScore = (shop.confidence || 50) / 5;

        return distanceScore + subScore + trustScore;
    };

    // --- FILTERING & SORTING EXECUTION ---
    const displayShops = shops
        .filter(shop => {
            if (selectedCategories.length === 0) return true;
            return selectedCategories.some(catId => {
                const shopCat = (shop.category || '').toUpperCase();
                return shopCat === catId || (catId === 'GROCERY_KIRANA' && shopCat.includes('GROCERY'));
            });
        })
        .sort((a, b) => {
            if (isNearestSort) {
                const distA = a.distanceMeters || (parseFloat(a.distanceKm) * 1000) || 99999;
                const distB = b.distanceMeters || (parseFloat(b.distanceKm) * 1000) || 99999;
                return distA - distB;
            }
            return getSmartScore(b) - getSmartScore(a);
        });

    if (!isLocationSet) {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-in fade-in zoom-in-95 duration-300 min-h-[60vh]">
                <div className="w-24 h-24 bg-black/5 rounded-[40px] flex items-center justify-center mb-8 text-[var(--accent-terracotta)] shadow-inner border border-black/5">
                    <FaMapPin className="text-4xl opacity-30" />
                </div>
                <h2 className="text-2xl font-black text-[var(--text-primary)] mb-3">CITY NOT SET</h2>
                <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest mb-10 opacity-60">Set your location to see local shops nearby.</p>
                <button
                    onClick={() => setShowLocationModal(true)}
                    className="px-10 py-4 bg-[var(--accent-terracotta)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-xl active:scale-95"
                >
                    Set Location
                </button>
            </div>
        );
    }

    return (
        <div className="shops-page-container">
            <div className="shops-page max-w-[1280px] mx-auto px-6 py-6 md:px-[24px] pb-[60px]">

                {/* 1. TOP HEADER: Spread Layout */}
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                    <h1 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em]">
                        {loading ? 'Finding shops...' : `SHOPS IN ${currentCity?.split(' ')[0]?.split(',')[0]?.toUpperCase() || 'YOUR AREA'}`}
                    </h1>

                    <div className="flex items-center">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={isNearestSort}
                                    onChange={() => setIsNearestSort(!isNearestSort)}
                                />
                                <div className={`w-9 h-5 rounded-full transition-colors ${isNearestSort ? 'bg-[#E07A5F]' : 'bg-slate-200'}`}></div>
                                <div className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isNearestSort ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-900 transition-colors">
                                Nearest from me
                            </span>
                        </label>
                    </div>
                </div>

                {/* 2. MAIN LAYOUT: 75 / 25 SPLIT */}
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* LEFT PANEL: SHOP LIST (75%) */}
                    <div className="flex-1 lg:w-[75%]">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[18px]">
                            {loading ? (
                                Array(6).fill(0).map((_, i) => (
                                    <div key={i} className="h-[128px] bg-slate-50 rounded-2xl animate-pulse border border-slate-100"></div>
                                ))
                            ) : displayShops.map(shop => (
                                <ShopCard
                                    key={shop._id}
                                    {...shop}
                                    location={shop.address || currentCity}
                                    image={shop.shopImage}
                                />
                            ))}
                        </div>

                        {!loading && displayShops.length === 0 && (
                            <div className="text-center py-20 bg-white/40 rounded-[32px] border border-dashed border-slate-200">
                                <FaBullseye className="text-4xl text-slate-200 mx-auto mb-4" />
                                <h3 className="text-lg font-black text-slate-900 mb-1 uppercase tracking-tight">No shops found</h3>
                                <p className="text-sm text-slate-500 font-medium">Try adjusting your filters or search radius.</p>
                                <button
                                    onClick={() => setSelectedCategories([])}
                                    className="mt-6 text-[10px] font-black text-[#E07A5F] uppercase tracking-[0.2em] hover:underline"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>

                    {/* RIGHT PANEL: STICKY FILTERS (25%) */}
                    <div className="lg:w-[25%] shrink-0">
                        <div className="shop-filter-panel sticky top-[96px] bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
                                Shop Types
                            </h3>

                            <div className="space-y-[22px]">
                                {/* ALL SHOPS OPTION */}
                                <label className="flex items-center gap-4 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded-[6px] border-2 transition-all flex items-center justify-center ${selectedCategories.length === 0
                                        ? 'bg-[#E07A5F] border-[#E07A5F]'
                                        : 'bg-white border-slate-200 group-hover:border-slate-300'
                                        }`}>
                                        {selectedCategories.length === 0 && (
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={selectedCategories.length === 0}
                                        onChange={() => toggleCategory('ALL')}
                                    />
                                    <span className={`text-[13px] font-bold transition-colors ${selectedCategories.length === 0 ? 'text-slate-900' : 'text-slate-500'}`}>
                                        All Shops
                                    </span>
                                </label>

                                {CATEGORIES.map(cat => (
                                    <label key={cat.id} className="flex items-center gap-4 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded-[6px] border-2 transition-all flex items-center justify-center ${selectedCategories.includes(cat.id)
                                            ? 'bg-[#E07A5F] border-[#E07A5F]'
                                            : 'bg-white border-slate-200 group-hover:border-slate-300'
                                            }`}>
                                            {selectedCategories.includes(cat.id) && (
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={selectedCategories.includes(cat.id)}
                                            onChange={() => toggleCategory(cat.id)}
                                        />
                                        <span className={`text-[13px] font-bold transition-colors ${selectedCategories.includes(cat.id) ? 'text-slate-900' : 'text-slate-500'
                                            }`}>
                                            {cat.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showLocationModal && (
                <LocationModal
                    onSelect={handleManualLocation}
                    onClose={() => setShowLocationModal(false)}
                />
            )}

            <style sx>{`
                .shops-page-container {
                    background: transparent;
                    min-h-screen;
                    font-family: 'Inter', sans-serif;
                }
            `}</style>
        </div>
    );
};

export default CustomerShops;
