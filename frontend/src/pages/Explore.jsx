import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/common/PageWrapper';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ExploreCard from '../components/explore/ExploreCard';
import { useLocation } from '../context/LocationContext';
import { cn } from '../lib/utils';
import { FaMapMarkerAlt } from 'react-icons/fa';

const Explore = () => {
    const { userLocation, isLocating, refreshLocation } = useLocation();
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState("All");

    const categories = ["All", "Groceries", "Electronics", "Fashion", "Books", "Sports", "Home", "Pharmacy"];

    // Auto-detect location on mount if not available
    useEffect(() => {
        if (!userLocation && !isLocating) {
            refreshLocation(); // Attempt auto-detection
        }
    }, []);

    // Real Data Fetch
    useEffect(() => {
        const fetchShops = async () => {
            if (!userLocation) return;

            setLoading(true);
            try {
                const params = new URLSearchParams({
                    lat: userLocation.lat,
                    lng: userLocation.lng,
                    category: activeCategory,
                    radius: 15
                });
                const response = await fetch(`/api/customer/nearby-shops?${params}`);
                const data = await response.json();

                if (response.ok) {
                    setShops(data);
                } else {
                    console.error("Failed to fetch shops:", data.message);
                }
            } catch (error) {
                console.error("Error fetching shops:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchShops();
    }, [userLocation, activeCategory]);

    const filteredShops = shops; // Filtering is now handled by API

    return (
        <PageWrapper className="bg-white min-h-screen flex flex-col font-sans">
            <Header />

            <main className="flex-grow pt-20">
                {/* Context Strip */}
                <div className="bg-slate-50 border-b border-slate-100 py-3 px-4 text-center">
                    <p className="text-sm text-slate-600 flex items-center justify-center gap-2">
                        <FaMapMarkerAlt className="text-teal-600" />
                        Showing shops near:
                        <span className="font-bold text-slate-900">
                            {userLocation?.city || userLocation?.area || (isLocating ? "Detecting location..." : "Unknown Area")}
                        </span>
                        {!userLocation && !isLocating && (
                            <button
                                onClick={refreshLocation}
                                className="text-teal-600 text-xs font-semibold hover:underline ml-2"
                            >
                                (Detect Location)
                            </button>
                        )}
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
                            <p className="text-sm text-slate-400 font-medium mt-1">Updated in real time</p>
                        </div>
                    </div>

                    {/* Shop Grid */}
                    {userLocation ? (
                        <div className="bg-white">
                            {loading ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="h-48 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />
                                    ))}
                                </div>
                            ) : (
                                <>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredShops.map((shop, idx) => (
                                            <div key={shop._id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                                <ExploreCard shop={shop} />
                                            </div>
                                        ))}
                                    </div>

                                    {filteredShops.length === 0 && (
                                        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                            <p className="text-slate-500 font-medium mb-2">No shops found nearby yet.</p>
                                            <p className="text-sm text-slate-400">Try expanding your distance or check back later.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        /* Fallback if location access denied or strictly waiting */
                        <div className="text-center py-20">
                            <div className="inline-block p-4 rounded-full bg-slate-50 mb-4">
                                <FaMapMarkerAlt className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Location access needed</h3>
                            <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                To show you local shops, we need to know your general area.
                            </p>
                            <button
                                onClick={refreshLocation}
                                disabled={isLocating}
                                className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                                {isLocating ? 'Detecting...' : 'Enable Location'}
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </PageWrapper>
    );
};

export default Explore;
