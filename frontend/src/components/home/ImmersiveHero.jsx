import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IconShop, IconService, IconHeart } from '../common/Icons3D';

const HERO_IMAGES = [
    "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1600&q=80", // Busy Shopping Street
    "https://images.unsplash.com/photo-1573855619003-97b4799dcd8b?auto=format&fit=crop&w=1600&q=80", // Electronics/Gadgets
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80", // Fashion/Clothes
];

const ImmersiveHero = () => {
    const [currentImage, setCurrentImage] = useState(0);

    // Auto-rotate background images every 6 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % HERO_IMAGES.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-full bg-slate-50">

            {/* --- 1. THE CINEMATIC BACKGROUND --- */}
            <div className="relative h-[65vh] w-full overflow-hidden">
                {/* Dark Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-slate-50/90 z-10"></div>

                {/* The Sliding Images */}
                {HERO_IMAGES.map((img, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentImage ? 'opacity-100' : 'opacity-0'
                            }`}
                    >
                        {/* "Ken Burns" Slow Zoom Effect */}
                        <img
                            src={img}
                            alt="Background"
                            className={`w-full h-full object-cover transform transition-transform duration-[10000ms] ${index === currentImage ? 'scale-110' : 'scale-100'
                                }`}
                        />
                    </div>
                ))}

                {/* --- 2. THE SEARCH CONTENT (Floating on top) --- */}
                <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4 -mt-16">

                    <div className="inline-block px-4 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold tracking-widest uppercase mb-6 animate-fade-in shadow-lg">
                        📍 Vadodara's Local Marketplace
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-xl mb-6 max-w-4xl animate-fade-in delay-100 leading-tight">
                        Find what’s <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">actually available</span> near you.
                    </h1>

                    {/* The "Super" Search Bar */}
                    <div className="w-full max-w-2xl relative group animate-fade-in delay-200">
                        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                        <input
                            type="text"
                            placeholder="Search shops, electronics, services..."
                            className="relative w-full py-5 pl-14 pr-6 rounded-2xl bg-white text-gray-800 text-lg shadow-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-gray-400"
                        />
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
                    </div>

                </div>
            </div>

            {/* --- 3. THE OVERLAPPING CARDS (The Bridge) --- */}
            {/* Negative Margin (-mt-24) pulls this section UP into the image */}
            <div className="relative z-30 container mx-auto px-4 -mt-24 pb-12 max-w-[1440px]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-8">

                    {/* Card 1 */}
                    <Link to="/shops" className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-black/10 border border-white/50 hover:-translate-y-2 transition-transform duration-300 group cursor-pointer">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-orange-100 p-3 rounded-2xl w-16 h-16 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><IconShop /></div>
                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors">Browse Shops</h3>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Explore local inventory from verified sellers.</p>
                    </Link>

                    {/* Card 2 */}
                    <Link to="/services" className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-black/10 border border-white/50 hover:-translate-y-2 transition-transform duration-300 group cursor-pointer">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-blue-100 p-3 rounded-2xl w-16 h-16 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><IconService /></div>
                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Find Services</h3>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Electricians, Plumbers, and Repairs.</p>
                    </Link>

                    {/* Card 3 */}
                    <Link to="/interested" className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-black/10 border border-white/50 hover:-translate-y-2 transition-transform duration-300 group cursor-pointer">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-pink-100 p-3 rounded-2xl w-16 h-16 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><IconHeart /></div>
                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-pink-600 transition-colors">Interested</h3>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Track your requests and wishlists.</p>
                    </Link>

                </div>
            </div>

        </div>
    );
};

export default ImmersiveHero;
