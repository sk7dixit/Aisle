import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Store, Sparkles, ShoppingBag, SlidersHorizontal, 
  Menu, X, Bell, Search, Star, Clock, ArrowRight, Percent, 
  Tag, Activity, Heart, User, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import AisleLogo from '../AisleLogo';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const MobileExplore = ({
  shops,
  products,
  loading,
  activeCategory,
  setActiveCategory,
  activeShopType,
  setActiveShopType,
  filterDistance,
  setFilterDistance,
  filterOpenOnly,
  setFilterOpenOnly,
  filterHomeOnly,
  setFilterHomeOnly,
  filterHighestRated,
  setFilterHighestRated,
  pulseStats,
  filteredShops,
  isLocating,
  refreshLocation,
  userLocation
}) => {
  const navigate = useNavigate();

  // Controls UI overlays
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Bottom Navigation tab indicator (Discover is active)
  const activeTab = 'discover';

  // Live Activity Toast cycling state
  const liveEvents = [
    "🟢 New creator joined: Sweet Whisk Bakery nearby",
    "🟢 Fresh Mango Pickle uploaded by Priya's Kitchen",
    "🟢 Customer viewed Handmade Rakhi in Vadodara",
    "🟢 Aarav's Woven Crochet updated inventory (12 new items)",
    "🟢 Someone ordered Homemade Laddoo from Priya's Kitchen (2 min ago)"
  ];
  const [liveIndex, setLiveIndex] = useState(0);
  const [showToast, setShowToast] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setShowToast(false);
      setTimeout(() => {
        setLiveIndex(prev => (prev + 1) % liveEvents.length);
        setShowToast(true);
      }, 500);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Menu navigation drawer click
  const handleNavClick = (path) => {
    setIsDrawerOpen(false);
    navigate(path);
  };

  // Bottom nav tab selector
  const handleTabClick = (tab) => {
    if (tab === 'home') navigate('/');
    else if (tab === 'discover') navigate('/explore');
    else if (tab === 'nearby') navigate('/shops');
    else if (tab === 'saved') navigate('/interested');
    else if (tab === 'profile') navigate('/profile');
  };

  // Local state for Price Range filter just to make the bottom sheet feel premium
  const [selectedPrice, setSelectedPrice] = useState('All');

  // Categories list
  const categories = ["All", "Groceries", "Electronics", "Fashion", "Books", "Sports", "Home", "Pharmacy"];

  // Collapsible footer states
  const [footerOpen, setFooterOpen] = useState({ explore: false, business: false, about: false });
  const toggleFooter = (section) => {
    setFooterOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Location display text
  const locationText = isLocating
    ? 'Locating...'
    : userLocation
      ? `${userLocation.city || userLocation.area || 'Vadodara'}`
      : 'Vadodara, Gujarat';

  return (
    <div className="bg-[#FAF9F5] min-h-screen pb-24 text-slate-800 relative overflow-x-hidden font-sans">
      
      {/* 1. COMPACT HEADER */}
      <header className="bg-[#FAF9F5] pt-4 px-4 flex justify-between items-center">
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="p-2 rounded-xl bg-white border border-slate-200/50 shadow-sm active:scale-95 transition-transform"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>
        
        <div onClick={() => navigate('/')} className="cursor-pointer">
          <AisleLogo imgClassName="h-[28px] w-auto object-contain" />
        </div>
        
        <button 
          onClick={() => navigate('/notifications')}
          className="p-2 rounded-xl bg-white border border-slate-200/50 shadow-sm relative active:scale-95 transition-transform"
        >
          <Bell className="w-5 h-5 text-slate-700" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
        </button>
      </header>

      {/* Geolocation info strip directly below Header */}
      <div className="px-5 pt-3 pb-2 text-left">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </span>
          <p className="text-[11px] font-black text-slate-900 tracking-wide">
            📍 {locationText} Live <span className="text-slate-300 mx-1">|</span> {shops.length} Shops Nearby
          </p>
        </div>
      </div>

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
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[270px] bg-[#FAF9F5] z-50 shadow-2xl p-6 border-r border-slate-200/50 flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-200/50">
                  <span className="font-black text-slate-900 tracking-tight text-lg">Discovery Menu</span>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 rounded-lg bg-slate-100"
                  >
                    <X className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
                
                <nav className="flex flex-col gap-2">
                  <button onClick={() => handleNavClick('/')} className="flex items-center gap-3 w-full text-left p-3 rounded-2xl hover:bg-slate-100/50 font-bold text-slate-700 transition-colors text-sm">
                    <Store className="w-4 h-4 text-teal-600" /> Landing Home
                  </button>
                  <button onClick={() => handleNavClick('/explore')} className="flex items-center gap-3 w-full text-left p-3 rounded-2xl hover:bg-slate-100/50 font-bold text-slate-700 transition-colors text-sm">
                    <Search className="w-4 h-4 text-orange-500" /> Discover Goods
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

      {/* 2. STICKY SEARCH BAR */}
      <div className="sticky top-0 bg-[#FAF9F5]/90 backdrop-blur-md py-3.5 z-30 px-4 shadow-sm border-b border-slate-200/40">
        <div className="relative shadow-sm rounded-3xl overflow-hidden border-2 border-slate-200 focus-within:border-teal-500 transition-colors max-w-sm mx-auto">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <Input 
            type="text" 
            placeholder="Search shops, creators, products..." 
            className="w-full pl-12 pr-4 py-6 text-sm bg-white border-none focus-visible:ring-0 rounded-none font-semibold text-slate-800"
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate(`/explore?q=${e.target.value}`);
            }}
          />
        </div>
      </div>

      {/* 3. QUICK ACTIONS STATS CAPSULES */}
      <section className="px-4 pt-4">
        <div className="flex gap-2 justify-between overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
          {[
            { label: "Shops", val: pulseStats.openShops || 8, icon: "🏪" },
            { label: "Products", val: pulseStats.liveProducts || 92, icon: "🛍️" },
            { label: "Creators", val: pulseStats.activeHomeBiz || 8, icon: "🏠" },
            { label: "New", val: pulseStats.newListings || 14, icon: "✨" }
          ].map((stat, i) => (
            <div 
              key={i} 
              className="bg-white border border-slate-200/50 px-3 py-2 rounded-2xl shadow-sm text-center flex items-center gap-1.5 min-w-[85px] justify-center snap-start"
            >
              <span className="text-xs">{stat.icon}</span>
              <div className="text-left leading-none">
                <span className="text-[10px] font-black text-slate-900 block">{stat.val}</span>
                <span className="text-[8px] font-bold text-slate-400 block">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. DISCOVERY TABS (LISTING TYPE PILLS) */}
      <section className="px-4 pt-4">
        <div className="bg-white border border-slate-200/50 p-1.5 rounded-2xl shadow-sm flex gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'All', label: '🌐 All' },
            { id: 'Retail', label: '🏪 Stores' },
            { id: 'HomeBusiness', label: '🏠 Creators' },
            { id: 'Services', label: '🛠 Services' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveShopType(tab.id)}
              className={`flex-1 px-3 py-2.5 rounded-xl text-[10px] font-black tracking-wider uppercase whitespace-nowrap active:scale-95 transition-all ${
                activeShopType === tab.id
                  ? "bg-slate-900 text-white shadow-md border-slate-900"
                  : "bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* 5. CATEGORIES & FILTERS STRIP */}
      <section className="pt-4 space-y-3">
        <div className="px-4 flex items-center justify-between gap-3">
          {/* Categories Rail */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory flex-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-[10px] font-black whitespace-nowrap tracking-wider uppercase snap-start border active:scale-95 transition-all ${
                  activeCategory === cat
                    ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Settings / Filters Trigger Button */}
          <button 
            onClick={() => setIsFilterSheetOpen(true)}
            className="flex items-center gap-1 bg-white border border-slate-200/60 px-3.5 py-2 rounded-2xl text-[10px] font-black text-slate-700 shadow-sm active:scale-95 transition-transform flex-shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
            <span>Filters</span>
          </button>
        </div>
      </section>

      {/* 6. PRODUCTS SECTION (SURFACED IMMEDIATELY BELOW CATEGORIES) */}
      <section className="px-4 py-4 space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Surfaced Live Items</p>
            <h2 className="text-base font-black text-slate-900 tracking-tight">Products Near You</h2>
          </div>
          <span className="text-[10px] font-bold text-slate-400">{products.length} products</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="h-44 bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm">
            <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-xs font-bold">No products live in this area.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {products.slice(0, 4).map((prod) => {
              const distText = prod.distance 
                ? `${prod.distance < 1000 ? prod.distance + 'm' : (prod.distance / 1000).toFixed(1) + 'km'}` 
                : 'Nearby';
              return (
                <div 
                  key={prod._id}
                  onClick={() => navigate(`/login?redirect=/product/${prod._id}`)}
                  className="bg-white border border-slate-200/50 rounded-3xl p-3 shadow-sm flex flex-col justify-between space-y-3 relative group active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <div className="h-28 w-full bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden relative flex items-center justify-center">
                    {prod.imageUrl ? (
                      <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-8 h-8 text-slate-300" />
                    )}
                    <span className="absolute bottom-2 left-2 bg-slate-900 text-white font-black text-[9px] px-2 py-0.5 rounded shadow-sm">
                      ₹{prod.price}
                    </span>
                  </div>

                  <div className="space-y-1 text-left">
                    <h4 className="font-black text-slate-800 text-[11px] line-clamp-1 leading-tight">{prod.name}</h4>
                    <p className="text-[9px] text-slate-400 font-bold leading-none">{prod.shopName}</p>
                    <div className="flex justify-between items-center pt-1 mt-1 border-t border-slate-100 text-[8px] font-black text-teal-600">
                      <span>📍 {distText}</span>
                      <span className="text-slate-400">View Shop</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 7. AIRBNB-STYLE HORIZONTAL STORE CARDS */}
      <section className="px-4 py-4 space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Discovery Shops</p>
            <h2 className="text-base font-black text-slate-900 tracking-tight mt-0.5">Shops & Creators</h2>
          </div>
          <span className="text-[10px] font-bold text-slate-400">{filteredShops.length} listings</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-24 bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse" />
            ))}
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm">
            <Store className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-xs font-bold">No stores matching current filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredShops.map((shop) => {
              const isHome = shop.category === 'Home Businesses' || shop.category === 'Homemade Food' || shop.category === 'Handmade Crafts';
              return (
                <div 
                  key={shop._id}
                  onClick={() => navigate(`/login?redirect=/shop/${shop._id}`)}
                  className="bg-white border border-slate-200/50 rounded-3xl p-3.5 shadow-sm flex gap-4 hover:shadow-md transition-shadow active:scale-[0.99] transition-transform cursor-pointer"
                >
                  {/* Left: Thumbnail image or icon fallback */}
                  <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-50 border border-slate-150 flex items-center justify-center">
                    {shop.imageUrl ? (
                      <img src={shop.imageUrl} alt={shop.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">{isHome ? '🏠' : '🏪'}</span>
                    )}
                  </div>

                  {/* Right: details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between text-left">
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[8px] font-black uppercase tracking-wider ${isHome ? 'text-pink-600 bg-pink-50' : 'text-teal-600 bg-teal-50'} px-1.5 py-0.2 rounded`}>
                          {isHome ? 'Creator' : 'Retailer'}
                        </span>
                        <div className="flex items-center gap-0.5 text-amber-500">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="text-[10px] font-black text-slate-800">{shop.rating ? Number(shop.rating).toFixed(1) : "4.8"}</span>
                        </div>
                      </div>
                      <h4 className="font-black text-xs text-slate-800 truncate">{shop.name}</h4>
                      <p className="text-[9px] text-slate-400 font-bold leading-normal truncate">{shop.address}</p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100/50 text-[9px] font-black">
                      <span className="text-slate-500">📍 {shop.distance || '0.5 km'}</span>
                      <span className={shop.isOpen ? "text-emerald-600" : "text-slate-400"}>
                        {shop.isOpen ? "● Open Now" : "● Closed"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 8. HORIZONTAL SWIPE RAILS (NETFLIX STYLE) */}
      
      {/* Rail 1: Trending Nearby */}
      <section className="py-4 space-y-3 bg-slate-100/40 border-y border-slate-200/50">
        <div className="px-4 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-rose-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Trending Nearby</h3>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 px-4 scrollbar-none snap-x snap-mandatory">
          {[
            { name: "Homemade Mango Pickles", shop: "Priya's Kitchen", views: "42 views today", price: "₹250", icon: "🌶️" },
            { name: "Custom Rakhi Set", shop: "Rakhi Craft Studio", views: "81 viewed today", price: "₹1,200", icon: "🧶" },
            { name: "Weekly Tiffin Plan", shop: "Priya's Kitchen", views: "19 orders today", price: "₹850/wk", icon: "🍱" }
          ].map((item, i) => (
            <div 
              key={i} 
              className="bg-white border border-slate-200/50 p-4 rounded-3xl shadow-sm flex flex-col justify-between space-y-4 min-w-[210px] max-w-[210px] snap-start"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div className="min-w-0 text-left">
                  <h4 className="text-xs font-black text-slate-800 truncate leading-tight">{item.name}</h4>
                  <span className="text-[9px] text-slate-400 font-bold block">{item.shop}</span>
                </div>
              </div>
              <div className="flex justify-between items-center border-t border-slate-50 pt-2 text-[9px] font-black">
                <span className="text-slate-400">{item.views}</span>
                <span className="text-teal-600">{item.price}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Rail 2: Deals Near You */}
      <section className="py-5 space-y-3">
        <div className="px-4 flex items-center gap-1.5">
          <Percent className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Deals Near You</h3>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 px-4 scrollbar-none snap-x snap-mandatory">
          {[
            { title: "10% Off Gift Boxes", desc: "Use code: CREATOR10", shop: "Rakhi Craft Studio" },
            { title: "Buy 2 Get 1 Free", desc: "Applies to Mango Pickles", shop: "Priya's Kitchen" },
            { title: "Free Cupcake with order", desc: "No minimum purchase", shop: "Sweet Whisk Bakery" }
          ].map((deal, i) => (
            <div 
              key={i} 
              className="bg-gradient-to-br from-teal-900 to-teal-950 text-white p-4 rounded-3xl shadow-md min-w-[210px] max-w-[210px] snap-start relative flex flex-col justify-between space-y-3"
            >
              <Tag className="absolute top-3 right-3 w-3.5 h-3.5 text-amber-400" />
              <div className="text-left space-y-1">
                <h4 className="text-xs font-extrabold">{deal.title}</h4>
                <p className="text-[9px] text-teal-300 font-bold leading-tight">{deal.desc}</p>
              </div>
              <span className="text-[8px] text-slate-400 font-semibold block uppercase tracking-wider text-left border-t border-teal-800/40 pt-2">{deal.shop}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Rail 3: Recommended For You */}
      <section className="py-4 space-y-3 bg-white border-y border-slate-200/50">
        <div className="px-4 flex items-center gap-1.5">
          <Star className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Recommended For You</h3>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 px-4 scrollbar-none snap-x snap-mandatory">
          {[
            { name: "Homemade Spicy Papad", rate: "⭐ 4.9", shop: "Priya's Kitchen", price: "₹120" },
            { name: "Gourmet Sweet Laddoo", rate: "⭐ 4.8", shop: "Sweet Whisk Bakery", price: "₹450" }
          ].map((sug, i) => (
            <div 
              key={i} 
              className="bg-slate-50 border border-slate-200/30 p-4 rounded-3xl shadow-sm flex flex-col justify-between space-y-4 min-w-[210px] max-w-[210px] snap-start"
            >
              <div className="text-left space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded">{sug.rate}</span>
                  <span className="text-xs font-black text-slate-800">{sug.price}</span>
                </div>
                <h4 className="text-xs font-black text-slate-800 truncate leading-tight">{sug.name}</h4>
                <span className="text-[9px] text-slate-400 font-bold block">{sug.shop}</span>
              </div>
              <button 
                onClick={() => navigate('/explore')}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[9px] rounded-xl uppercase tracking-wider"
              >
                Add To Cart
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 9. FLOATING LIVE ACTIVITY TOAST */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-20 left-4 right-4 z-40 bg-slate-900/90 text-white text-[10px] font-bold py-3 px-4 rounded-2xl shadow-xl border border-slate-700/50 backdrop-blur-md flex items-center gap-2 max-w-sm mx-auto"
          >
            <Activity className="w-3.5 h-3.5 text-teal-400 animate-pulse flex-shrink-0" />
            <span className="text-slate-100 tracking-wide font-medium truncate text-left">
              {liveEvents[liveIndex]}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 10. ACCORDION MOBILE FOOTER */}
      <footer className="px-5 py-6 mt-6 border-t border-slate-200/50 bg-slate-100/40 space-y-3 text-left">
        
        {/* Explore Links */}
        <div className="border-b border-slate-200/40 pb-2">
          <button 
            onClick={() => toggleFooter('explore')}
            className="w-full flex justify-between items-center text-xs font-black text-slate-800 py-1"
          >
            <span>Explore Options</span>
            {footerOpen.explore ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          <AnimatePresence>
            {footerOpen.explore && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="pl-2 py-1 flex flex-col gap-1.5 text-[10px] text-slate-500 font-bold"
              >
                <button onClick={() => navigate('/explore')} className="text-left hover:text-teal-600 transition-colors">Discover Shops</button>
                <button onClick={() => navigate('/homemade')} className="text-left hover:text-teal-600 transition-colors">Handcrafted Goods</button>
                <button onClick={() => navigate('/services')} className="text-left hover:text-teal-600 transition-colors">Local Handymen</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Business Links */}
        <div className="border-b border-slate-200/40 pb-2">
          <button 
            onClick={() => toggleFooter('business')}
            className="w-full flex justify-between items-center text-xs font-black text-slate-800 py-1"
          >
            <span>For Creators & Businesses</span>
            {footerOpen.business ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          <AnimatePresence>
            {footerOpen.business && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="pl-2 py-1 flex flex-col gap-1.5 text-[10px] text-slate-500 font-bold"
              >
                <button onClick={() => navigate('/for-shops')} className="text-left hover:text-teal-600 transition-colors">Register Shop</button>
                <button onClick={() => navigate('/home-business')} className="text-left hover:text-teal-600 transition-colors">Home Kitchen Program</button>
                <button onClick={() => navigate('/guide')} className="text-left hover:text-teal-600 transition-colors">Creator Guide</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* About Links */}
        <div className="border-b border-slate-200/40 pb-2">
          <button 
            onClick={() => toggleFooter('about')}
            className="w-full flex justify-between items-center text-xs font-black text-slate-800 py-1"
          >
            <span>About & Support</span>
            {footerOpen.about ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          <AnimatePresence>
            {footerOpen.about && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="pl-2 py-1 flex flex-col gap-1.5 text-[10px] text-slate-500 font-bold"
              >
                <button onClick={() => navigate('/about')} className="text-left hover:text-teal-600 transition-colors">Our Vision</button>
                <button onClick={() => navigate('/contact')} className="text-left hover:text-teal-600 transition-colors">Contact Support</button>
                <button onClick={() => navigate('/terms-of-service')} className="text-left hover:text-teal-600 transition-colors">Terms of Service</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="text-center pt-2 space-y-1">
          <p className="text-[10px] text-slate-500 font-bold">© Aisle 2026</p>
          <p className="text-[8px] text-slate-400">Discover and verify neighborhood creators.</p>
        </div>
      </footer>

      {/* 11. FILTERS SLIDING BOTTOM SHEET MODAL */}
      <AnimatePresence>
        {isFilterSheetOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterSheetOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-sm"
            />
            {/* Slide-up sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#FAF9F5] rounded-t-[30px] p-6 shadow-2xl border-t border-slate-200 flex flex-col max-h-[85vh] overflow-y-auto"
            >
              {/* Grab handle */}
              <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-4" />
              
              <div className="flex justify-between items-center pb-4 border-b border-slate-200/40 text-left">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-teal-600" /> Advanced Filters
                </h3>
                <button 
                  onClick={() => setIsFilterSheetOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-100 text-slate-700 active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Advanced Form Options */}
              <div className="py-4 space-y-6 text-left">
                
                {/* Distance Option */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Distance Radius</span>
                  <div className="flex gap-2">
                    {[
                      { id: 'All', label: 'All Distances' },
                      { id: '2km', label: 'Within 2 km' },
                      { id: '5km', label: 'Within 5 km' }
                    ].map(opt => (
                      <button 
                        key={opt.id} 
                        onClick={() => setFilterDistance(opt.id)}
                        className={`px-4 py-2.5 rounded-2xl text-[10px] font-black border transition-all ${
                          filterDistance === opt.id 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                            : 'bg-white text-slate-500 border-slate-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Switch Toggles */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Quick Toggles</span>
                  
                  {/* Open Now Toggle */}
                  <div className="flex justify-between items-center p-3 bg-white rounded-2xl border border-slate-200/50">
                    <div>
                      <h4 className="text-xs font-black text-slate-800">Open Stores Only</h4>
                      <p className="text-[9px] text-slate-400 font-semibold leading-none mt-0.5">Show only stores currently active.</p>
                    </div>
                    <button 
                      onClick={() => setFilterOpenOnly(!filterOpenOnly)}
                      className={`w-11 h-6 rounded-full p-1 transition-colors relative flex items-center ${filterOpenOnly ? 'bg-emerald-500 justify-end' : 'bg-slate-200 justify-start'}`}
                    >
                      <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" />
                    </button>
                  </div>

                  {/* Home Businesses Only Toggle */}
                  <div className="flex justify-between items-center p-3 bg-white rounded-2xl border border-slate-200/50">
                    <div>
                      <h4 className="text-xs font-black text-slate-800">Home Creators Only</h4>
                      <p className="text-[9px] text-slate-400 font-semibold leading-none mt-0.5">Show only local homemade crafts & food.</p>
                    </div>
                    <button 
                      onClick={() => setFilterHomeOnly(!filterHomeOnly)}
                      className={`w-11 h-6 rounded-full p-1 transition-colors relative flex items-center ${filterHomeOnly ? 'bg-pink-500 justify-end' : 'bg-slate-200 justify-start'}`}
                    >
                      <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" />
                    </button>
                  </div>

                  {/* Highest Rated Toggle */}
                  <div className="flex justify-between items-center p-3 bg-white rounded-2xl border border-slate-200/50">
                    <div>
                      <h4 className="text-xs font-black text-slate-800">Highest Rated (4.8+)</h4>
                      <p className="text-[9px] text-slate-400 font-semibold leading-none mt-0.5">Sort listings by customer ratings.</p>
                    </div>
                    <button 
                      onClick={() => setFilterHighestRated(!filterHighestRated)}
                      className={`w-11 h-6 rounded-full p-1 transition-colors relative flex items-center ${filterHighestRated ? 'bg-amber-500 justify-end' : 'bg-slate-200 justify-start'}`}
                    >
                      <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" />
                    </button>
                  </div>
                </div>

                {/* Price Range */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Price Filter</span>
                  <div className="flex gap-2">
                    {[
                      { id: 'All', label: 'All Prices' },
                      { id: 'Low', label: 'Under ₹200' },
                      { id: 'Mid', label: '₹200 - ₹500' }
                    ].map(opt => (
                      <button 
                        key={opt.id} 
                        onClick={() => setSelectedPrice(opt.id)}
                        className={`px-4 py-2.5 rounded-2xl text-[10px] font-black border transition-all ${
                          selectedPrice === opt.id 
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                            : 'bg-white text-slate-500 border-slate-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex gap-3 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilterDistance('All');
                    setFilterOpenOnly(false);
                    setFilterHomeOnly(false);
                    setFilterHighestRated(false);
                    setSelectedPrice('All');
                  }}
                  className="flex-1 py-5 rounded-2xl border-slate-350 font-bold text-slate-700 active:scale-95"
                >
                  Reset All
                </Button>
                <Button 
                  onClick={() => setIsFilterSheetOpen(false)}
                  className="flex-1 py-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold active:scale-95"
                >
                  Apply Filters
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default MobileExplore;
