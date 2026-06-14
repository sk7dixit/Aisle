import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageWrapper from '../components/common/PageWrapper';
import MobileForShops from '../components/mobile/MobileForShops';
import { useNavigate } from 'react-router-dom';
import { 
    MapPin, Store, ShoppingBag, MessageSquare, Clock, 
    ArrowRight, Shield, Zap, Users, Award, TrendingUp, 
    Sparkles, Check, CheckCircle, DollarSign, Activity, 
    ChevronRight, LineChart, Star, Compass
} from 'lucide-react';

const ForShops = () => {
    const navigate = useNavigate();

    // Section 3: Interactive Roadmap state
    const [activeRoadmapStep, setActiveRoadmapStep] = useState(1);

    // Section 8: Live Activity Feed ticker state
    const [activityIndex, setActivityIndex] = useState(0);
    const recentActivities = [
        "🟢 New shop joined: Priya's Homemade Pickles (Vadodara)",
        "🟢 15 new creations added by Sweet Whisk Bakery nearby",
        "🟢 Home baker received a custom request for a birthday cake (2 min ago)",
        "🟢 Electronics shop updated inventory: 8 phone chargers live",
        "🟢 Grocery store accepted order for same-day local pickup",
        "🟢 Creator 'Aarav's Woven Crochet' hit 50+ local reviews!"
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActivityIndex((prev) => (prev + 1) % recentActivities.length);
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    const valueCards = [
        {
            title: "More Local Visibility",
            metric: "10x Reach",
            desc: "Appear in local neighborhood searches the exact second customers look for your items nearby.",
            icon: <Users className="w-5 h-5 text-teal-600" />,
            badgeColor: "bg-teal-50 border-teal-150 text-teal-700"
        },
        {
            title: "Direct Customer Requests",
            metric: "No Middleman",
            desc: "Receive direct, high-intent product enquiries. Chat, negotiate, and quote pricing directly.",
            icon: <MessageSquare className="w-5 h-5 text-rose-500" />,
            badgeColor: "bg-rose-50 border-rose-150 text-rose-700"
        },
        {
            title: "Sell At Your Own Price",
            metric: "0% Commission",
            desc: "No forced platform discounts. Keep 100% of your earnings. We don't take any cuts.",
            icon: <DollarSign className="w-5 h-5 text-emerald-600" />,
            badgeColor: "bg-emerald-50 border-emerald-150 text-emerald-700"
        },
        {
            title: "Go Live in Minutes",
            metric: "Instant Setup",
            desc: "Register your shop, upload your inventory, and start appearing in local feeds immediately.",
            icon: <Zap className="w-5 h-5 text-amber-500" />,
            badgeColor: "bg-amber-50 border-amber-150 text-amber-700"
        }
    ];

    const roadmapSteps = [
        {
            step: 1,
            title: "Register Shop",
            desc: "Create your seller profile (Retail Store vs Home Business) in 2 minutes."
        },
        {
            step: 2,
            title: "Add Inventory",
            desc: "Upload photos, price details, and tell your unique product stories."
        },
        {
            step: 3,
            title: "Become Discoverable",
            desc: "Your catalog instantly appears to customers searching within a 5-15km radius."
        },
        {
            step: 4,
            title: "Receive Requests",
            desc: "Get notified when local buyers query your stock or send custom orders."
        },
        {
            step: 5,
            title: "Grow Business",
            desc: "Complete transactions locally, collect ratings, and increase your growth score."
        }
    ];

    const featureSuite = [
        { title: "Store Profile", desc: "A professional, customizable public page displaying location, details, and opening status.", icon: <Store className="w-5 h-5 text-teal-600" /> },
        { title: "Product Listings", desc: "Showcase ready-stock inventory or made-to-order creations with high-quality photos.", icon: <ShoppingBag className="w-5 h-5 text-rose-500" /> },
        { title: "Customer Requests", desc: "Receive direct buyer notifications and negotiate custom prices using the chat portal.", icon: <MessageSquare className="w-5 h-5 text-amber-600" /> },
        { title: "Location Visibility", desc: "Get plotted dynamically on Aisle's local Discovery Map when buyers search nearby.", icon: <MapPin className="w-5 h-5 text-emerald-600" /> },
        { title: "Reviews & Ratings", desc: "Collect customer ratings and testimonials to rank higher in local search results.", icon: <Award className="w-5 h-5 text-indigo-600" /> },
        { title: "Business Analytics", desc: "Track views, requests, customer visits, and growth metrics from a clean dashboard.", icon: <LineChart className="w-5 h-5 text-pink-600" /> }
    ];

    const eligibleCategories = [
        { label: "Grocery & Kirana", icon: "🏪" },
        { label: "Electronics Shops", icon: "🔌" },
        { label: "Pharmacies", icon: "💊" },
        { label: "Home Businesses", icon: "🏠" },
        { label: "Bakeries & Cafes", icon: "🍰" },
        { label: "Service Providers", icon: "🛠️" }
    ];

    return (
        <PageWrapper className="bg-[#FDFCF8] min-h-screen flex flex-col font-sans overflow-x-hidden">
            {/* Desktop Experience (Frozen above 768px) */}
            <div className="hidden md:block">
                <Header />

            <style>{`
                @keyframes pulse-dot {
                    0% { transform: scale(0.95); opacity: 0.5; }
                    100% { transform: scale(1.8); opacity: 0; }
                }
                .active-radar {
                    animation: pulse-dot 2s infinite ease-out;
                }
                .roadmap-line {
                    background: linear-gradient(to right, #81B29A 0%, #E07A5F 100%);
                }
            `}</style>

            <main className="flex-grow pt-28 pb-20">

                {/* SECTION 1: HERO UPGRADE */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 pt-6">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-black uppercase tracking-wider shadow-sm animate-pulse">
                        <DollarSign className="w-3.5 h-3.5" /> 100% Direct Sales • 0% Commissions
                    </div>
                    
                    <h1 className="text-4xl sm:text-5xl font-black text-slate-800 tracking-tight max-w-4xl mx-auto leading-[1.15]">
                        Grow Your Local Business Without Paying Marketplace Commissions
                    </h1>
                    
                    <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto font-medium">
                        Get discovered by nearby customers, receive direct requests, and sell at your own store prices. Simple setup, instant neighborhood reach.
                    </p>

                    {/* Interactive Stats Counters */}
                    <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 pt-4">
                        {[
                            { label: "Active Businesses", value: "2,000+" },
                            { label: "Products Listed", value: "50,000+" },
                            { label: "Cities Reached", value: "Multiple Hubs" }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white border border-slate-100/80 px-5 py-2.5 rounded-2xl shadow-sm flex items-center gap-3">
                                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 relative flex">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                </span>
                                <div className="text-left">
                                    <span className="text-sm font-black text-slate-800 block leading-none">{stat.value}</span>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">{stat.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SECTION 8: LIVE ACTIVITY TICKER */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
                    <div className="bg-slate-900 border border-slate-850 rounded-2xl p-3 shadow text-center relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-3 max-w-3xl mx-auto">
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Aisle Live Ticker:</span>
                        </div>
                        <div className="min-h-[20px] flex items-center flex-grow justify-center sm:justify-start">
                            <p key={activityIndex} className="text-xs font-semibold text-slate-100 animate-in fade-in slide-in-from-right-4 duration-300">
                                {recentActivities[activityIndex]}
                            </p>
                        </div>
                        <span className="text-[8px] font-black bg-teal-600 text-white px-2 py-0.5 rounded-lg uppercase tracking-wider">Live Activity</span>
                    </div>
                </div>

                {/* SECTION 2: SHOW RESULTS, NOT FEATURES */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center mb-10">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Real Results For Real Sellers</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Why local businesses and home creators are migrating to Aisle</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {valueCards.map((card, i) => (
                            <div key={i} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between text-left group">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                            {card.icon}
                                        </div>
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${card.badgeColor}`}>
                                            {card.metric}
                                        </span>
                                    </div>
                                    <h4 className="font-extrabold text-base text-slate-800 tracking-tight group-hover:text-teal-600 transition-colors">
                                        {card.title}
                                    </h4>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        {card.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SECTION 3: INTERACTIVE ROADMAP TIMELINE */}
                <div className="bg-[#F6F4EB] py-16 border-y border-slate-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
                        <div className="space-y-2">
                            <span className="text-[10px] font-black text-teal-600 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full uppercase tracking-widest inline-block shadow-sm">
                                The Roadmap
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">How Your Business Grows on Aisle</h2>
                            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto font-medium">Hover or tap on steps below to check details of your journey</p>
                        </div>

                        {/* Interactive Timeline Grid */}
                        <div className="max-w-5xl mx-auto relative py-8 px-4">
                            {/* Horizontal Line connector (Desktop only) */}
                            <div className="hidden lg:block absolute left-8 right-8 top-1/2 -translate-y-6 h-1 bg-slate-200 rounded">
                                <div 
                                    className="h-full bg-gradient-to-r from-teal-500 to-amber-500 transition-all duration-500 rounded"
                                    style={{ width: `${(activeRoadmapStep - 1) * 25}%` }}
                                ></div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 relative z-10 text-left">
                                {roadmapSteps.map((s) => {
                                    const isActive = activeRoadmapStep === s.step;
                                    return (
                                        <div 
                                            key={s.step}
                                            onMouseEnter={() => setActiveRoadmapStep(s.step)}
                                            onClick={() => setActiveRoadmapStep(s.step)}
                                            className={`bg-white border rounded-3xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between h-48 select-none ${
                                                isActive 
                                                    ? 'border-teal-500 shadow-lg scale-102 -translate-y-1 ring-4 ring-teal-500/10' 
                                                    : 'border-slate-100 shadow-sm opacity-80 hover:opacity-100'
                                            }`}
                                        >
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border transition-colors ${
                                                        isActive ? 'bg-teal-600 border-teal-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'
                                                    }`}>
                                                        0{s.step}
                                                    </span>
                                                    {isActive && (
                                                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping"></span>
                                                    )}
                                                </div>
                                                <h4 className="font-extrabold text-sm text-slate-800">{s.title}</h4>
                                                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">{s.desc}</p>
                                            </div>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-2 block">
                                                {isActive ? "Active Step" : "Tap to inspect"}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 4: SHOW WHAT SELLERS ACTUALLY GET */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center mb-12">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Your Complete Seller Toolkit</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Every account receives full access to these premium tools</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
                        {featureSuite.map((feat, i) => (
                            <div key={i} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
                                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex-shrink-0">
                                    {feat.icon}
                                </div>
                                <div className="space-y-1.5">
                                    <h4 className="font-extrabold text-sm text-slate-800 tracking-tight">{feat.title}</h4>
                                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">{feat.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SECTION 5: SUCCESS STORY SECTION (PRIYA'S PICKLES) */}
                <div className="bg-[#FAF9F5] py-16 border-y border-slate-100">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6">
                        <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm flex flex-col lg:flex-row items-center gap-10 text-left relative overflow-hidden">
                            
                            {/* Decorative badge */}
                            <div className="absolute top-4 right-4 bg-teal-50 border border-teal-150 text-teal-700 font-black text-[9px] px-3 py-1 rounded-full uppercase tracking-wider">
                                Verified Story
                            </div>

                            {/* Left Side: Narrative */}
                            <div className="flex-1 space-y-5">
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block">Local Success Spotlight</span>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Meet Priya's Homemade Pickles</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Home Entrepreneur based in Vadodara</p>
                                </div>
                                
                                <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed italic">
                                    "Before joining Aisle, finding local customers for my traditional pickles was a struggle. I could only sell 2 to 3 jars weekly through word of mouth. With Aisle, customers nearby query my items, negotiate custom orders, and pick them up directly. My sales skyrocketed!"
                                </p>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg">👩‍🍳</div>
                                    <div>
                                        <h5 className="font-extrabold text-xs text-slate-800">Priya Sharma</h5>
                                        <span className="text-[9px] text-slate-450 font-bold block uppercase">Founder, Priya's Kitchen</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Before vs After metrics comparison */}
                            <div className="w-full lg:w-[350px] bg-slate-50 border border-slate-150 rounded-3xl p-6 space-y-4">
                                <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider border-b border-slate-200 pb-2">The Aisle Impact</h4>
                                
                                {/* Before Metrics */}
                                <div className="space-y-1.5">
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Before Aisle</span>
                                    <div className="flex items-center gap-2">
                                        <div className="bg-slate-200 h-6 rounded-full flex items-center px-3 text-[9px] font-black text-slate-650 w-24">
                                            2-3 weekly
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-bold">Local referrals</span>
                                    </div>
                                </div>

                                {/* After Metrics */}
                                <div className="space-y-1.5">
                                    <span className="text-[9px] text-teal-600 font-bold uppercase tracking-wider">After joining Aisle</span>
                                    <div className="flex items-center gap-2">
                                        <div className="bg-gradient-to-r from-teal-500 to-teal-600 h-8 rounded-full flex items-center px-4 text-[10px] font-black text-white w-full shadow shadow-teal-100">
                                            35+ monthly requests
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-center">
                                    <span className="text-xl font-black text-emerald-950 block">+1,400% Growth</span>
                                    <span className="text-[8px] text-emerald-650 font-bold uppercase block tracking-wider mt-0.5">Expanded into custom festive gift boxes</span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* SECTION 6: SHOP CATEGORIES (WHO CAN JOIN) */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-8">
                    <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Eligibility</span>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Who Can Join Aisle?</h2>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto font-medium">Any local business owner, creator, or neighborhood merchant can list in minutes</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 max-w-5xl mx-auto">
                        {eligibleCategories.map((cat, i) => (
                            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow text-center space-y-2 flex flex-col justify-center items-center">
                                <span className="text-3xl select-none">{cat.icon}</span>
                                <h5 className="font-extrabold text-[11px] text-slate-800 tracking-tight">{cat.label}</h5>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SECTION 7: COMPARISON TABLE */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center space-y-8">
                    <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-455 uppercase tracking-widest block">The Bottom Line</span>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Traditional Marketplaces vs Aisle</h2>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm text-left">
                        <table className="w-full text-xs sm:text-sm">
                            <thead>
                                <tr className="bg-slate-900 text-white font-extrabold border-b border-slate-800">
                                    <th className="p-4 uppercase tracking-wider text-[10px]">Metric</th>
                                    <th className="p-4 uppercase tracking-wider text-[10px] text-slate-350 bg-slate-850">Traditional Marketplace</th>
                                    <th className="p-4 uppercase tracking-wider text-[10px] text-teal-400">Aisle Local Engine</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {[
                                    { f: "Commissions", t: "High fees (15% to 30% cut)", a: "0% Commission (Keep all sales)" },
                                    { f: "Competition", t: "Nationwide warehouses listing products", a: "Exclusive local area visibility" },
                                    { f: "Fulfillment", t: "Warehouse storage & slow packaging", a: "Direct customer collection / Same-day" },
                                    { f: "Discovery", t: "Algorithmic search pushing paid listings", a: "Interactive nearby geolocation search" },
                                    { f: "Product Catalog", t: "Strict templates & static listings only", a: "Post custom creations & stories" }
                                ].map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 font-black text-slate-900 border-r border-slate-100">{row.f}</td>
                                        <td className="p-4 text-slate-400 border-r border-slate-100 bg-slate-50/30">{row.t}</td>
                                        <td className="p-4 text-teal-800 font-black bg-teal-50/20">{row.a}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* SECTION 9: FUTURE HOME BUSINESS BLOCK */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
                    <div className="bg-gradient-to-br from-rose-900 to-rose-950 text-white rounded-[36px] p-8 text-left space-y-6 relative overflow-hidden shadow-lg">
                        
                        {/* Abstract design elements */}
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/5 rounded-full"></div>
                        <div className="absolute bottom-[-50px] left-[-50px] w-36 h-36 bg-pink-500/5 rounded-full"></div>

                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            <div className="space-y-3">
                                <span className="text-[9px] font-black text-pink-300 uppercase tracking-widest flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5" /> Special Support Program
                                </span>
                                <h3 className="text-xl sm:text-2xl font-black tracking-tight">🏠 Special Support For Home Businesses</h3>
                                <p className="text-xs text-rose-100 leading-relaxed font-semibold max-w-xl">
                                    Are you a home baker, custom crafter, or pickle creator? Aisle features unique tools built specifically for makers: story-sharing fields, custom recipe uploaders, draft saves, and flexible prep timings.
                                </p>
                            </div>
                            
                            <button
                                onClick={() => navigate('/home-business')}
                                className="bg-white hover:bg-rose-50 text-rose-950 font-black text-xs py-3.5 px-6 rounded-2xl shadow transition-all duration-300 flex-shrink-0 flex items-center gap-1.5 uppercase tracking-wider relative z-10"
                            >
                                <span>Explore Program</span>
                                <ChevronRight className="w-4 h-4 text-rose-950" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* SECTION 10: MASSIVE FINAL CTA */}
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-gradient-to-br from-teal-900 via-teal-950 to-slate-900 text-white rounded-[40px] p-8 sm:p-12 text-center space-y-8 relative overflow-hidden shadow-xl">
                        
                        <div className="absolute -top-16 -left-16 w-32 h-32 bg-teal-800/10 rounded-full"></div>
                        <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-white/5 rounded-full"></div>

                        <div className="space-y-4 max-w-2xl mx-auto">
                            <span className="text-[10px] font-black text-teal-300 uppercase tracking-widest block">No obligations • Start free</span>
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Ready to Bring More Customers to Your Business?</h2>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                                Join Aisle today and start appearing in local searches. Receive real inquiries, build neighborhood loyalty, and retain 100% of your price quotes.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-sm mx-auto">
                            <button
                                onClick={() => navigate('/seller/register')}
                                className="bg-teal-500 hover:bg-teal-600 text-white font-black text-xs py-4 px-8 rounded-2xl w-full shadow transition-all uppercase tracking-wider"
                            >
                                Start Your Business
                            </button>
                            <button
                                onClick={() => navigate('/how-it-works')}
                                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-black text-xs py-4 px-8 rounded-2xl w-full transition-all uppercase tracking-wider"
                            >
                                Learn More
                            </button>
                        </div>
                    </div>
                </div>

            </main>

            <Footer />
            </div>

            {/* Mobile Experience (Complete Redesign below 768px) */}
            <div className="block md:hidden">
                <MobileForShops />
            </div>
        </PageWrapper>
    );
};

export default ForShops;
