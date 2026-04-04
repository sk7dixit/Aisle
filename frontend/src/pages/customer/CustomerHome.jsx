import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import {
    Store,
    ArrowRight,
    Heart,
    Wrench, // For Services
    MapPin,
    CheckCircle,
    RefreshCw,
    Navigation,
    TrendingUp,
    Clock,
    Star,
    Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CustomerHome = () => {
    const navigate = useNavigate();
    const { userLocation } = useLocation();
    const city = userLocation?.city || "Your Area";

    return (
        <div className="min-h-screen font-sans pb-20 relative overflow-x-hidden">

            {/* 1. GLOBAL PAGE BASE: Max width 1200, Center */}
            <div className="max-w-[1200px] mx-auto px-6 md:px-8 relative z-10 transition-colors duration-500">

                {/* 2. HERO SECTION */}
                <HeroSection />

                {/* 4. QUICK ACTION CARDS */}
                <QuickActionsSection />

                {/* 5. LIVE MARKET SECTION */}
                <LiveMarketSection city={city} />

                {/* --- NEW RETENTION LAYERS --- */}

                {/* ADDITION 1: TRENDING NEAR YOU */}
                <TrendingSection />

                {/* ADDITION 2: SHOP SPOTLIGHT */}
                <ShopSpotlightSection />

                {/* ADDITION 3: JUST UPDATED FEED */}
                <JustUpdatedFeed city={city} />

                {/* ADDITION 5: PERSONAL HOOK (Inserted before Service Teaser for flow) */}
                <PersonalHookSection city={city} />

                {/* ADDITION 4: SERVICE DISCOVERY TEASER */}
                <ServiceDiscoveryTeaser />

                {/* 6. TRUST SIGNAL STRIP */}
                <TrustSignalStrip />

            </div>
        </div>
    );
};

// --- COMPONENTS ---

// 2 & 3. HERO & AUTO-SHIFTING SHOWCASE
const HeroSection = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col md:flex-row items-center justify-between pt-16 md:pt-24 mb-24 min-h-[420px]">

            {/* LEFT: Text + CTA */}
            <div className="w-full md:w-1/2 text-left z-10">
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="text-[44px] font-bold text-[#1f2937] leading-[1.15] mb-4"
                >
                    Find what’s actually <br />
                    <span className="text-[#E07A5F] animate-pulse">available</span> near you.
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    transition={{ delay: 0.1, duration: 0.45 }}
                    className="text-[16px] text-[#1f2937] opacity-80 mb-10 max-w-md"
                >
                    Real local shops. Real stock. <br />
                    Updated by shop owners nearby.
                </motion.p>

                <motion.button
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => navigate('/shops')}
                    className="group bg-gradient-to-r from-[#E07A5F] to-[#F2CC8F] text-white px-8 py-3.5 rounded-full font-bold text-sm shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                >
                    Explore Nearby Shops
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
            </div>

            {/* RIGHT: Auto-shifting product showcase */}
            <div className="w-full md:w-1/2 flex justify-end mt-12 md:mt-0 relative h-[320px] overflow-hidden">
                <AutoShiftShowcase />
            </div>
        </div>
    );
};

