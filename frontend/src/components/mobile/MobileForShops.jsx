import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Store, ShoppingBag, MessageSquare, Clock, 
  ArrowRight, Shield, Zap, Users, Award, TrendingUp, 
  Sparkles, Check, CheckCircle, DollarSign, Activity, 
  ChevronRight, LineChart, Star, Compass, AlertCircle,
  Menu, X, HelpCircle, ChevronUp, ChevronDown, Heart, ShieldAlert
} from 'lucide-react';
import AisleLogo from '../AisleLogo';
import { Button } from '../ui/button';

// Animated Counter subcomponent for premium feel
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

const MobileForShops = () => {
  const navigate = useNavigate();

  // Navigation Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Section 1: Dashboard Simulator States
  const [dashboardData, setDashboardData] = useState({
    views: 12,
    requests: 4,
    quotes: 3250,
    customers: 2
  });

  // Section 3: Roadmap State
  const [activeStep, setActiveStep] = useState(1);

  // Section 5: Stories Carousel State
  const [activeStory, setActiveStory] = useState(0);

  // Section 6: Eligibility Details State
  const [selectedCategory, setSelectedCategory] = useState("Bakery");

  // Footer Accordion State
  const [footerOpen, setFooterOpen] = useState({ about: false, builtFor: false, stats: false, join: false });

  // Simulate dashboard data changes live
  useEffect(() => {
    const interval = setInterval(() => {
      setDashboardData(prev => {
        const trigger = Math.random();
        if (trigger > 0.7) {
          return {
            views: prev.views + 1,
            requests: prev.requests,
            quotes: prev.quotes,
            customers: prev.customers
          };
        } else if (trigger > 0.45) {
          const addedQuote = Math.floor(Math.random() * 3 + 1) * 250;
          return {
            views: prev.views + 1,
            requests: prev.requests + 1,
            quotes: prev.quotes + addedQuote,
            customers: prev.customers
          };
        } else if (trigger > 0.25) {
          return {
            views: prev.views + 2,
            requests: prev.requests,
            quotes: prev.quotes,
            customers: prev.customers + 1
          };
        }
        return prev;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const roadmapSteps = [
    {
      step: 1,
      title: "Register Shop",
      time: "2 Minutes",
      difficulty: "Easy",
      result: "Visible Locally",
      desc: "Create your seller profile (Retail Store vs Home Business) in 2 minutes."
    },
    {
      step: 2,
      title: "Add Inventory",
      time: "3 Minutes",
      difficulty: "Easy",
      result: "Catalog Uploaded",
      desc: "Upload photos, set price details, and tell your unique product stories."
    },
    {
      step: 3,
      title: "Become Discoverable",
      time: "Instant",
      difficulty: "Easy",
      result: "Active 15km Radius",
      desc: "Your catalog instantly appears to customers searching within a 5-15km radius."
    },
    {
      step: 4,
      title: "Receive Requests",
      time: "A Few Hours",
      difficulty: "Easy",
      result: "Direct Enquiries",
      desc: "Get notified when local buyers query your stock or send custom orders."
    },
    {
      step: 5,
      title: "Grow Business",
      time: "Ongoing",
      difficulty: "Medium",
      result: "Customer Loyalty",
      desc: "Complete transactions locally, collect ratings, and increase your growth score."
    }
  ];

  const buyerBenefits = [
    {
      title: "Nearby Discovery",
      desc: "Buyers find your products within a few kilometers instantly without browsing national listings.",
      icon: <Compass className="w-5 h-5 text-teal-600" />
    },
    {
      title: "Custom Requests",
      desc: "Buyers send specific order queries (less salt, vegan, custom sizing) directly to you.",
      icon: <Sparkles className="w-5 h-5 text-rose-500" />
    },
    {
      title: "Same Day Pickup",
      desc: "Zero logistics delays. Buyers walk in or get it delivered within minutes, not days.",
      icon: <Clock className="w-5 h-5 text-amber-500" />
    },
    {
      title: "Direct Seller Chat",
      desc: "Buyers communicate directly with you to build long-term local trust without middleman filters.",
      icon: <MessageSquare className="w-5 h-5 text-emerald-600" />
    }
  ];

  const toolkitCategories = [
    {
      name: "Growth Tools",
      icon: <LineChart className="w-4 h-4 text-emerald-600" />,
      features: ["Business Analytics (Views/Clicks)", "Ratings & Neighborhood Leaderboard", "Ecosystem stats indicators"]
    },
    {
      name: "Discovery Tools",
      icon: <MapPin className="w-4 h-4 text-teal-600" />,
      features: ["Interactive Location Map plotting", "Customizable Public Store Profile", "Hyperlocal tags and SEO listings"]
    },
    {
      name: "Trust Tools",
      icon: <Award className="w-4 h-4 text-rose-500" />,
      features: ["Verified Seller Badges", "Real customer testimonials panel", "Ratings feedback lock system"]
    },
    {
      name: "Communication Tools",
      icon: <MessageSquare className="w-4 h-4 text-amber-500" />,
      features: ["Direct Chat Enquiries Box", "Custom quotation and pricing engine", "Real-time notifications push"]
    }
  ];

  const successStories = [
    {
      name: "Priya's Homemade Pickles",
      industry: "Pickle Story",
      role: "Home Entrepreneur",
      location: "Vadodara",
      quote: "Before joining Aisle, finding local customers for my traditional pickles was a struggle. I could only sell 2 to 3 jars weekly. Now, I receive direct queries, negotiate orders, and get 35+ monthly requests!",
      stats: { requests: "35+", orders: "120", rating: "4.9" },
      avatar: "👩‍🍳",
      tagline: "1,400% Monthly Growth"
    },
    {
      name: "Sweet Whisk Bakery",
      industry: "Bakery Story",
      role: "Artisanal Baker",
      location: "Alkapuri",
      quote: "Aisle changed everything. Customers find my freshly baked sourdough bread and cakes while they are still in the oven. I've built a neighborhood club of regular buyers who order weekly.",
      stats: { requests: "55+", orders: "200+", rating: "5.0" },
      avatar: "🧁",
      tagline: "Same-Day Fresh Sales"
    },
    {
      name: "Utsav Gift Boxes",
      industry: "Gift Box Story",
      role: "Festive Crafter",
      location: "Gotri Road",
      quote: "I make custom corporate and festive gift boxes. Traditional sites charge high commission cuts and ship slowly. On Aisle, corporate clients chat with me, customize box fillers, and pick up 50 units same day.",
      stats: { requests: "80+", orders: "240", rating: "4.8" },
      avatar: "🎁",
      tagline: "Commission-Free Bulk Orders"
    },
    {
      name: "Vikas Mathematics Academy",
      industry: "Tutor Story",
      role: "Local Educator",
      location: "Akota",
      quote: "I host neighborhood math coaching classes. Traditional classifieds are full of spam. On Aisle, local parents searching for home tutors message me directly. I've filled up 3 new batches in weeks.",
      stats: { requests: "25+", orders: "45", rating: "4.9" },
      avatar: "📚",
      tagline: "High-Intent Local Enquiries"
    }
  ];

  const eligibilityDetails = {
    "Bakery": { setup: "3 Minutes", products: ["Sourdough Bread", "Custom Cakes", "Healthy Cookies", "Muffins"], icon: "🍰" },
    "Grocery": { setup: "5 Minutes", products: ["Fresh Greens", "Organic Pulses", "Daily Dairy", "Gourmet Spices"], icon: "🏪" },
    "Pharmacy": { setup: "3 Minutes", products: ["OTC Wellness Kits", "First Aid Supplies", "Vitamins", "Daily Skincare"], icon: "💊" },
    "Home Businesses": { setup: "2 Minutes", products: ["Handmade Pickles", "Jams & Preserves", "Festive Rakhis", "Crochet Bags"], icon: "🏠" },
    "Electronics": { setup: "4 Minutes", products: ["Phone Chargers", "Bluetooth Earbuds", "Adapters", "Tech Repairs"], icon: "🔌" },
    "Services": { setup: "5 Minutes", products: ["Home Tutoring", "AC Cleaning", "Dry Cleaning", "Appliance Repair"], icon: "🛠️" }
  };

  const comparisonRows = [
    { metric: "Commissions", traditional: "❌ 15% to 30% cut per sale", aisle: "✅ 0% Commission (Keep 100%)" },
    { metric: "Discovery Mechanism", traditional: "❌ Paid ranking pushing you down", aisle: "✅ Pure organic local relevance" },
    { metric: "Fulfillment Speed", traditional: "❌ 2-5 days warehouse shipment", aisle: "✅ Same-day customer pickup / chat" },
    { metric: "Customer Connection", traditional: "❌ Masked emails / No chat access", aisle: "✅ Direct phone & chat relationships" },
    { metric: "Onboarding Ease", traditional: "❌ Strict GST & logistics codes required", aisle: "✅ Go live in 2 minutes" }
  ];

  const homeBusinessBenefits = [
    { title: "Custom Orders", desc: "Easily accept specific ingredient changes and quantities." },
    { title: "Recipe Stories", desc: "Share the traditional method or clean ingredients of your foods." },
    { title: "Flexible Inventory", desc: "No penalty for going out-of-stock. Mark items as 'Made-to-Order'." },
    { title: "Neighborhood Trust", desc: "Leverage home-cooked hygiene to build loyal local families." }
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
                    <Heart className="w-4 h-4 text-emerald-600" /> Home
                  </button>
                  <button onClick={() => handleMenuNavigation('/explore')} className="flex items-center gap-3 w-full text-left p-3 rounded-2xl hover:bg-slate-100/50 font-bold text-slate-700 transition-colors text-sm">
                    <Compass className="w-4 h-4 text-teal-600" /> Explore
                  </button>
                  <button onClick={() => handleMenuNavigation('/for-shops')} className="flex items-center gap-3 w-full text-left p-3 rounded-2xl bg-teal-50 text-teal-800 font-bold text-sm">
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

      {/* SECTION 1: HERO + LIVE DASHBOARD */}
      <section className="px-5 pt-3 pb-6 space-y-6 text-left">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-black uppercase tracking-wider shadow-sm animate-pulse">
            <DollarSign className="w-3.5 h-3.5" /> 100% Direct Sales • 0% Commissions
          </div>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-900">
            Grow Your Local Business Without Paying Marketplace Commissions
          </h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Get discovered by nearby customers, receive direct requests, and sell at your own store prices. Simple setup, instant neighborhood reach.
          </p>
          
          <div className="flex gap-3 pt-2">
            <Button 
              onClick={() => navigate('/seller/register')}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs py-5 rounded-2xl shadow-md uppercase tracking-wider"
            >
              Start Selling
            </Button>
            <Button 
              onClick={() => navigate('/demo')}
              variant="outline"
              className="flex-1 border-slate-300 font-black text-slate-700 text-xs py-5 rounded-2xl uppercase tracking-wider"
            >
              See Demo
            </Button>
          </div>
        </div>

        {/* Live Dashboard Preview */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-xl space-y-4 relative overflow-hidden">
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Live Preview
          </div>
          
          <div className="border-b border-slate-800 pb-2">
            <h3 className="font-extrabold text-xs text-slate-300 tracking-wider uppercase">Today's Activity</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Updated live in Vadodara</p>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-slate-850 border border-slate-800 p-3 rounded-2xl space-y-1">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">New Views</span>
              <div className="text-lg font-black text-slate-100 flex items-center gap-1">
                <Users className="w-4 h-4 text-teal-400" />
                <span>{dashboardData.views}</span>
              </div>
            </div>
            
            <div className="bg-slate-850 border border-slate-800 p-3 rounded-2xl space-y-1">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Requests</span>
              <div className="text-lg font-black text-slate-100 flex items-center gap-1">
                <MessageSquare className="w-4 h-4 text-rose-400" />
                <span>{dashboardData.requests}</span>
              </div>
            </div>

            <div className="bg-slate-850 border border-slate-800 p-3 rounded-2xl space-y-1">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Quotes Sent</span>
              <div className="text-lg font-black text-slate-100 flex items-center gap-0.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>₹{dashboardData.quotes.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="bg-slate-850 border border-slate-800 p-3 rounded-2xl space-y-1">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">New Customers</span>
              <div className="text-lg font-black text-slate-100 flex items-center gap-1">
                <Award className="w-4 h-4 text-amber-400" />
                <span>{dashboardData.customers}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: RESULTS METRICS CARDS WITH ANIMATED COUNTERS */}
      <section className="px-5 py-6 space-y-6">
        <div className="text-left space-y-1">
          <span className="text-[9px] font-black text-teal-600 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full uppercase tracking-widest inline-block shadow-sm">
            Ecosystem Metrics
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Real Outcome-Driven Results</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {[
            { title: "10x More Visibility", value: "10", suffix: "x Reach", desc: "Appear in local neighborhood searches the exact second customers look for items.", icon: <Users className="w-5 h-5 text-teal-600" />, color: "bg-teal-50 border-teal-150" },
            { title: "85% Faster Discovery", value: "85", suffix: "% Speed", desc: "Hyperlocal matching cuts down browsing-to-conversion times significantly.", icon: <Clock className="w-5 h-5 text-amber-500" />, color: "bg-amber-50 border-amber-150" },
            { title: "Keep 100% Revenue", value: "100", suffix: "% Profit", desc: "Keep 100% of your earnings. No commissions, no middleman cuts ever.", icon: <DollarSign className="w-5 h-5 text-emerald-600" />, color: "bg-emerald-50 border-emerald-150" },
            { title: "Launch In 2 Minutes", value: "2", suffix: " Min Setup", desc: "Create your product profile, post items, and go live instantly nearby.", icon: <Zap className="w-5 h-5 text-rose-500" />, color: "bg-rose-50 border-rose-150" }
          ].map((card, i) => (
            <div key={i} className="bg-white border border-slate-200/50 p-5 rounded-3xl shadow-sm text-left flex gap-4 items-start">
              <div className={`p-3 rounded-2xl flex-shrink-0 ${card.color} border`}>
                {card.icon}
              </div>
              <div className="space-y-1 flex-grow">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-sm text-slate-800">{card.title}</h4>
                  <span className="text-[10px] font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100/50">
                    <AnimatedCounter value={card.value} suffix={card.suffix} duration={1200} />
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: BUSINESS GROWTH ROADMAP */}
      <section className="px-5 py-6 space-y-6">
        <div className="text-left space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Step-By-Step Growth</span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Interactive Platform Journey</h2>
        </div>

        {/* Roadmap Timeline Track */}
        <div className="bg-white border border-slate-200/50 p-5 rounded-3xl shadow-sm space-y-4">
          <div className="flex justify-between items-center overflow-x-auto pb-2 scrollbar-none gap-2">
            {roadmapSteps.map((step) => {
              const isActive = activeStep === step.step;
              return (
                <button
                  key={step.step}
                  onClick={() => setActiveStep(step.step)}
                  className={`px-3.5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex-shrink-0 border transition-all ${
                    isActive 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-102' 
                      : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Step 0{step.step}
                </button>
              );
            })}
          </div>

          {/* Details Panel for Active Step */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                <h3 className="font-extrabold text-sm text-slate-800">{roadmapSteps[activeStep - 1].title}</h3>
                <span className="text-[8px] font-black bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  0{activeStep} / 05
                </span>
              </div>

              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                {roadmapSteps[activeStep - 1].desc}
              </p>

              {/* Floating Attributes Grid */}
              <div className="grid grid-cols-3 gap-2 pt-1.5">
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl text-center space-y-0.5">
                  <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block">Expected Time</span>
                  <span className="text-[10px] font-extrabold text-slate-800 block">{roadmapSteps[activeStep - 1].time}</span>
                </div>
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl text-center space-y-0.5">
                  <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block">Difficulty</span>
                  <span className="text-[10px] font-extrabold text-slate-800 block">{roadmapSteps[activeStep - 1].difficulty}</span>
                </div>
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl text-center space-y-0.5">
                  <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block">Outcome</span>
                  <span className="text-[9px] font-black text-teal-700 block truncate">{roadmapSteps[activeStep - 1].result}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* MISSING SECTION: WHY CUSTOMERS PREFER AISLE */}
      <section className="px-5 py-6 space-y-6">
        <div className="text-left space-y-1">
          <span className="text-[9px] font-black text-teal-700 bg-teal-50 border border-teal-150 px-3 py-1.5 rounded-full uppercase tracking-wider inline-block">
            Seller Insight
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Why Customers Prefer Aisle</h2>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">Answering the seller's biggest concern: Why will buyers come here?</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {buyerBenefits.map((benefit, i) => (
            <div key={i} className="bg-white border border-slate-200/50 p-4 rounded-3xl shadow-sm text-left flex flex-col justify-between space-y-3">
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl w-fit">
                {benefit.icon}
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-[11px] text-slate-800 leading-tight">{benefit.title}</h4>
                <p className="text-[9px] text-slate-500 font-semibold leading-relaxed">{benefit.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: SELLER TOOLKIT */}
      <section className="px-5 py-6 space-y-6">
        <div className="text-left space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Feature Suite</span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Your Complete Seller Toolkit</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {toolkitCategories.map((category, idx) => (
            <div key={idx} className="bg-white border border-slate-200/50 rounded-3xl p-5 shadow-sm text-left space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-xl">
                  {category.icon}
                </div>
                <h4 className="font-extrabold text-xs text-slate-800">{category.name}</h4>
              </div>
              
              <ul className="space-y-2">
                {category.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-2 text-xs text-slate-500 font-semibold leading-tight">
                    <CheckCircle className="w-3.5 h-3.5 text-teal-600 mt-0.5 flex-shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: SUCCESS STORIES CAROUSEL */}
      <section className="px-5 py-6 space-y-6">
        <div className="text-left space-y-1">
          <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full uppercase tracking-widest inline-block shadow-sm">
            Success Stories
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Stories From the Neighborhood</h2>
        </div>

        <div className="bg-white border border-slate-200/50 rounded-3xl p-5 shadow-sm space-y-5 text-left relative overflow-hidden">
          {/* Tagline */}
          <div className="absolute top-3 right-3 bg-teal-50 border border-teal-150 text-teal-700 font-black text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider">
            {successStories[activeStory].tagline}
          </div>

          <div className="space-y-1 pt-1.5">
            <span className="text-[9px] font-black text-rose-500 uppercase tracking-wider block">
              {successStories[activeStory].industry}
            </span>
            <h3 className="font-extrabold text-sm text-slate-800">{successStories[activeStory].name}</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase">{successStories[activeStory].role} • {successStories[activeStory].location}</p>
          </div>

          <p className="text-xs text-slate-500 font-semibold italic leading-relaxed bg-slate-50 border border-slate-100 p-3 rounded-2xl">
            "{successStories[activeStory].quote}"
          </p>

          {/* Social Proof stats grid */}
          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
            <div className="space-y-0.5">
              <span className="text-[8px] font-black text-slate-400 uppercase block">Requests / Mo</span>
              <span className="text-xs font-black text-slate-800 block">{successStories[activeStory].stats.requests}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[8px] font-black text-slate-400 uppercase block">Orders Done</span>
              <span className="text-xs font-black text-slate-800 block">{successStories[activeStory].stats.orders}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[8px] font-black text-slate-400 uppercase block">Ratings</span>
              <span className="text-xs font-black text-teal-700 block flex items-center justify-center gap-0.5">
                ★ {successStories[activeStory].stats.rating}
              </span>
            </div>
          </div>

          {/* Carousel Selector Chips */}
          <div className="flex gap-1.5 justify-center pt-2">
            {successStories.map((st, i) => (
              <button
                key={i}
                onClick={() => setActiveStory(i)}
                className={`px-3 py-1.5 rounded-xl text-[8.5px] font-black uppercase border transition-all ${
                  activeStory === i 
                    ? 'bg-slate-900 border-slate-900 text-white' 
                    : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}
              >
                {st.avatar} {st.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: ELIGIBILITY WALL (INTERACTIVE WALL) */}
      <section className="px-5 py-6 space-y-6">
        <div className="text-left space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Eligibility Wall</span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Who Can Join Aisle?</h2>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {Object.keys(eligibilityDetails).map((catName) => {
            const isActive = selectedCategory === catName;
            return (
              <button
                key={catName}
                onClick={() => setSelectedCategory(catName)}
                className={`bg-white border rounded-2xl p-3 shadow-sm hover:shadow-md transition-all text-center flex flex-col justify-center items-center gap-1.5 ${
                  isActive ? 'border-teal-500 ring-2 ring-teal-500/10' : 'border-slate-200/50'
                }`}
              >
                <span className="text-2xl select-none">{eligibilityDetails[catName].icon}</span>
                <span className="font-extrabold text-[9px] text-slate-800 leading-tight block truncate w-full">{catName}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Category Details Floating Drawer */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="bg-slate-900 text-white p-4.5 rounded-3xl text-left space-y-3.5 border border-slate-800"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-black text-xs text-slate-300 flex items-center gap-1.5">
                {eligibilityDetails[selectedCategory].icon} {selectedCategory} Details
              </span>
              <span className="text-[8px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Average Setup: {eligibilityDetails[selectedCategory].setup}
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block">Popular Products Listed:</span>
              <div className="flex flex-wrap gap-1.5">
                {eligibilityDetails[selectedCategory].products.map((item, idx) => (
                  <span key={idx} className="bg-slate-800 border border-slate-700 text-slate-200 text-[9px] font-bold px-2 py-1 rounded-xl">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* SECTION 7: COMPARISON TABLE */}
      <section className="px-5 py-6 space-y-6">
        <div className="text-left space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Marketplace Comparison</span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Traditional Marketplace vs Aisle</h2>
        </div>

        <div className="bg-white border border-slate-200/50 rounded-3xl p-4 shadow-sm space-y-4">
          {comparisonRows.map((row, idx) => (
            <div key={idx} className="border-b border-slate-100 last:border-b-0 pb-3 last:pb-0 text-left space-y-2">
              <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">{row.metric}</span>
              
              <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                <div className="bg-rose-50/20 border border-rose-100/50 p-2 rounded-xl text-rose-950 font-medium">
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Traditional</span>
                  {row.traditional}
                </div>
                <div className="bg-emerald-50/20 border border-emerald-100/50 p-2 rounded-xl text-emerald-950 font-black">
                  <span className="text-[7px] font-black text-teal-600 uppercase tracking-wider block mb-0.5">Aisle Local</span>
                  {row.aisle}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 8: HOME BUSINESS ADVANTAGE PROGRAM */}
      <section className="px-5 py-6 space-y-6 bg-gradient-to-br from-rose-900 to-rose-950 text-white rounded-[2.5rem] mx-4 py-8 shadow-xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
        
        <div className="space-y-2 text-left relative z-10">
          <span className="text-[9.5px] font-black text-pink-300 uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Built For Home Entrepreneurs
          </span>
          <h3 className="text-xl font-black tracking-tight leading-tight">Special Support For Home Businesses</h3>
          <p className="text-xs text-rose-100 leading-relaxed font-semibold">
            Are you a home baker, custom crafter, or pickle creator? Aisle features unique tools built specifically for makers:
          </p>
        </div>

        {/* Benefits Cards Rail */}
        <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory pt-2 relative z-10">
          {homeBusinessBenefits.map((item, idx) => (
            <div key={idx} className="bg-white/10 border border-white/20 p-4 rounded-3xl min-w-[170px] max-w-[170px] snap-start text-left space-y-1.5">
              <h4 className="font-extrabold text-xs text-white tracking-tight">{item.title}</h4>
              <p className="text-[10px] text-rose-150 leading-relaxed font-semibold">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="pt-4 relative z-10">
          <Button
            onClick={() => navigate('/home-business')}
            className="w-full bg-white hover:bg-rose-50 text-rose-950 font-black text-xs py-5 rounded-2xl shadow flex items-center justify-center gap-1.5 uppercase tracking-wider"
          >
            <span>Explore Program</span>
            <ChevronRight className="w-4 h-4 text-rose-950" />
          </Button>
        </div>
      </section>

      {/* SECTION 9 & 10: FINAL CTA WITH LIVE COUNTERS */}
      <section className="px-5 py-8 space-y-6 max-w-sm mx-auto text-left">
        <div className="bg-gradient-to-br from-teal-900 via-teal-950 to-slate-900 text-white rounded-[2.5rem] p-6 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-teal-850/15 rounded-full pointer-events-none" />
          
          <div className="space-y-1.5 relative z-10 border-b border-teal-850 pb-4">
            <span className="text-[8.5px] font-black text-teal-300 uppercase tracking-widest block">No obligations • Start free</span>
            <h2 className="text-xl font-black tracking-tight leading-tight">Ready to Bring More Customers to Your Business?</h2>
            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
              Join Aisle today and start appearing in local searches. Receive real inquiries, build neighborhood loyalty, and retain 100% of your price quotes.
            </p>
          </div>

          {/* Live daily counters */}
          <div className="grid grid-cols-3 gap-2 relative z-10 text-center">
            <div className="bg-slate-800/40 border border-slate-700/30 p-2 rounded-xl">
              <span className="text-[10.5px] font-black text-slate-100 block">
                <AnimatedCounter value="8" duration={1000} />
              </span>
              <span className="text-[6.5px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Shops Active</span>
            </div>
            
            <div className="bg-slate-800/40 border border-slate-700/30 p-2 rounded-xl">
              <span className="text-[10.5px] font-black text-slate-100 block">
                <AnimatedCounter value="92" duration={1000} />
              </span>
              <span className="text-[6.5px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Listed Today</span>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/30 p-2 rounded-xl">
              <span className="text-[10.5px] font-black text-slate-100 block">
                <AnimatedCounter value="24" duration={1000} />
              </span>
              <span className="text-[6.5px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Leads Formed</span>
            </div>
          </div>

          <div className="space-y-3 relative z-10 pt-2">
            <Button
              onClick={() => navigate('/seller/register')}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-black text-xs py-5 rounded-2xl shadow uppercase tracking-wider"
            >
              Start Your Business
            </Button>
            <Button
              onClick={() => navigate('/how-it-works')}
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/15 font-black text-xs py-5 rounded-2xl shadow uppercase tracking-wider"
            >
              Learn More
            </Button>
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

export default MobileForShops;
