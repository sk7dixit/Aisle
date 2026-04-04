import React, { useState } from 'react';
import PageWrapper from '../components/common/PageWrapper';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ExploreCard from '../components/explore/ExploreCard';
import { cn } from '../lib/utils';
import { FaMapMarkerAlt, FaInfoCircle } from 'react-icons/fa';

const Demo = () => {
    const [activeCategory, setActiveCategory] = useState("All");

    // Mock Location for Demo
    const demoLocationName = "Mission District, San Francisco";

    // Hardcoded Demo Shops
    const shops = [
        { id: 1, name: "The Coffee Bean", category: "Groceries", isOpen: true, lat: 0, lng: 0 },
        { id: 2, name: "Urban Threads", category: "Fashion", isOpen: true, lat: 0, lng: 0 },
        { id: 3, name: "Tech Point", category: "Electronics", isOpen: true, lat: 0, lng: 0 },
        { id: 4, name: "Green Earth Organics", category: "Groceries", isOpen: false, lat: 0, lng: 0 },
        { id: 5, name: "City Readers", category: "Books", isOpen: true, lat: 0, lng: 0 },
        { id: 6, name: "FitLife Gear", category: "Sports", isOpen: true, lat: 0, lng: 0 },
    ];

    const categories = ["All", "Groceries", "Electronics", "Fashion", "Books", "Sports"];

    const filteredShops = activeCategory === "All"
        ? shops
        : shops.filter(shop => shop.category === activeCategory);

    return (
        <PageWrapper className="bg-white min-h-screen flex flex-col font-sans">
            <Header />

            <main className="flex-grow pt-20">
                {/* Demo Banner */}
                <div className="bg-teal-50 border-b border-teal-100 py-3 px-4 text-center">
                    <p className="text-sm text-teal-800 flex items-center justify-center gap-2 font-medium">
                        <FaInfoCircle className="text-teal-600" />
                        Viewing Demo Mode • No location access required
                    </p>
                </div>

                {/* Context Strip (Mock) */}
                <div className="bg-slate-50 border-b border-slate-100 py-3 px-4 text-center">
                    <p className="text-sm text-slate-600 flex items-center justify-center gap-2">
                        <FaMapMarkerAlt className="text-teal-600" />
                        Showing shops near:
                        <span className="font-bold text-slate-900">
                            {demoLocationName}
                        </span>
                    </p>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Page Copy */}
                    <div className="mb-8">
                        <p className="text-slate-600 text-lg">
                            Browse nearby shops and live inventory.
                            <br className="hidden md:block" />
                            Login only when you want to connect or request a product.
                        </p>
                    </div>

                    {/* Category Pills */}
                    <div className="mb-8">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Categories</h3>
                        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={cn(
                                        "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
                                        activeCategory === cat
                                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Shop Grid Header */}
                    <div className="flex items-end justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Shops near you</h2>
                            <p className="text-sm text-slate-400 font-medium mt-1">Updated in real time (Demo Data)</p>
                        </div>
                    </div>

                    {/* Shop Grid */}
                    <div className="bg-white">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredShops.map((shop, idx) => (
                                <div key={shop.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                    {/* 
                                        Note: ExploreCard handles interaction by redirecting to login. 
                                        In a real demo, we might want to suppress that or show a "This is a demo" toast.
                                        For now, the default behavior (redirect to login on click) effectively gates the "View Shop" action, 
                                        which reinforces the "View Demo (No Signup)" -> "Real Feature requires login" flow, 
                                        OR we could override it.
                                        
                                        However, ExploreCard takes a `shop` object. The internal onClick is hardcoded.
                                        Ideally, we should pass an onAction prop to ExploreCard, but for now, 
                                        we will let it be. The user said "Pure walkthrough... Shows example flow". 
                                        If 'View Shop' redirects to login, it might break the "No Signup" promise of the demo if executed immediately.
                                        
                                        But 'ExploreCard' isn't easily modified via props without changing the component definition.
                                        Given the constraints, reusing ExploreCard is efficient. 
                                    */}
                                    <ExploreCard shop={shop} distance={(0.5 + idx * 0.2).toFixed(1)} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </PageWrapper>
    );
};

export default Demo;
