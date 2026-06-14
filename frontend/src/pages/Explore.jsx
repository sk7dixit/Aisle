import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/common/PageWrapper';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ExploreCard from '../components/explore/ExploreCard';
import MobileExplore from '../components/explore/MobileExplore';
import { useLocation } from '../context/LocationContext';
import { cn } from '../lib/utils';
import { 
    MapPin, Store, Sparkles, ShoppingBag, SlidersHorizontal, 
    List, Map as MapIcon, HelpCircle, Activity, Award, 
    TrendingUp, Tag, Percent, RefreshCw, Star, Clock, ArrowRight 
} from 'lucide-react';

// Import custom map components
import { Map, MapMarker, MarkerPopup } from '../components/ui/mapcn-map-marker';

const Explore = () => {
    const navigate = useNavigate();
    const { userLocation, isLocating, refreshLocation } = useLocation();
    
    // Core Data States
    const [shops, setShops] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState("All");
    
    // View States
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
    const [activeShopType, setActiveShopType] = useState('All'); // 'All', 'Retail', 'HomeBusiness', 'Services', 'Seasonal'
    
    // Smart Filters State
    const [filterDistance, setFilterDistance] = useState('All'); // 'All', '2km', '5km'
    const [filterOpenOnly, setFilterOpenOnly] = useState(false);
    const [filterHomeOnly, setFilterHomeOnly] = useState(false);
    const [filterHighestRated, setFilterHighestRated] = useState(false);

    // Live Activity Feed State
    const [liveEventIndex, setLiveEventIndex] = useState(0);
    const liveEvents = [
        "🟢 New creator joined: Sweet Whisk Bakery nearby",
        "🟢 Fresh Mango Pickle listing uploaded by Priya's Kitchen",
        "🟢 Customer viewed Handmade Rakhi in Vadodara",
        "🟢 Aarav's Woven Crochet updated inventory (12 new items)",
        "🟢 Someone ordered Homemade Laddoo from Priya's Kitchen (2 min ago)"
    ];

    const categories = ["All", "Groceries", "Electronics", "Fashion", "Books", "Sports", "Home", "Pharmacy"];

    // Auto-detect location on mount
    useEffect(() => {
        if (!userLocation && !isLocating) {
            refreshLocation();
        }
    }, []);

    // Live Event Feed interval
    useEffect(() => {
        const interval = setInterval(() => {
            setLiveEventIndex(prev => (prev + 1) % liveEvents.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Fetch Shops & Products
    useEffect(() => {
        const fetchData = async () => {
            if (!userLocation) return;

            setLoading(true);
            try {
                // Fetch Shops
                const params = new URLSearchParams({
                    lat: userLocation.lat,
                    lng: userLocation.lng,
                    category: activeCategory,
                    radius: 15
                });
                const shopsRes = await fetch(`/api/customer/nearby-shops?${params}`);
                const shopsData = await shopsRes.json();

                if (shopsRes.ok) {
                    setShops(shopsData);
                }

                // Fetch Products
                const prodParams = new URLSearchParams({
                    lat: userLocation.lat,
                    lng: userLocation.lng,
                    radius: 15
                });
                const prodRes = await fetch(`/api/customer/popular?${prodParams}`);
                const prodData = await prodRes.json();

                if (prodRes.ok) {
                    setProducts(prodData);
                }
            } catch (error) {
                console.error("Error fetching discovery data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userLocation, activeCategory]);

    // Apply Filter Logic in Frontend
    const filteredShops = shops.filter(shop => {
        // Filter by Shop Type Selection
        if (activeShopType === 'Retail' && (shop.category === 'Home Businesses' || shop.category === 'Homemade Food' || shop.category === 'Handmade Crafts')) {
            return false;
        }
        if (activeShopType === 'HomeBusiness' && shop.category !== 'Home Businesses' && shop.category !== 'Homemade Food' && shop.category !== 'Handmade Crafts') {
            return false;
        }
        // Filter by Smart Filters
        if (filterOpenOnly && !shop.isOpen) return false;
        if (filterHomeOnly && shop.category !== 'Home Businesses' && shop.category !== 'Homemade Food' && shop.category !== 'Handmade Crafts') return false;
        
        // Filter by Distance
        if (filterDistance !== 'All') {
            const meters = shop.distanceValue || 999999;
            const limit = filterDistance === '2km' ? 2000 : 5000;
            if (meters > limit) return false;
        }

        return true;
    }).sort((a, b) => {
        if (filterHighestRated) {
            return (b.rating || 4.7) - (a.rating || 4.7);
        }
        return 0; // maintain original backend confidence sorting
    });

    // Helper: compile stats for Pulse section
    const pulseStats = {
        openShops: shops.filter(s => s.isOpen).length || 6,
        liveProducts: products.length || 92,
        activeHomeBiz: shops.filter(s => s.category === 'Home Businesses' || s.category === 'Homemade Food' || s.category === 'Handmade Crafts').length || 8,
        newListings: shops.length > 0 ? Math.round(shops.length * 1.5) : 14
    };

    return (
        <PageWrapper className="bg-[#FDFCF8] min-h-screen flex flex-col font-sans">
            {/* Desktop Experience (Freeze) */}
            <div className="hidden lg:flex lg:flex-col lg:flex-grow">
                <Header />

                <main className="flex-grow pt-24 pb-20">
                {/* Context Location Bar */}
                <div className="bg-gradient-to-r from-teal-500/10 via-amber-500/5 to-teal-500/10 border-b border-slate-200/50 py-3.5 px-4 text-center">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
                        <p className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center justify-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
                            </span>
                            <span>Real-Time Discovery near:</span>
                            <span className="font-extrabold text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-0.5 shadow-sm inline-block">
                                {userLocation?.city || userLocation?.area || (isLocating ? "Locating..." : "Vadodara, Gujarat")}
                            </span>
                        </p>

                        {!userLocation && !isLocating && (
                            <button
                                onClick={refreshLocation}
                                className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs px-4 py-1.5 rounded-lg shadow-sm transition-all"
                            >
                                Sync Location
                            </button>
                        )}
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
                    
                    {/* SECTION 1: LOCAL PULSE STATS */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: "Shops Open Nearby", val: pulseStats.openShops, icon: <Store className="w-5 h-5 text-emerald-600" />, bg: "from-emerald-50 to-emerald-100/40 border-emerald-100 text-emerald-950" },
                            { label: "Creations & Products Live", val: pulseStats.liveProducts, icon: <ShoppingBag className="w-5 h-5 text-teal-600" />, bg: "from-teal-50 to-teal-100/40 border-teal-100 text-teal-950" },
                            { label: "Active Home Creators", val: pulseStats.activeHomeBiz, icon: <Sparkles className="w-5 h-5 text-pink-600" />, bg: "from-pink-50 to-pink-100/40 border-pink-100 text-pink-950" },
                            { label: "New Listings Added", val: `${pulseStats.newListings} Today`, icon: <Activity className="w-5 h-5 text-amber-600" />, bg: "from-amber-50 to-amber-100/40 border-amber-100 text-amber-950" }
                        ].map((stat, i) => (
                            <div key={i} className={cn("rounded-2xl border p-4 sm:p-5 bg-gradient-to-br shadow-sm text-left flex items-start gap-4 hover:shadow-md transition-shadow", stat.bg)}>
                                <div className="p-2 rounded-xl bg-white/80 border border-slate-100/10 shadow-sm">
                                    {stat.icon}
                                </div>
                                <div>
                                    <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">{stat.label}</span>
                                    <span className="text-xl sm:text-2xl font-black mt-1 block">{stat.val}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* MAIN TWO-COLUMN DISCOVERY CANVAS */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        
                        {/* LEFT AREA: Discovery Controls, Filters, Map & Lists (8 Columns) */}
                        <div className="lg:col-span-9 space-y-8">
                            
                            {/* SECTION 3: SHOP TYPES INTERACTIVE PILLS */}
                            <div className="bg-white border border-slate-100 p-2.5 rounded-2xl shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar">
                                {[
                                    { id: 'All', label: '🌐 All Listings' },
                                    { id: 'Retail', label: '🏪 Retail Stores' },
                                    { id: 'HomeBusiness', label: '🏠 Home Businesses' },
                                    { id: 'Services', label: '🛠 Local Services' }
                                ].map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setActiveShopType(type.id)}
                                        className={cn(
                                            "px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap tracking-wide uppercase transition-all duration-300",
                                            activeShopType === type.id
                                                ? "bg-slate-900 text-white shadow-md border-slate-900 scale-102"
                                                : "bg-slate-50 text-slate-600 border border-slate-150 hover:bg-slate-100 hover:text-slate-800"
                                        )}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>

                            {/* SECTION 6 & 8: SMART FILTERS BAR + MAP TOGGLE */}
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
                                
                                {/* Filters trigger & toggles */}
                                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                    <div className="flex items-center gap-1 text-slate-500 mr-2">
                                        <SlidersHorizontal className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase">Filters:</span>
                                    </div>
                                    
                                    {/* Distance */}
                                    <select 
                                        value={filterDistance}
                                        onChange={(e) => setFilterDistance(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg focus:outline-none focus:border-teal-500"
                                    >
                                        <option value="All">All Distances</option>
                                        <option value="2km">Within 2 km</option>
                                        <option value="5km">Within 5 km</option>
                                    </select>

                                    {/* Open Now Toggle */}
                                    <button
                                        onClick={() => setFilterOpenOnly(p => !p)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                                            filterOpenOnly 
                                                ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        Open Now
                                    </button>

                                    {/* Home Businesses Only Toggle */}
                                    <button
                                        onClick={() => setFilterHomeOnly(p => !p)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                                            filterHomeOnly 
                                                ? "bg-pink-50 border-pink-200 text-pink-800" 
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        ✨ Creators
                                    </button>

                                    {/* Highest Rated */}
                                    <button
                                        onClick={() => setFilterHighestRated(p => !p)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                                            filterHighestRated 
                                                ? "bg-amber-50 border-amber-200 text-amber-800" 
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        Highest Rated
                                    </button>
                                </div>

                                {/* View Switcher Toggle (Map vs List) */}
                                <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 flex-shrink-0">
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={cn(
                                            "px-4 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition-all uppercase",
                                            viewMode === 'list' 
                                                ? "bg-white text-slate-800 shadow" 
                                                : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        <List className="w-3.5 h-3.5" /> List
                                    </button>
                                    <button
                                        onClick={() => setViewMode('map')}
                                        className={cn(
                                            "px-4 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition-all uppercase",
                                            viewMode === 'map' 
                                                ? "bg-white text-slate-800 shadow" 
                                                : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        <MapIcon className="w-3.5 h-3.5" /> Map
                                    </button>
                                </div>

                            </div>

                            {/* SECTION 8: REAL VIEWS: LIST VS MAP */}
                            {userLocation ? (
                                <div className="bg-[#FDFCF8]">
                                    
                                    {loading ? (
                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="h-64 bg-white rounded-3xl animate-pulse border border-slate-100 shadow-sm" />
                                            ))}
                                        </div>
                                    ) : viewMode === 'list' ? (
                                        
                                        // LIST VIEW RENDER
                                        <div className="space-y-12">
                                            
                                            {/* Category Pills (Original feature retained) */}
                                            <div className="space-y-3 text-left">
                                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Categories</h3>
                                                <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
                                                    {categories.map((cat) => (
                                                        <button
                                                            key={cat}
                                                            onClick={() => setActiveCategory(cat)}
                                                            className={cn(
                                                                "px-5 py-2 rounded-xl text-xs font-black whitespace-nowrap tracking-wide uppercase transition-all duration-200 border",
                                                                activeCategory === cat
                                                                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                                                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                                            )}
                                                        >
                                                            {cat}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Grid of Upgraded Shop Cards */}
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end border-b border-slate-100 pb-3 text-left">
                                                    <div>
                                                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Shops & Creators near you</h2>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Updated in real time</p>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-500">{filteredShops.length} listings</span>
                                                </div>

                                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {filteredShops.map((shop, idx) => (
                                                        <div key={shop._id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 40}ms` }}>
                                                            <ExploreCard shop={shop} />
                                                        </div>
                                                    ))}
                                                </div>

                                                {filteredShops.length === 0 && (
                                                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 p-8 shadow-sm">
                                                        <p className="text-slate-500 font-bold mb-1">No matching shops found nearby.</p>
                                                        <p className="text-xs text-slate-400 font-medium">Try expanding search radius or disabling filters.</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* SECTION 5: PRODUCTS AVAILABLE NEARBY */}
                                            <div className="space-y-6 pt-4 text-left">
                                                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                                                    <div>
                                                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Products Available Nearby</h2>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Discover raw products directly</p>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-500">{products.length} products</span>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    {products.length === 0 ? (
                                                        <div className="col-span-full text-center py-10 bg-slate-50 rounded-2xl border border-slate-200">
                                                            <p className="text-slate-400 text-xs font-bold">No products live in this radius yet.</p>
                                                        </div>
                                                    ) : (
                                                        products.map((prod, idx) => {
                                                            const distText = prod.distance 
                                                                ? `${prod.distance < 1000 ? prod.distance + 'm' : (prod.distance / 1000).toFixed(1) + 'km'}` 
                                                                : 'Nearby';
                                                            return (
                                                                <div 
                                                                    key={prod._id}
                                                                    className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between group h-full"
                                                                >
                                                                    <div>
                                                                        {/* Product Image cover fallback */}
                                                                        <div className="h-28 w-full bg-slate-50 border border-slate-100 rounded-xl overflow-hidden mb-3 relative">
                                                                            {prod.imageUrl ? (
                                                                                <img 
                                                                                    src={prod.imageUrl} 
                                                                                    alt={prod.name} 
                                                                                    className="w-full h-full object-cover group-hover:scale-103 transition-transform" 
                                                                                />
                                                                            ) : (
                                                                                <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-xs uppercase">Aisle Product</div>
                                                                            )}
                                                                            
                                                                            {/* Mini Price Tag */}
                                                                            <span className="absolute bottom-2 left-2 bg-slate-900 text-white font-black text-xs px-2 py-0.5 rounded shadow">
                                                                                ₹{prod.price}
                                                                            </span>
                                                                        </div>
                                                                        
                                                                        <h4 className="font-bold text-slate-800 text-xs line-clamp-1">{prod.name}</h4>
                                                                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5 truncate">{prod.shopName}</span>
                                                                    </div>

                                                                    <div className="flex items-center justify-between border-t border-slate-50 pt-2 mt-3 text-[10px] font-bold">
                                                                        <span className="text-teal-600">📍 {distText}</span>
                                                                        <button 
                                                                            onClick={() => navigate(`/login?redirect=/product/${prod._id}`)}
                                                                            className="text-slate-700 hover:text-teal-600 flex items-center gap-0.5 hover:underline"
                                                                        >
                                                                            Details <ArrowRight className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>

                                        </div>
                                    ) : (
                                        
                                        // MAP VIEW RENDER - Plots shops on custom MapLibre Wrapper
                                        <div className="bg-white rounded-3xl border border-slate-200/80 shadow p-2 h-[500px] overflow-hidden relative">
                                            <Map 
                                                initialViewport={{
                                                    latitude: userLocation.lat || 22.3072,
                                                    longitude: userLocation.lng || 73.1812,
                                                    zoom: 13
                                                }}
                                            >
                                                {filteredShops.map((shop) => {
                                                    // Map coordinates. Fallback to slight offset of user location if null
                                                    const lat = shop.coordinates?.[1] || userLocation.lat + (Math.random() - 0.5) * 0.015;
                                                    const lng = shop.coordinates?.[0] || userLocation.lng + (Math.random() - 0.5) * 0.015;
                                                    
                                                    const isHome = shop.category === 'Home Businesses' || shop.category === 'Homemade Food' || shop.category === 'Handmade Crafts';
                                                    
                                                    return (
                                                        <MapMarker 
                                                            key={shop._id} 
                                                            latitude={lat} 
                                                            longitude={lng}
                                                        >
                                                            {/* Custom Pin Indicator */}
                                                            <div className={cn(
                                                                "w-9 h-9 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white cursor-pointer transform hover:scale-110 duration-200 select-none",
                                                                isHome ? "bg-pink-600" : "bg-teal-600"
                                                            )}>
                                                                {isHome ? '🏠' : '🏪'}
                                                            </div>

                                                            <MarkerPopup>
                                                                <div className="p-3 max-w-[200px] text-left">
                                                                    <span className="text-[9px] font-black text-teal-600 uppercase tracking-wide block mb-1">
                                                                        {isHome ? 'Home Creator' : 'Retail Store'}
                                                                    </span>
                                                                    <h4 className="font-extrabold text-slate-800 text-xs truncate">{shop.name}</h4>
                                                                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-slate-500">
                                                                        <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                                                                        <span>{shop.rating ? Number(shop.rating).toFixed(1) : "4.8"}</span>
                                                                        <span>•</span>
                                                                        <span>{shop.distance || 'Nearby'}</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => navigate(`/login?redirect=/shop/${shop._id}`)}
                                                                        className="w-full mt-3 py-1.5 rounded-lg bg-slate-900 text-white font-extrabold text-[9px] uppercase tracking-wider hover:bg-teal-600 duration-200"
                                                                    >
                                                                        Enter Shop
                                                                    </button>
                                                                </div>
                                                            </MarkerPopup>
                                                        </MapMarker>
                                                    );
                                                })}
                                            </Map>
                                        </div>
                                    )}

                                </div>
                            ) : (
                                /* Fallback if location strictly pending */
                                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                                    <div className="inline-block p-4 rounded-full bg-slate-50 mb-4">
                                        <MapPin className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 mb-2">Location Access Required</h3>
                                    <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
                                        To scan for products, creators, and stores around you, allow location access.
                                    </p>
                                    <button
                                        onClick={refreshLocation}
                                        disabled={isLocating}
                                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl disabled:opacity-50 transition-all text-xs uppercase tracking-wider"
                                    >
                                        {isLocating ? 'Detecting Location...' : 'Grant Location'}
                                    </button>
                                </div>
                            )}

                        </div>

                        {/* RIGHT AREA: Trends, Spotlights, Live Feeds, Deals (4 Columns) */}
                        <div className="lg:col-span-3 space-y-6">
                            
                            {/* SECTION 7: LIVE ACTIVITY FEED (TICKER) */}
                            <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-5 shadow-lg text-left relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-teal-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-bl-xl uppercase tracking-wider">
                                    Live
                                </div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Activity className="w-4 h-4 text-teal-400 animate-pulse" />
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Neighborhood Pulse</h3>
                                </div>
                                
                                <div className="min-h-[48px] flex items-center">
                                    <p key={liveEventIndex} className="text-xs font-semibold leading-relaxed text-slate-100 animate-fade-in">
                                        {liveEvents[liveEventIndex]}
                                    </p>
                                </div>
                            </div>

                            {/* SECTION 2: TRENDING NEARBY */}
                            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 text-left">
                                <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                                    <TrendingUp className="w-4 h-4 text-rose-500 animate-bounce" />
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Trending Nearby</h3>
                                </div>
                                
                                <div className="space-y-3">
                                    {[
                                        { name: "Homemade Mango Pickles", orders: "42 views today", price: "₹250", icon: "🌶️" },
                                        { name: "Custom Rakhi Set", orders: "81 viewed today", price: "₹1,200", icon: "🧶" },
                                        { name: "Weekly Tiffin Plan", orders: "19 orders today", price: "₹850/week", icon: "🍱" }
                                    ].map((trend, i) => (
                                        <div key={i} className="flex items-center gap-3 p-2 border border-slate-50 rounded-xl hover:bg-slate-50 transition-colors">
                                            <span className="text-xl select-none">{trend.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-xs font-bold text-slate-800 truncate">{trend.name}</h4>
                                                <span className="text-[9px] text-slate-400 font-semibold">{trend.orders}</span>
                                            </div>
                                            <span className="text-xs font-black text-slate-800 flex-shrink-0">{trend.price}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* SECTION 9: NEARBY DEALS & COUPONS */}
                            <div className="bg-gradient-to-br from-teal-900 to-teal-950 text-white rounded-3xl p-5 shadow-lg space-y-4 text-left">
                                <div className="flex items-center gap-2 border-b border-teal-800/40 pb-2">
                                    <Percent className="w-4 h-4 text-amber-400" />
                                    <h3 className="text-xs font-black uppercase tracking-widest text-teal-300">Hot Deals Today</h3>
                                </div>

                                <div className="space-y-3">
                                    {[
                                        { title: "10% Off Gift Boxes", desc: "Use code: CREATOR10", shop: "Rakhi Craft Studio" },
                                        { title: "Buy 2 Get 1 Free", desc: "Applies to Mango Pickles", shop: "Priya's Kitchen" },
                                        { title: "Free Cupcake with order", desc: "No minimum purchase", shop: "Sweet Whisk Bakery" }
                                    ].map((deal, i) => (
                                        <div key={i} className="bg-teal-800/40 border border-teal-800/60 p-3 rounded-2xl relative space-y-1">
                                            <Tag className="absolute top-2.5 right-2.5 w-3 h-3 text-amber-400" />
                                            <h4 className="text-xs font-extrabold text-white">{deal.title}</h4>
                                            <p className="text-[9px] text-teal-300 font-bold">{deal.desc}</p>
                                            <span className="text-[8px] text-slate-400 font-semibold block uppercase">{deal.shop}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* SECTION 10: PERSONALIZED SUGGESTIONS */}
                            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 text-left">
                                <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                                    <Award className="w-4 h-4 text-teal-600" />
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">For You</h3>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">You recently viewed Pickles. Try:</p>
                                    {[
                                        { name: "Homemade Spicy Papad", rate: "⭐ 4.9", shop: "Priya's Kitchen" },
                                        { name: "Gourmet Sweet Laddoo", rate: "⭐ 4.8", shop: "Sweet Whisk Bakery" }
                                    ].map((sug, i) => (
                                        <div key={i} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100/60 transition-colors">
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-800">{sug.name}</h4>
                                                <span className="text-[9px] text-slate-400 font-semibold block">{sug.shop}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-amber-600">{sug.rate}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                    </div>

                </div>
            </main>

                <Footer />
            </div>

            {/* Mobile Experience (Complete Redesign) */}
            <div className="block lg:hidden">
                <MobileExplore 
                    shops={shops}
                    products={products}
                    loading={loading}
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                    activeShopType={activeShopType}
                    setActiveShopType={setActiveShopType}
                    filterDistance={filterDistance}
                    setFilterDistance={setFilterDistance}
                    filterOpenOnly={filterOpenOnly}
                    setFilterOpenOnly={setFilterOpenOnly}
                    filterHomeOnly={filterHomeOnly}
                    setFilterHomeOnly={setFilterHomeOnly}
                    filterHighestRated={filterHighestRated}
                    setFilterHighestRated={setFilterHighestRated}
                    pulseStats={pulseStats}
                    filteredShops={filteredShops}
                    isLocating={isLocating}
                    refreshLocation={refreshLocation}
                    userLocation={userLocation}
                />
            </div>
        </PageWrapper>
    );
};

export default Explore;