// 3. AUTO-SHIFTING SHOWCASE LOGIC
const AutoShiftShowcase = () => {
    // Mock Data for "Real" feel
    const cards = [
        { id: 1, name: "Fresh Organic Apples", price: "₹180/kg", shop: "Green Valley Farms", img: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&q=80" },
        { id: 2, name: "Nike Air Zoom", price: "₹8,499", shop: "City Sports Hub", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80" },
        { id: 3, name: "Sourdough Bread", price: "₹120", shop: "The Baker's Corner", img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80" },
        { id: 4, name: "Sony WH-1000XM5", price: "₹24,990", shop: "Tech World", img: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=400&q=80" },
        { id: 5, name: "Ceramic Vase Set", price: "₹1,250", shop: "Home Decor Studio", img: "https://images.unsplash.com/photo-1612196808214-b7e239e5f6b7?auto=format&fit=crop&w=400&q=80" },
    ];

    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % cards.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [isPaused, cards.length]);

    return (
        <div
            className="relative w-full h-full flex items-center justify-center mask-image-gradient"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="relative w-[240px] h-[280px]"> {/* Container for cards */}
                <AnimatePresence mode="popLayout">
                    {cards.map((card, index) => {
                        // Calculate relative position logic for simple carousel effect
                        // 0 is active, 1 is next, -1 is prev (simplified for "auto shift stream")
                        // Actually, prompts asks for transform translateX logic. 
                        // Let's use a simpler stack approach that feels like a stream.

                        // Current approach: Just show Active + Next, shifting left.

                        const offset = (index - activeIndex + cards.length) % cards.length;

                        // Only render relevant cards to save resources: 0 (active), 1 (next), etc.
                        if (offset > 2 && offset < cards.length - 1) return null;

                        const isFirst = offset === 0;

                        return (
                            <motion.div
                                key={card.id}
                                layout
                                initial={{ x: 240, opacity: 0, scale: 0.9 }}
                                animate={{
                                    x: offset * 40, // Stacking effect
                                    opacity: isFirst ? 1 : 1 - (offset * 0.3),
                                    scale: isFirst ? 1 : 0.9 - (offset * 0.05),
                                    zIndex: 10 - offset
                                }}
                                exit={{ x: -240, opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.8, ease: "easeInOut" }}
                                className="absolute top-0 left-0 w-[220px] h-[260px] bg-white rounded-[18px] shadow-soft border border-gray-100 overflow-hidden"
                            >
                                <div className="h-[160px] w-full bg-gray-100 relative">
                                    <img src={card.img} alt={card.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-[#1f2937] text-sm truncate">{card.name}</h3>
                                    <p className="text-[#E07A5F] font-bold text-sm mt-0.5">{card.price}</p>
                                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1 truncate">
                                        <Store size={10} />
                                        {card.shop}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

// 4. QUICK ACTION CARDS (Refined)
const QuickActionsSection = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-24 justify-items-center">
            <QuickCard
                title="Browse Shops"
                description="Discover trusted local stores near you"
                icon={<Store size={22} />} // Passing component with size props directly if possible, or usually Icon component is passed. 
                // Wait, previous code passed element. Let's keep it consistent but simplified.
                // Actually, let's pass the Icon Component to allow styling control in the card if we want, 
                // but for now I'll just pass the element with the right class.
                // User's example used `Icon` as component. I will stick to the existing pattern but just pass the element 
                // and let the wrapper handle colors.
                iconElement={<Store size={22} className="text-[#E07A5F]" />}
                to="/shops"
                delay={0}
            />
            <QuickCard
                title="Find Services"
                description="Book verified services from nearby providers"
                iconElement={<Wrench size={22} className="text-[#3D405B]" />}
                to="/services"
                delay={0.1}
            />
            <QuickCard
                title="Save Interested"
                description="Keep track of items you like"
                iconElement={<Heart size={22} className="text-[#E63946]" />}
                to="/interested"
                delay={0.2}
            />
        </div>
    );
};

const QuickCard = ({ title, description, iconElement, to, delay }) => {
    const navigate = useNavigate();
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, ease: "easeOut" }}
            whileHover={{ y: -6 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(to)}
            className="group relative w-full max-w-[320px] cursor-pointer
                       bg-white/60 backdrop-blur-md border border-white/40
                       rounded-[24px] p-6 text-center
                       shadow-sm hover:shadow-2xl hover:border-orange-200/60
                       transition-all duration-300 ease-out flex flex-col items-center"
        >
            {/* Icon Container with Independent Pop */}
            <div className="mb-4 flex h-12 w-12 items-center justify-center 
                            rounded-full bg-orange-50/80 
                            transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                {iconElement}
            </div>

            <h3 className="text-[17px] font-bold text-gray-800 mb-1.5">{title}</h3>
            <p className="text-[13px] text-gray-500 leading-relaxed font-medium">{description}</p>
        </motion.div>
    );
};

// 5. LIVE MARKET SECTION
const LiveMarketSection = ({ city }) => {
    const navigate = useNavigate();
    return (
        <div className="mb-24">
            <div className="flex items-center gap-3 mb-8">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <h2 className="text-[22px] font-semibold text-[#1f2937]">Live near you right now</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Product Card */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex gap-6 hover:shadow-md transition-shadow group">
                    <div className="w-[120px] h-[120px] bg-gray-200 rounded-xl relative overflow-hidden shrink-0">
                        <img
                            src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80"
                            alt="Featured Product"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                            In Stock
                        </div>
                    </div>
                    <div className="flex flex-col justify-center items-start">
                        <h3 className="font-bold text-lg text-[#1f2937] mb-1">Nike Air Max</h3>
                        <p className="text-[#E07A5F] font-bold mb-4">₹8,499</p>
                        <button
                            onClick={() => navigate('/shops')}
                            className="text-xs font-bold text-[#1f2937] uppercase tracking-wide border-b-2 border-transparent hover:border-[#E07A5F] transition-all"
                        >
                            View Availability
                        </button>
                    </div>
                </div>

                {/* Shop Card */}
                <div className="bg-[#1f2937] text-white rounded-[24px] p-8 shadow-sm relative overflow-hidden flex flex-col justify-center items-start group">
                    {/* Abstract BG */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#E07A5F] rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity"></div>

                    <h3 className="text-xl font-bold mb-2 relative z-10">Market Pulse</h3>
                    <p className="text-white/70 text-sm mb-6 max-w-xs relative z-10">Stay connected to real-time inventory from {city} shop owners.</p>

                    <button
                        onClick={() => navigate('/shops')}
                        className="bg-white text-[#1f2937] px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#E07A5F] hover:text-white transition-colors shadow-lg"
                    >
                        Explore All
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- NEW SECTIONS ---

// ADDITION 1: TRENDING NEAR YOU
const TrendingSection = () => {
    // Mock Data
    const trendingItems = [
        { id: 1, name: "Iphone 15 Case", price: "₹499", dist: "0.8 km", img: "https://images.unsplash.com/photo-1623998021153-f35058aa9f4d?w=200&q=80" },
        { id: 2, name: "Organic Honey", price: "₹350", dist: "1.2 km", img: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=200&q=80" },
        { id: 3, name: "Yoga Mat", price: "₹1,200", dist: "1.5 km", img: "https://images.unsplash.com/photo-1592432655613-26a630fe7681?w=200&q=80" },
        { id: 4, name: "Bluetooth Speaker", price: "₹2,999", dist: "2.0 km", img: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=200&q=80" },
        { id: 5, name: "Running Shoes", price: "₹3,400", dist: "2.5 km", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80" },
        { id: 6, name: "Plant Pot", price: "₹250", dist: "0.5 km", img: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=200&q=80" },
    ];

    return (
        <div className="mb-24">
            <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={20} className="text-[#E07A5F]" />
                <h2 className="text-[20px] font-bold text-[#1f2937]">Trending near you</h2>
            </div>

            {/* Scrolling Row */}
            <div className="relative w-full overflow-hidden group">
                <div className="flex gap-6 animate-scroll hover:animation-play-state-paused w-max px-2">
                    {/* Double list for seamless loop (Simulated simply here with enough items, ideally duplicated) */}
                    {[...trendingItems, ...trendingItems].map((item, idx) => (
                        <div key={`${item.id}-${idx}`} className="w-[200px] flex-shrink-0 bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-white/50 shadow-sm hover:shadow-md transition-all cursor-pointer">
                            <div className="h-[140px] w-full rounded-lg overflow-hidden bg-gray-100 mb-3">
                                <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <h4 className="font-bold text-sm text-gray-800 truncate">{item.name}</h4>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-[#E07A5F] font-bold text-sm">{item.price}</span>
                                <span className="text-xs text-gray-400">{item.dist}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); } 
                }
                .animate-scroll {
                    animation: scroll 40s linear infinite;
                }
                .hover\\:animation-play-state-paused:hover {
                   animation-play-state: paused;
                }
            `}</style>
        </div>
    );
};

// ADDITION 2: SHOP SPOTLIGHT
const ShopSpotlightSection = () => {
    const navigate = useNavigate();
    const shops = [
        { id: 1, name: "Urban Greens", type: "Organic Grocery", status: "Open", desc: "Fresh farm produce daily.", color: "bg-green-100 text-green-700" },
        { id: 2, name: "Tech Haven", type: "Electronics", status: "Closing Soon", desc: "Best gadgets in town.", color: "bg-orange-100 text-orange-700" },
        { id: 3, name: "Style Loft", type: "Fashion Boutique", status: "Open", desc: "Trendy wear for summer.", color: "bg-blue-100 text-blue-700" },
    ];

    return (
        <div className="mb-24">
            <div className="flex items-center gap-2 mb-6">
                <Star size={20} className="text-[#FFB703]" />
                <h2 className="text-[20px] font-bold text-[#1f2937]">Popular shops around you</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {shops.map((shop) => (
                    <motion.div
                        key={shop.id}
                        whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                        onClick={() => navigate('/shops')}
                        className="bg-white/80 backdrop-blur-md border border-white/60 p-6 rounded-2xl cursor-pointer shadow-sm transition-all"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold text-gray-400">
                                {shop.name[0]}
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${shop.color}`}>
                                {shop.status}
                            </span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-800">{shop.name}</h3>
                        <p className="text-sm text-gray-500 font-medium mb-2">{shop.type}</p>
                        <p className="text-sm text-gray-400">{shop.desc}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

// ADDITION 3: JUST UPDATED FEED
const JustUpdatedFeed = ({ city }) => {
    const updates = [
        { text: "New stock added at Sharma Electronics", time: "2 min ago" },
        { text: "Price updated for Nike Air Max", time: "10 min ago" },
        { text: "Fresh vegetables listed near you", time: "15 min ago" },
        { text: "Flash sale started at Style Loft", time: "22 min ago" },
        { text: "New service provider joined in " + city, time: "30 min ago" },
    ];

    return (
        <div className="mb-24">
            <div className="flex items-center gap-2 mb-6">
                <Clock size={20} className="text-[#3D405B]" />
                <h2 className="text-[20px] font-bold text-[#1f2937]">Just Updated</h2>
            </div>

            <div className="bg-white/50 backdrop-blur-sm border border-white/40 rounded-2xl p-6">
                <div className="flex flex-col gap-6">
                    {updates.map((item, idx) => (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            key={idx}
                            className="flex items-start gap-3 relative pl-4 border-l border-gray-200 last:border-0"
                        >
                            {/* Timeline Dot */}
                            <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 bg-[#E07A5F] rounded-full border-2 border-white"></div>

                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700">{item.text}</p>
                                <span className="text-xs text-gray-400">{item.time}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ADDITION 4: SERVICE DISCOVERY TEASER
const ServiceDiscoveryTeaser = () => {
    const navigate = useNavigate();
    return (
        <div className="mb-12 bg-gradient-to-r from-[#3D405B] to-[#2b2d42] rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

            <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Need a service instead?</h2>
                <p className="text-blue-100 mb-8 max-w-lg mx-auto">From repairs to home services — book trusted local providers securely on ShopLens.</p>

                <button
                    onClick={() => navigate('/services')}
                    className="bg-white text-[#3D405B] px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-lg"
                >
                    Find Services
                </button>
            </div>
        </div>
    );
};

// ADDITION 5: PERSONAL HOOK
const PersonalHookSection = ({ city }) => {
    const navigate = useNavigate();
    return (
        <div className="mb-24 bg-[#E07A5F]/5 rounded-3xl p-8 md:p-10 border border-[#E07A5F]/10">
            <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={18} className="text-[#E07A5F]" />
                        <span className="text-[#E07A5F] font-bold text-xs uppercase tracking-widest">Recommended for you</span>
                    </div>
                    <h2 className="text-2xl font-bold text-[#1f2937] mb-2">Because you’re nearby</h2>
                    <p className="text-gray-600 mb-6">We found some great spots you might like in {city}.</p>

                    <button
                        onClick={() => navigate('/shops')}
                        className="text-sm font-bold text-[#E07A5F] hover:underline"
                    >
                        View all suggestions
                    </button>
                </div>

                <div className="flex-1 w-full flex gap-4 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    <motion.div
                        whileHover={{ y: -3 }}
                        className="min-w-[140px] bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer"
                    >
                        <div className="w-full h-24 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                            <img src="https://images.unsplash.com/photo-1556910103-1c02745a30bf?w=400&q=80" className="w-full h-full object-cover" alt="Tea" />
                        </div>
                        <p className="font-bold text-sm text-gray-800">Chai Point</p>
                        <p className="text-xs text-gray-500">Cafe • 0.5km</p>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -3 }}
                        className="min-w-[140px] bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer"
                    >
                        <div className="w-full h-24 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                            <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80" className="w-full h-full object-cover" alt="Groceries" />
                        </div>
                        <p className="font-bold text-sm text-gray-800">Daily Mart</p>
                        <p className="text-xs text-gray-500">Grocery • 1.2km</p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

// 6. TRUST SIGNAL STRIP
const TrustSignalStrip = () => {
    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500 pb-12">
            <TrustItem icon={<CheckCircle size={18} />} text="100% Local" />
            <TrustItem icon={<RefreshCw size={18} />} text="Live Updates" />
            <TrustItem icon={<Navigation size={18} />} text="Nearest First" />
        </div>
    );
};

const TrustItem = ({ icon, text }) => (
    <div className="flex items-center gap-2 text-[#1f2937]">
        {icon}
        <span className="text-xs font-bold uppercase tracking-widest">{text}</span>
    </div>
);

export default CustomerHome;
