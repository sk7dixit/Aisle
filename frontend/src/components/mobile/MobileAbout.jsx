import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Store, ShoppingBag, MessageSquare, Clock, 
  ArrowRight, Shield, Zap, Users, Award, TrendingUp, 
  Sparkles, Check, CheckCircle, DollarSign, Activity, 
  ChevronRight, LineChart, Star, Compass, Heart, Calendar,
  Menu, X, HelpCircle, ChevronDown, ChevronUp, Info, Smile
} from 'lucide-react';
import AisleLogo from '../AisleLogo';
import { Button } from '../ui/button';

// Animated Counter subcomponent
const AnimatedCounter = ({ value, suffix = "", prefix = "", duration = 1000 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value.replace(/[^0-9]/g, ''));
    if (isNaN(end) || start === end) {
      setCount(value);
      return;
    }
    const totalMiliseconds = duration;
    const incrementTime = Math.max(Math.floor(totalMiliseconds / end), 10);
    const step = Math.ceil(end / (totalMiliseconds / incrementTime));
    
    let timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, incrementTime);
    return () => clearInterval(timer);
  }, [value, duration]);

  const formatted = typeof count === 'number' ? count.toLocaleString('en-IN') : count;
  return <span>{prefix}{formatted}{suffix}</span>;
};

