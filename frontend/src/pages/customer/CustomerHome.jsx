import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import {
    Store,
    ArrowRight,
    Heart,
    Wrench,
    MapPin,
    CheckCircle,
    RefreshCw,
    Navigation,
    TrendingUp,
    Clock,
    Star,
    Sparkles,
    Search,
    MessageSquare,
    Palette,
    ShieldCheck,
    ArrowUpRight,
    ShoppingBag,
    Layers,
    Scissors,
    UserCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import CopilotWidget from '../../components/CopilotWidget';

const CustomerHome = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { userLocation } = useLocation();
    const city = userLocation?.city || "Your Area";
    const userName = user?.name || "Guest";

    const [feedData, setFeedData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) return;
        
        const fetchFeed = async () => {
            setLoading(true);
            try {
                const lat = userLocation?.coordinates?.[1] || 28.6139;
                const lng = userLocation?.coordinates?.[0] || 77.2090;
                const { data } = await axios.get('/api/customer/home/feed', {
                    params: { lat, lng, radius: 5 }
                });
                setFeedData(data);
            } catch (err) {
                console.error("Failed to fetch personalized feed:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFeed();
    }, [user, userLocation]);

    const handleItemClick = async (itemId, itemName, itemCategory) => {
        try {
            await axios.post('/api/customer/activity', {
                action: 'view_product',
                targetId: itemId,
                targetType: 'Product',
                metadata: { productName: itemName, category: itemCategory }
            });
            await axios.post('/api/customer/recommendations/action', {
                recommendationType: 'product',
                targetId: itemId,
                action: 'clicked'
            });
        } catch (e) {
            console.warn("Analytics tracking error:", e.message);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <div className="min-h-screen font-sans pb-24 relative overflow-x-hidden bg-transparent">
            {/* Page container */}
            <div className="max-w-[1200px] mx-auto px-6 md:px-8 space-y-12">
                
                {/* SECTION 1: SMART HERO */}
                <SmartHeroSection userName={userName} getGreeting={getGreeting} />

                {/* AI Personalization Banner Section */}
                {feedData && feedData.segment && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 rounded-[2rem] bg-gradient-to-r from-orange-500/10 to-indigo-500/10 border border-[#E07A5F]/20 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm shadow-slate-100/10 animate-scale-up"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E07A5F] to-indigo-500 text-white flex items-center justify-center shadow-md shrink-0 animate-pulse">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#E07A5F]">Aisle AI Personalization</span>
                                    <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-600 rounded-full text-[8px] font-black uppercase tracking-wider">
                                        🤖 {feedData.segment} Focused Feed
                                    </span>
                                </div>
                                <h3 className="text-base font-black text-slate-800 tracking-tight mt-1">
                                    Your feed is customized to your interest in <span className="text-indigo-600 capitalize">"{feedData.segment.toLowerCase()}"</span>
                                </h3>
                                <div className="flex flex-wrap gap-1.5 mt-2.5">
                                    {feedData.interests?.map((interest, idx) => (
                                        <span key={idx} className="px-2.5 py-0.5 bg-white border border-slate-200 text-slate-600 text-[9px] font-bold rounded-lg shadow-3xs">
                                            ✓ {interest}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* SECTION 2: QUICK ACTIONS */}
                <QuickActionsSection />

                {/* PREDICTIVE DISCOVERY SECTION */}
                {feedData?.predictiveDiscoveries?.length > 0 && (
                    <div className="space-y-6 animate-scale-up">
                        <div className="space-y-1">
                            <h2 className="text-xs font-black text-slate-450 uppercase tracking-widest flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-indigo-500"></span>
                                🤖 AI Suggested For You
                            </h2>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Predictive Discovery</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {feedData.predictiveDiscoveries.map((pd) => (
                                <div
                                    key={pd._id}
                                    onClick={() => {
                                        handleItemClick(pd._id, pd.name, pd.category);
                                        navigate('/categories');
                                    }}
                                    className="group flex gap-4 p-4.5 bg-white border border-slate-100 rounded-3xl hover:border-indigo-300 hover:shadow-md transition-all duration-300 cursor-pointer items-center shadow-xs"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center overflow-hidden border border-slate-100 shrink-0">
                                        <img src={pd.imageUrl || "https://via.placeholder.com/150"} alt={pd.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.target.src = "https://via.placeholder.com/150" }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[8px] font-black uppercase text-indigo-500 tracking-wider">PREDICTED FIT</div>
                                        <h4 className="font-extrabold text-slate-800 text-sm truncate mt-0.5 leading-tight">{pd.name}</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">{pd.shopName}</p>
                                        <div className="text-base font-black text-indigo-600 mt-1.5 leading-none">₹{pd.price}</div>
                                    </div>
                                    <button className="bg-indigo-50 group-hover:bg-indigo-500 text-indigo-650 group-hover:text-white rounded-xl p-2.5 transition-all shadow-3xs cursor-pointer">
                                        <ArrowUpRight size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* BUNDLES RECOMMENDATION SECTION */}
                {feedData?.bundles?.length > 0 && feedData.bundles.map((bundle, idx) => (
                    <div key={idx} className="space-y-6 animate-scale-up">
                        <div className="space-y-1">
                            <h2 className="text-xs font-black text-slate-450 uppercase tracking-widest flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-emerald-500"></span>
                                📦 Recommended Custom Bundle
                            </h2>
                        </div>
                        <div className="p-6 rounded-[2rem] bg-white border border-slate-150 shadow-lg shadow-slate-100/40 space-y-4">
                            <div className="flex justify-between items-start flex-wrap gap-3">
                                <div>
                                    <span className="text-[8px] font-black uppercase text-emerald-500 tracking-widest block bg-emerald-500/10 px-2 py-0.5 rounded-full w-max">Bundle Discount Applied</span>
                                    <h4 className="text-base font-black text-slate-800 tracking-tight mt-1">{bundle.name}</h4>
                                    <p className="text-xs text-slate-500 font-semibold mt-1">Get all components locally in one go and save 10%.</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-black text-emerald-500">₹{bundle.bundlePrice}</div>
                                    <div className="text-[10px] text-slate-400 font-semibold line-through">₹{bundle.originalPrice}</div>
                                    <div className="text-[9px] text-emerald-500 font-black mt-0.5 uppercase tracking-wider">Save ₹{bundle.estimatedSavings}!</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {bundle.products?.map((bp, i) => (
                                    <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center text-center space-y-1.5 shadow-3xs">
                                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-slate-100 shrink-0">
                                            <img src={bp.imageUrl || "https://via.placeholder.com/100"} alt={bp.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = "https://via.placeholder.com/100" }} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[10px] font-black text-slate-800 line-clamp-1">{bp.name}</div>
                                            <div className="text-[9px] text-[#E07A5F] font-bold mt-0.5">₹{bp.price}</div>
                                        </div>
                                        <div className="text-[7px] text-slate-400 font-bold uppercase truncate w-full">{bp.shopName}</div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={async () => {
                                    try {
                                        await axios.post('/api/customer/recommendations/action', {
                                            recommendationType: 'bundle',
                                            targetId: user?._id || "6a203d5c5aac6b48b91dbf5c",
                                            action: 'converted',
                                            revenueImpact: bundle.bundlePrice
                                        });
                                        toast.success(`🎉 Added all bundle items to cart! Saved ₹${bundle.estimatedSavings}!`, { icon: '📦' });
                                    } catch (e) {
                                        toast.success(`🎉 Added all bundle items to cart!`);
                                    }
                                }}
                                className="w-full py-3 bg-[#E07A5F] hover:bg-[#d0694e] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                            >
                                Add Whole Bundle to Cart
                            </button>
                        </div>
                    </div>
                ))}

                {/* SECTION 3: LIVE NEARBY FEED */}
                <LiveNearbyFeed city={city} />

                {/* SECTION 4: TRENDING NEARBY */}
                <TrendingNearbySection products={feedData?.recommendedProducts} />

                {/* SECTION 5: FEATURED CREATORS */}
                <FeaturedCreatorsSection />

                {/* SECTION 6: POPULAR BUSINESSES */}
                <PopularBusinessesSection shops={feedData?.recommendedShops} />

                {/* SECTION 7: SERVICES NEARBY */}
                <ServicesNearbySection />

                {/* SECTION 8: MESSAGES & ACTIVITY */}
                <RecentActivitySection userName={userName} />

                {/* TRUST SIGNAL STRIP */}
                <TrustSignalStrip />

            </div>
            <CopilotWidget role="customer" />
        </div>
    );
};

// ================= SECTION 1: SMART HERO =================
const SmartHeroSection = ({ userName, getGreeting }) => {
    return (
        <div className="pt-4 md:pt-8 flex flex-col items-center text-center max-w-3xl mx-auto">
            {/* Greeting badge */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/50 text-[#E07A5F] text-xs font-black uppercase tracking-wider mb-4"
            >
                <Sparkles className="w-3.5 h-3.5" />
                {getGreeting()}, {userName} 👋
            </motion.div>

            {/* Title */}
            <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-4xl lg:text-[44px] font-black text-slate-900 tracking-tight leading-[1.1] mb-3"
            >
                Find products, creators & <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E07A5F] to-[#F2CC8F]">
                    services near you.
                </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ delay: 0.2 }}
                className="text-slate-650 text-xs md:text-sm font-semibold leading-relaxed mb-6 max-w-xl"
            >
                Real local inventory. Real local creators. Real-time updates. <br className="hidden sm:inline" />
                Everything available in your neighborhood right now.
            </motion.p>

            {/* Platform Counters */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full border border-slate-200/50 bg-white/50 backdrop-blur-md p-4.5 rounded-3xl"
            >
                <CounterItem label="Products Nearby" count="2,341" gradient="from-emerald-500/10 to-teal-500/10 text-emerald-600" />
                <CounterItem label="Local Businesses" count="417" gradient="from-[#E07A5F]/10 to-[#F2CC8F]/10 text-[#E07A5F]" />
                <CounterItem label="Artisan Creators" count="83" gradient="from-indigo-500/10 to-purple-500/10 text-indigo-650" />
                <CounterItem label="Services Today" count="24" gradient="from-cyan-500/10 to-blue-500/10 text-cyan-600" />
            </motion.div>
        </div>
    );
};

const CounterItem = ({ label, count, gradient }) => (
    <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} flex flex-col justify-center items-center shadow-xs border border-white/40 hover:scale-103 transition-transform`}>
        <span className="text-2xl font-black tracking-tight">{count}</span>
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 text-center mt-1">{label}</span>
    </div>
);

// ================= SECTION 2: QUICK ACTIONS =================
const QuickActionsSection = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-xs font-black text-slate-450 uppercase tracking-widest flex items-center gap-3">
                <span className="w-8 h-[2px] bg-[#E07A5F]"></span>
                Quick Navigation
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <ActionCard
                    title="Products"
                    desc="Local catalog items"
                    icon={<ShoppingBag size={20} />}
                    color="text-emerald-500 bg-emerald-50 border-emerald-100"
                    hoverBorder="hover:border-emerald-300"
                    to="/categories"
                />
                <ActionCard
                    title="Businesses"
                    desc="Verified neighborhood stores"
                    icon={<Store size={20} />}
                    color="text-[#E07A5F] bg-orange-50 border-orange-100"
                    hoverBorder="hover:border-orange-350"
                    to="/shops"
                />
                <ActionCard
                    title="Creators"
                    desc="Handmade artisan creations"
                    icon={<Palette size={20} />}
                    color="text-indigo-500 bg-indigo-50 border-indigo-100"
                    hoverBorder="hover:border-indigo-300"
                    to="/creators"
                />
                <ActionCard
                    title="Services"
                    desc="Book repairs, tutoring, salon"
                    icon={<Wrench size={20} />}
                    color="text-cyan-500 bg-cyan-50 border-cyan-100"
                    hoverBorder="hover:border-cyan-300"
                    to="/services"
                />
            </div>
        </div>
    );
};

const ActionCard = ({ title, desc, icon, color, hoverBorder, to }) => {
    const navigate = useNavigate();
    return (
        <div
            onClick={() => navigate(to)}
            className={`group bg-white rounded-3xl p-5 border border-slate-100 shadow-xs ${hoverBorder} hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[140px]`}
        >
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center border ${color} transition-transform group-hover:scale-105 duration-350`}>
                {icon}
            </div>
            <div>
                <h3 className="text-base font-black text-slate-800 flex items-center justify-between">
                    {title}
                    <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </h3>
                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wide leading-tight">{desc}</p>
            </div>
        </div>
    );
};

// ================= SECTION 3: LIVE NEARBY FEED =================
const LiveNearbyFeed = ({ city }) => {
    const updates = [
        { id: 1, user: "Urban Greens", action: "added", item: "Fresh Organic Tomatoes", time: "2 minutes ago", type: "stock" },
        { id: 2, user: "Priya Bakery", action: "added", item: "Custom Eggless Chocolate Cake", time: "5 minutes ago", type: "stock" },
        { id: 3, user: "Style Loft", action: "updated", item: "Summer Linen Collection", time: "9 minutes ago", type: "catalog" },
        { id: 4, user: "QuickFix Electricals", action: "went", item: "Online & Accepting bookings", time: "15 minutes ago", type: "status" }
    ];

    return (
        <div className="space-y-6 bg-slate-900 text-white rounded-[32px] p-6 md:p-8 relative overflow-hidden shadow-xl">
            {/* Glowing circle decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#E07A5F]/20 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                    </span>
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-200">LIVE NEAR YOU</h2>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-full">{city}</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 relative z-10 pt-4">
                {updates.map((update) => (
                    <div
                        key={update.id}
                        className="bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl p-4.5 flex gap-4 transition-all duration-305 group cursor-pointer"
                    >
                        <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-sm font-black uppercase text-[#F2CC8F] group-hover:scale-105 transition-transform duration-300">
                            {update.user[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <h4 className="font-extrabold text-sm text-slate-100 truncate">{update.user}</h4>
                                <span className="text-[9px] font-bold text-slate-450 whitespace-nowrap">{update.time}</span>
                            </div>
                            <p className="text-xs text-slate-350 leading-relaxed font-semibold">
                                {update.action} <span className="text-[#F2CC8F] font-bold">{update.item}</span>
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ================= SECTION 4: TRENDING NEARBY =================
const TrendingNearbySection = ({ products }) => {
    const navigate = useNavigate();
    
    // Top 8 trending products (with high-res Unsplash links)
    const items = [
        { id: "p1", name: "Fresh Sourdough Bread", price: "₹120", dist: "0.8 km", shop: "Priya Bakery", status: "AVAILABLE", img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80" },
        { id: "p2", name: "Organic Forest Honey", price: "₹380", dist: "1.2 km", shop: "Urban Greens", status: "AVAILABLE", img: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=400&q=80" },
        { id: "p3", name: "Crochet Coffee Sleeve", price: "₹240", dist: "1.5 km", shop: "Soniya Saini", status: "AVAILABLE", img: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=400&q=80" },
        { id: "p4", name: "Handcrafted Ceramic Mug", price: "₹450", dist: "2.1 km", shop: "Pottery & Soul", status: "LIMITED", img: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=400&q=80" },
        { id: "p5", name: "Custom Calligraphy Card", price: "₹150", dist: "0.5 km", shop: "The Gift Studio", status: "AVAILABLE", img: "https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&w=400&q=80" },
        { id: "p6", name: "Summer Linen Shirt", price: "₹1,499", dist: "2.5 km", shop: "Style Loft", status: "AVAILABLE", img: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80" },
        { id: "p7", name: "Matte Black Earbuds", price: "₹2,999", dist: "3.0 km", shop: "Tech World", status: "AVAILABLE", img: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=400&q=80" },
        { id: "p8", name: "Lactose-Free Milk", price: "₹90", dist: "1.0 km", shop: "Valley Groceries", status: "LIMITED", img: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80" }
    ];

    const displayItems = products && products.length > 0
        ? products.map(p => ({
            id: p._id,
            name: p.name,
            price: typeof p.price === 'number' ? `₹${p.price}` : p.price,
            dist: p.distance !== undefined ? `${(p.distance / 1000).toFixed(1)} km` : "Nearby",
            shop: p.shopName || "Local Shop",
            status: p.stockStatus || "AVAILABLE",
            img: p.imageUrl || "https://via.placeholder.com/200",
            category: p.category,
            shopId: p.shopId
          }))
        : items;

    const handleItemClick = async (item) => {
        try {
            await axios.post('/api/customer/activity', {
                action: 'view_product',
                targetId: item.id,
                targetType: 'Product',
                metadata: { productName: item.name, category: item.category }
            });
            await axios.post('/api/customer/recommendations/action', {
                recommendationType: 'product',
                targetId: item.id,
                action: 'clicked'
            });
        } catch (e) {
            console.warn(e);
        }
        navigate('/categories');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <h2 className="text-xs font-black text-slate-450 uppercase tracking-widest flex items-center gap-3">
                        <span className="w-8 h-[2px] bg-[#E07A5F]"></span>
                        Weekly Favorites
                    </h2>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Trending Nearby</h3>
                </div>
                <button
                    onClick={() => navigate('/categories')}
                    className="text-xs font-black uppercase tracking-widest text-[#E07A5F] border-b-2 border-transparent hover:border-[#E07A5F] pb-1 transition-all flex items-center gap-1 cursor-pointer"
                >
                    View All Products <ArrowRight size={12} />
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {displayItems.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="group bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
                    >
                        {/* Image area */}
                        <div className="relative aspect-square w-full bg-slate-50 border-b border-slate-100 flex items-center justify-center overflow-hidden">
                            <img
                                src={item.img}
                                alt={item.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                onError={(e) => { e.target.src = "https://via.placeholder.com/200"; }}
                            />
                            {/* Stock status indicator */}
                            <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide text-white shadow-sm
                                ${item.status === 'LIMITED' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            >
                                {item.status === 'LIMITED' ? 'Limited' : 'In Stock'}
                            </span>
                            <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide">
                                {item.dist}
                            </span>
                        </div>

                        {/* Content info */}
                        <div className="p-4 flex flex-col justify-between flex-grow">
                            <div>
                                <h4 className="font-extrabold text-slate-800 text-sm truncate leading-tight">{item.name}</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{item.shop}</p>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <span className="font-black text-slate-900 text-base leading-none">{item.price}</span>
                                <button className="bg-slate-50 hover:bg-[#E07A5F] text-slate-700 hover:text-white font-black text-[10px] py-1.5 px-3 rounded-lg uppercase tracking-widest transition-all border border-slate-200/50 hover:border-[#E07A5F] shadow-xs cursor-pointer">
                                    View
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ================= SECTION 5: FEATURED CREATORS =================
const FeaturedCreatorsSection = () => {
    const navigate = useNavigate();

    const creators = [
        { id: "c1", name: "Soniya Saini", category: "Crochet & Knits", location: "0.5 km away", status: "Accepting Requests", cover: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=400&q=80", color: "bg-indigo-50 border-indigo-100 text-indigo-700" },
        { id: "c2", name: "Priya Bakery", category: "Bespoke Cakes & Pastries", location: "0.8 km away", status: "Accepting Requests", cover: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80", color: "bg-amber-50 border-amber-100 text-amber-700" },
        { id: "c3", name: "Gift Craft Co.", category: "Custom Gift Boxes & Cards", location: "1.2 km away", status: "Fully Booked", cover: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80", color: "bg-rose-50 border-rose-100 text-rose-700" },
        { id: "c4", name: "Clay & Soul Studio", category: "Hand-thrown Pottery & Vases", location: "2.1 km away", status: "Accepting Requests", cover: "https://images.unsplash.com/photo-1612196808214-b7e239e5f6b7?auto=format&fit=crop&w=400&q=80", color: "bg-teal-50 border-teal-100 text-teal-700" }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <h2 className="text-xs font-black text-slate-450 uppercase tracking-widest flex items-center gap-3">
                        <span className="w-8 h-[2px] bg-[#E07A5F]"></span>
                        Handcrafted locally
                    </h2>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Meet Local Creators</h3>
                </div>
                <button
                    onClick={() => navigate('/creators')}
                    className="text-xs font-black uppercase tracking-widest text-[#E07A5F] border-b-2 border-transparent hover:border-[#E07A5F] pb-1 transition-all flex items-center gap-1 cursor-pointer"
                >
                    Explore Creators <ArrowRight size={12} />
                </button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
                {creators.map((c) => (
                    <div
                        key={c.id}
                        onClick={() => navigate('/creators')}
                        className="group bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
                    >
                        {/* Cover image area */}
                        <div className="relative h-36 w-full bg-slate-50 border-b border-slate-100 flex items-center justify-center overflow-hidden">
                            <img
                                src={c.cover}
                                alt={c.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                            <span className="absolute bottom-3 left-3 text-white text-[10px] font-black uppercase tracking-wider">
                                {c.location}
                            </span>
                        </div>

                        {/* Info area */}
                        <div className="p-4.5 space-y-3.5">
                            <div>
                                <h4 className="font-extrabold text-slate-800 text-base truncate leading-tight">{c.name}</h4>
                                <p className="text-[11px] text-slate-450 font-bold uppercase tracking-wider mt-1">{c.category}</p>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider w-max border
                                ${c.status === 'Accepting Requests' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                {c.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ================= SECTION 6: POPULAR BUSINESSES =================
const PopularBusinessesSection = ({ shops }) => {
    const navigate = useNavigate();

    const businesses = [
        { id: "b1", name: "Urban Greens", type: "GROCERY_KIRANA", cover: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80", logo: "https://cdn-icons-png.flaticon.com/512/2953/2953363.png", distance: "1.2 km", rating: 4.8, open: true },
        { id: "b2", name: "City Sports Hub", type: "RETAIL_GOODS", cover: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=400&q=80", logo: "https://cdn-icons-png.flatic512/3068/3068421.png", distance: "1.8 km", rating: 4.5, open: true },
        { id: "b3", name: "Tech World", type: "TECH_ACCESSORIES", cover: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=400&q=80", logo: "https://cdn-icons-png.flaticon.com/512/2012/2012247.png", distance: "2.5 km", rating: 4.6, open: false }
    ];

    const displayShops = shops && shops.length > 0
        ? shops.map(s => ({
            id: s._id,
            name: s.name,
            type: s.category || "General",
            cover: s.shopImage || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80",
            logo: "https://cdn-icons-png.flaticon.com/512/2953/2953363.png",
            distance: typeof s.distance === 'number' ? `${(s.distance / 1000).toFixed(1)} km` : s.distance || "Nearby",
            rating: s.rating || 4.5,
            open: s.isOpen
          }))
        : businesses;

    const handleShopClick = async (shop) => {
        try {
            await axios.post('/api/customer/activity', {
                action: 'view_shop',
                targetId: shop.id,
                targetType: 'User',
                metadata: { shopName: shop.name }
            });
            await axios.post('/api/customer/recommendations/action', {
                recommendationType: 'shop',
                targetId: shop.id,
                action: 'clicked'
            });
        } catch (e) {
            console.warn(e);
        }
        navigate('/shops');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <h2 className="text-xs font-black text-slate-450 uppercase tracking-widest flex items-center gap-3">
                        <span className="w-8 h-[2px] bg-[#E07A5F]"></span>
                        Local Landmarks
                    </h2>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Popular Businesses</h3>
                </div>
                <button
                    onClick={() => navigate('/shops')}
                    className="text-xs font-black uppercase tracking-widest text-[#E07A5F] border-b-2 border-transparent hover:border-[#E07A5F] pb-1 transition-all flex items-center gap-1 cursor-pointer"
                >
                    Explore Businesses <ArrowRight size={12} />
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {displayShops.map((b) => (
                    <div
                        key={b.id}
                        onClick={() => handleShopClick(b)}
                        className="group bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer"
                    >
                        {/* Cover Image */}
                        <div className="relative h-44 w-full bg-slate-50 overflow-hidden">
                            <img
                                src={b.cover}
                                alt={b.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                onError={(e) => { e.target.src = "https://via.placeholder.com/300"; }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                            
                            {/* Logo overlay */}
                            <div className="absolute bottom-4 left-4 h-12 w-12 bg-white/90 backdrop-blur-md rounded-2xl p-1.5 shadow-lg border border-white/40 flex items-center justify-center overflow-hidden">
                                <img src={b.logo} alt="" className="w-full h-full object-contain" />
                            </div>

                            {/* Open Now badge */}
                            <span className={`absolute top-4 right-4 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest backdrop-blur-md border 
                                ${b.open 
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' 
                                    : 'bg-rose-500/20 text-rose-300 border-rose-500/50'}`}>
                                {b.open ? 'Open Now' : 'Closed'}
                            </span>
                        </div>

                        {/* Card Content info */}
                        <div className="p-5 space-y-4">
                            <div>
                                <h4 className="font-extrabold text-slate-800 text-lg group-hover:text-[#E07A5F] transition-colors leading-tight">{b.name}</h4>
                                <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                    <span className="flex items-center gap-1"><MapPin className="text-[#E07A5F]" size={12} /> {b.distance}</span>
                                    <span className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg text-amber-700 font-black">
                                        <Star className="text-amber-500" size={10} /> {b.rating}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ================= SECTION 7: SERVICES NEARBY =================
const ServicesNearbySection = () => {
    const navigate = useNavigate();

    const services = [
        { id: "electrician", name: "Electrician", rate: "From ₹199", icon: <Wrench className="text-orange-500" />, desc: "Auto, AC, auto wiring, fan repairs" },
        { id: "plumber", name: "Plumber", rate: "From ₹149", icon: <Wrench className="text-blue-500" />, desc: "Taps, piping, drainage leak fixes" },
        { id: "painter", name: "Painter", rate: "From ₹499", icon: <Palette className="text-pink-500" />, desc: "Wall touchups, texture, custom designs" },
        { id: "tutor", name: "Tutor", rate: "From ₹400/hr", icon: <Palette className="text-emerald-500" />, desc: "Maths, sciences, programming tutorials" },
        { id: "salon", name: "Beautician", rate: "From ₹99", icon: <Scissors className="text-indigo-500" />, desc: "Haircut, styling, massage, makeup" }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <h2 className="text-xs font-black text-slate-450 uppercase tracking-widest flex items-center gap-3">
                        <span className="w-8 h-[2px] bg-[#E07A5F]"></span>
                        Verified Professionals
                    </h2>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Services Nearby</h3>
                </div>
                <button
                    onClick={() => navigate('/services')}
                    className="text-xs font-black uppercase tracking-widest text-[#E07A5F] border-b-2 border-transparent hover:border-[#E07A5F] pb-1 transition-all flex items-center gap-1 cursor-pointer"
                >
                    Find Services <ArrowRight size={12} />
                </button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-5">
                {services.map((s) => (
                    <div
                        key={s.id}
                        onClick={() => navigate('/services')}
                        className="group bg-white rounded-3xl border border-slate-100 p-5 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between"
                    >
                        <div className="h-10 w-10 bg-slate-50 group-hover:bg-orange-50 border border-slate-100 group-hover:border-orange-100 rounded-2xl flex items-center justify-center transition-all duration-300 text-lg">
                            {s.icon}
                        </div>
                        <div className="mt-8">
                            <h4 className="font-extrabold text-slate-800 text-base leading-tight group-hover:text-[#E07A5F] transition-colors">{s.name}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{s.rate}</p>
                            <p className="text-[11px] text-slate-450 font-semibold mt-3 line-clamp-2 leading-relaxed">{s.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ================= SECTION 8: MESSAGES & ACTIVITY =================
const RecentActivitySection = ({ userName }) => {
    const navigate = useNavigate();

    const activities = [
        { id: 1, text: "Rahul replied to your custom inquiry for Crochet Sleeve", action: "Go to Chat", to: "/messages", highlight: true },
        { id: 2, text: "New stock added: Organic Honey by Urban Greens", action: "Browse Items", to: "/categories" },
        { id: 3, text: "Your service booking was confirmed by Sharma Plumbers", action: "View Bookings", to: "/bookings" },
        { id: 4, text: "Creator accepted request: Special Birthday Cake", action: "Go to Chat", to: "/messages", highlight: true }
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-xs font-black text-slate-450 uppercase tracking-widest flex items-center gap-3">
                <span className="w-8 h-[2px] bg-[#E07A5F]"></span>
                Recent Activity & Notifications
            </h2>
            <div className="bg-white/50 border border-slate-200/50 backdrop-blur-md rounded-[32px] p-6 md:p-8 flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-4">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <UserCheck className="text-[#E07A5F] w-5 h-5" />
                        Hello, {userName}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 leading-relaxed max-w-sm">
                        Keep track of your bookings, inquiries, and custom requests. Local sellers typically respond within a few hours.
                    </p>
                    <div className="pt-2 flex flex-wrap gap-2.5">
                        <button
                            onClick={() => navigate('/messages')}
                            className="bg-slate-900 hover:bg-[#E07A5F] text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors cursor-pointer flex items-center gap-2"
                        >
                            <MessageSquare size={13} /> View Inbox
                        </button>
                        <button
                            onClick={() => navigate('/bookings')}
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors cursor-pointer"
                        >
                            Track Bookings
                        </button>
                    </div>
                </div>

                <div className="flex-1.5 space-y-4">
                    <div className="flex flex-col gap-3">
                        {activities.map((act) => (
                            <div
                                key={act.id}
                                onClick={() => navigate(act.to)}
                                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer group
                                    ${act.highlight 
                                        ? 'bg-orange-50/40 border-orange-100 hover:bg-orange-50/70' 
                                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3 min-w-0 pr-4">
                                    <div className={`h-7 w-7 rounded-xl flex items-center justify-center text-xs shrink-0
                                        ${act.highlight ? 'bg-orange-100 text-[#E07A5F]' : 'bg-slate-100 text-slate-500'}`}>
                                        ✓
                                    </div>
                                    <p className="text-xs font-semibold text-slate-700 leading-relaxed truncate">{act.text}</p>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-wider text-[#E07A5F] opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                                    {act.action} →
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ================= TRUST SIGNAL STRIP =================
const TrustSignalStrip = () => {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 opacity-50 border-t border-slate-200/50 pt-10 pb-6">
            <TrustItem icon={<ShieldCheck size={16} />} text="100% Local Shops" />
            <TrustItem icon={<RefreshCw size={16} />} text="Live Inventory Updates" />
            <TrustItem icon={<Navigation size={16} />} text="Nearest First Ranking" />
        </div>
    );
};

const TrustItem = ({ icon, text }) => (
    <div className="flex items-center gap-2 text-slate-700">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">{text}</span>
    </div>
);

export default CustomerHome;
