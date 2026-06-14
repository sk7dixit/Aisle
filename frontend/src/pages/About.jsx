import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageWrapper from '../components/common/PageWrapper';
import MobileAbout from '../components/mobile/MobileAbout';
import { useNavigate } from 'react-router-dom';
import { 
    MapPin, Store, ShoppingBag, MessageSquare, Clock, 
    ArrowRight, Shield, Zap, Users, Award, TrendingUp, 
    Sparkles, Check, CheckCircle, DollarSign, Activity, 
    ChevronRight, LineChart, Star, Compass, Heart, Calendar
} from 'lucide-react';

const About = () => {
    const navigate = useNavigate();

    // Section 10: Active city statistics simulation state
    const [cityStats, setCityStats] = useState({
        shops: 184,
        products: 4860,
        homeBiz: 42
    });

    // Simulate minor live ticking counters for Vadodara Pulse
    useEffect(() => {
        const interval = setInterval(() => {
            setCityStats(prev => ({
                shops: prev.shops + (Math.random() > 0.7 ? 1 : 0),
                products: prev.products + (Math.random() > 0.5 ? Math.floor(Math.random() * 3) + 1 : 0),
                homeBiz: prev.homeBiz + (Math.random() > 0.95 ? 1 : 0)
            }));
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const timelineMilestones = [
        { year: "2025", title: "Idea Conception", desc: "Aisle was founded after seeing neighborhood businesses struggle to display their real-time inventory to nearby online searchers." },
        { year: "2026", title: "First Businesses Onboarded", desc: "Successfully onboarded the first 100 independent businesses in Vadodara, mapping real-time grocery and retail catalogs." },
        { year: "Mid 2026", title: "Home Business Program", desc: "Launched dedicated creators uploader modules, enabling home bakers and pickle makers to list custom stock." },
        { year: "Late 2026", title: "AI Search Discovery", desc: "Introduced smart filters, distance-calculated routing, and automated stock confidence indexing." },
        { year: "2027", title: "Multi-City Expansion", desc: "Expanding Aisle to support neighborhood local discovery engines across 5 new regional hubs." }
    ];

    const trustCounters = [
        { count: "200+", label: "Businesses Onboarded", icon: <Store className="w-5 h-5 text-teal-600" /> },
        { count: "5,000+", label: "Products Listed", icon: <ShoppingBag className="w-5 h-5 text-rose-500" /> },
        { count: "50+", label: "Home Businesses", icon: <Sparkles className="w-5 h-5 text-pink-600" /> },
        { count: "3+", label: "Cities Covered", icon: <MapPin className="w-5 h-5 text-amber-600" /> }
    ];

    const serveCards = [
        {
            title: "Customers",
            desc: "Find products and unique creators nearby, chat directly, and pick up orders same-day without wait times.",
            icon: <Users className="w-5 h-5 text-teal-600" />
        },
        {
            title: "Businesses",
            desc: "Gain instant digital visibility to nearby queries, attract footfall, and sell without delivery commissions.",
            icon: <Store className="w-5 h-5 text-amber-600" />
        },
        {
            title: "Creators & Home Entrepreneurs",
            desc: "Sell homemade pickles, custom cakes, or handmade crafts with custom prep times and stories.",
            icon: <Sparkles className="w-5 h-5 text-pink-600" />
        },
        {
            title: "Independent Sellers",
            desc: "Connect directly with local buyers searching for immediate neighborhood maintenance, coaching, or utilities.",
            icon: <Zap className="w-5 h-5 text-rose-500" />
        }
    ];

    return (
        <PageWrapper className="bg-[#FDFCF8] min-h-screen flex flex-col font-sans overflow-x-hidden">
            {/* Desktop Experience (Frozen above 768px) */}
            <div className="hidden md:block">
                <Header />

            <main className="flex-grow pt-28 pb-20">

                {/* SECTION 1: HERO UPGRADE */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 pt-6">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-black uppercase tracking-wider shadow-sm animate-pulse">
                        <Compass className="w-3.5 h-3.5" /> Our Mission & Vision
                    </div>
                    
                    <h1 className="text-4xl sm:text-5xl font-black text-slate-800 tracking-tight max-w-4xl mx-auto leading-[1.15]">
                        The Internet Helped Big Stores.<br /> We Are Building It For Local Ones.
                    </h1>
                    
                    <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto font-medium">
                        Millions of products exist just a few streets away, yet customers cannot discover them online. Aisle bridges that gap by mapping local inventories in real time.
                    </p>
                </div>

                {/* SECTION 2: THE PROBLEM (VISUAL SPLIT SCREEN) */}
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 text-center">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-8">The Local Discovery Gap</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
                        
                        {/* BEFORE AISLE */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5 text-left relative flex flex-col justify-between">
                            <div>
                                <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100 uppercase tracking-wider block mb-4 w-max">
                                    Before Aisle
                                </span>
                                
                                <div className="space-y-4">
                                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-150">
                                        <h5 className="font-extrabold text-xs text-slate-850">Customer Side</h5>
                                        <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1">Needs a phone charger immediately. Searches online. Waits 2 days for warehouse dispatch.</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-150">
                                        <h5 className="font-extrabold text-xs text-slate-850">Seller Side</h5>
                                        <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1">Has the phone charger sitting on the shelf. But no nearby customer knows it is available.</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center mt-6 text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" /> Disconnected Fragmented Retail
                            </div>
                        </div>

                        {/* AFTER AISLE */}
                        <div className="bg-gradient-to-br from-teal-500/5 to-teal-500/10 border border-teal-100 rounded-3xl p-6 shadow-md space-y-5 text-left relative flex flex-col justify-between">
                            <div>
                                <span className="text-[9px] font-black text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100 uppercase tracking-wider block mb-4 w-max">
                                    With Aisle
                                </span>
                                
                                <div className="space-y-4">
                                    <div className="p-3 bg-white/80 rounded-2xl border border-teal-100/50">
                                        <h5 className="font-extrabold text-xs text-slate-850">Customer Search</h5>
                                        <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">Enters "charger" in Aisle. Discovers it available 300m away at a nearby retail shop.</p>
                                    </div>
                                    <div className="p-3 bg-white/80 rounded-2xl border border-teal-100/50">
                                        <h5 className="font-extrabold text-xs text-slate-850">Instant Connection</h5>
                                        <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">Sends direct custom request or quote, walks over, and picks up the item same-day.</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-teal-600 text-white rounded-xl p-2.5 text-center mt-6 font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm shadow-teal-700/10">
                                <Zap className="w-3.5 h-3.5 animate-bounce" /> Connected Local Discovery
                            </div>
                        </div>

                    </div>
                </div>

                {/* SECTION 3: WHY WE BUILT AISLE (EMOTIONAL COPY) */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center space-y-6">
                    <h3 className="text-[10px] font-black text-slate-455 uppercase tracking-widest block">Why We Built Aisle</h3>
                    
                    <div className="space-y-4 max-w-2xl mx-auto text-slate-500 font-semibold text-xs sm:text-sm leading-relaxed">
                        <p>
                            Every city has thousands of neighborhood businesses. Every lane has products people need immediately—from fresh grocery items to unique creations baked inside home kitchens.
                        </p>
                        <p>
                            Yet, when customers search online, they only see massive e-commerce warehouses located hundreds of kilometers away. Local businesses, makers, and creators are shut out of the discovery cycle.
                        </p>
                        <p className="text-slate-800 font-extrabold text-sm sm:text-base">
                            We believed local businesses deserved equal visibility. That's why Aisle was created. We want to bring the convenience of search engines to the creators and business owners next door.
                        </p>
                    </div>
                </div>

                {/* SECTION 4: MISSION & VISION CARDS */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Mission */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-left space-y-3 relative overflow-hidden">
                            <div className="absolute -top-6 -right-6 w-20 h-20 bg-teal-500/5 rounded-full"></div>
                            <h4 className="font-extrabold text-sm text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Compass className="w-4 h-4" /> Our Mission
                            </h4>
                            <h3 className="font-black text-slate-800 text-lg sm:text-xl tracking-tight">Help people discover local inventory instantly.</h3>
                            <p className="text-xs text-slate-400 font-semibold leading-relaxed">We map neighborhoods so users never have to wait for warehouse shipping when the product is already next door.</p>
                        </div>

                        {/* Vision */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-left space-y-3 relative overflow-hidden">
                            <div className="absolute -top-6 -right-6 w-20 h-20 bg-rose-500/5 rounded-full"></div>
                            <h4 className="font-extrabold text-sm text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Zap className="w-4 h-4" /> Our Vision
                            </h4>
                            <h3 className="font-black text-slate-800 text-lg sm:text-xl tracking-tight">Create the largest real-time local commerce network.</h3>
                            <p className="text-xs text-slate-400 font-semibold leading-relaxed">Empower local retailers and home business creators with robust tools to chat, quote pricing, and grow sustainably.</p>
                        </div>

                    </div>
                </div>

                {/* SECTION 5: NUMBERS SECTION (COUNTERS) */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {trustCounters.map((counter, i) => (
                            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-center flex flex-col items-center justify-center">
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-2">
                                    {counter.icon}
                                </div>
                                <span className="text-xl sm:text-2xl font-black text-slate-800 leading-none">{counter.count}</span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-1">{counter.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SECTION 6: HOME BUSINESS MOVEMENT (EMPOWERMENT) */}
                <div className="bg-gradient-to-b from-transparent via-[#F7F6EE] to-transparent py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
                        <div className="space-y-2">
                            <span className="text-[10px] font-black text-pink-600 bg-pink-50 border border-pink-100 px-3 py-1 rounded-full uppercase tracking-widest inline-block shadow-sm">
                                Creator Advocacy
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Empowering The Home Business Movement</h2>
                            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto font-medium">Home creators represent a major pillar of Aisle. We help them sell without expensive storefront leases.</p>
                        </div>

                        {/* Home Business Movement details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
                            
                            {/* Card 1: Homemade Food */}
                            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-lg">🌶️</div>
                                    <h4 className="font-extrabold text-base text-slate-850">Homemade Creations</h4>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        Empowering local chefs who bake customized cakes, prepare traditional spicy pickles, dry papads, and tiffin boxes directly from home kitchens.
                                    </p>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-wider text-teal-600 block mt-6">Traditional Recipes • Fresh Stocks</span>
                            </div>

                            {/* Card 2: Handmade Creations */}
                            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center text-lg">🧶</div>
                                    <h4 className="font-extrabold text-base text-slate-850">Handmade Creations</h4>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        Providing custom gallery slots for makers crafting holiday decorations, woven crochet clothing, custom gift boxes, and unique rakhis.
                                    </p>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-wider text-pink-600 block mt-6">Handmade Quality • Custom Requests</span>
                            </div>

                            {/* Card 3: Women Entrepreneurs */}
                            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-lg">👩‍💼</div>
                                    <h4 className="font-extrabold text-base text-slate-850">Women Entrepreneurs</h4>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        Allowing women to run micro-enterprises from home, select flexible preparation times, post personal stories, and grow independently.
                                    </p>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-wider text-rose-600 block mt-6">Sell Locally • Work Independently</span>
                            </div>

                        </div>
                    </div>
                </div>

                {/* SECTION 7: MEET THE ECOSYSTEM */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-10">
                    <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">The Ecosystem</span>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Who We Empower</h2>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto font-medium">Aisle brings every local commerce layer onto one digital canvas</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto text-left">
                        {serveCards.map((card, i) => (
                            <div key={i} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                                <div className="space-y-3">
                                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 w-max">
                                        {card.icon}
                                    </div>
                                    <h4 className="font-extrabold text-sm text-slate-805">{card.title}</h4>
                                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">{card.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SECTION 8: WHAT MAKES AISLE DIFFERENT */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center space-y-8">
                    <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Comparison</span>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Aisle vs Traditional E-Commerce</h2>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm text-left">
                        <table className="w-full text-xs sm:text-sm">
                            <thead>
                                <tr className="bg-slate-900 text-white font-extrabold border-b border-slate-800">
                                    <th className="p-4 uppercase tracking-wider text-[10px]">Feature</th>
                                    <th className="p-4 uppercase tracking-wider text-[10px] text-slate-350 bg-slate-850">Traditional E-Commerce</th>
                                    <th className="p-4 uppercase tracking-wider text-[10px] text-teal-400">Aisle Local Network</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {[
                                    { f: "Warehouse first vs Local first", t: "Sells items shipped from remote warehouses", a: "Highlights stock ready in nearby lanes" },
                                    { f: "Delivery wait times", t: "Takes 2 to 5 days for cargo logistics", a: "Same-day collection (Within minutes)" },
                                    { f: "Competition scope", t: "National competition with major brokers", a: "Exclusive visibility within local radius" },
                                    { f: "Catalog inventories", t: "Generic, bulk-manufactured products", a: "Unique creation stories & local inventory" },
                                    { f: "Custom requests", t: "No custom orders or negotiation", a: "Direct custom requests via in-app chat" }
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

                {/* SECTION 9: FOUNDER VISION SECTION */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center">
                    <div className="bg-white border border-slate-150 rounded-[40px] p-8 max-w-3xl mx-auto shadow-sm relative overflow-hidden text-center space-y-6">
                        <Heart className="w-10 h-10 text-rose-500 fill-rose-100 mx-auto animate-pulse" />
                        <h3 className="text-lg sm:text-xl font-black text-slate-855 max-w-xl mx-auto leading-relaxed">
                            "Aisle is built for the neighborhood. Built for the business owner. Built for the creator working from home. Built for the customer who needs something today."
                        </h3>
                        <div className="w-12 h-0.5 bg-rose-200 mx-auto"></div>
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">The Aisle Product Philosophy</span>
                    </div>
                </div>

                {/* SECTION 10: INTERACTIVE CITY MAP / PULSE (VADODARA) */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center">
                    <div className="bg-slate-900 border border-slate-850 text-white rounded-[36px] p-8 shadow-lg text-left relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-teal-600/5 rounded-full"></div>
                        
                        {/* Map labels */}
                        <div className="space-y-3">
                            <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest block">Active Regional Hub</span>
                            <h3 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                                </span>
                                <span>Vadodara Hub Pulse</span>
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed font-semibold max-w-sm">
                                Checking active nodes and inventories live in Vadodara Taluka.
                            </p>
                        </div>

                        {/* Interactive counters */}
                        <div className="grid grid-cols-3 gap-6 bg-slate-850 border border-slate-800 p-5 rounded-2xl flex-shrink-0 w-full md:w-auto text-center">
                            <div>
                                <span className="text-lg font-black text-white block">{cityStats.shops}</span>
                                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Active Businesses</span>
                            </div>
                            <div>
                                <span className="text-lg font-black text-teal-400 block">{cityStats.products}</span>
                                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Creations Live</span>
                            </div>
                            <div>
                                <span className="text-lg font-black text-pink-500 block">{cityStats.homeBiz}</span>
                                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Home Biz</span>
                            </div>
                        </div>

                    </div>
                </div>

                {/* SECTION 11: GROWTH TIMELINE */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center space-y-12">
                    <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-455 uppercase tracking-widest block">Milestones</span>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Our Growth Timeline</h2>
                    </div>

                    <div className="relative max-w-2xl mx-auto text-left pl-6 py-4">
                        {/* Connecting Line */}
                        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-200"></div>

                        <div className="space-y-8">
                            {timelineMilestones.map((m, idx) => (
                                <div key={idx} className="relative pl-8 group">
                                    {/* Circle dot */}
                                    <div className="absolute -left-2.5 top-0.5 w-5 h-5 rounded-full bg-white border-2 border-teal-500 flex items-center justify-center z-10 transition-colors group-hover:bg-teal-500 duration-200">
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 group-hover:bg-white transition-colors"></div>
                                    </div>

                                    {/* Box content */}
                                    <div className="space-y-1 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                        <span className="text-[10px] font-black text-teal-600 uppercase tracking-wider flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" /> {m.year}
                                        </span>
                                        <h4 className="font-extrabold text-sm text-slate-800">{m.title}</h4>
                                        <p className="text-xs text-slate-400 font-semibold leading-relaxed">{m.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* SECTION 12: MASSIVE FINAL CTA */}
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-gradient-to-br from-teal-900 via-teal-950 to-slate-900 text-white rounded-[40px] p-8 sm:p-12 text-center space-y-8 relative overflow-hidden shadow-xl">
                        
                        <div className="absolute -top-16 -left-16 w-32 h-32 bg-teal-800/10 rounded-full"></div>
                        <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-white/5 rounded-full"></div>

                        <div className="space-y-4 max-w-2xl mx-auto">
                            <span className="text-[10px] font-black text-teal-300 uppercase tracking-widest block">Start today</span>
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Join The Future Of Local Commerce</h2>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                                Whether you are a local buyer searching for unique items nearby, a retail merchant seeking footfall, or a home business creator listing your first creation.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-xl mx-auto">
                            <button
                                onClick={() => navigate('/explore')}
                                className="bg-teal-500 hover:bg-teal-600 text-white font-black text-xs py-4 px-6 rounded-2xl w-full shadow transition-all uppercase tracking-wider"
                            >
                                Explore Nearby Businesses
                            </button>
                            <button
                                onClick={() => navigate('/seller/register')}
                                className="bg-white/15 hover:bg-white/25 text-white border border-white/20 font-black text-xs py-4 px-6 rounded-2xl w-full transition-all uppercase tracking-wider"
                            >
                                Start Your Business
                            </button>
                            <button
                                onClick={() => navigate('/home-business')}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-4 px-6 rounded-2xl w-full shadow transition-all uppercase tracking-wider"
                            >
                                Start Home Business
                            </button>
                        </div>
                    </div>
                </div>

            </main>

            <Footer />
            </div>

            {/* Mobile Experience (Complete Redesign below 768px) */}
            <div className="block md:hidden">
                <MobileAbout />
            </div>
        </PageWrapper>
    );
};

export default About;