const MobileAbout = () => {
  const navigate = useNavigate();

  // Navigation Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Section 11: Segmented CTA selection state ('customer' | 'business' | 'creator')
  const [selectedRole, setSelectedRole] = useState('customer');

  // Section 10: Active city statistics simulation state
  const [cityStats, setCityStats] = useState({
    shops: 192,
    products: 4875,
    homeBiz: 43
  });

  // Footer Accordion State
  const [footerOpen, setFooterOpen] = useState({ about: false, builtFor: false, stats: false, join: false });

  // Simulate minor live ticking counters for Vadodara Pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setCityStats(prev => ({
        shops: prev.shops + (Math.random() > 0.8 ? 1 : 0),
        products: prev.products + (Math.random() > 0.5 ? Math.floor(Math.random() * 3) + 1 : 0),
        homeBiz: prev.homeBiz + (Math.random() > 0.95 ? 1 : 0)
      }));
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const discoveryGaps = [
    {
      title: "Customer Problem",
      phase: "Before Aisle",
      desc: "Needs a phone charger immediately. Searches online. Waits 2 days for warehouse dispatch from hundreds of kilometers away.",
      icon: "❌",
      color: "border-rose-150 bg-rose-50/10"
    },
    {
      title: "Seller Problem",
      phase: "Before Aisle",
      desc: "Has the phone charger sitting right on the shelf in the local lane. But no nearby online searchers know it is available.",
      icon: "❌",
      color: "border-rose-150 bg-rose-50/10"
    },
    {
      title: "Connected Discovery",
      phase: "With Aisle",
      desc: "Customer searches nearby, locates the charger 300m away, chats directly to confirm stock, and picks it up in minutes.",
      icon: "✅",
      color: "border-teal-150 bg-teal-50/10"
    }
  ];

  const whyBuiltBullets = [
    { num: "1", title: "Local products stay invisible", desc: "Items on nearby shelves aren't mapped online." },
    { num: "2", title: "Nearby customers cannot discover them", desc: "No tool connects real-time local supply with immediate demand." },
    { num: "3", title: "Large marketplaces dominate search", desc: "Algorithms prioritize remote warehouse cargo dispatch." },
    { num: "4", title: "Aisle connects local demand and supply", desc: "Creating a direct neighborhood bridge for immediate fulfillment." }
  ];

  const metricsStats = [
    { count: "200+", label: "Businesses Onboarded", icon: <Store className="w-5 h-5 text-teal-650" /> },
    { count: "5000+", label: "Products Listed", icon: <ShoppingBag className="w-5 h-5 text-rose-500" /> },
    { count: "50+", label: "Home Businesses", icon: <Sparkles className="w-5 h-5 text-pink-650" /> },
    { count: "3+", label: "Cities Covered", icon: <MapPin className="w-5 h-5 text-amber-500" /> }
  ];

  const ecosystemEmpower = [
    { title: "Customers", desc: "Find items nearby, chat directly, and collect same-day.", icon: <Users className="w-5 h-5 text-teal-600" /> },
    { title: "Businesses", desc: "Get mapped instantly, attract footfall, and pay 0% commissions.", icon: <Store className="w-5 h-5 text-amber-600" /> },
    { title: "Creators", desc: "Sell home-cooked foods or crafts with flexible prep times.", icon: <Sparkles className="w-5 h-5 text-pink-650" /> },
    { title: "Sellers", desc: "Connect directly with local searchers for services and goods.", icon: <Zap className="w-5 h-5 text-rose-500" /> }
  ];

  const comparisonSlides = [
    { title: "Warehouse vs Pickup", feature: "Warehouse First", traditional: "2-5 day delivery logisitics", aisle: "Same Day Pickup" },
    { title: "Competition Scope", feature: "Competition", traditional: "National market matching", aisle: "Hyperlocal relevance" },
    { title: "Transaction Model", feature: "Direct Connection", traditional: "Broker middleman filters", aisle: "Direct buyer-seller chat" }
  ];

  const homeBusinessMovement = [
    { title: "Homemade Food", icon: "🌶️", desc: "Empowering chefs preparing traditional recipe pickles, dry snacks, and custom tiffins.", badge: "Food Creator" },
    { title: "Handmade Crafts", icon: "🧶", desc: "Providing gallery profiles for artisans making rakhis, gift boxes, and crochet bags.", badge: "Craft Creator" },
    { title: "Women Entrepreneurs", icon: "👩‍💼", desc: "Allowing home makers to list items, set custom prep times, and sell independently.", badge: "Home Advocate" }
  ];

  const growthTimeline = [
    { year: "2025", title: "Idea Conception", desc: "Founded Aisle to bridge the neighborhood discovery gap." },
    { year: "2026", title: "First Businesses", desc: "Onboarded first 100 retail merchants in Vadodara." },
    { year: "Mid 2026", title: "Home Creator Launch", desc: "Enabled custom recipe and handmade listings." },
    { year: "Late 2026", title: "AI Discovery", desc: "Introduced location-routing and stock confidence indices." },
    { year: "2027", title: "Expansion", desc: "Expanding services across 5 regional hubs." }
  ];

  const toggleFooter = (section) => {
    setFooterOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleMenuNavigation = (path) => {
    setIsDrawerOpen(false);
    navigate(path);
  };

  return (
    <div className="bg-[#FAF9F5] min-h-screen text-slate-800 relative overflow-x-hidden font-sans pb-10">
      
      {/* MOBILE HEADER */}
      <header className="sticky top-0 bg-[#FAF9F5]/90 backdrop-blur-md z-40 border-b border-slate-200/50 py-3.5 px-4 flex justify-between items-center shadow-sm">
        <div onClick={() => navigate('/')} className="cursor-pointer">
          <AisleLogo imgClassName="h-[32px] w-auto object-contain" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-black text-emerald-700 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span>LIVE</span>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-1.5 rounded-xl bg-white border border-slate-200/50 shadow-sm active:scale-95 transition-transform"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
        </div>
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
                  <button onClick={() => handleMenuNavigation('/')} className="flex items-center gap-3 w-full text-left p-3 rounded-2xl hover:bg-slate-100/50 font-bold text-slate-700 transition-colors text-sm">
                    <Heart className="w-4 h-4 text-emerald-600" /> Home
                  </button>
                  <button onClick={() => handleMenuNavigation('/explore')} className="flex items-center gap-3 w-full text-left p-3 rounded-2xl hover:bg-slate-100/50 font-bold text-slate-700 transition-colors text-sm">
                    <Compass className="w-4 h-4 text-teal-600" /> Explore
                  </button>
                  <button onClick={() => handleMenuNavigation('/for-shops')} className="flex items-center gap-3 w-full text-left p-3 rounded-2xl hover:bg-slate-100/50 font-bold text-slate-700 transition-colors text-sm">
                    <Store className="w-4 h-4 text-teal-600" /> For Businesses
                  </button>
                  <button onClick={() => handleMenuNavigation('/home-business')} className="flex items-center gap-3 w-full text-left p-3 rounded-2xl hover:bg-slate-100/50 font-bold text-slate-700 transition-colors text-sm">
                    <Sparkles className="w-4 h-4 text-rose-500" /> Home Businesses
                  </button>
                  <button onClick={() => handleMenuNavigation('/how-it-works')} className="flex items-center gap-3 w-full text-left p-3 rounded-2xl hover:bg-slate-100/50 font-bold text-slate-700 transition-colors text-sm">
                    <Clock className="w-4 h-4 text-amber-500" /> How It Works
                  </button>
                </nav>
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-200/50">
                <Button 
                  onClick={() => handleMenuNavigation('/login')}
                  variant="outline" 
                  className="w-full py-5 rounded-2xl border-slate-300 font-bold text-slate-700"
                >
                  Login
                </Button>
                <Button 
                  onClick={() => handleMenuNavigation('/seller/register')}
                  className="w-full py-5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Get Started
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 1. HERO SECTION */}
      <section className="px-5 pt-3 pb-6 text-center space-y-6 max-w-[90%] mx-auto">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-black uppercase tracking-wider shadow-sm">
            <Compass className="w-3.5 h-3.5" /> Our Mission & Vision
          </div>
          
          <h1 className="text-[32px] font-black leading-[1.15] tracking-tight text-slate-900">
            The Internet Helped Big Stores. We Are Building It For Local Ones.
          </h1>
          
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Millions of products exist just a few streets away, yet customers cannot discover them online. Aisle bridges that gap by mapping local inventories in real time.
          </p>

          <div className="pt-2">
            <Button 
              onClick={() => {
                const el = document.getElementById('mobile-timeline');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-[200px] h-[52px] bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-2xl shadow-md uppercase tracking-wider mx-auto"
            >
              Discover Aisle
            </Button>
          </div>
        </div>
      </section>

      {/* 2. DISCOVERY GAP SECTION (SWIPE CARDS) */}
      <section className="px-5 py-16 space-y-4">
        <div className="text-left space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">The Local Gap</span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Discovery Swipe Journey</h2>
        </div>

        {/* Swipe cards wrapper */}
        <div className="flex gap-4 overflow-x-auto pb-4 px-1 scrollbar-none snap-x snap-mandatory">
          {discoveryGaps.map((card, i) => (
            <div 
              key={i}
              className={`border p-5 rounded-[20px] shadow-sm min-w-[280px] max-w-[280px] snap-start text-left space-y-3 flex flex-col justify-between h-[180px] ${card.color}`}
            >
              <div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <h4 className="font-extrabold text-xs text-slate-800">{card.title}</h4>
                  <span className="text-[8px] font-black uppercase text-slate-400">{card.phase}</span>
                </div>
                <p className="text-[10.5px] text-slate-500 font-semibold leading-relaxed pt-2">
                  {card.desc}
                </p>
              </div>
              <span className="text-lg text-right block">{card.icon}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. MISSION & VISION SECTION */}
      <section className="px-5 py-16 space-y-4">
        <div className="text-left space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Our Focus</span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Mission & Vision</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Mission */}
          <div className="bg-white border border-slate-200/50 p-5 rounded-[20px] shadow-sm text-left space-y-2 relative overflow-hidden border-t-4 border-t-teal-650 border-t-teal-600">
            <h4 className="font-extrabold text-[10px] text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4.5 h-4.5" /> Our Mission
            </h4>
            <h3 className="font-extrabold text-xs text-slate-800 tracking-tight">Help people discover local inventory instantly.</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">We map neighborhoods so users never have to wait for warehouse shipping when the product is already next door.</p>
          </div>

          {/* Vision */}
          <div className="bg-white border border-slate-200/50 p-5 rounded-[20px] shadow-sm text-left space-y-2 relative overflow-hidden border-t-4 border-t-pink-500">
            <h4 className="font-extrabold text-[10px] text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4.5 h-4.5" /> Our Vision
            </h4>
            <h3 className="font-extrabold text-xs text-slate-800 tracking-tight">Create the largest real-time local commerce network.</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">Empower local retailers and home business creators with robust tools to chat, quote pricing, and grow sustainably.</p>
          </div>
        </div>
      </section>

      {/* 4. METRICS SECTION (2X2 GRID) */}
      <section className="px-5 py-16 space-y-4">
        <div className="text-left space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Trust Statistics</span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Growing Every Single Day</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {metricsStats.map((counter, i) => (
            <div key={i} className="bg-white border border-slate-200/50 rounded-[20px] p-4.5 shadow-sm text-center flex flex-col items-center justify-center space-y-1">
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 mb-1">
                {counter.icon}
              </div>
              <span className="text-lg font-black text-slate-900 leading-none">
                <AnimatedCounter value={counter.count} suffix="" duration={1000} />
              </span>
              <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block text-center leading-tight">
                {counter.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 5. WHO WE EMPOWER SECTION (2X2 ECOSYSTEM) */}
      <section className="px-5 py-16 space-y-4">
        <div className="text-left space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Ecosystem Wheel</span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Who We Empower</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {ecosystemEmpower.map((card, i) => (
            <div key={i} className="bg-white border border-slate-200/50 rounded-[20px] p-4.5 shadow-sm text-left flex flex-col justify-between space-y-3.5">
              <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl w-fit">
                {card.icon}
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-[11px] text-slate-850 tracking-tight leading-tight">{card.title}</h4>
                <p className="text-[9.5px] text-slate-500 font-semibold leading-relaxed">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. VADODARA HUB PULSE (MOVED HIGHER UP) */}
      <section className="px-5 py-16">
        <div className="bg-slate-900 border border-slate-800 text-white rounded-[20px] p-5 shadow-lg text-left space-y-4 relative overflow-hidden">
          <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-teal-650/5 rounded-full"></div>
          
          <div className="space-y-1 border-b border-slate-800 pb-2">
            <span className="text-[8.5px] font-black text-teal-400 uppercase tracking-widest block">Active Regional Hub</span>
            <h3 className="text-base font-black tracking-tight flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
              </span>
              <span>Vadodara Hub Pulse</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold">Live regional telemetry tracking active nodes</p>
          </div>

          {/* 3 equal cards layout */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-850 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-xs font-black text-slate-100 block">
                <AnimatedCounter value={String(cityStats.shops)} duration={900} />
              </span>
              <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Shops</span>
            </div>
            
            <div className="bg-slate-850 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-xs font-black text-teal-400 block">
                <AnimatedCounter value={String(cityStats.products)} duration={950} />
              </span>
              <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Products</span>
            </div>

            <div className="bg-slate-850 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-xs font-black text-pink-500 block">
                <AnimatedCounter value={String(cityStats.homeBiz)} duration={1000} />
              </span>
              <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Home Biz</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PHILOSOPHY QUOTE MANIFESTO CARD */}
      <section className="px-5 py-16 text-center">
        <div className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm relative overflow-hidden text-center space-y-4">
          <Heart className="w-8 h-8 text-rose-500 fill-rose-100 mx-auto animate-pulse" />
          <h3 className="text-[22px] font-black text-slate-800 leading-tight">
            "Aisle is built for the neighborhood. Built for the business owner. Built for the creator working from home. Built for the customer who needs something today."
          </h3>
          <div className="w-10 h-0.5 bg-rose-200 mx-auto"></div>
          <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest block">The Aisle Product Philosophy</span>
        </div>
      </section>

      {/* 8. WHY WE BUILT AISLE TIMELINE BULLETS */}
      <section className="px-5 py-16 space-y-6">
        <div className="text-left space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Our Core Why</span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Why We Built Aisle</h2>
        </div>

        <div className="space-y-4">
          {whyBuiltBullets.map((bullet, idx) => (
            <div key={idx} className="flex gap-3 text-left">
              <div className="w-6 h-6 rounded-full bg-teal-50 border border-teal-150 text-teal-700 text-xs font-black flex items-center justify-center flex-shrink-0">
                0{bullet.num}
              </div>
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-xs text-slate-800">{bullet.title}</h4>
                <p className="text-[10.5px] text-slate-500 font-semibold leading-relaxed">{bullet.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. COMPARISON (AISLE VS TRADITIONAL) */}
      <section className="px-5 py-16 space-y-4">
        <div className="text-left space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">How we compare</span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Traditional vs Aisle</h2>
        </div>

        {/* Comparison Swipe Track */}
        <div className="flex gap-4 overflow-x-auto pb-4 px-1 scrollbar-none snap-x snap-mandatory">
          {comparisonSlides.map((slide, i) => (
            <div 
              key={i}
              className="bg-white border border-slate-200/50 p-5 rounded-[20px] shadow-sm flex flex-col justify-between space-y-4 min-w-[250px] max-w-[250px] snap-start text-left"
            >
              <div className="space-y-1 border-b border-slate-100 pb-2">
                <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider block">Feature</span>
                <h4 className="font-extrabold text-xs text-slate-800 tracking-tight">{slide.feature}</h4>
              </div>

              <div className="space-y-2.5">
                <div className="space-y-0.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-wider block">Traditional E-Commerce</span>
                  <p className="text-xs text-slate-500 font-semibold leading-tight">{slide.traditional}</p>
                </div>
                <div className="space-y-0.5 bg-teal-50/20 p-2 rounded-xl border border-teal-100/50">
                  <span className="text-[7px] font-black text-teal-650 uppercase tracking-wider block">Aisle Network</span>
                  <p className="text-xs text-teal-950 font-black leading-tight">{slide.aisle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 10. EMPOWERING HOME BUSINESS MOVEMENT (HORIZONTAL SCROLL) */}
      <section className="px-5 py-16 space-y-4">
        <div className="text-left space-y-1">
          <span className="text-[9px] font-black text-[#C95B42] bg-orange-50 border border-orange-100 px-3 py-1 rounded-full uppercase tracking-widest inline-block shadow-sm">
            Creator Advocacy
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Empowering Home Businesses</h2>
        </div>

        {/* Scrollable track of 280px wide cards */}
        <div className="flex gap-4 overflow-x-auto pb-4 px-1 scrollbar-none snap-x snap-mandatory">
          {homeBusinessMovement.map((card, i) => (
            <div 
              key={i}
              className="bg-white border border-slate-200/50 p-5 rounded-[20px] shadow-sm flex flex-col justify-between space-y-5 min-w-[280px] max-w-[280px] snap-start text-left h-[180px]"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg shadow-inner">
                    {card.icon}
                  </div>
                  <span className="text-[8px] font-black bg-pink-50 border border-pink-100 text-pink-700 px-2 py-0.5 rounded-full uppercase">
                    {card.badge}
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-800 leading-tight">{card.title}</h4>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 11. GROWTH TIMELINE (LINKEDIN STYLE) */}
      <section id="mobile-timeline" className="px-5 py-16 space-y-6">
        <div className="text-left space-y-1">
          <span className="text-[9px] font-black text-slate-455 uppercase tracking-widest block">Our Milestones</span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Growth Timeline</h2>
        </div>

        <div className="relative pl-6 py-2 space-y-6 text-left">
          {/* timeline line */}
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200"></div>

          {growthTimeline.map((item, idx) => (
            <div key={idx} className="relative pl-6 space-y-1">
              {/* timeline marker dot */}
              <div className="absolute -left-[22px] top-1.5 w-3.5 h-3.5 rounded-full bg-teal-500 border-2 border-white flex items-center justify-center shadow">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              </div>
              <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest block">{item.year}</span>
              <h4 className="font-extrabold text-xs text-slate-800">{item.title}</h4>
              <p className="text-[10.5px] text-slate-500 font-semibold leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 12. FINAL CTA WITH SEGMENTED ROLE SELECTOR */}
      <section className="px-5 py-8 space-y-6 max-w-sm mx-auto text-left">
        <div className="bg-gradient-to-br from-teal-900 via-teal-950 to-slate-900 text-white rounded-[20px] p-6 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-teal-850/15 rounded-full pointer-events-none" />
          
          <div className="space-y-1.5 relative z-10 border-b border-teal-850 pb-4">
            <span className="text-[8.5px] font-black text-teal-300 uppercase tracking-widest block">Get Connected</span>
            <h2 className="text-xl font-black tracking-tight leading-tight">Join The Local Commerce Network</h2>
            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
              Select your path below to get started immediately. Free setup, neighborhood focus.
            </p>
          </div>

          {/* Segmented Selector */}
          <div className="bg-slate-950/60 p-1 rounded-2xl border border-slate-800/80 flex gap-1 relative z-10">
            {['customer', 'business', 'creator'].map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                  selectedRole === role 
                    ? 'bg-teal-600 text-white shadow' 
                    : 'text-slate-400 bg-transparent hover:text-slate-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="relative z-10 pt-2">
            <AnimatePresence mode="wait">
              {selectedRole === 'customer' && (
                <motion.div
                  key="customer"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                >
                  <Button
                    onClick={() => navigate('/explore')}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-black text-xs py-5 rounded-xl shadow uppercase tracking-wider"
                  >
                    Explore Nearby Businesses
                  </Button>
                </motion.div>
              )}

              {selectedRole === 'business' && (
                <motion.div
                  key="business"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                >
                  <Button
                    onClick={() => navigate('/seller/register')}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-black text-xs py-5 rounded-xl shadow uppercase tracking-wider"
                  >
                    Start Your Business
                  </Button>
                </motion.div>
              )}

              {selectedRole === 'creator' && (
                <motion.div
                  key="creator"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                >
                  <Button
                    onClick={() => navigate('/home-business')}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-5 rounded-xl shadow uppercase tracking-wider"
                  >
                    Start Home Business
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* MOBILE FOOTER ACCORDION */}
      <footer className="px-5 py-6 mt-8 border-t border-slate-200/50 bg-slate-100/40 space-y-3.5 text-left">
        {/* About */}
        <div className="border-b border-slate-200/40 pb-2.5">
          <button 
            onClick={() => toggleFooter('about')}
            className="w-full flex justify-between items-center text-xs font-black text-slate-800 py-1"
          >
            <span>About Aisle</span>
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
                <button onClick={() => navigate('/careers')} className="text-left hover:text-teal-600 transition-colors">Careers</button>
                <button onClick={() => navigate('/contact')} className="text-left hover:text-teal-600 transition-colors">Contact Support</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Built For */}
        <div className="border-b border-slate-200/40 pb-2.5">
          <button 
            onClick={() => toggleFooter('builtFor')}
            className="w-full flex justify-between items-center text-xs font-black text-slate-800 py-1"
          >
            <span>Built For</span>
            {footerOpen.builtFor ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          <AnimatePresence>
            {footerOpen.builtFor && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="pl-2 py-1 flex flex-col gap-1.5 text-[10px] text-slate-500 font-bold"
              >
                <button onClick={() => navigate('/for-shops')} className="text-left hover:text-teal-600 transition-colors">Local Retailers</button>
                <button onClick={() => navigate('/home-business')} className="text-left hover:text-teal-600 transition-colors">Artisans & Bakers</button>
                <button onClick={() => navigate('/services')} className="text-left hover:text-teal-600 transition-colors">Independent Contractors</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats */}
        <div className="border-b border-slate-200/40 pb-2.5">
          <button 
            onClick={() => toggleFooter('stats')}
            className="w-full flex justify-between items-center text-xs font-black text-slate-800 py-1"
          >
            <span>Growing Every Day</span>
            {footerOpen.stats ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          <AnimatePresence>
            {footerOpen.stats && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="pl-2 py-1 space-y-1.5 text-[10px] text-slate-500 font-bold"
              >
                <p>● 50,000+ Products Live Near You</p>
                <p>● 2,000+ Local Businesses Verified</p>
                <p>● 500+ Active Neighborhood Creators</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Community */}
        <div className="border-b border-slate-200/40 pb-2.5">
          <button 
            onClick={() => toggleFooter('join')}
            className="w-full flex justify-between items-center text-xs font-black text-slate-800 py-1"
          >
            <span>Join Community</span>
            {footerOpen.join ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          <AnimatePresence>
            {footerOpen.join && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="pl-2 py-1 flex flex-col gap-1.5 text-[10px] text-slate-500 font-bold"
              >
                <button onClick={() => navigate('/guide')} className="text-left hover:text-teal-600 transition-colors">Seller Guidebook</button>
                <button onClick={() => navigate('/demo')} className="text-left hover:text-teal-600 transition-colors">Live Simulation Demo</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="text-center pt-4 space-y-1">
          <p className="text-[10px] text-slate-500 font-bold">© Aisle 2026</p>
          <p className="text-[8px] text-slate-400">Verifiably connecting neighborhood creators and customers.</p>
        </div>
      </footer>

    </div>
  );
};

export default MobileAbout;
