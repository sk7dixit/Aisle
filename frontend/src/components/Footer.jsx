import React, { useState, useEffect } from 'react';
import { Store, Twitter, Linkedin, ShieldCheck, Clock, MessageSquare, DollarSign, Sparkles, Compass, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AisleLogo from './AisleLogo';

const Footer = () => {
    const navigate = useNavigate();

    // 1. Live Community Activity Feed State
    const [liveActivityIndex, setLiveActivityIndex] = useState(0);
    const liveActivities = [
        "✓ Homemade Pickle sold in Vadodara",
        "✓ Customer discovered a bakery nearby",
        "✓ New Crochet Creator joined Aisle",
        "✓ 8 businesses active right now",
        "✓ 92 products updated today"
    ];

    // 2. Creator Showcase State
    const [showcaseIndex, setShowcaseIndex] = useState(0);
    const featuredCreators = [
        { title: "Crochet Studio", category: "Handmade Art", desc: "Aarav bakes custom crochet bags & name threads.", icon: "🧶" },
        { title: "Home Bakery", category: "Gourmet Food", desc: "Neha bakes organic eggless cakes and fudge brownies.", icon: "🍪" },
        { title: "Homemade Pickles", category: "Traditional Food", desc: "Priya preserves traditional mango & lemon recipes.", icon: "🥒" },
        { title: "Gift Creator", category: "Artisan Box", desc: "Meera curates customized birthday & festive gifts.", icon: "🎁" }
    ];

    useEffect(() => {
        const activityTimer = setInterval(() => {
            setLiveActivityIndex(prev => (prev + 1) % liveActivities.length);
        }, 4000);
        return () => clearInterval(activityTimer);
    }, []);

    useEffect(() => {
        const showcaseTimer = setInterval(() => {
            setShowcaseIndex(prev => (prev + 1) % featuredCreators.length);
        }, 5000);
        return () => clearInterval(showcaseTimer);
    }, []);

    return (
        <footer className="bg-gray-900 text-gray-300 border-t border-gray-800 relative overflow-hidden">
            {/* 7. Interactive Map Background pattern (5-8% opacity) */}
            <MapBackground />

            {/* 1. Live Community Strip (Top of footer) */}
            <div className="bg-gray-950 border-b border-gray-800 py-3 relative z-10">
                <div className="max-w-[1440px] mx-auto px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                            Live on Aisle
                        </span>
                    </div>
                    <div className="min-h-[20px] flex items-center">
                        <p key={liveActivityIndex} className="text-xs font-bold text-slate-100 animate-in fade-in slide-in-from-right-4 duration-300">
                            {liveActivities[liveActivityIndex]}
                        </p>
                    </div>
                    <span className="text-[8px] font-black bg-teal-900/50 text-teal-400 border border-teal-800 px-2 py-0.5 rounded uppercase tracking-wider">
                        Ecosystem Pulse
                    </span>
                </div>
            </div>

            {/* 6. Trust Bar (Four horizontal badges) */}
            <div className="border-b border-gray-800 relative z-10 py-8 bg-gray-900/40 backdrop-blur-sm">
                <div className="max-w-[1440px] mx-auto px-6 md:px-12">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: <ShieldCheck className="w-5 h-5 text-teal-400" />, text: "Verified Businesses" },
                            { icon: <Clock className="w-5 h-5 text-amber-400" />, text: "Real-Time Availability" },
                            { icon: <MessageSquare className="w-5 h-5 text-rose-400" />, text: "Direct Customer Connection" },
                            { icon: <DollarSign className="w-5 h-5 text-emerald-400" />, text: "No Hidden Marketplace Fees" }
                        ].map((badge, i) => (
                            <div key={i} className="flex items-center gap-3 bg-slate-950/30 border border-slate-800/40 p-4 rounded-2xl shadow-sm hover:border-gray-800 transition-colors">
                                <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                                    {badge.icon}
                                </div>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-left">
                                    {badge.text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Footer Grid */}
            <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-16 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">

                    {/* Column 1: Logo & Mission */}
                    <div className="space-y-6">
                        <div>
                            <AisleLogo className="h-12 w-auto !justify-start" />
                        </div>
                        <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-semibold">
                            Aisle helps people discover nearby businesses, home entrepreneurs, and creators in real time.
                            <br /><br />
                            No warehouses. No delivery markups. Just real people and real products around you.
                        </p>
                    </div>

                    {/* Column 2: "Built For" Section */}
                    <div>
                        <h3 className="text-white font-extrabold mb-4 text-xs uppercase tracking-widest text-slate-400">
                            Built For
                        </h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center gap-2">
                                <span className="select-none">🏪</span>
                                <Link to="/for-shops" className="text-gray-500 hover:text-teal-400 transition-colors font-bold text-xs uppercase tracking-wider">
                                    Businesses
                                </Link>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="select-none">🏠</span>
                                <Link to="/home-business" className="text-gray-500 hover:text-teal-400 transition-colors font-bold text-xs uppercase tracking-wider">
                                    Home Entrepreneurs
                                </Link>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="select-none">🎨</span>
                                <Link to="/home-business" className="text-gray-500 hover:text-teal-400 transition-colors font-bold text-xs uppercase tracking-wider">
                                    Creators
                                </Link>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="select-none">🛍️</span>
                                <Link to="/explore" className="text-gray-500 hover:text-teal-400 transition-colors font-bold text-xs uppercase tracking-wider">
                                    Customers
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Platform Statistics */}
                    <div>
                        <h3 className="text-white font-extrabold mb-4 text-xs uppercase tracking-widest text-slate-400">
                            Growing Every Day
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { value: "8", label: "Active Businesses" },
                                { value: "92", label: "Products Today" },
                                { value: "15", label: "Categories" },
                                { value: "24/7", label: "Discovery" }
                            ].map((stat, i) => (
                                <div key={i} className="bg-slate-950/20 border border-slate-800/50 p-2.5 rounded-xl text-center">
                                    <span className="text-sm font-black text-white block leading-none">{stat.value}</span>
                                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider block mt-1 leading-tight">
                                        {stat.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Column 4: Join The Movement */}
                    <div>
                        <h3 className="text-white font-extrabold mb-4 text-xs uppercase tracking-widest text-slate-400">
                            Join The Movement
                        </h3>
                        <p className="text-gray-500 text-xs leading-relaxed font-semibold mb-4">
                            Be the first to know when new businesses, creators, and discoveries arrive near you.
                        </p>
                        <SubscribeSection />
                    </div>

                    {/* Column 5: Creator Showcase & Hobby CTA Card */}
                    <div className="space-y-4">
                        {/* Featured Today Creator Showcase */}
                        <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 text-left shadow-md flex items-center gap-3">
                            <span className="text-3xl select-none flex-shrink-0 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                                {featuredCreators[showcaseIndex].icon}
                            </span>
                            <div className="min-w-0">
                                <span className="text-[8px] font-black text-[#E07A5F] uppercase tracking-wider block">Featured Today</span>
                                <h4 className="font-extrabold text-white text-xs truncate mt-0.5">{featuredCreators[showcaseIndex].title}</h4>
                                <p className="text-[10px] text-slate-400 font-semibold truncate leading-tight">{featuredCreators[showcaseIndex].category}</p>
                                <p className="text-[9px] text-slate-500 mt-1 line-clamp-1 leading-normal font-medium">{featuredCreators[showcaseIndex].desc}</p>
                            </div>
                        </div>

                        {/* Mini Home Business CTA */}
                        <div className="bg-gradient-to-br from-teal-950/80 to-slate-900/90 border border-teal-900/40 rounded-2xl p-4 text-left shadow-lg relative overflow-hidden backdrop-blur-sm">
                            <div className="absolute -top-12 -right-12 w-24 h-24 bg-teal-500/5 rounded-full"></div>
                            <span className="text-[9px] font-black text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider inline-block mb-2">
                                Sell Local
                            </span>
                            <h4 className="font-extrabold text-white text-xs mb-1">✨ Turn your hobby into a local business</h4>
                            <p className="text-[10px] text-slate-450 font-semibold leading-relaxed mb-3">
                                List handmade products, food creations, gifts and more.
                            </p>
                            <button
                                onClick={() => navigate('/seller/register')}
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black text-[9px] py-2 px-3 rounded-lg uppercase tracking-wider transition-colors shadow"
                            >
                                Start Creating
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom Bar & Tagline */}
            <div className="border-t border-gray-800 bg-gray-950 relative z-10">
                <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 text-gray-500">
                        <p className="text-gray-500 text-xs font-black uppercase tracking-wider">
                            © 2025 Aisle. All rights reserved.
                        </p>
                        <span className="text-gray-800 hidden md:inline">|</span>
                        <p className="text-xs font-black text-teal-500 uppercase tracking-widest">
                            Real products. Real people. Nearby.
                        </p>
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center gap-4">
                        <a href="#" className="text-gray-600 hover:text-teal-500 transition-colors"><Twitter className="w-4 h-4" /></a>
                        <a href="#" className="text-gray-600 hover:text-teal-500 transition-colors"><Linkedin className="w-4 h-4" /></a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

// 7. Map Grid Graphic Element
const MapBackground = () => (
    <div className="absolute inset-0 pointer-events-none opacity-[0.04] select-none z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
            </defs>
            {/* Grid Pattern */}
            <rect width="100%" height="100%" fill="url(#grid)" />
            {/* Curved Connection Lines */}
            <path d="M 100 200 Q 300 100 500 250 T 900 150" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="5,5" />
            <path d="M 200 400 Q 600 300 1000 450" fill="none" stroke="white" strokeWidth="1" strokeDasharray="3,3" />
            <path d="M 800 100 Q 1100 250 1300 120" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="4,4" />
            {/* Blinking Location Pins / Dots */}
            <circle cx="100" cy="200" r="4" fill="#E07A5F" />
            <circle cx="500" cy="250" r="3" fill="#81B29A" />
            <circle cx="900" cy="150" r="5" fill="#F2CC8F" />
            <circle cx="1000" cy="450" r="3.5" fill="#E07A5F" />
            <circle cx="1300" cy="120" r="4" fill="#81B29A" />
        </svg>
    </div>
);

// 8. Movement Subscription Section
const SubscribeSection = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        // Basic Validation
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            setStatus('error');
            setErrorMsg('Please enter a valid email address.');
            return;
        }

        setStatus('loading');

        // Simulate API call (1.5s delay)
        setTimeout(() => {
            setStatus('success');
            setEmail('');
        }, 1500);
    };

    if (status === 'success') {
        return (
            <div className="pt-2 animate-fade-in text-teal-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                <span>✓</span> Joined Aisle Movement
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if (status === 'error') setStatus('idle');
                    }}
                    disabled={status === 'loading'}
                    className={`bg-gray-800/80 border ${status === 'error' ? 'border-red-500/50' : 'border-gray-700/60'} text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-teal-600 w-full md:w-48 transition-all disabled:opacity-50 font-medium`}
                />
                <button
                    type="submit"
                    disabled={!email || status === 'loading'}
                    className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-800 disabled:text-gray-600 text-white text-[10px] font-black px-4 py-2 rounded-xl transition-colors whitespace-nowrap uppercase tracking-wider"
                >
                    {status === 'loading' ? '...' : 'Join'}
                </button>
            </div>
            {status === 'error' && (
                <p className="text-red-400 text-[10px] font-semibold pl-1">{errorMsg}</p>
            )}
        </form>
    );
};

export default Footer;
