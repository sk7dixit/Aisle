import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Store, ShoppingBag, MessageSquare, CheckCircle, 
  Clock, ArrowRight, Shield, Zap, Users, Award, 
  Sparkles, HelpCircle, Activity, ChevronDown, ChevronUp,
  X, Check, AlertCircle, Play, ArrowLeft, ArrowRight as ArrowRightIcon,
  Menu, Info, Smile
} from 'lucide-react';
import AisleLogo from '../AisleLogo';
import { Button } from '../ui/button';

const MobileHowItWorks = () => {
  const navigate = useNavigate();

  // Navigation Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Journey Tab State ('customer' | 'seller')
  const [journeyTab, setJourneyTab] = useState('customer');

  // Journey Step Accordion State
  const [activeStep, setActiveStep] = useState(1);

  // Instagram Story State
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const storyDuration = 5000; // 5 seconds per story slide

  // Sticky Progress Indicator Active Section State
  const [activeSection, setActiveSection] = useState('hero');

  const storySlides = [
    {
      title: "🥭 The Need",
      tagline: "Custom Cravings",
      desc: "Priya wanted home-cooked, low-sodium Mango Pickles for her family.",
      bg: "from-amber-500/20 to-orange-500/10",
      color: "text-amber-600",
      icon: "🥭",
      badge: "Step 1: The Request"
    },
    {
      title: "🔍 The Scan",
      tagline: "Real-time Matching",
      desc: "Aisle scanned her 2km radius and found Priya's Kitchen with live stock.",
      bg: "from-teal-500/20 to-emerald-500/10",
      color: "text-teal-600",
      icon: "🔍",
      badge: "Step 2: Hyperlocal Scan"
    },
    {
      title: "💬 Direct Quote",
      tagline: "Conversational Deal",
      desc: "She sent a custom request for low salt and received an instant quote of ₹250.",
      bg: "from-[#E07A5F]/20 to-coral-500/10",
      color: "text-[#E07A5F]",
      icon: "💬",
      badge: "Step 3: Direct Chat"
    },
    {
      title: "🤝 The Handshake",
      tagline: "Completed Safely",
      desc: "Priya walked down, scanned the seller's QR code, and picked up her fresh jar.",
      bg: "from-emerald-500/20 to-cyan-500/10",
      color: "text-emerald-600",
      icon: "🤝",
      badge: "Step 4: Same-day Collect"
    }
  ];

  // Auto-play Instagram story
  useEffect(() => {
    let startTime = Date.now();
    let animationFrame;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / storyDuration) * 100, 100);
      setStoryProgress(progress);

      if (progress >= 100) {
        setStoryIndex(prev => (prev + 1) % storySlides.length);
        startTime = Date.now();
        setStoryProgress(0);
      }
      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationFrame);
  }, [storyIndex]);

  const handleStoryTap = (direction) => {
    setStoryProgress(0);
    if (direction === 'next') {
      setStoryIndex(prev => (prev + 1) % storySlides.length);
    } else {
      setStoryIndex(prev => (prev - 1 + storySlides.length) % storySlides.length);
    }
  };

  // Scroll listener for Sticky Progress Indicator
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['mobile-hero', 'mobile-journey', 'mobile-story', 'mobile-creators', 'mobile-compare', 'mobile-start'];
      const scrollPos = window.scrollY + 200;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section.replace('mobile-', ''));
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (secName) => {
    const el = document.getElementById(`mobile-${secName}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Stats Grid data
  const stats = [
    { val: "50K+", label: "Products Live", desc: "Updated hourly", icon: ShoppingBag, color: "text-teal-600 bg-teal-50" },
    { val: "2K+", label: "Local Shops", desc: "Verified businesses", icon: Store, color: "text-amber-600 bg-amber-50" },
    { val: "500+", label: "Home Creators", desc: "Makers & chefs", icon: Sparkles, color: "text-pink-650 bg-pink-50" },
    { val: "24/7", label: "Discovery", desc: "Real-time updates", icon: Clock, color: "text-indigo-600 bg-indigo-50" }
  ];

  // Customer steps config
  const customerSteps = [
    {
      index: 1,
      title: "Allow Location",
      desc: "Aisle scans your neighborhood to locate nearby products instantly.",
      time: "5 sec",
      preview: (
        <div className="w-full space-y-3 p-3 bg-white border border-teal-150 rounded-2xl shadow-sm">
          <div className="relative w-16 h-16 mx-auto rounded-full border border-teal-200/50 bg-teal-50/20 flex items-center justify-center overflow-hidden">
            <div className="absolute w-14 h-14 rounded-full bg-teal-500/10 animate-ping"></div>
            <MapPin className="w-6 h-6 text-teal-600 relative z-10" />
          </div>
          <div className="text-center">
            <span className="text-[8px] font-black text-teal-700 uppercase tracking-wider block">Scanning Vadodara</span>
            <span className="text-[10px] text-slate-700 font-extrabold">📍 Alkapuri Area</span>
          </div>
        </div>
      )
    },
    {
      index: 2,
      title: "Browse Nearby",
      desc: "Explore fresh meals, groceries, or handmade crafts in one place.",
      time: "1 min",
      preview: (
        <div className="w-full space-y-2 p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-left">
          <span className="text-[8px] font-black text-slate-400 uppercase">Shops Near You</span>
          <div className="border border-teal-150 bg-teal-50/10 rounded-xl p-2 flex items-center gap-2">
            <span className="text-lg">🌶️</span>
            <div className="min-w-0 flex-1">
              <h5 className="font-extrabold text-[9px] text-slate-800 truncate">Priya's Kitchen</h5>
              <p className="text-[7px] text-slate-400 font-semibold">★ 4.9 • Home Kitchen</p>
            </div>
            <span className="text-[7px] font-black text-teal-700 bg-teal-50 px-1 py-0.5 rounded">1.2 km</span>
          </div>
        </div>
      )
    },
    {
      index: 3,
      title: "Pick Your Items",
      desc: "Click on any product listing to check stock status and pricing.",
      time: "30 sec",
      preview: (
        <div className="w-full p-2 bg-white border border-slate-200 rounded-2xl shadow-sm text-left">
          <div className="h-16 rounded-xl bg-gradient-to-r from-orange-100 to-amber-100 flex items-center justify-center text-xl relative overflow-hidden">
            🏺
            <span className="absolute bottom-1 right-1 bg-slate-900 text-white font-black text-[7px] px-1.5 py-0.2 rounded">₹250</span>
          </div>
          <h5 className="font-extrabold text-[9px] text-slate-800 mt-2 truncate">Homemade Mango Pickle</h5>
          <p className="text-[7.5px] text-emerald-600 font-black uppercase mt-0.5">● IN STOCK</p>
        </div>
      )
    },
    {
      index: 4,
      title: "Send Custom Request",
      desc: "Send custom specifications (e.g. less salt, quantity) in one click.",
      time: "10 sec",
      preview: (
        <div className="w-full space-y-2 p-3 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
          <div className="bg-teal-600 text-white text-[8px] font-bold p-2 rounded-2xl rounded-tr-none self-end max-w-[85%] text-left">
            Can I get a 1kg jar with slightly less salt? Pickup at 5 PM?
          </div>
          <span className="text-[7px] text-slate-400 font-extrabold uppercase text-center block">✓ Request Transmitted</span>
        </div>
      )
    },
    {
      index: 5,
      title: "Connect & Collect",
      desc: "Chat directly, review directions, and complete pickup with a QR code.",
      time: "Instant",
      preview: (
        <div className="w-full p-3 bg-white border border-emerald-100 rounded-2xl shadow-sm text-center space-y-2">
          <span className="text-xl">🤝</span>
          <h5 className="font-black text-[9px] text-slate-800 uppercase block">Approved by Priya</h5>
          <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded mx-auto flex items-center justify-center p-1">
            <div className="grid grid-cols-4 gap-0.5 w-full h-full opacity-60">
              {[...Array(16)].map((_, i) => (
                <div key={i} className={`bg-slate-900 ${i % 3 === 0 ? 'opacity-90' : 'opacity-20'}`}></div>
              ))}
            </div>
          </div>
        </div>
      )
    }
  ];

  // Seller steps config
  const sellerSteps = [
    {
      index: 1,
      title: "Create Shop",
      desc: "Define your shop category (Home Business vs Retail) and add your location.",
      time: "2 min",
      preview: (
        <div className="w-full p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-left space-y-2">
          <span className="text-[8px] font-black text-slate-400 uppercase">Profile Registration</span>
          <div className="border border-slate-200 rounded px-1.5 py-0.5 text-[8.5px] text-slate-700 font-bold bg-slate-50">
            Priya's Kitchen
          </div>
          <div className="border border-slate-200 rounded px-1.5 py-0.5 text-[8.5px] text-slate-700 font-bold bg-slate-50 flex justify-between items-center">
            <span>🏠 Home Business</span>
            <span className="text-[6.5px] font-black text-rose-600 bg-rose-50 px-1 rounded uppercase">Selected</span>
          </div>
        </div>
      )
    },
    {
      index: 2,
      title: "Add Creations",
      desc: "Upload item photos, set price, custom prep times, and tell your unique story.",
      time: "3 min",
      preview: (
        <div className="w-full p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-left space-y-2">
          <span className="text-[8px] font-black text-slate-400 uppercase">Creation Setup</span>
          <div className="flex gap-1.5">
            <div className="w-8 h-8 rounded border border-dashed border-slate-250 flex items-center justify-center text-xs bg-slate-50 relative">
              🏺
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full"></span>
            </div>
            <div className="w-8 h-8 rounded border border-dashed border-slate-200 flex items-center justify-center text-[8px] text-slate-400 bg-slate-50">
              + Slot
            </div>
          </div>
          <p className="text-[7px] text-slate-500 italic bg-slate-50 p-1 border rounded">
            "奶奶's traditional spice blend..."
          </p>
        </div>
      )
    },
    {
      index: 3,
      title: "Receive Requests",
      desc: "Get notified instantly when local users query your stock or send custom orders.",
      time: "Instant",
      preview: (
        <div className="w-full p-2.5 bg-slate-900 text-white rounded-2xl shadow-lg text-left flex items-center gap-2">
          <span className="text-lg">🔔</span>
          <div className="min-w-0 flex-1">
            <h6 className="font-extrabold text-[8px] uppercase tracking-wider text-teal-400">Aisle Request</h6>
            <p className="text-[7.5px] font-bold truncate">Custom query: Mango Pickle (1.2 km)</p>
          </div>
        </div>
      )
    },
    {
      index: 4,
      title: "Negotiate Orders",
      desc: "Discuss specs, adjust pricing quotes, and confirm pickup slots directly.",
      time: "2 min",
      preview: (
        <div className="w-full p-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-end text-left space-y-1.5">
          <div className="bg-slate-200 text-slate-800 text-[8px] font-semibold p-1.5 rounded-xl self-start max-w-[85%]">
            Can I get less salt?
          </div>
          <div className="bg-teal-650 bg-teal-600 text-white text-[8px] font-bold p-1.5 rounded-xl self-end max-w-[85%]">
            Yes, custom batch is ready by 5.
          </div>
        </div>
      )
    },
    {
      index: 5,
      title: "Fulfill & Grow",
      desc: "Provide secure checkout QR codes, increase your neighborhood score, and build loyalty.",
      time: "Instant",
      preview: (
        <div className="w-full p-3 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-sm text-center space-y-1">
          <span className="text-xl">🏆</span>
          <h5 className="font-extrabold text-[9px] text-emerald-950 uppercase tracking-wider">Completed!</h5>
          <span className="text-[10px] font-black text-slate-900 block">+₹250</span>
        </div>
      )
    }
  ];

  const currentSteps = journeyTab === 'customer' ? customerSteps : sellerSteps;

  // Home Business Cards Horizontal Rail
  const creatorCards = [
    {
      title: "Food & Tiffins",
      emoji: "🌶️",
      desc: "Sell traditional pickles, weekly lunch tiffins, and spice kits.",
      bullet: "Zero Commission • Sell From Home",
      tags: ["Pickles", "Tiffins", "Papad", "Dry Snacks"],
      bg: "from-teal-600 to-teal-800"
    },
    {
      title: "Handmade Products",
      emoji: "🧶",
      desc: "Display craft baskets, handwoven crochet, and festive decor.",
      bullet: "Direct Chat • Same Day Pickup",
      tags: ["Rakhis", "Gift Boxes", "Crochet", "Decor"],
      bg: "from-pink-600 to-pink-800"
    },
    {
      title: "Custom Requests",
      emoji: "🎂",
      desc: "Receive customized catering requests, festive packages, and sweets.",
      bullet: "Set Custom Prep Times • Personalized Quotes",
      tags: ["Cakes", "Catering", "Festival Boxes", "Hampers"],
      bg: "from-amber-600 to-amber-800"
    }
  ];

  // Comparison Cards
  const comparisonCards = [
    {
      feature: "Shipping & Fulfillment",
      traditional: "❌ Warehouse shipping (3-5 days)",
      aisle: "✅ Direct local pickup / Same-day chat"
    },
    {
      feature: "Delivery Duration",
      traditional: "❌ 3-5 days cargo logistics",
      aisle: "✅ Same-day (Often within 15-30 min)"
    },
    {
      feature: "Seller Transparency",
      traditional: "❌ Hidden corporate brokers",
      aisle: "✅ Real neighborhood makers"
    },
    {
      feature: "Order Personalization",
      traditional: "❌ Static items. No customizations",
      aisle: "✅ Direct messaging custom quotes"
    },
    {
      feature: "Support for Creators",
      traditional: "❌ High fees & cargo setup",
      aisle: "✅ Commission-free program"
    }
  ];

  // Collapsible footer states
  const [footerOpen, setFooterOpen] = useState({ about: false, builtFor: false, stats: false, join: false });
  const toggleFooter = (section) => {
    setFooterOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleMenuNavigation = (path) => {
    setIsDrawerOpen(false);
    navigate(path);
  };

  return (
    <div className="bg-[#FAF9F5] min-h-screen text-slate-800 relative overflow-x-hidden font-sans pb-10">
      
      {/* STICKY PROGRESS INDICATOR */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3.5 bg-white/70 backdrop-blur-md px-2.5 py-4.5 rounded-full border border-slate-200/50 shadow-md">
        {[
          { id: 'hero', tooltip: 'Hero' },
          { id: 'journey', tooltip: 'Journey' },
          { id: 'story', tooltip: 'Story' },
          { id: 'creators', tooltip: 'Creators' },
          { id: 'compare', tooltip: 'Compare' },
          { id: 'start', tooltip: 'Start' }
        ].map((sec) => (
          <button 
            key={sec.id}
            onClick={() => scrollToSection(sec.id)}
            className={`w-3.5 h-3.5 rounded-full border transition-all relative group flex items-center justify-center ${
              activeSection === sec.id 
                ? 'bg-teal-650 bg-teal-600 border-teal-600 scale-125' 
                : 'bg-slate-200 border-slate-300'
            }`}
            aria-label={`Scroll to ${sec.tooltip}`}
          >
            {/* Tooltip */}
            <span className="absolute right-6 bg-slate-900 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow">
              {sec.tooltip}
            </span>
          </button>
        ))}
      </div>

      {/* HEADER */}
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
                  <button onClick={() => handleMenuNavigation('/')} className="flex items-center gap-3 w-full text-left p-3 rounded-2xl hover:bg-slate-100/50 font-bold text-slate-700 transition-colors text-sm">
                    <Smile className="w-4 h-4 text-emerald-600" /> Home
                  </button>
                  <button onClick={() => handleMenuNavigation('/explore')} className="flex items-center gap-3 w-full text-left p-3 rounded-2xl hover:bg-slate-100/50 font-bold text-slate-700 transition-colors text-sm">
                    <Search className="w-4 h-4 text-teal-650 text-teal-650" /> Explore
                  </button>
                  <button onClick={() => handleMenuNavigation('/for-shops')} className="flex items-center gap-3 w-full text-left p-3 rounded-2xl hover:bg-slate-100/50 font-bold text-slate-700 transition-colors text-sm">
                    <Store className="w-4 h-4 text-amber-600" /> For Businesses
                  </button>
                  <button onClick={() => handleMenuNavigation('/home-business')} className="flex items-center gap-3 w-full text-left p-3 rounded-2xl hover:bg-slate-100/50 font-bold text-slate-700 transition-colors text-sm">
                    <Sparkles className="w-4 h-4 text-rose-500" /> Home Businesses
                  </button>
                  <button onClick={() => handleMenuNavigation('/how-it-works')} className="flex items-center gap-3 w-full text-left p-3 rounded-2xl bg-teal-50 text-teal-800 font-bold text-sm">
                    <Info className="w-4 h-4 text-teal-600" /> How It Works
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
                  onClick={() => handleMenuNavigation('/register')}
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
      <section id="mobile-hero" className="px-5 pt-8 pb-6 text-center space-y-6">
        <div className="space-y-3">
          <span className="text-[10px] font-black text-teal-700 bg-teal-50 border border-teal-200 px-3.5 py-1.5 rounded-full uppercase tracking-widest inline-block shadow-sm">
            🚀 How Aisle Works
          </span>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-900 max-w-sm mx-auto">
            Find local products, creators and businesses around you in real time.
          </h1>
          <div className="pt-2">
            <Button 
              onClick={() => scrollToSection('journey')}
              className="bg-teal-650 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs py-5 px-6 rounded-2xl shadow-md flex items-center gap-2 mx-auto uppercase tracking-wider"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Watch Journey
            </Button>
          </div>
        </div>

        {/* 2X2 STATS GRID */}
        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto pt-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div 
                key={i} 
                className="bg-white border border-slate-200/50 rounded-3xl p-4 flex flex-col justify-between items-center text-center shadow-sm"
              >
                <div className={`p-2 rounded-xl mb-2.5 ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xl font-black text-slate-900 leading-none">{stat.val}</span>
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide mt-1 block">{stat.label}</span>
                <span className="text-[7.5px] text-slate-400 font-bold block mt-0.5">{stat.desc}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. INTERACTIVE PLATFORM JOURNEY (TABS + ACCORDIONS) */}
      <section id="mobile-journey" className="px-5 py-6 space-y-6">
        <div className="text-center space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Interactive Flow</span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Interactive Platform Journey</h2>
        </div>

        {/* Tab Selection */}
        <div className="bg-white border border-slate-200/50 p-1 rounded-2xl shadow-sm flex gap-1 mx-auto max-w-xs">
          <button 
            onClick={() => { setJourneyTab('customer'); setActiveStep(1); }}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap active:scale-95 transition-all ${
              journeyTab === 'customer' 
                ? 'bg-slate-900 text-white shadow' 
                : 'text-slate-500 bg-slate-50 border border-slate-100 hover:bg-slate-100'
            }`}
          >
            Buyer Journey
          </button>
          <button 
            onClick={() => { setJourneyTab('seller'); setActiveStep(1); }}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap active:scale-95 transition-all ${
              journeyTab === 'seller' 
                ? 'bg-slate-900 text-white shadow' 
                : 'text-slate-500 bg-slate-50 border border-slate-100 hover:bg-slate-100'
            }`}
          >
            Creator Journey
          </button>
        </div>

        {/* Accordion list */}
        <div className="space-y-3 max-w-sm mx-auto relative pl-4.5">
          {/* Vertical timeline line */}
          <div className="absolute left-2.5 top-5 bottom-5 w-0.5 border-l-2 border-dashed border-slate-250"></div>
          <div 
            className={`absolute left-2.5 top-5 w-0.5 transition-all duration-500 rounded bg-gradient-to-b ${
              journeyTab === 'customer' ? 'from-teal-500 to-teal-200' : 'from-amber-500 to-amber-200'
            }`}
            style={{ height: `${(activeStep - 1) * 23.5}%`, maxHeight: '95%' }}
          ></div>

          {currentSteps.map((step) => {
            const isOpen = activeStep === step.index;
            return (
              <div 
                key={step.index}
                className={`relative pl-7 transition-all duration-300 ${isOpen ? 'scale-[1.01]' : 'opacity-80'}`}
              >
                {/* Step Marker */}
                <button 
                  onClick={() => setActiveStep(step.index)}
                  className={`absolute -left-3.5 top-1.5 w-7 h-7 rounded-full border-2 font-black text-xs flex items-center justify-center transition-all ${
                    isOpen 
                      ? journeyTab === 'customer'
                        ? 'bg-teal-650 bg-teal-600 border-teal-600 text-white shadow scale-110'
                        : 'bg-amber-500 border-amber-500 text-white shadow scale-110'
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  {step.index}
                </button>

                {/* Card Container */}
                <div 
                  className={`p-4 rounded-3xl border transition-all ${
                    isOpen 
                      ? 'bg-white border-slate-250 shadow-md shadow-slate-100/50' 
                      : 'bg-[#F9F7F1]/30 border-transparent'
                  }`}
                >
                  <button 
                    onClick={() => setActiveStep(step.index)}
                    className="w-full flex justify-between items-center text-left focus:outline-none"
                  >
                    <span className="text-xs font-black text-slate-800">{step.title}</span>
                    <span className="text-[8px] font-black bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-slate-400" /> {step.time}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <p className="mt-2 text-[10.5px] text-slate-500 font-semibold leading-relaxed">
                          {step.desc}
                        </p>
                        
                        {/* Step Screenshot / Mock Preview */}
                        <div className="mt-4 p-2 bg-slate-50/50 rounded-2xl border border-slate-200 flex items-center justify-center animate-fade-in">
                          {step.preview}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 10. MOBILE CONVERSION IMPROVEMENT - EARLY CTA */}
      <section className="px-5 py-4 text-center max-w-sm mx-auto">
        <div className="bg-gradient-to-br from-teal-900 to-teal-950 text-white rounded-3xl p-6 shadow-xl space-y-4 text-left relative overflow-hidden">
          <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-teal-850/20 rounded-full"></div>
          <div className="space-y-1 relative z-10">
            <span className="text-[8px] font-black text-teal-300 uppercase tracking-widest block">Start Discovering</span>
            <h3 className="text-base font-black tracking-tight leading-tight">Ready to explore what's available?</h3>
            <p className="text-[10px] text-slate-300 leading-relaxed font-semibold">Scan Vadodara for fresh bakeries, home creators, and local retail stores.</p>
          </div>
          <Button 
            onClick={() => navigate('/explore')}
            className="w-full bg-white hover:bg-slate-50 text-teal-900 font-bold py-5 rounded-2xl shadow-md text-xs relative z-10 flex items-center justify-center gap-1.5"
          >
            <span>Explore Nearby</span>
            <ArrowRight className="w-3.5 h-3.5 text-teal-900" />
          </Button>
        </div>
      </section>

      {/* 4. PICKLE STORY SECTION (INSTAGRAM STORIES INTERFACE) */}
      <section id="mobile-story" className="px-5 py-6 space-y-6">
        <div className="text-center space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Hyperlocal Narrative</span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">A 12-Minute Pickle Story</h2>
        </div>

        {/* Instagram Story Device Frame */}
        <div className="w-full max-w-[310px] bg-slate-900 rounded-[35px] p-2.5 shadow-2xl border border-slate-800/80 mx-auto relative select-none">
          <div className="bg-[#FAF9F5]/90 rounded-[28px] p-5 h-[340px] flex flex-col justify-between relative overflow-hidden text-left shadow-inner">
            
            {/* Story slide progress bars */}
            <div className="flex gap-1.5 w-full absolute top-3 left-0 right-0 px-4">
              {storySlides.map((_, i) => (
                <div key={i} className="h-1 bg-slate-200 rounded-full flex-1 overflow-hidden">
                  <div 
                    className="h-full bg-teal-600 transition-all duration-100"
                    style={{ 
                      width: storyIndex === i 
                        ? `${storyProgress}%` 
                        : storyIndex > i ? '100%' : '0%' 
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Story Header */}
            <div className="flex justify-between items-center pt-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-black">
                  🏪
                </div>
                <div className="leading-tight">
                  <h4 className="text-[10px] font-black text-slate-800">Aisle Actions</h4>
                  <span className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider">{storySlides[storyIndex].badge}</span>
                </div>
              </div>
              <span className="text-[8px] font-black bg-teal-50 border border-teal-100 text-teal-700 px-2 py-0.5 rounded-full uppercase">Vadodara</span>
            </div>

            {/* Tap Triggers (Hidden click elements left/right) */}
            <div className="absolute inset-y-16 left-0 w-1/3 z-10 cursor-pointer" onClick={() => handleStoryTap('prev')} />
            <div className="absolute inset-y-16 right-0 w-1/3 z-10 cursor-pointer" onClick={() => handleStoryTap('next')} />

            {/* Story Graphic / Content Body */}
            <div className="flex-grow flex flex-col justify-center items-center text-center space-y-4 px-2">
              <span className="text-5xl animate-bounce">{storySlides[storyIndex].icon}</span>
              <div className="space-y-1">
                <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">{storySlides[storyIndex].tagline}</span>
                <h3 className="text-base font-black text-slate-900 tracking-tight">{storySlides[storyIndex].title}</h3>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed max-w-[200px] mx-auto">{storySlides[storyIndex].desc}</p>
              </div>
            </div>

            {/* Story Footer action */}
            <div className="border-t border-slate-200/50 pt-3 flex justify-between items-center text-[8.5px] text-slate-400 font-black">
              <span>Swipe left or right to browse</span>
              <span className="text-teal-600 flex items-center gap-0.5">Learn more <ArrowRightIcon className="w-2.5 h-2.5" /></span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOME BUSINESS SECTION (HORIZONTAL SWIPE RAIL) */}
      <section id="mobile-creators" className="px-5 py-6 space-y-6">
        <div className="text-center space-y-1">
          <span className="text-[9px] font-black text-[#C95B42] bg-orange-50 border border-orange-100 px-3 py-1 rounded-full uppercase tracking-widest inline-block shadow-sm">
            🏠 For Home Businesses
          </span>
          <h2 className="text-xl font-black text-slate-950 tracking-tight">Turn Your Skills Into Income</h2>
        </div>

        {/* Horizontal Swiper Rail */}
        <div className="flex gap-4 overflow-x-auto pb-4 px-1 scrollbar-none snap-x snap-mandatory">
          {creatorCards.map((card, i) => (
            <div 
              key={i} 
              className={`bg-gradient-to-br ${card.bg} text-white p-5 rounded-[2.2rem] shadow-lg flex flex-col justify-between space-y-6 min-w-[250px] max-w-[250px] snap-start relative overflow-hidden`}
            >
              {/* Background circle decoration */}
              <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
              
              <div className="space-y-4 text-left">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl shadow-inner">
                  {card.emoji}
                </div>
                <h3 className="font-extrabold text-base tracking-tight">{card.title}</h3>
                <p className="text-[10.5px] text-slate-200 leading-relaxed font-semibold">{card.desc}</p>
                
                {/* List tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {card.tags.map((tag) => (
                    <span 
                      key={tag} 
                      className="text-[8px] font-black bg-white/10 border border-white/20 text-white px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <span className="text-[8px] font-black uppercase tracking-wider text-slate-200 border-t border-white/10 pt-3 block text-left">
                {card.bullet}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 6. COMPARISON TABLE (SWIPEABLE COMPARISON CARDS) */}
      <section id="mobile-compare" className="px-5 py-6 space-y-6">
        <div className="text-center space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Marketplace Comparison</span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">What Makes Aisle Different</h2>
        </div>

        {/* Comparison Swipe Track */}
        <div className="flex gap-4 overflow-x-auto pb-4 px-1 scrollbar-none snap-x snap-mandatory">
          {comparisonCards.map((row, i) => (
            <div 
              key={i} 
              className="bg-white border border-slate-200/50 p-5 rounded-[2rem] shadow-sm flex flex-col justify-between space-y-5 min-w-[240px] max-w-[240px] snap-start text-left"
            >
              <div className="space-y-1 border-b border-slate-100 pb-2.5">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Feature</span>
                <h4 className="font-extrabold text-xs text-slate-900 tracking-tight">{row.feature}</h4>
              </div>

              {/* Compare rows */}
              <div className="space-y-3.5">
                {/* Traditional */}
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                  <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider block">Traditional Marketplace</span>
                  <p className="text-xs text-slate-400 font-bold leading-tight">{row.traditional}</p>
                </div>

                {/* Aisle */}
                <div className="space-y-1 bg-teal-50/20 p-2.5 rounded-xl border border-teal-100/50">
                  <span className="text-[7.5px] font-black text-teal-600 uppercase tracking-wider block">Aisle Engine</span>
                  <p className="text-xs text-teal-955 text-teal-950 font-black leading-tight">{row.aisle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. CTA SECTION (STACKED VERTICALLY) */}
      <section id="mobile-start" className="px-5 py-6 space-y-4 max-w-sm mx-auto">
        {/* Explore Path */}
        <div className="bg-gradient-to-br from-teal-900 to-teal-950 text-white rounded-[2.2rem] p-6 text-left space-y-4 relative overflow-hidden shadow-lg">
          <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-teal-850/10 rounded-full" />
          <div className="space-y-1.5 relative z-10">
            <span className="text-[8px] font-black text-teal-300 uppercase tracking-widest block">For Local Buyers</span>
            <h3 className="text-lg font-black tracking-tight leading-tight">Ready to explore what's available?</h3>
            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">Scan for fresh bakeries, home creators, and local retail stores live in Vadodara.</p>
          </div>
          <Button 
            onClick={() => navigate('/explore')}
            className="w-full bg-white hover:bg-slate-50 text-teal-950 font-black text-xs py-4 px-6 rounded-2xl shadow transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider relative z-10"
          >
            <span>Explore Nearby</span>
            <ArrowRight className="w-3.5 h-3.5 text-teal-950" />
          </Button>
        </div>

        {/* Seller Path */}
        <div className="bg-gradient-to-br from-[#E07A5F] to-[#C95B42] text-white rounded-[2.2rem] p-6 text-left space-y-4 relative overflow-hidden shadow-lg">
          <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-white/10 rounded-full" />
          <div className="space-y-1.5 relative z-10">
            <span className="text-[8px] font-black text-amber-250 text-amber-200 uppercase tracking-widest block">For Creators & Sellers</span>
            <h3 className="text-lg font-black tracking-tight leading-tight">Ready to start selling from home?</h3>
            <p className="text-[10px] text-orange-100 leading-relaxed font-semibold">List products, set custom prep timings, chat with neighbors directly, and build loyalty.</p>
          </div>
          <Button 
            onClick={() => navigate('/seller/register')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-4 px-6 rounded-2xl shadow transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider relative z-10"
          >
            <span>Create Your Shop</span>
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </Button>
        </div>
      </section>

      {/* 8. FOOTER ACCORDION */}
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

export default MobileHowItWorks;
