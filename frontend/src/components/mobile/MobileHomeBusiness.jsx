import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Store, ShoppingBag, MessageSquare, Clock, 
  ArrowRight, Shield, Zap, Users, Award, TrendingUp, 
  Sparkles, Check, CheckCircle, DollarSign, Activity, 
  ChevronRight, LineChart, Star, Compass, AlertCircle,
  Menu, X, HelpCircle, ChevronDown, ChevronUp, Heart, Smile
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

const MobileHomeBusiness = () => {
  const navigate = useNavigate();

  // Navigation Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Section 3: Interactive Category Wall State
  const [selectedCategory, setSelectedCategory] = useState("Food");

  // Section 6: Dashboard Mockup States
  const [dashboardData, setDashboardData] = useState({
    active: 12,
    preparing: 4,
    requests: 3
  });

  // Section 8: Stories Carousel State
  const [activeStory, setActiveStory] = useState(0);

  // Section 9: FAQ Category state
  const [selectedFaqCat, setSelectedFaqCat] = useState("Getting Started");
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Footer Accordion State
  const [footerOpen, setFooterOpen] = useState({ about: false, builtFor: false, stats: false, join: false });

  // Simulate dashboard changes live
  useEffect(() => {
    const interval = setInterval(() => {
      setDashboardData(prev => {
        const trigger = Math.random();
        if (trigger > 0.8) {
          return {
            active: prev.active + 1,
            preparing: prev.preparing,
            requests: prev.requests
          };
        } else if (trigger > 0.5) {
          return {
            active: prev.active,
            preparing: prev.preparing + 1,
            requests: prev.requests
          };
        } else if (trigger > 0.2) {
          return {
            active: prev.active,
            preparing: prev.preparing,
            requests: prev.requests + 1
          };
        }
        return prev;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const collageCards = [
    { title: "Nani's Mango Pickle", price: "₹250", icon: "🏺", color: "border-amber-200" },
    { title: "Woven Crochet Shoulder Bag", price: "₹850", icon: "🧶", color: "border-teal-200" },
    { title: "Custom Anniversary Cake", price: "₹1,200", icon: "🧁", color: "border-rose-200" },
    { title: "Premium Diwali Hamper", price: "₹1,500", icon: "🎁", color: "border-indigo-200" }
  ];

  const statsList = [
    { label: "Home Creators", value: "2000", suffix: "+" },
    { label: "Products Listed", value: "50000", suffix: "+" },
    { label: "Local Orders", value: "15000", suffix: "+" }
  ];

  const buyerMotivations = [
    {
      title: "Freshly Made",
      desc: "Items are prepared fresh in home kitchens or home desks on order, not sitting on warehouse shelves.",
      icon: <Smile className="w-5 h-5 text-amber-600" />
    },
    {
      title: "Custom Orders",
      desc: "Customers get exactly what they need—gluten-free, less salt, custom names, or custom sizes.",
      icon: <Sparkles className="w-5 h-5 text-rose-500" />
    },
    {
      title: "Local Pickup",
      desc: "Save shipping fees and shipping delays. Pick up from a neighbor in minutes.",
      icon: <MapPin className="w-5 h-5 text-teal-600" />
    },
    {
      title: "Unique Products",
      desc: "Discover traditional recipes and handcrafted items not sold in corporate retail chains.",
      icon: <Award className="w-5 h-5 text-indigo-600" />
    },
    {
      title: "Direct Communication",
      desc: "Chat directly with the maker. Build deep neighborhood trust without automated support filters.",
      icon: <MessageSquare className="w-5 h-5 text-emerald-600" />
    }
  ];

  const categoryWallDetails = {
    "Food": { 
      label: "Homemade Food", 
      popular: "Gourmet Pickles, Papad, Snacks, Chutneys", 
      prep: "1 Day", 
      searches: "420+ Searches/Mo",
      icon: "🌶️",
      bg: "bg-amber-50 border-amber-100"
    },
    "Bakery": { 
      label: "Bakery & Sweets", 
      popular: "Custom Cakes, Cupcakes, Healthy Cookies, Brownies", 
      prep: "1 Day", 
      searches: "₹850 Avg Order",
      icon: "🍰",
      bg: "bg-pink-50 border-pink-100"
    },
    "Crafts": { 
      label: "Handmade Crafts", 
      popular: "Festival Rakhi, Canvas Art, Crochet Bags, Home Decor", 
      prep: "2 Days", 
      searches: "300+ Searches/Mo",
      icon: "🧶",
      bg: "bg-teal-50 border-teal-100"
    },
    "Gifts": { 
      label: "Custom Gifts", 
      popular: "Curated Gift Boxes, Sweet Boxes, Festive Hampers", 
      prep: "2 Days", 
      searches: "₹1,500 Avg Order",
      icon: "🎁",
      bg: "bg-indigo-50 border-indigo-100"
    },
    "Services": { 
      label: "Home Services", 
      popular: "Custom Tailoring, Daily Tiffins, Tuition, Beauty Care", 
      prep: "1-2 Days", 
      searches: "250+ Searches/Mo",
      icon: "🛠️",
      bg: "bg-rose-50 border-rose-100"
    }
  };

  const roadmapJourney = [
    { step: 1, title: "Create Product", desc: "Take a photo of your creation and fill details in 1 minute." },
    { step: 2, title: "Add Story", desc: "Share your recipe or traditional method to connect with buyers." },
    { step: 3, title: "Appear Nearby", desc: "Your catalog shows up on the discovery map within 15km." },
    { step: 4, title: "Receive Orders", desc: "Get notified when neighbors buy or send custom requests." }
  ];

  const benefitsOutcomes = [
    { title: "Start Without Rent", desc: "Turn your kitchen or study desk into an active storefront. Zero commercial leasing overheads." },
    { title: "Launch With ₹0 Investment", desc: "Upload and publish up to 50 active creations with absolutely zero listing or listing renewal fees." },
    { title: "Customers Within 5 KM", desc: "Reach active buyers in your immediate neighborhood. Minimize logistics costs and transit times." }
  ];

  const revenuePotential = [
    { category: "Homemade Pickles", orders: "25 Orders", income: "₹8,000+", icon: "🏺", desc: "25 jars sold locally monthly" },
    { category: "Custom Cakes", orders: "15 Orders", income: "₹12,000+", icon: "🧁", desc: "15 cakes baked for events monthly" },
    { category: "Gift Hampers", orders: "20 Orders", income: "₹15,000+", icon: "🎁", desc: "20 premium festive boxes monthly" },
    { category: "Crochet Products", orders: "12 Orders", income: "₹7,500+", icon: "🧶", desc: "12 handmade bags/accessories monthly" }
  ];

  const successStories = [
    {
      name: "Priya Sharma",
      creator: "Pickle Creator",
      biz: "Homemade Pickles & Chutneys",
      quote: "I started with just 3 family recipes. By getting discovered on Aisle's local map, I have now served over 120+ households in my area. Custom requests for low-salt options helped me double my sales!",
      before: "3 customers / mo",
      after: "120 customers / mo",
      avatar: "👩‍🍳"
    },
    {
      name: "Neha Goel",
      creator: "Cake Creator",
      biz: "Sweet Whisk Bakery",
      quote: "As a self-taught baker, getting custom orders used to be stressful over WhatsApp. Now, customer inquiries land directly in my Aisle Custom Requests dashboard, allowing me to coordinate and quote pricing instantly.",
      before: "4 cakes / mo",
      after: "60 cakes / mo",
      avatar: "🧁"
    },
    {
      name: "Utsav Gift Boxes",
      creator: "Gift Creator",
      biz: "Festive Crafter",
      quote: "I make custom corporate and festive gift boxes. Traditional sites charge high commission cuts and ship slowly. On Aisle, corporate clients chat with me, customize box fillers, and pick up 50 units same day.",
      before: "2 orders / mo",
      after: "80 orders / mo",
      avatar: "🎁"
    },
    {
      name: "Aarav's Woven Art",
      creator: "Craft Creator",
      biz: "Woven Crochet Baskets",
      quote: "Selling crochet baskets was a side hobby. Listing on Aisle made me visible to neighbors looking for decorative gifts. Direct collection saves me shipping boxes entirely.",
      before: "1 basket / mo",
      after: "35 baskets / mo",
      avatar: "🧶"
    },
    {
      name: "Vikas Math Classes",
      creator: "Tutor",
      biz: "Local Education Academy",
      quote: "Traditional listing sites generated zero response. Aisle connected me directly with local parents searching for home tutors within 3km. My batches are fully booked.",
      before: "5 queries / mo",
      after: "45 queries / mo",
      avatar: "📚"
    }
  ];

  const faqs = [
    {
      category: "Getting Started",
      q: "Do I need a commercial shop or shop license to list?",
      a: "No! Aisle is built specifically to support home entrepreneurs, hobby creators, and home cooks. You can register using your home address and start displaying your creations immediately."
    },
    {
      category: "Getting Started",
      q: "Are there any listing fees or hidden charges?",
      a: "Listing creations on Aisle is completely free. We do not charge listing fees or monthly subscriptions for the basic seller tier. You keep 100% of direct transactions."
    },
    {
      category: "Payments",
      q: "How do I receive payments from buyers?",
      a: "Aisle supports both 'Prepaid' (online payments settled directly into your linked bank account) and 'Pay on Delivery' directly to you, commission-free."
    },
    {
      category: "Orders",
      q: "Can I sell part-time or list items as 'Made-To-Order'?",
      a: "Absolutely. When adding a creation, you can toggle its mode between 'Ready Stock' or 'Made to Order'. You can specify custom preparation times (e.g. 'Requires 2 days prep') so customers have clear expectations."
    },
    {
      category: "Pricing",
      q: "How do custom requests and order changes work?",
      a: "Customers can send a 'Custom Request Inquiry' explaining what they need (e.g., gluten-free, eggless). You receive this inquiry in your Special Inbox, where you can chat, agree on specifications, and send a custom price quote."
    },
    {
      category: "Verification",
      q: "How does local verification work for home creators?",
      a: "Aisle verifies your location coordinates and basic details on signup. If local laws require basic registration (like basic food registration for home chefs), we guide you through the process."
    }
  ];

  const filteredFaqs = faqs.filter(f => f.category === selectedFaqCat);

  const toggleFooter = (section) => {
    setFooterOpen(prev => ({ ...prev, [section]: !prev[section] }));
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
                  <button onClick={() => handleMenuNavigation('/for-shops')} className="flex items-center gap-3 w-full text-left p-3 rounded-2xl hover:bg-slate-100/50 font-bold text-slate-700 transition-colors text-sm">
                    <Store className="w-4 h-4 text-teal-600" /> For Businesses
                  </button>
                  <button onClick={() => handleMenuNavigation('/home-business')} className="flex items-center gap-3 w-full text-left p-3 rounded-2xl bg-teal-50 text-teal-800 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-teal-600" /> Home Businesses
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

      {/* SECTION 1: HERO */}
      <section className="px-5 pt-3 pb-6 space-y-6 text-left">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black uppercase tracking-wider shadow-sm animate-pulse">
            <Sparkles className="w-3.5 h-3.5" /> Newly Launched: Home Business Platform
          </div>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-900">
            Start Selling From Home.<br/>
            <span className="text-teal-600">Reach Customers Nearby.</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Whether you make pickles, cakes, handmade gifts, crochet products, custom rakhis, tiffin services, or anything unique, Aisle helps local customers discover and order directly from you.
          </p>
          
          <div className="flex gap-3 pt-2">
            <Button 
              onClick={() => navigate('/seller/register')}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs py-5 rounded-2xl shadow-md uppercase tracking-wider"
            >
              Start Home Business
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

        {/* Hero Proof Metrics */}
        <div className="grid grid-cols-3 gap-2 border-t border-b border-slate-200/50 py-4 text-center">
          {statsList.map((stat, i) => (
            <div key={i} className="space-y-0.5">
              <span className="text-sm font-black text-slate-900 leading-none">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={1200} />
              </span>
              <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Floating Product Cards Carousel/Mockup */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
          {collageCards.map((card, i) => (
            <div 
              key={i} 
              className={`bg-white border rounded-2xl p-4 min-w-[150px] max-w-[150px] shadow-sm snap-start text-left space-y-2.5 ${card.color}`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xl">{card.icon}</span>
                <span className="text-[10px] font-black text-slate-800">{card.price}</span>
              </div>
              <h4 className="font-extrabold text-[10.5px] text-slate-800 leading-snug line-clamp-2">{card.title}</h4>
            </div>
          ))}
        </div>
      </section>

      {/* ADDED SECTION: WHY CUSTOMERS BUY FROM HOME CREATORS */}
      <section className="px-5 py-6 space-y-6">
        <div className="text-left space-y-1">
          <span className="text-[9px] font-black text-teal-700 bg-teal-50 border border-teal-150 px-3 py-1.5 rounded-full uppercase tracking-wider inline-block">
            Customer Motivation
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Why Customers Choose You Instead of Amazon</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {buyerMotivations.map((motivation, i) => (
            <div key={i} className="bg-white border border-slate-200/50 p-5 rounded-3xl shadow-sm text-left flex gap-4 items-start">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex-shrink-0">
                {motivation.icon}
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-800">{motivation.title}</h4>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">{motivation.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: CATEGORIES SECTION (INTERACTIVE WALL) */}
      <section className="px-5 py-6 space-y-6">
        <div className="text-left space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Categories Wall</span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">What Can You Sell?</h2>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {Object.keys(categoryWallDetails).map((key) => {
            const isActive = selectedCategory === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`bg-white border rounded-2xl p-3 shadow-sm hover:shadow-md transition-all text-center flex flex-col justify-center items-center gap-1.5 ${
                  isActive ? 'border-teal-500 ring-2 ring-teal-500/10' : 'border-slate-200/50'
                }`}
              >
                <span className="text-2xl select-none">{categoryWallDetails[key].icon}</span>
                <span className="font-extrabold text-[9px] text-slate-800 leading-tight block truncate w-full">
                  {categoryWallDetails[key].label.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Category Floating details drawer */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`p-4.5 border rounded-3xl text-left space-y-3.5 ${categoryWallDetails[selectedCategory].bg}`}
          >
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="font-black text-xs text-slate-800 flex items-center gap-1.5">
                {categoryWallDetails[selectedCategory].icon} {categoryWallDetails[selectedCategory].label}
              </span>
              <span className="text-[8px] font-black bg-teal-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                {categoryWallDetails[selectedCategory].searches}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-0.5">
                <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block">Most Popular:</span>
                <span className="text-[10px] font-extrabold text-slate-700 block">{categoryWallDetails[selectedCategory].popular}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block">Average Prep Time:</span>
                <span className="text-[10px] font-extrabold text-slate-700 block flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> {categoryWallDetails[selectedCategory].prep}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* SECTION 3: HOW AISLE WORKS (TIMELINE ROADMAP) */}
      <section className="px-5 py-6 space-y-6">
        <div className="text-left space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">How It Works</span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Your Launch Journey</h2>
        </div>

        <div className="relative pl-6 py-2 space-y-6 text-left">
          {/* Vertical timeline line */}
          <div className="absolute left-2.5 top-2 bottom-2 w-0.5 border-l-2 border-dashed border-slate-250"></div>
          
          {roadmapJourney.map((item, idx) => (
            <div key={idx} className="relative pl-6 space-y-1">
              {/* timeline marker dot */}
              <div className="absolute -left-5 top-1 w-4 h-4 rounded-full bg-teal-600 border-2 border-white flex items-center justify-center shadow">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              </div>
              <h4 className="font-extrabold text-xs text-slate-800">
                0{item.step}. {item.title}
              </h4>
              <p className="text-[10.5px] text-slate-500 font-semibold leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: OUTCOME BENEFITS */}
      <section className="px-5 py-6 space-y-6">
        <div className="text-left space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Value Outcomes</span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Tailored Outcome Benefits</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {benefitsOutcomes.map((benefit, i) => (
            <div key={i} className="bg-white border border-slate-200/50 p-5 rounded-3xl shadow-sm text-left space-y-1.5">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-650 text-teal-600" />
                <h4 className="font-extrabold text-sm text-slate-800 tracking-tight">{benefit.title}</h4>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: CREATOR DASHBOARD WITH LIVE ELEMENTS */}
      <section className="px-5 py-6 space-y-6">
        <div className="text-left space-y-1">
          <span className="text-[9px] font-black text-[#C95B42] bg-orange-50 border border-orange-100 px-3 py-1 rounded-full uppercase tracking-widest inline-block shadow-sm">
            Live Simulator
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Your Home Creator Dashboard</h2>
        </div>

        <div className="bg-slate-900 text-white rounded-[2rem] p-5 border border-slate-800 shadow-xl space-y-5 relative overflow-hidden text-left">
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping"></span>
            Simulated
          </div>

          <div className="border-b border-slate-800 pb-2.5">
            <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Aisle Seller Hub</h4>
            <p className="text-[9px] text-slate-550 text-slate-500">Live coordinates tracking: Active</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-850 border border-slate-800 p-3 rounded-2xl text-center space-y-1 relative">
              <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider block">Creations</span>
              <span className="text-base font-black text-slate-100 block">
                <AnimatedCounter value={String(dashboardData.active)} duration={800} />
              </span>
            </div>
            
            <div className="bg-slate-850 border border-slate-800 p-3 rounded-2xl text-center space-y-1 relative">
              <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider block">Preparing</span>
              <span className="text-base font-black text-amber-400 block">
                <AnimatedCounter value={String(dashboardData.preparing)} duration={800} />
              </span>
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            </div>

            <div className="bg-slate-850 border border-slate-800 p-3 rounded-2xl text-center space-y-1 relative">
              <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider block">Requests</span>
              <span className="text-base font-black text-teal-400 block">
                <AnimatedCounter value={String(dashboardData.requests)} duration={800} />
              </span>
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping"></span>
            </div>
          </div>

          <div className="bg-slate-850 border border-slate-800 p-3 rounded-2xl flex items-center justify-between text-[10.5px]">
            <span className="text-slate-400 font-semibold">Local Visibility Rank</span>
            <span className="text-teal-400 font-black flex items-center gap-1">
              Top 8% <LineChart className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </section>

      {/* MISSING SECTION: REVENUE POTENTIAL SHOWCASE */}
      <section className="px-5 py-6 space-y-6">
        <div className="text-left space-y-1">
          <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
            Earnings Potential
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Potential Monthly Revenue</h2>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">Illustrative examples of how home creators generate income locally.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {revenuePotential.map((item, idx) => (
            <div key={idx} className="bg-white border border-slate-200/50 p-4.5 rounded-3xl shadow-sm text-left flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-2xl select-none">{item.icon}</span>
                <span className="text-teal-700 bg-teal-50 border border-teal-100 font-black text-[9px] px-2 py-0.5 rounded-lg">
                  {item.orders}
                </span>
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-[11px] text-slate-800 leading-tight">{item.category}</h4>
                <span className="text-base font-black text-slate-950 block">{item.income}</span>
                <p className="text-[8.5px] text-slate-400 font-semibold leading-tight">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 7: SUCCESS STORIES CAROUSEL */}
      <section className="px-5 py-6 space-y-6">
        <div className="text-left space-y-1">
          <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full uppercase tracking-widest inline-block shadow-sm">
            Social Proof
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Creator Success Stories</h2>
        </div>

        <div className="bg-white border border-slate-200/50 rounded-3xl p-5 shadow-sm space-y-4 text-left relative overflow-hidden">
          <div className="absolute top-3 right-3 bg-teal-50 border border-teal-100 text-teal-800 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
            {successStories[activeStory].creator}
          </div>

          <div className="space-y-1 pt-1.5">
            <h3 className="font-extrabold text-sm text-slate-800">{successStories[activeStory].name}</h3>
            <p className="text-[8.5px] text-slate-400 font-bold uppercase">{successStories[activeStory].biz}</p>
          </div>

          <p className="text-xs text-slate-500 font-semibold italic leading-relaxed bg-slate-50 border border-slate-100 p-3 rounded-2xl">
            "{successStories[activeStory].quote}"
          </p>

          {/* Before vs After stats comparison box */}
          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl text-center space-y-0.5">
              <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider block">Before Aisle</span>
              <span className="text-[10px] font-extrabold text-slate-600 block">{successStories[activeStory].before}</span>
            </div>
            
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-2.5 rounded-2xl text-center space-y-0.5 shadow-sm">
              <span className="text-[7.5px] font-black text-teal-100 uppercase tracking-wider block">After Aisle</span>
              <span className="text-[10px] font-black text-white block">{successStories[activeStory].after}</span>
            </div>
          </div>

          {/* Stories Selector Pills */}
          <div className="flex gap-1 overflow-x-auto pb-1.5 scrollbar-none justify-start pt-1">
            {successStories.map((st, i) => (
              <button
                key={i}
                onClick={() => setActiveStory(i)}
                className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase flex-shrink-0 border transition-all ${
                  activeStory === i 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                    : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}
              >
                {st.avatar} {st.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9: FAQ SECTION WITH CATEGORY FILTER CHIPS */}
      <section className="px-5 py-6 space-y-6">
        <div className="text-left space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Support</span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
        </div>

        {/* FAQ category chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {["Getting Started", "Payments", "Orders", "Pricing", "Verification"].map((catName) => (
            <button
              key={catName}
              onClick={() => { setSelectedFaqCat(catName); setOpenFaqIndex(null); }}
              className={`px-3 py-1.5 rounded-xl text-[8.5px] font-black uppercase tracking-wider flex-shrink-0 border transition-all ${
                selectedFaqCat === catName 
                  ? 'bg-slate-900 border-slate-900 text-white' 
                  : 'bg-slate-50 border-slate-100 text-slate-400'
              }`}
            >
              {catName}
            </button>
          ))}
        </div>

        {/* Filtered FAQs */}
        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="bg-white border border-slate-200/50 rounded-2xl overflow-hidden shadow-sm transition-all">
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full text-left p-4.5 flex items-center justify-between font-bold text-slate-800 hover:text-teal-600 transition-colors text-xs"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-teal-600' : ''}`} />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden bg-slate-50/50 border-t border-slate-100"
                    >
                      <p className="p-4.5 text-[10.5px] text-slate-500 font-semibold leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 10: FINAL CTA WITH LIVE ACTIVITY COUNTERS */}
      <section className="px-5 py-8 space-y-6 max-w-sm mx-auto text-left">
        {/* Urgency Live Ticker Indicator */}
        <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-4.5 space-y-3 relative overflow-hidden">
          <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-teal-850/10 rounded-full" />
          
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[8.5px] font-black text-slate-300 uppercase tracking-widest">Live Activity Today</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-850 border border-slate-800/40 p-2 rounded-xl">
              <span className="text-slate-100 font-black block">
                <AnimatedCounter value="8" duration={800} />
              </span>
              <span className="text-[6.5px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Creators Active</span>
            </div>
            
            <div className="bg-slate-850 border border-slate-800/40 p-2 rounded-xl">
              <span className="text-slate-100 font-black block">
                <AnimatedCounter value="92" duration={850} />
              </span>
              <span className="text-[6.5px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Products Added</span>
            </div>

            <div className="bg-slate-850 border border-slate-800/40 p-2 rounded-xl">
              <span className="text-slate-100 font-black block">
                <AnimatedCounter value="15" duration={900} />
              </span>
              <span className="text-[6.5px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Requests Made</span>
            </div>
          </div>
        </div>

        {/* CTA Card */}
        <div className="bg-gradient-to-br from-teal-900 to-teal-950 text-white rounded-[2.5rem] p-6 shadow-xl space-y-5 relative overflow-hidden">
          <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-teal-850/15 rounded-full pointer-events-none" />
          
          <div className="space-y-1.5 relative z-10 border-b border-teal-850 pb-4">
            <span className="text-[8.5px] font-black text-teal-300 uppercase tracking-widest block">Start your journey</span>
            <h2 className="text-xl font-black tracking-tight leading-tight">Your Talent Deserves Customers.</h2>
            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
              Join hundreds of women entrepreneurs, home chefs, and craft creators who are building independent neighborhood brands on Aisle.
            </p>
          </div>

          <div className="space-y-3 relative z-10">
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

export default MobileHomeBusiness;
