import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageWrapper from '../components/common/PageWrapper';
import MobileHowItWorks from '../components/mobile/MobileHowItWorks';
import { useNavigate } from 'react-router-dom';
import { 
    MapPin, Store, ShoppingBag, MessageSquare, CheckCircle, 
    Clock, ArrowRight, Shield, Truck, Zap, Users, Award, 
    ChefHat, Gift, Compass, Sparkles, AlertCircle, Check, 
    ArrowLeftRight, Calendar, Star, HelpCircle, Activity, 
    TrendingUp, ArrowDown, ChevronRight
} from 'lucide-react';

const HowItWorks = () => {
    const navigate = useNavigate();
    
    // Track active simulation state based on step hover/click
    const [activeStep, setActiveStep] = useState({ flow: 'customer', index: 1 });
    
    // Stats list for Trust Metrics
    const liveStats = [
        { label: "Products Live", count: "50,000+", icon: <ShoppingBag className="w-5 h-5 text-teal-600" /> },
        { label: "Local Retail Shops", count: "2,000+", icon: <Store className="w-5 h-5 text-amber-600" /> },
        { label: "Home Businesses", count: "500+", icon: <Sparkles className="w-5 h-5 text-pink-600" /> },
        { label: "Live Updates", count: "Daily Scans", icon: <Activity className="w-5 h-5 text-emerald-600" /> }
    ];

    const customerTimeline = [
        {
            index: 1,
            title: "Allow Location",
            time: "5 seconds",
            subtitle: "Find shops and makers near you",
            desc: "Aisle scans your local neighborhood coordinates in real time to locate nearby products.",
            icon: <MapPin className="w-5 h-5" />
        },
        {
            index: 2,
            title: "Browse Nearby",
            time: "1 minute",
            subtitle: "Discover products & businesses",
            desc: "Explore fresh creations, grocery items, or custom baking pages in one place.",
            icon: <Compass className="w-5 h-5" />
        },
        {
            index: 3,
            title: "Pick Your Items",
            time: "30 seconds",
            subtitle: "Select exactly what you need",
            desc: "Click on any product listing to read the creation story, price, and ingredients.",
            icon: <ShoppingBag className="w-5 h-5" />
        },
        {
            index: 4,
            title: "Send Custom Request",
            time: "10 seconds",
            subtitle: "Direct negotiation channel",
            desc: "Send custom specifications (e.g. less salt, custom message, pickup times) in one click.",
            icon: <MessageSquare className="w-5 h-5" />
        },
        {
            index: 5,
            title: "Connect & Collect",
            time: "Instant",
            subtitle: "Handshake completion",
            desc: "Chat with the maker, review the pick-up directions, and pay directly on-site.",
            icon: <CheckCircle className="w-5 h-5" />
        }
    ];

    const sellerTimeline = [
        {
            index: 1,
            title: "Create Shop",
            time: "2 minutes",
            subtitle: "Launch your local profile",
            desc: "Define your shop category (Home Business vs Retail) and add your location.",
            icon: <Store className="w-5 h-5" />
        },
        {
            index: 2,
            title: "Add Creations",
            time: "3 minutes",
            subtitle: "Tell your product story",
            desc: "Upload photos of your items, specify stock mode, prep times, and tell your unique story.",
            icon: <Sparkles className="w-5 h-5" />
        },
        {
            index: 3,
            title: "Receive Requests",
            time: "Instant",
            subtitle: "High-intent customer leads",
            desc: "Get notified instantly when local users query your inventory or request custom orders.",
            icon: <Zap className="w-5 h-5" />
        },
        {
            index: 4,
            title: "Negotiate Orders",
            time: "2 minutes",
            subtitle: "Direct message box",
            desc: "Discuss custom requirements, adjust pricing quotes, and confirm ready slots.",
            icon: <MessageSquare className="w-5 h-5" />
        },
        {
            index: 5,
            title: "Fulfill & Grow",
            time: "Instant",
            subtitle: "Verify with local QR codes",
            desc: "Provide secure checkout QR codes, increase your neighborhood score, and build loyalty.",
            icon: <Award className="w-5 h-5" />
        }
    ];
    return (
        <PageWrapper className="bg-[#FDFCF8] min-h-screen flex flex-col font-sans overflow-x-hidden">
            {/* Desktop Experience (Freeze) */}
            <div className="hidden md:block">
                <Header />

            {/* Custom Keyframes and animations block */}
            <style>{`
                @keyframes radar-pulse {
                    0% { transform: scale(0.85); opacity: 0.6; }
                    100% { transform: scale(2.2); opacity: 0; }
                }
                .animate-radar {
                    animation: radar-pulse 2.2s infinite ease-out;
                }
                @keyframes typing-fade {
                    0%, 100% { opacity: 0.2; }
                    50% { opacity: 1; }
                }
                .typing-dot {
                    animation: typing-fade 1.2s infinite ease-in-out;
                }
                .typing-dot:nth-child(2) { animation-delay: 0.2s; }
                .typing-dot:nth-child(3) { animation-delay: 0.4s; }
                
                /* Custom scrollbar hiding */
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            <main className="flex-grow pt-28 pb-20">
                
                {/* HERO BLOCK & TITLE */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-black uppercase tracking-wider shadow-sm animate-pulse">
                        <Sparkles className="w-3.5 h-3.5" /> Discovery Engine Redefined
                    </div>
                    
                    <h1 className="text-4xl sm:text-5xl font-black text-slate-800 tracking-tight">
                        How Aisle Works
                    </h1>
                    <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto font-medium">
                        Aisle transforms shopping by connecting local customers directly with nearby retail stores and home creators. Explore the visual flow below.
                    </p>

                    {/* UPGRADE 6: LIVE PLATFORM NUMBERS */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6">
                        {liveStats.map((stat, i) => (
                            <div key={i} className="bg-white border border-slate-100/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center">
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-2.5">
                                    {stat.icon}
                                </div>
                                <span className="text-lg font-black text-slate-900">{stat.count}</span>
                                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide mt-0.5">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* UPGRADE 1, 2, 3, 5 & 9: INTERACTIVE DUAL JOURNEY + LIVE SIMULATOR */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    
                    {/* Header for timelines */}
                    <div className="text-center mb-8">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Interactive Platform Journey</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Hover over any step to simulate the interface in the center phone</p>
                    </div>

                    {/* Timeline split container */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                        
                        {/* CUSTOMER TIMELINE (Col-span 4) */}
                        <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
                            <div className="bg-gradient-to-r from-teal-500/10 to-transparent p-4 rounded-2xl border-l-4 border-teal-600 mb-2 text-left">
                                <h3 className="text-sm font-black text-teal-900 uppercase tracking-widest flex items-center gap-1.5">
                                    <Users className="w-4 h-4" /> Customer Journey
                                </h3>
                                <p className="text-[11px] text-slate-500 font-medium mt-1">How local buyers discover unique items and buy nearby.</p>
                            </div>

                            <div className="relative pl-6 space-y-6 text-left flex-1 py-4">
                                {/* Vertical Journey Line */}
                                <div className="absolute left-6 top-6 bottom-6 w-0.5 border-l-2 border-dashed border-slate-200"></div>
                                <div 
                                    className="absolute left-6 top-6 w-0.5 bg-gradient-to-b from-teal-600 to-teal-200 transition-all duration-500 rounded"
                                    style={{ 
                                        height: activeStep.flow === 'customer' ? `${(activeStep.index - 1) * 23.5}%` : '0%',
                                        maxHeight: '100%'
                                    }}
                                ></div>

                                {customerTimeline.map((step) => {
                                    const isActive = activeStep.flow === 'customer' && activeStep.index === step.index;
                                    return (
                                        <div 
                                            key={step.index}
                                            onMouseEnter={() => setActiveStep({ flow: 'customer', index: step.index })}
                                            onClick={() => setActiveStep({ flow: 'customer', index: step.index })}
                                            className={`relative pl-8 cursor-pointer transition-all duration-300 group ${
                                                isActive ? 'scale-101 translate-x-1' : 'opacity-70 hover:opacity-100'
                                            }`}
                                        >
                                            {/* Journey Marker */}
                                            <div className={`absolute -left-3.5 top-0.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-300 ${
                                                isActive 
                                                    ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-100 scale-110' 
                                                    : 'bg-white border-slate-200 text-slate-400'
                                            }`}>
                                                {step.index}
                                            </div>

                                            {/* Content Block */}
                                            <div className={`p-4 rounded-2xl border transition-all ${
                                                isActive 
                                                    ? 'bg-white border-teal-100 shadow-md shadow-teal-50/50' 
                                                    : 'bg-transparent border-transparent'
                                            }`}>
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="text-xs sm:text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                                                        {step.title}
                                                    </h4>
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1 ${
                                                        isActive ? 'bg-teal-50 border-teal-100 text-teal-700' : 'bg-slate-100 border-slate-200 text-slate-400'
                                                    }`}>
                                                        <Clock className="w-2.5 h-2.5" /> {step.time}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-teal-600 font-extrabold uppercase mt-1 block">{step.subtitle}</span>
                                                <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1">{step.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* LIVE PREVIEW SIMULATOR PANEL (Col-span 4) */}
                        <div className="lg:col-span-4 flex flex-col justify-center items-center py-4">
                            
                            {/* Device Frame */}
                            <div className="w-full max-w-[290px] aspect-[9/18] bg-slate-900 rounded-[40px] p-3 shadow-2xl border-4 border-slate-850 relative overflow-hidden flex flex-col select-none ring-12 ring-slate-950/5">
                                
                                {/* Device Camera Notch & Speaker */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-900 rounded-b-2xl z-20 flex items-center justify-center">
                                    <div className="w-8 h-1 bg-slate-800 rounded-full mb-1"></div>
                                </div>

                                {/* Simulator Screen Header */}
                                <div className="bg-white border-b border-slate-100 pt-6 pb-2.5 px-3 flex justify-between items-center z-10">
                                    <span className="font-extrabold text-[10px] text-slate-800">Aisle Live</span>
                                    <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Simulator</span>
                                    </div>
                                </div>

                                {/* Simulator Screen Content Canvas */}
                                <div className="flex-grow bg-[#FDFCF8] p-3 overflow-hidden relative flex flex-col justify-between text-left">
                                    
                                    {/* SIMULATION GRAPHICS RENDER */}
                                    <div className="flex-grow flex flex-col justify-center items-center text-center">
                                        {activeStep.flow === 'customer' && (
                                            <>
                                                {/* CUSTOMER STEP 1: Map / Radar */}
                                                {activeStep.index === 1 && (
                                                    <div className="w-full space-y-3 animate-in fade-in duration-300">
                                                        <div className="relative w-24 h-24 mx-auto rounded-full border border-teal-200/50 bg-teal-50/20 flex items-center justify-center overflow-hidden">
                                                            <div className="absolute w-20 h-20 rounded-full bg-teal-500/10 animate-radar"></div>
                                                            <div className="absolute w-20 h-20 rounded-full bg-teal-500/10 animate-radar" style={{ animationDelay: '0.7s' }}></div>
                                                            <MapPin className="w-8 h-8 text-teal-600 animate-bounce relative z-10" />
                                                        </div>
                                                        <div className="bg-white border border-slate-100 rounded-xl p-2 shadow-sm">
                                                            <span className="text-[8px] font-black text-teal-700 uppercase tracking-wider block">Acquiring Location</span>
                                                            <span className="text-[9px] text-slate-600 font-extrabold block truncate">📍 Vadodara Rural, Gujarat</span>
                                                            <span className="text-[7px] text-slate-400 font-semibold block mt-0.5">Coords: 22.3072, 73.1812</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* CUSTOMER STEP 2: Shop Discovery */}
                                                {activeStep.index === 2 && (
                                                    <div className="w-full space-y-2.5 animate-in slide-in-from-bottom-6 duration-300">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block text-left">Shops Near You</span>
                                                        
                                                        {/* Shop Card Mockup 1 */}
                                                        <div className="bg-white border border-teal-100/50 rounded-xl p-2 shadow-sm text-left flex items-center gap-2">
                                                            <span className="text-xl p-1 bg-teal-50 rounded-lg">🌶️</span>
                                                            <div className="min-w-0 flex-1">
                                                                <h5 className="font-extrabold text-[9px] text-slate-800 truncate">Priya's Kitchen</h5>
                                                                <div className="flex items-center gap-1 text-[7px] font-bold text-slate-400">
                                                                    <span className="text-amber-500">★ 4.9</span>
                                                                    <span>•</span>
                                                                    <span>Home Business</span>
                                                                </div>
                                                            </div>
                                                            <span className="text-[7px] font-black text-teal-700 bg-teal-50 px-1 py-0.5 rounded">1.2km</span>
                                                        </div>

                                                        {/* Shop Card Mockup 2 */}
                                                        <div className="bg-white border border-slate-100 rounded-xl p-2 shadow-sm text-left flex items-center gap-2 opacity-80">
                                                            <span className="text-xl p-1 bg-amber-50 rounded-lg">🍰</span>
                                                            <div className="min-w-0 flex-1">
                                                                <h5 className="font-extrabold text-[9px] text-slate-800 truncate">Sweet Whisk Bakery</h5>
                                                                <div className="flex items-center gap-1 text-[7px] font-bold text-slate-400">
                                                                    <span className="text-amber-500">★ 4.8</span>
                                                                    <span>•</span>
                                                                    <span>Baker</span>
                                                                </div>
                                                            </div>
                                                            <span className="text-[7px] font-black text-amber-700 bg-amber-50 px-1 py-0.5 rounded">800m</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* CUSTOMER STEP 3: Pick Product */}
                                                {activeStep.index === 3 && (
                                                    <div className="w-full space-y-2 animate-in fade-in duration-300">
                                                        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm text-left">
                                                            <div className="h-20 bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center text-2xl relative">
                                                                🌶️
                                                                <span className="absolute bottom-1 right-1.5 bg-slate-900 text-white font-black text-[8px] px-1.5 py-0.5 rounded">₹250</span>
                                                            </div>
                                                            <div className="p-2 space-y-1">
                                                                <h5 className="font-extrabold text-[10px] text-slate-800">Homemade Spicy Mango Pickle</h5>
                                                                <p className="text-[8px] text-slate-400 leading-tight">Authentic recipe made with organic mangoes & cold pressed mustard oil.</p>
                                                                <div className="flex items-center gap-1 text-[7px] font-bold text-teal-700 pt-1">
                                                                    <span>Ready Stock</span>
                                                                    <span>•</span>
                                                                    <span>By Priya's Kitchen</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* CUSTOMER STEP 4: Send Request */}
                                                {activeStep.index === 4 && (
                                                    <div className="w-full space-y-2 animate-in zoom-in-95 duration-300 flex flex-col justify-end h-full pt-12">
                                                        {/* Dialog chat bubble */}
                                                        <div className="bg-teal-550 bg-teal-600 text-white text-[8px] font-bold p-2 rounded-2xl rounded-tr-none self-end max-w-[85%] text-left shadow-sm">
                                                            Hi Priya! Can I get a 1kg jar of Spicy Pickle with slightly less salt? Pick up tomorrow?
                                                        </div>
                                                        
                                                        {/* Status alert bar */}
                                                        <div className="bg-slate-50 border border-slate-150 rounded-xl p-1.5 flex items-center gap-1.5 justify-center">
                                                            <Clock className="w-2.5 h-2.5 text-teal-600 animate-spin" />
                                                            <span className="text-[7px] font-bold text-slate-500 uppercase tracking-wider">Sending Request to Maker...</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* CUSTOMER STEP 5: Connect & Buy */}
                                                {activeStep.index === 5 && (
                                                    <div className="w-full space-y-3 animate-in fade-in duration-300">
                                                        <div className="bg-emerald-50 border border-emerald-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-emerald-600">
                                                            <Check className="w-6 h-6 stroke-[3]" />
                                                        </div>
                                                        
                                                        <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm text-center space-y-2">
                                                            <h5 className="font-extrabold text-[9px] text-slate-800 uppercase tracking-wider">Request Approved!</h5>
                                                            <p className="text-[7.5px] text-slate-500 leading-tight">Priya confirmed: "Pickle ready with custom salt specs. Ready by 4 PM."</p>
                                                            
                                                            {/* Mini barcode/QR mock */}
                                                            <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded mx-auto flex items-center justify-center p-1.5">
                                                                <div className="grid grid-cols-4 gap-0.5 w-full h-full opacity-60">
                                                                    {[...Array(16)].map((_, i) => (
                                                                        <div key={i} className={`bg-slate-900 ${i % 3 === 0 ? 'opacity-90' : 'opacity-20'}`}></div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <span className="text-[6.5px] font-black text-slate-400 block tracking-widest uppercase">AISLE-VERIFY-881</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {activeStep.flow === 'seller' && (
                                            <>
                                                {/* SELLER STEP 1: Create Shop */}
                                                {activeStep.index === 1 && (
                                                    <div className="w-full space-y-2.5 animate-in fade-in duration-300">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block text-left">Shop Register</span>
                                                        
                                                        <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm space-y-2 text-left">
                                                            <div>
                                                                <label className="text-[7px] font-extrabold text-slate-400 uppercase">Shop/Creator Name</label>
                                                                <div className="border border-slate-200 rounded px-1.5 py-0.5 text-[8.5px] text-slate-700 font-bold bg-slate-50">
                                                                    Priya's Kitchen
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="text-[7px] font-extrabold text-slate-400 uppercase">Seller Category</label>
                                                                <div className="border border-slate-200 rounded px-1.5 py-0.5 text-[8.5px] text-slate-700 font-bold bg-slate-50 flex justify-between items-center">
                                                                    <span>🏠 Home Business</span>
                                                                    <span className="text-[6.5px] font-black text-rose-600 bg-rose-50 px-1 rounded uppercase">Selected</span>
                                                                </div>
                                                            </div>
                                                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="w-2/3 h-full bg-teal-500 rounded-full"></div>
                                                            </div>
                                                            <span className="text-[6.5px] text-slate-400 font-bold block text-right">Step 2 of 3</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* SELLER STEP 2: Add Creations */}
                                                {activeStep.index === 2 && (
                                                    <div className="w-full space-y-2 animate-in slide-in-from-bottom-6 duration-300">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block text-left font-bold">New Creation</span>
                                                        
                                                        <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm space-y-2 text-left">
                                                            <div className="flex gap-1.5">
                                                                {/* Photo slots */}
                                                                <div className="w-8 h-8 rounded border border-dashed border-slate-250 flex items-center justify-center text-xs bg-slate-50 relative">
                                                                    🌶️
                                                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[6px]">✓</span>
                                                                </div>
                                                                <div className="w-8 h-8 rounded border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-400 bg-slate-50">
                                                                    + Slot
                                                                </div>
                                                            </div>
                                                            
                                                            <div>
                                                                <label className="text-[6.5px] font-extrabold text-slate-400 uppercase block">My Story</label>
                                                                <p className="text-[7.5px] text-slate-600 italic bg-slate-50 p-1 border rounded leading-tight">
                                                                    "This pickle recipe was passed down by my grandmother..."
                                                                </p>
                                                            </div>
                                                            
                                                            <button className="w-full py-1 rounded bg-slate-900 text-white font-extrabold text-[7.5px] uppercase tracking-wider text-center">
                                                                Publish Creation
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* SELLER STEP 3: Receive Requests */}
                                                {activeStep.index === 3 && (
                                                    <div className="w-full space-y-3 animate-in zoom-in-95 duration-300">
                                                        {/* Simulated OS notification push */}
                                                        <div className="bg-slate-900 text-white border border-slate-800 rounded-xl p-2.5 text-left flex items-start gap-2 shadow-lg w-full">
                                                            <span className="text-lg">🔔</span>
                                                            <div className="min-w-0 flex-1">
                                                                <h6 className="font-extrabold text-[8px] uppercase tracking-wider text-teal-400">Aisle Request</h6>
                                                                <p className="text-[7.5px] font-bold truncate">Aarav sent a custom query (1.2 km away)</p>
                                                            </div>
                                                            <span className="text-[6px] text-slate-400 uppercase font-black">Just Now</span>
                                                        </div>
                                                        
                                                        {/* Inbox Dashboard badge */}
                                                        <div className="bg-white border border-slate-100 rounded-xl p-2 shadow-sm text-left flex justify-between items-center">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                                                                <span className="text-[8.5px] font-black text-slate-800">Inbox Requests</span>
                                                            </div>
                                                            <span className="bg-rose-500 text-white font-black text-[8px] px-1.5 py-0.5 rounded-full">1 New</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* SELLER STEP 4: Negotiate Orders */}
                                                {activeStep.index === 4 && (
                                                    <div className="w-full space-y-2 animate-in fade-in duration-300 flex flex-col justify-end h-full pt-10">
                                                        <div className="bg-slate-100 text-slate-800 text-[8px] font-semibold p-2 rounded-2xl rounded-tl-none self-start max-w-[85%] text-left">
                                                            Hi! Can I get less salt?
                                                        </div>
                                                        <div className="bg-teal-600 text-white text-[8px] font-bold p-2 rounded-2xl rounded-tr-none self-end max-w-[85%] text-left">
                                                            Absolutely, I'll prepare a custom batch tonight!
                                                        </div>
                                                        
                                                        {/* Action tools */}
                                                        <div className="flex gap-1.5 pt-1.5">
                                                            <button className="flex-1 py-1 rounded border border-slate-200 text-slate-500 text-[7px] uppercase font-black bg-white">Decline</button>
                                                            <button className="flex-1 py-1 rounded bg-teal-600 text-white text-[7px] uppercase font-black">Send Quote: ₹250</button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* SELLER STEP 5: Fulfill & Grow */}
                                                {activeStep.index === 5 && (
                                                    <div className="w-full space-y-2 animate-in fade-in duration-300">
                                                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 text-center space-y-1.5 shadow-sm">
                                                            <span className="text-xl">🏆</span>
                                                            <h5 className="font-extrabold text-[9px] text-emerald-950 uppercase tracking-wider block">Order Completed</h5>
                                                            <span className="text-[12px] font-black text-slate-900 block">+₹250</span>
                                                        </div>

                                                        {/* Dashboard metrics */}
                                                        <div className="bg-white border border-slate-100 rounded-xl p-2 shadow-sm text-left flex justify-between items-center">
                                                            <div>
                                                                <span className="text-[6.5px] font-extrabold text-slate-400 uppercase block">Growth Score</span>
                                                                <span className="text-[10px] font-black text-slate-800">98% High Pulse</span>
                                                            </div>
                                                            <span className="text-[6.5px] font-black text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded uppercase">Level Up</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Simulator Home indicator */}
                                    <div className="w-20 h-1 bg-slate-200 rounded-full mx-auto mt-2"></div>
                                </div>
                            </div>
                        </div>

                        {/* SELLER TIMELINE (Col-span 4) */}
                        <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
                            <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-4 rounded-2xl border-l-4 border-amber-500 mb-2 text-left">
                                <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest flex items-center gap-1.5">
                                    <Store className="w-4 h-4" /> Seller Journey
                                </h3>
                                <p className="text-[11px] text-slate-500 font-medium mt-1">How makers build profiles, list inventory, and fulfill requests.</p>
                            </div>

                            <div className="relative pl-6 space-y-6 text-left flex-1 py-4">
                                {/* Vertical Journey Line */}
                                <div className="absolute left-6 top-6 bottom-6 w-0.5 border-l-2 border-dashed border-slate-200"></div>
                                <div 
                                    className="absolute left-6 top-6 w-0.5 bg-gradient-to-b from-amber-500 to-amber-200 transition-all duration-500 rounded"
                                    style={{ 
                                        height: activeStep.flow === 'seller' ? `${(activeStep.index - 1) * 23.5}%` : '0%',
                                        maxHeight: '100%'
                                    }}
                                ></div>

                                {sellerTimeline.map((step) => {
                                    const isActive = activeStep.flow === 'seller' && activeStep.index === step.index;
                                    return (
                                        <div 
                                            key={step.index}
                                            onMouseEnter={() => setActiveStep({ flow: 'seller', index: step.index })}
                                            onClick={() => setActiveStep({ flow: 'seller', index: step.index })}
                                            className={`relative pl-8 cursor-pointer transition-all duration-300 group ${
                                                isActive ? 'scale-101 translate-x-1' : 'opacity-70 hover:opacity-100'
                                            }`}
                                        >
                                            {/* Journey Marker */}
                                            <div className={`absolute -left-3.5 top-0.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-300 ${
                                                isActive 
                                                    ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-100 scale-110' 
                                                    : 'bg-white border-slate-200 text-slate-400'
                                            }`}>
                                                {step.index}
                                            </div>

                                            {/* Content Block */}
                                            <div className={`p-4 rounded-2xl border transition-all ${
                                                isActive 
                                                    ? 'bg-white border-amber-100 shadow-md shadow-amber-50/50' 
                                                    : 'bg-transparent border-transparent'
                                            }`}>
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="text-xs sm:text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                                                        {step.title}
                                                    </h4>
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1 ${
                                                        isActive ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-400'
                                                    }`}>
                                                        <Clock className="w-2.5 h-2.5" /> {step.time}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-amber-600 font-extrabold uppercase mt-1 block">{step.subtitle}</span>
                                                <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1">{step.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                </div>

                {/* UPGRADE 4: REAL EXAMPLE STORY */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
                    <div className="bg-white rounded-[32px] border border-slate-100 p-6 sm:p-8 shadow-sm text-left relative overflow-hidden">
                        
                        {/* Decorative background circle */}
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-teal-500/5 rounded-full"></div>
                        
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4 mb-6">
                            <div>
                                <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest block">Aisle in Action</span>
                                <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">A 12-Minute Pickle Story</h3>
                            </div>
                            <div className="bg-slate-900 text-white font-black text-xs px-4 py-1.5 rounded-full shadow-sm">
                                Total Duration: 12 mins
                            </div>
                        </div>

                        {/* Story flow bubbles */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[
                                { title: "1. The Need", desc: "Priya wanted spicy, low-sodium Mango Pickles.", sub: "📍 Vadodara Rural", color: "bg-slate-50 border-slate-100 text-slate-850" },
                                { title: "2. The Scan", desc: "Found nearby seller Priya's Kitchen (1.2 km).", sub: "🔍 Aisle Search Engine", color: "bg-teal-50/40 border-teal-100/50 text-teal-950" },
                                { title: "3. Direct Quote", desc: "Sent direct request & locked ₹250 quote.", sub: "💬 Conversational Lead", color: "bg-amber-50/40 border-amber-100/50 text-amber-950" },
                                { title: "4. The Handshake", desc: "Picked up jar same day on the drive home.", sub: "🤝 Completed Locally", color: "bg-emerald-50/40 border-emerald-100/50 text-emerald-950" }
                            ].map((story, i) => (
                                <div key={i} className={`p-4 rounded-2xl border flex flex-col justify-between ${story.color}`}>
                                    <div>
                                        <h5 className="font-extrabold text-xs uppercase tracking-wide border-b border-slate-150 pb-1 mb-2">{story.title}</h5>
                                        <p className="text-xs font-semibold leading-relaxed">{story.desc}</p>
                                    </div>
                                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 mt-4 block">{story.sub}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* UPGRADE 7: SPECIAL FOR HOME BUSINESSES */}
                <div className="bg-gradient-to-b from-transparent via-[#F9F7F1] to-transparent py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
                        <div className="space-y-3">
                            <span className="text-[10px] font-black text-pink-600 bg-pink-50 border border-pink-100 px-3 py-1 rounded-full uppercase tracking-widest inline-block shadow-sm">
                                🏠 Special for Home Businesses
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Turn Your Skills Into Income</h2>
                            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto font-medium">Aisle is custom-built to help local bakers, pickle makers, and artisans sell without renting storefronts.</p>
                        </div>

                        {/* Home Business Card Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
                            
                            {/* Card 1: Homemade Food */}
                            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-xl shadow-sm">🌶️</div>
                                    <h4 className="font-extrabold text-base text-slate-800">Homemade Food & Tiffins</h4>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Sell traditional treats, weekly lunch plans, or custom orders directly from your kitchen.</p>
                                    
                                    <div className="flex flex-wrap gap-1.5 pt-2">
                                        {["Pickles", "Papad", "Tiffin Services", "Dry Snacks"].map((tag) => (
                                            <span key={tag} className="text-[9px] font-bold bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                                <span className="text-[9px] font-black uppercase text-teal-600 tracking-wider block mt-6">Zero Commission • Sell From Home</span>
                            </div>

                            {/* Card 2: Handmade Products */}
                            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center text-xl shadow-sm">🧶</div>
                                    <h4 className="font-extrabold text-base text-slate-800">Handmade Products</h4>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Display custom craft baskets, handwoven crochet, custom festive products, and decorations.</p>
                                    
                                    <div className="flex flex-wrap gap-1.5 pt-2">
                                        {["Custom Rakhis", "Gift Boxes", "Crochet Items", "Home Decor"].map((tag) => (
                                            <span key={tag} className="text-[9px] font-bold bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                                <span className="text-[9px] font-black uppercase text-pink-600 tracking-wider block mt-6">Direct In-App Orders • Safe Pickup</span>
                            </div>

                            {/* Card 3: Custom Requests */}
                            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-xl shadow-sm">🎂</div>
                                    <h4 className="font-extrabold text-base text-slate-800">Custom Requests Inbox</h4>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Receive personalized catering quotes, festival specific requests, or custom cake flavors.</p>
                                    
                                    <div className="flex flex-wrap gap-1.5 pt-2">
                                        {["Cake Orders", "Festival Sweets", "Bulk Catering", "Private Tutoring"].map((tag) => (
                                            <span key={tag} className="text-[9px] font-bold bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                                <span className="text-[9px] font-black uppercase text-amber-600 tracking-wider block mt-6">Set Custom Prep Times • Custom Price Quotes</span>
                            </div>

                        </div>
                    </div>
                </div>

                {/* UPGRADE 8: WHAT MAKES AISLE DIFFERENT */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center space-y-8">
                    <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">How we compare</span>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">What Makes Aisle Different</h2>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm text-left">
                        <table className="w-full text-xs sm:text-sm">
                            <thead>
                                <tr className="bg-slate-900 text-white font-extrabold border-b border-slate-800">
                                    <th className="p-4 uppercase tracking-wider text-[10px]">Feature</th>
                                    <th className="p-4 uppercase tracking-wider text-[10px] text-slate-350 bg-slate-850">Traditional Marketplace</th>
                                    <th className="p-4 uppercase tracking-wider text-[10px] text-teal-400">Aisle Local Engine</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {[
                                    { f: "Shipping & Fulfillment", t: "Warehouse cargo shipping (3-5 days)", a: "Direct local pickup / Same-day chat" },
                                    { f: "Delivery Duration", t: "Long shipping durations & cargo logistics", a: "Same day (Often within 15-30 minutes)" },
                                    { f: "Seller Transparency", t: "Hidden corporate sellers & brokers", a: "Direct nearby neighborhood makers" },
                                    { f: "Order Personalization", t: "Strictly static items. No customizations", a: "Direct messaging custom order quotes" },
                                    { f: "Support for Creators", t: "Prohibitive costs & shipping requirements", a: "Custom-made for home businesses" }
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

                {/* UPGRADE 10: DUAL SPLIT CTA TIMELINE PATHS */}
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* Customer Path CTA */}
                        <div className="bg-gradient-to-br from-teal-900 to-teal-950 text-white rounded-[32px] p-8 text-left space-y-6 flex flex-col justify-between relative overflow-hidden shadow-lg">
                            <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-teal-800/10 rounded-full"></div>
                            
                            <div className="space-y-3">
                                <span className="text-[9px] font-black text-teal-300 uppercase tracking-widest block">For Local Buyers</span>
                                <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">Ready to explore what's available around you?</h3>
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">Scan Vadodara for fresh bakeries, homemade products, groceries, and creators live in your area.</p>
                            </div>
                            
                            <button
                                onClick={() => navigate('/explore')}
                                className="bg-white hover:bg-teal-50 text-teal-950 font-black text-xs py-4 px-6 rounded-2xl shadow transition-all duration-300 w-full flex items-center justify-center gap-2 uppercase tracking-wider relative z-10"
                            >
                                <span>Explore Nearby Shops</span>
                                <ArrowRight className="w-4 h-4 text-teal-950" />
                            </button>
                        </div>

                        {/* Seller Path CTA */}
                        <div className="bg-gradient-to-br from-[#E07A5F] to-[#C95B42] text-white rounded-[32px] p-8 text-left space-y-6 flex flex-col justify-between relative overflow-hidden shadow-lg">
                            <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-white/10 rounded-full"></div>
                            
                            <div className="space-y-3">
                                <span className="text-[9px] font-black text-amber-250 text-amber-200 uppercase tracking-widest block">For Creators & Sellers</span>
                                <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">Ready to start selling your creations from home?</h3>
                                <p className="text-xs text-orange-100 leading-relaxed font-medium">List your products, setup custom prep timings, talk to customers directly, and build local brand loyalty.</p>
                            </div>
                            
                            <button
                                onClick={() => navigate('/seller/register')}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-4 px-6 rounded-2xl shadow transition-all duration-300 w-full flex items-center justify-center gap-2 uppercase tracking-wider relative z-10"
                            >
                                <span>Create Your Shop</span>
                                <ArrowRight className="w-4 h-4 text-white" />
                            </button>
                        </div>

                    </div>
                </div>

            </main>

            <Footer />
            </div>

            {/* Mobile Experience (Complete Redesign below 768px) */}
            <div className="block md:hidden">
                <MobileHowItWorks />
            </div>
        </PageWrapper>
    );
};

export default HowItWorks;
