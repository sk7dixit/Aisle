import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, TrendingUp, Star, Sparkles, Menu, X, Search, 
  Heart, Bell, User, ChevronDown, ChevronUp, ArrowRight, 
  Store, ShoppingBag, Percent, Zap, Users, Smile, Headphones,
  Shirt, Flower, Activity, Book, Shield, Info, HelpCircle, Briefcase
} from 'lucide-react';
import AisleLogo from '../AisleLogo';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Map, MapMarker, MarkerContent, MarkerTooltip, MarkerLabel, MapControls, MapArc } from '../ui/mapcn-map-marker';

const MobileHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userLocation, detectLocation, isLocating } = useLocation();

  // Navigation Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Active Bottom Tab (Default to Home)
  const [activeTab, setActiveTab] = useState('home');

  // Real-time Live Badge cycling text
  const [liveIndex, setLiveIndex] = useState(0);
  const liveTexts = [
    "8 Businesses Live Nearby",
    "92 Fresh Products Today",
    "Vadodara Marketplace Live"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveIndex(prev => (prev + 1) % liveTexts.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // Location display logic
  const handleLocationScan = async () => {
    try {
      await detectLocation();
    } catch (e) {
      console.error("Location detection failed", e);
    }
  };

  const locationText = isLocating
    ? 'Scanning neighborhood...'
    : userLocation
      ? userLocation.address
      : 'Vadodara (Default)';

  // Product categories horizontal chips
  const categories = [
    { name: "Grocery", icon: Store, slug: "grocery" },
    { name: "Food", icon: Smile, slug: "food" },
    { name: "Fashion", icon: Shirt, slug: "fashion" },
    { name: "Electronics", icon: Headphones, slug: "electronics" },
    { name: "Gifts", icon: Sparkles, slug: "gifts" },
    { name: "Beauty", icon: Heart, slug: "beauty" }
  ];

  // Pinterest-style Product Cards Data
  const mobileProducts = [
    { name: 'Denim Jacket', shop: 'BlueThread Crafts', distance: '0.3 km', icon: Shirt, bg: 'from-blue-500/20 to-indigo-500/10', color: 'text-indigo-600' },
    { name: 'Homemade Mango Pickle', shop: 'Priya\'s Kitchen', distance: '0.2 km', icon: Sparkles, bg: 'from-amber-500/20 to-orange-500/10', color: 'text-amber-600' },
    { name: 'AirPods Pro', shop: 'TechHaven Store', distance: '0.2 km', icon: Headphones, bg: 'from-teal-500/20 to-emerald-500/10', color: 'text-teal-600' },
    { name: 'Ceramic Vase', shop: 'EarthWorks Ceramics', distance: '0.4 km', icon: Flower, bg: 'from-rose-500/20 to-pink-500/10', color: 'text-rose-600' },
    { name: 'Customized Rakhi', shop: 'Komal\'s Art Studio', distance: '0.1 km', icon: Star, bg: 'from-purple-500/20 to-fuchsia-500/10', color: 'text-purple-600' },
    { name: 'Yoga Mat', shop: 'FitLife Goods', distance: '0.5 km', icon: Activity, bg: 'from-emerald-500/20 to-cyan-500/10', color: 'text-emerald-600' }
  ];

  // Popular search items
  const popularSearches = [
    { label: "🍲 Tiffin", term: "tiffin" },
    { label: "🥭 Pickles", term: "pickle" },
    { label: "🎁 Gifts", term: "gift" },
    { label: "👗 Fashion", term: "fashion" }
  ];

  // Benefits
  const benefits = [
    { title: 'Zero Markups', desc: 'Pay exactly what you would inside the physical store.', icon: Percent, bg: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { title: 'Support Local', desc: 'Every purchase directly strengthens your neighborhood.', icon: Heart, bg: 'bg-rose-50 text-rose-600 border-rose-100' },
    { title: 'Instant Stock', desc: 'Know what is available before leaving your house.', icon: Zap, bg: 'bg-amber-50 text-amber-600 border-amber-100' },
    { title: 'Community', desc: 'Direct chat and verification with local makers.', icon: Users, bg: 'bg-teal-50 text-teal-600 border-teal-100' }
  ];

  // Accordion Discovery State
  const [accordionOpen, setAccordionOpen] = useState(0);
  const discoveryFeatures = [
    { title: "💬 Real-time Seller Chat", content: "Chat instantly with local makers, shop owners, and home cooks to ask about custom requests or verify stock availability in seconds." },
    { title: "🗺️ Physical Route Navigation", content: "Interactive physical routing powered by OpenStreetMap that guides you right to the seller's storefront or pick-up point." },
    { title: "🧾 AI Receipt Scanning", content: "Snap a picture of your receipt to earn community trust points, track local spending, and unlock neighborhood deals." },
    { title: "🎁 Custom Group Bookings", content: "Schedule group custom orders, festive hampers, or event catering directly through the seller's storefront dashboard." }
  ];

  // Map configuration
  const userCoords = userLocation 
    ? [userLocation.lng, userLocation.lat]
    : [77.209, 28.6139];
  const shopCoords = userLocation
    ? [userLocation.lng + 0.008, userLocation.lat + 0.006]
    : [77.218, 28.6190];

  const arcData = [{ id: 'mobile-arc', from: userCoords, to: shopCoords }];

  // Menu Navigation Click Handler
  const handleNavClick = (path) => {
    setIsDrawerOpen(false);
    navigate(path);
  };

  // Bottom navigation tab selector
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === 'discover') navigate('/explore');
    else if (tab === 'nearby') navigate('/shops');
    else if (tab === 'saved') navigate('/interested');
    else if (tab === 'profile') {
      if (user) navigate('/profile');
      else navigate('/login');
    }
  };

  return (
    <div className="bg-[#FAF9F5] min-h-screen pb-24 text-slate-800 relative overflow-x-hidden font-sans">
      
      {/* 1. MOBILE HEADER */}
      <header className="sticky top-0 bg-[#FAF9F5]/90 backdrop-blur-md z-40 border-b border-slate-200/50 py-3.5 px-4 flex justify-between items-center shadow-sm">
        <div onClick={() => navigate('/')} className="cursor-pointer">
          <AisleLogo imgClassName="h-[32px] w-auto object-contain" />
        </div>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="p-1.5 rounded-xl bg-white border border-slate-200/50 shadow-sm active:scale-95 transition-transform"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>
      </header>

      {/* DRAWER MENU OVERLAY */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/40 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[270px] bg-[#FAF9F5] z-50 shadow-2xl p-6 border-l border-slate-200/50 flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-200/50">
                  <span className="font-black text-slate-900 tracking-tight text-lg">Menu</span>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200"
                  >
                    <X className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
                
                <nav className="flex flex-col gap-2">
                  <button onClick={() => handleNavClick('/explore')} className="flex items-center gap-3 w-full text-left p-3 rounded-2xl hover:bg-slate-100/50 font-bold text-slate-700 transition-colors text-sm">
                    <Search className="w-4 h-4 text-teal-600" /> Explore
                  </button>
                  <button onClick={() => handleNavClick('/for-shops')} className="flex items-center gap-3 w-full text-left p-3 rounded-2xl hover:bg-slate-100/50 font-bold text-slate-700 transition-colors text-sm">
                    <Store className="w-4 h-4 text-amber-600" /> For Businesses
                  </button>
                  <button onClick={() => handleNavClick('/home-business')} className="flex items-center gap-3 w-full text-left p-3 rounded-2xl hover:bg-slate-100/50 font-bold text-slate-700 transition-colors text-sm">
                    <Sparkles className="w-4 h-4 text-rose-500" /> Home Businesses
                  </button>
                  <button onClick={() => handleNavClick('/how-it-works')} className="flex items-center gap-3 w-full text-left p-3 rounded-2xl hover:bg-slate-100/50 font-bold text-slate-700 transition-colors text-sm">
                    <Info className="w-4 h-4 text-indigo-500" /> How It Works
                  </button>
                  <button onClick={() => handleNavClick('/about')} className="flex items-center gap-3 w-full text-left p-3 rounded-2xl hover:bg-slate-100/50 font-bold text-slate-700 transition-colors text-sm">
                    <HelpCircle className="w-4 h-4 text-blue-500" /> About
                  </button>
                </nav>
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-200/50">
                <Button 
                  onClick={() => handleNavClick('/login')}
                  variant="outline" 
                  className="w-full py-5 rounded-2xl border-slate-300 font-bold text-slate-700"
                >
                  Login
                </Button>
                <Button 
                  onClick={() => handleNavClick('/register')}
                  className="w-full py-5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Get Started
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 2. REAL-TIME LIVE BADGE (STICKY BOTTOM BAR OR FLOATING PILL) */}
      <div className="px-4 pt-4">
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-2xl text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm animate-fade-in w-full max-w-sm mx-auto">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="transition-all duration-500">{liveTexts[liveIndex]}</span>
        </div>
      </div>

      {/* 3. HERO & SEARCH REDESIGN */}
      <section className="px-5 pt-6 pb-4 text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-900">
            Find Anything <br />
            <span className="bg-gradient-to-r from-teal-600 via-coral-500 to-amber-500 bg-clip-text text-transparent">
              Near You.
            </span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 max-w-xs mx-auto leading-relaxed">
            Discover real-time inventory at local shops and creators around your neighborhood.
          </p>
        </div>

        {/* Location Indicator & Scan Button */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/50 shadow-sm space-y-3 max-w-sm mx-auto">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              📍 Current Location
            </span>
            <button 
              onClick={handleLocationScan} 
              disabled={isLocating}
              className="text-[10px] font-black text-teal-600 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full active:scale-95 transition-transform disabled:opacity-50"
            >
              {isLocating ? "Syncing..." : "Scan Area"}
            </button>
          </div>
          <p className="text-xs font-bold text-slate-800 text-left truncate">
            {locationText}
          </p>
        </div>

        {/* What Need? Product Search Bar */}
        <div className="max-w-sm mx-auto relative shadow-sm rounded-3xl overflow-hidden border-2 border-slate-200 focus-within:border-teal-500 transition-colors">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <Input 
            type="text" 
            placeholder="Search products, groceries, crafts..." 
            className="w-full pl-12 pr-4 py-6 text-sm bg-white border-none focus-visible:ring-0 rounded-none font-semibold text-slate-800"
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate(`/explore?q=${e.target.value}`);
            }}
          />
        </div>

        {/* Popular Searches */}
        <div className="max-w-sm mx-auto space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Popular Searches</p>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((search, i) => (
              <button 
                key={i} 
                onClick={() => navigate(`/explore?q=${search.term}`)}
                className="bg-white border border-slate-200/50 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 shadow-sm active:scale-95 transition-all"
              >
                {search.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE LIVE MAP */}
      <section className="px-4 py-4 space-y-3">
        <div className="max-w-sm mx-auto bg-white rounded-3xl border border-slate-200/50 p-3 shadow-sm space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Live Map View</span>
            <span className="text-[9px] font-black bg-orange-500/10 text-orange-700 px-2 py-0.5 rounded-full border border-orange-500/20">8 Shops Active</span>
          </div>

          <div className="w-full h-[320px] rounded-2xl overflow-hidden border border-slate-100 relative shadow-inner">
            <Map
              center={userCoords}
              zoom={13}
              pitch={45}
              bearing={0}
              className="w-full h-full"
              theme="light"
            >
              <MapControls position="top-right" showZoom={true} showLocate={true} />
              
              <MapArc
                data={arcData}
                curvature={0.25}
                paint={{"line-color": "#ea580c", "line-width": 3, "line-opacity": 0.8}}
              />

              <MapMarker longitude={userCoords[0]} latitude={userCoords[1]}>
                <MarkerContent>
                  <div className="w-8 h-8 bg-teal-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center relative">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <div className="absolute inset-0 rounded-full border border-teal-400 animate-ping"></div>
                  </div>
                </MarkerContent>
                <MarkerTooltip>You are here</MarkerTooltip>
              </MapMarker>

              <MapMarker longitude={shopCoords[0]} latitude={shopCoords[1]}>
                <MarkerContent>
                  <div className="w-10 h-10 bg-orange-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                    <ShoppingBag size={14} className="text-white" />
                  </div>
                </MarkerContent>
                <MarkerTooltip>Local Shop</MarkerTooltip>
                <MarkerLabel position="top" className="bg-slate-900/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                  Shops Active
                </MarkerLabel>
              </MapMarker>
            </Map>
          </div>
        </div>
      </section>

      {/* 5. CATEGORY SECTION */}
      <section className="py-4 space-y-3">
        <div className="px-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Explore Categories</p>
        </div>
        
        {/* Horizontal scroll chips */}
        <div className="flex gap-2.5 overflow-x-auto px-5 pb-2 scrollbar-none snap-x snap-mandatory">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <button 
                key={i} 
                onClick={() => navigate(`/search?category=${cat.name}`)}
                className="flex items-center gap-2 bg-white border border-slate-200/50 px-4 py-3 rounded-2xl shadow-sm snap-start active:scale-95 transition-all flex-shrink-0"
              >
                <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-slate-800">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 6. PRODUCT SECTION UPGRADE (2-COLUMN GRID) */}
      <section className="px-5 py-4 space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neighborhood Pulse</p>
            <h2 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">Fresh In-Stock Products</h2>
          </div>
          <button 
            onClick={() => navigate('/explore')}
            className="text-[10px] font-black text-teal-600 flex items-center gap-0.5"
          >
            View All <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Pinterest-style Staggered Grid */}
        <div className="grid grid-cols-2 gap-4">
          {mobileProducts.map((prod, i) => {
            const IconComponent = prod.icon;
            return (
              <div 
                key={i} 
                onClick={() => navigate('/explore')}
                className="bg-white border border-slate-200/50 rounded-3xl p-4 flex flex-col justify-between space-y-3 shadow-sm hover:shadow-md transition-shadow active:scale-[0.98] transition-transform cursor-pointer"
              >
                {/* Visual Header / Gradients Area */}
                <div className={`w-full h-24 rounded-2xl bg-gradient-to-br ${prod.bg} flex items-center justify-center relative overflow-hidden`}>
                  <IconComponent className={`w-10 h-10 ${prod.color} opacity-80`} />
                  <span className="absolute bottom-2 right-2 text-[9px] font-black bg-slate-900/65 text-white px-2 py-0.5 rounded-md">
                    {prod.distance}
                  </span>
                </div>

                {/* Info */}
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">In Stock</span>
                  </div>
                  <h3 className="text-xs font-black text-slate-800 line-clamp-1">{prod.name}</h3>
                  <p className="text-[9px] text-slate-400 font-bold flex items-center gap-0.5">
                    <Store className="w-2.5 h-2.5" />
                    {prod.shop}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. WHY NEIGHBORS LOVE AISLE */}
      <section className="px-5 py-6 bg-slate-100/40 border-y border-slate-200/50 space-y-4">
        <div className="text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Value Proposition</p>
          <h2 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">Why Neighbors Love Aisle</h2>
        </div>

        {/* Benefits horizontal swiper style */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
          {benefits.map((ben, i) => {
            const Icon = ben.icon;
            return (
              <div 
                key={i} 
                className="bg-white/70 backdrop-blur-md border border-slate-200/50 p-5 rounded-3xl shadow-sm flex flex-col justify-between space-y-4 min-w-[240px] max-w-[240px] snap-start"
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${ben.bg}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-left">
                  <h4 className="text-xs font-black text-slate-800">{ben.title}</h4>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">{ben.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. STATS SECTION */}
      <section className="px-5 py-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <div className="bg-white border border-slate-200/50 p-5 rounded-3xl shadow-sm text-center space-y-1">
            <p className="text-2xl font-black text-teal-600">2,500+</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Local Creators</p>
          </div>
          <div className="bg-white border border-slate-200/50 p-5 rounded-3xl shadow-sm text-center space-y-1">
            <p className="text-2xl font-black text-orange-500">50,000+</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Neighbors</p>
          </div>
          <div className="bg-white border border-slate-200/50 p-5 rounded-3xl shadow-sm text-center space-y-1">
            <p className="text-2xl font-black text-indigo-500">100K+</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Live Products</p>
          </div>
          <div className="bg-white border border-slate-200/50 p-5 rounded-3xl shadow-sm text-center space-y-1">
            <p className="text-2xl font-black text-rose-500">12+</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Hubs</p>
          </div>
        </div>
      </section>

      {/* 9. SMART SHOPPER JOURNEY */}
      <section className="px-6 py-6 bg-slate-900 text-white rounded-t-[40px] space-y-6">
        <div className="text-center space-y-1">
          <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest">How It Works</p>
          <h2 className="text-xl font-black tracking-tight">Smart Shopper Journey</h2>
        </div>

        {/* Vertical Timeline */}
        <div className="max-w-xs mx-auto relative pl-8 space-y-6 py-2">
          {/* Timeline center line */}
          <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-slate-800"></div>

          {/* Step 1 */}
          <div className="relative">
            <div className="absolute -left-7.5 w-6.5 h-6.5 bg-teal-500 rounded-full border-4 border-slate-900 flex items-center justify-center text-[10px] font-black text-white">1</div>
            <div className="text-left space-y-0.5">
              <h4 className="text-xs font-black text-slate-100">Search Products</h4>
              <p className="text-[10px] text-slate-400 font-medium">Type what you need in search or pick a popular chip.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <div className="absolute -left-7.5 w-6.5 h-6.5 bg-orange-500 rounded-full border-4 border-slate-900 flex items-center justify-center text-[10px] font-black text-white">2</div>
            <div className="text-left space-y-0.5">
              <h4 className="text-xs font-black text-slate-100">Locate Nearest Shop</h4>
              <p className="text-[10px] text-slate-400 font-medium">Check physical mapping distance on OSM live tracking.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative">
            <div className="absolute -left-7.5 w-6.5 h-6.5 bg-yellow-500 rounded-full border-4 border-slate-900 flex items-center justify-center text-[10px] font-black text-white">3</div>
            <div className="text-left space-y-0.5">
              <h4 className="text-xs font-black text-slate-100">Verify Availability</h4>
              <p className="text-[10px] text-slate-400 font-medium">Review live stock counters and seller indicators.</p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative">
            <div className="absolute -left-7.5 w-6.5 h-6.5 bg-rose-500 rounded-full border-4 border-slate-900 flex items-center justify-center text-[10px] font-black text-white">4</div>
            <div className="text-left space-y-0.5">
              <h4 className="text-xs font-black text-slate-100">Visit & Pickup</h4>
              <p className="text-[10px] text-slate-400 font-medium">Walk down, meet the maker, and complete your purchase.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. NEARBY DISCOVERY ACCORDIONS */}
      <section className="px-5 py-6 space-y-4">
        <div className="text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Explore Features</p>
          <h2 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">Features & Capabilities</h2>
        </div>

        <div className="space-y-2.5 max-w-sm mx-auto">
          {discoveryFeatures.map((feat, i) => {
            const isOpen = accordionOpen === i;
            return (
              <div 
                key={i} 
                className="bg-white border border-slate-200/50 rounded-2xl overflow-hidden shadow-sm transition-all"
              >
                <button 
                  onClick={() => setAccordionOpen(isOpen ? -1 : i)}
                  className="w-full px-4 py-4 flex justify-between items-center text-left focus:outline-none"
                >
                  <span className="text-xs font-black text-slate-800">{feat.title}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-100 bg-slate-50/50"
                    >
                      <p className="p-4 text-[10px] text-slate-500 leading-relaxed font-semibold">
                        {feat.content}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* 11. CTA SECTION */}
      <section className="px-5 py-8 text-center space-y-4 max-w-sm mx-auto">
        <div className="bg-gradient-to-br from-teal-600 to-emerald-700 text-white rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-black tracking-tight leading-tight">
            Find Hidden Gems Nearby in Vadodara
          </h2>
          <p className="text-[10px] text-teal-100/90 font-medium leading-relaxed">
            Support home businesses and shop local items at physical retail prices.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Button 
              onClick={() => navigate('/explore')}
              className="w-full bg-white hover:bg-slate-50 text-teal-800 font-bold py-5 rounded-2xl shadow-md"
            >
              Start Exploring
            </Button>
            <Button 
              onClick={() => navigate('/demo')}
              variant="outline" 
              className="w-full border-teal-400 text-white hover:bg-teal-500/20 font-bold py-5 rounded-2xl"
            >
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* 12. COMPACT FOOTER */}
      <footer className="px-6 py-6 border-t border-slate-200/50 bg-slate-100/50 text-center space-y-4">
        <div className="flex justify-center items-center gap-6 text-slate-400">
          <button onClick={() => navigate('/explore')} aria-label="Search"><Search className="w-4 h-4 hover:text-teal-600 transition-colors" /></button>
          <button onClick={() => navigate('/shops')} aria-label="Shops"><Store className="w-4 h-4 hover:text-teal-600 transition-colors" /></button>
          <button onClick={() => navigate('/interested')} aria-label="Saved"><Heart className="w-4 h-4 hover:text-teal-600 transition-colors" /></button>
          <button onClick={() => navigate('/profile')} aria-label="Profile"><User className="w-4 h-4 hover:text-teal-600 transition-colors" /></button>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-slate-500 font-bold">© Aisle 2026</p>
          <p className="text-[8px] text-slate-400">Local shopping and digital storefront discovery.</p>
        </div>
      </footer>

    </div>
  );
};

export default MobileHome;
