import React, { useState, useEffect } from 'react';
import { MapPin, TrendingUp, Star, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import InteractiveMap from './InteractiveMap';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../../context/LocationContext';

const Hero = () => {
    const { userLocation, detectLocation, isLocating } = useLocation();
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();

    // 1. Rotating Product Trends State
    const trends = [
        "⚡ Pickles",
        "⚡ Customized Rakhi",
        "⚡ Tiffin Service",
        "⚡ Gourmet Chocolates",
        "⚡ Phone Chargers",
        "⚡ Homemade Cupcakes"
    ];
    const [trendIndex, setTrendIndex] = useState(0);

    // 2. Rotating Seller Spotlight State
    const spotlights = [
        { name: "Priya's Homemade Pickles", rating: "4.9", orders: "120+ orders", details: "Authentic Mango & Lime pickles in Vadodara", icon: "🌶️" },
        { name: "Neha's Baking Haven", rating: "4.8", orders: "85+ orders", details: "Premium customized cakes and fudge brownies", icon: "🎂" },
        { name: "Aarav's Woven Crochet Studio", rating: "5.0", orders: "45+ orders", details: "Handcrafted bags & custom name threads", icon: "🧶" }
    ];
    const [spotlightIndex, setSpotlightIndex] = useState(0);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Timer for product trends (3 seconds)
    useEffect(() => {
        const trendTimer = setInterval(() => {
            setTrendIndex(prev => (prev + 1) % trends.length);
        }, 3000);
        return () => clearInterval(trendTimer);
    }, []);

    // Timer for seller spotlight (5 seconds)
    useEffect(() => {
        const spotlightTimer = setInterval(() => {
            setSpotlightIndex(prev => (prev + 1) % spotlights.length);
        }, 5000);
        return () => clearInterval(spotlightTimer);
    }, []);

    const handleScanArea = async () => {
        try {
            await detectLocation();
        } catch (error) {
            console.error("Manual scan failed", error);
        }
    };

    // Derived location text
    const locationDisplay = isLocating
        ? 'Scanning your neighborhood...'
        : userLocation
            ? userLocation.address
            : '';

    return (
        <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-teal-50 via-coral-50 to-amber-50 pt-8 pb-16">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-coral-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 mt-0">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className={`space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

                        {/* Main Heading */}
                        <div className="space-y-4">
                            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                                <span className="text-gray-900">Find</span>
                                <br />
                                <span className="bg-gradient-to-r from-teal-600 via-coral-500 to-amber-500 bg-clip-text text-transparent animate-gradient">
                                    Anything
                                </span>
                                <br />
                                <span className="text-gray-900">near you.</span>
                            </h1>
                            <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                                Skip the warehouse wait. See which nearby businesses and creators have exactly what you need, right now. Zero delivery markups.
                            </p>
                        </div>
 
                        {/* Search Bar / Location Display */}
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <Button
                                    className="flex-shrink-0 bg-white hover:bg-gray-50 text-teal-700 font-bold px-6 py-4 rounded-xl shadow-md hover:shadow-lg border border-teal-100 transition-all duration-300"
                                    onClick={handleScanArea}
                                    disabled={isLocating}
                                >
                                    <MapPin className={`w-5 h-5 mr-2 ${isLocating ? 'animate-spin' : ''}`} />
                                    {isLocating ? 'Scanning...' : 'Scan My Area'}
                                </Button>
                                <div className="relative flex-1">
                                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <Input
                                        type="text"
                                        value={locationDisplay}
                                        readOnly
                                        placeholder="Or scan to see where you are..."
                                        className="pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 bg-white/50 focus:border-teal-500 shadow-sm text-base transition-all duration-300 cursor-default"
                                    />
                                </div>
                            </div>
 
                            {/* Location Status Widget */}
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white/60 border border-slate-200/40 w-fit px-3 py-1.5 rounded-full select-none shadow-sm backdrop-blur-sm animate-fade-in">
                                {isLocating ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                                        <span>Finding nearby businesses...</span>
                                    </>
                                ) : userLocation ? (
                                    <>
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        <span>📍 {userLocation.city || 'Vadodara'} | Searching 5 km radius</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="relative flex h-2 w-2">
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
                                        </span>
                                        <span>📍 Vadodara (Default) | Scan area to sync radius</span>
                                    </>
                                )}
                            </div>

                            {/* Rotating Product Trends */}
                            <div className="text-sm text-gray-500 flex items-center gap-2 pt-1 min-h-[24px]">
                                <TrendingUp className="w-4 h-4 text-coral-500" />
                                <span className="font-medium text-slate-500">Popular now:</span>
                                <span key={trendIndex} className="font-bold text-teal-600 animate-fade-in inline-block">
                                    {trends[trendIndex]}
                                </span>
                            </div>
                        </div>

                        {/* Rotating Home Business Spotlight Card */}
                        <div className="bg-white/80 border border-slate-200/50 rounded-2xl p-4 shadow-md relative overflow-hidden transition-all duration-500 max-w-md backdrop-blur-md">
                            <div className="absolute top-2.5 right-3 bg-amber-500/10 text-amber-800 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 border border-amber-500/20">
                                <Sparkles className="w-2.5 h-2.5 text-amber-600 fill-amber-500 animate-pulse" />
                                <span>Creator Spotlight</span>
                            </div>
                            
                            <div key={spotlightIndex} className="flex items-center gap-3 animate-fade-in">
                                <span className="text-2xl select-none">{spotlights[spotlightIndex].icon}</span>
                                <div className="flex-1 min-w-0 text-left">
                                    <h4 className="font-extrabold text-slate-800 text-sm truncate">{spotlights[spotlightIndex].name}</h4>
                                    <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">{spotlights[spotlightIndex].details}</p>
                                </div>
                                <div className="text-right flex flex-shrink-0 flex-col items-end">
                                    <div className="flex items-center gap-0.5 text-amber-500">
                                        <Star className="w-3 h-3 fill-current" />
                                        <span className="text-[11px] font-black text-slate-800">{spotlights[spotlightIndex].rating}</span>
                                    </div>
                                    <span className="text-[9px] text-teal-600 font-bold bg-teal-50 border border-teal-100 px-1.5 py-0.2 rounded mt-0.5">
                                        {spotlights[spotlightIndex].orders}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Social Proof */}
                        <div className="flex items-center gap-6 pt-2 border-t border-slate-100">
                            <div className="flex -space-x-3">
                                {[
                                    { text: "P", color: "from-amber-400 to-amber-600" },
                                    { text: "N", color: "from-pink-400 to-pink-600" },
                                    { text: "A", color: "from-teal-400 to-teal-600" },
                                    { text: "M", color: "from-indigo-400 to-indigo-600" },
                                    { text: "R", color: "from-rose-400 to-rose-600" }
                                ].map((char, i) => (
                                    <div key={i} className={`w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br ${char.color} flex items-center justify-center text-white font-extrabold text-xs shadow-md transform hover:scale-110 transition-transform duration-300 select-none`}>
                                        {char.text}
                                    </div>
                                ))}
                            </div>
                            <div className="text-left">
                                <p className="text-xl font-black text-slate-800 leading-none">50,000+</p>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Neighbors connected locally</p>
                            </div>
                        </div>
                    </div>

                    {/* Right - Interactive Map */}
                    <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
                        <InteractiveMap />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;
