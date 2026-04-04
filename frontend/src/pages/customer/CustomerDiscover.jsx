import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaClock, FaFire, FaStore, FaArrowRight, FaRegSmile } from 'react-icons/fa';

const CustomerDiscover = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    // Data State (Mocked for now as backend endpoints for 'discover' might not be fully ready, 
    // but structure is ready for real ingestion)
    const [recentUpdates, setRecentUpdates] = useState([]);
    const [trendingItems, setTrendingItems] = useState([]);
    const [newShops, setNewShops] = useState([]);

    const city = user?.customerLocation?.city || "Vadodara";

    useEffect(() => {
        const fetchDiscoverData = async () => {
            // In a real implementation, this would be:
            // const { data } = await axios.get(`/api/customer/discover?city=${city}`);
            // For now, we simulate the "Truthful" empty state by default, 
            // but I will leave commented mock data for when we want to test connections.

            // Simulate network delay
            setTimeout(() => {
                setLoading(false);
                // To test populated state, uncomment these:
                // setRecentUpdates([{ id: 1, name: 'Dixit Mart', update: 'Added 5 new items', time: '2h ago' }]);
                // setTrendingItems([{ id: 101, name: 'Amul Butter', shop: 'Dixit Mart', interest: 12 }]);
                // setNewShops([{ id: 3, name: 'Fresh Fruits', category: 'Vegetables' }]);
            }, 800);
        };
        fetchDiscoverData();
    }, [city]);

    // Derived: Is the page empty?
    const isEmpty = recentUpdates.length === 0 && trendingItems.length === 0 && newShops.length === 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center animate-pulse">
                    <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
                    <div className="h-3 w-24 bg-slate-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-white p-6 rounded-full shadow-sm mb-6">
                    <FaRegSmile className="text-4xl text-slate-300" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Nothing new right now.</h2>
                <p className="text-slate-500 mb-8 max-w-xs mx-auto text-sm leading-relaxed">
                    Activity in {city} is quiet at the moment. We only show updates when they are real and relevant.
                </p>
                <button
                    onClick={() => navigate('/nearby')}
                    className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline"
                >
                    Browse shops in your area <FaArrowRight className="text-xs" />
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <div className="p-6 pt-8 pb-2">
                <span className="text-[10px] font-bold tracking-wider text-blue-600 uppercase mb-1 block">Live Activity</span>
                <h1 className="text-2xl font-bold text-slate-900">Discover {city}</h1>
                <p className="text-xs text-slate-400 mt-1">Real-time highlights from local sellers.</p>
            </div>

            <div className="space-y-8 pb-12">
                {/* 1. Recently Updated */}
                {recentUpdates.length > 0 && (
                    <section className="pl-6">
                        <div className="flex items-center gap-2 mb-4">
                            <FaClock className="text-slate-400 text-xs" />
                            <h2 className="text-sm font-bold text-slate-700">Just Updated</h2>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pr-6 pb-4 scrollbar-hide">
                            {recentUpdates.map(shop => (
                                <div
                                    key={shop.id}
                                    onClick={() => navigate(`/market/shop/${shop.id}`)}
                                    className="min-w-[200px] bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
                                >
                                    <h3 className="font-bold text-slate-900 text-sm mb-1">{shop.name}</h3>
                                    <p className="text-xs text-green-600 font-medium mb-2">{shop.update}</p>
                                    <p className="text-[10px] text-slate-400">{shop.time}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 2. Trending / Active Interest */}
                {trendingItems.length > 0 && (
                    <section className="px-6">
                        <div className="flex items-center gap-2 mb-4">
                            <FaFire className="text-amber-500 text-xs" />
                            <h2 className="text-sm font-bold text-slate-700">Neighbors are Looking For</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {trendingItems.map(item => (
                                <div
                                    key={item.id}
                                    className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between"
                                >
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                                        <p className="text-[10px] text-slate-400">at {item.shop}</p>
                                    </div>
                                    <div className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-1 rounded-full">
                                        +{item.interest}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 3. New Shops */}
                {newShops.length > 0 && (
                    <section className="px-6">
                        <div className="flex items-center gap-2 mb-4">
                            <FaStore className="text-blue-500 text-xs" />
                            <h2 className="text-sm font-bold text-slate-700">New in Town</h2>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                            {newShops.map(shop => (
                                <div key={shop.id} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm mb-2 last:mb-0">
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm">{shop.name}</h4>
                                        <p className="text-[10px] text-slate-500">{shop.category}</p>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/market/shop/${shop.id}`)}
                                        className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg"
                                    >
                                        Visit
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default CustomerDiscover;
