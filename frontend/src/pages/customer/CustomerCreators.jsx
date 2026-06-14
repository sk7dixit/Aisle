import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaMapMarkerAlt, FaPalette, FaFilter, FaCompass, FaChevronDown } from 'react-icons/fa';
import { detectUserLocation } from '../../services/locationService';
import CreatorCard from '../../components/customer/CreatorCard';
import { toast } from 'react-hot-toast';

const CREATOR_CATEGORIES = [
    { id: 'ALL', label: 'All Creations' },
    { id: 'food', label: 'Home Food & Catering' },
    { id: 'bakery', label: 'Bakeries & Sweets' },
    { id: 'crafts', label: 'Handmade Crafts & Gifts' },
    { id: 'crochet', label: 'Crochet & Sewing' },
    { id: 'jewelry', label: 'Jewelry & Decor' }
];

const CustomerCreators = () => {
    const [creators, setCreators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [radiusKm, setRadiusKm] = useState(5);
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [currentCity, setCurrentCity] = useState(localStorage.getItem('userCity') || "Vadodara");
    const [userLoc, setUserLoc] = useState(null);

    const fetchCreators = async () => {
        setLoading(true);
        try {
            const loc = await detectUserLocation();
            setUserLoc(loc);
            if (loc.city) {
                setCurrentCity(loc.city);
                localStorage.setItem('userCity', loc.city);
            }
            
            const lat = loc.lat || 22.3072; // default Vadodara
            const lng = loc.lng || 73.1812;

            const res = await axios.get(`/api/creators?lat=${lat}&lng=${lng}&radius=${radiusKm}`);
            setCreators(res.data);
        } catch (error) {
            console.error("Failed to load creators by GPS", error);
            try {
                // Fallback to query without coordinates
                const res = await axios.get(`/api/creators?radius=${radiusKm}`);
                setCreators(res.data);
            } catch (innerError) {
                toast.error("Failed to load creators. Please try again.");
                setCreators([]);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCreators();
    }, [radiusKm]);

    // Handle manual refresh
    const handleRefresh = () => {
        fetchCreators();
    };

    // Filter creators based on category selection
    const displayCreators = creators.filter(c => {
        if (selectedCategory === 'ALL') return true;
        const cat = (c.category || '').toLowerCase();
        
        if (selectedCategory === 'food') return cat.includes('food') || cat.includes('catering');
        if (selectedCategory === 'bakery') return cat.includes('bakery') || cat.includes('sweet') || cat.includes('bake');
        if (selectedCategory === 'crafts') return cat.includes('craft') || cat.includes('gift') || cat.includes('art');
        if (selectedCategory === 'crochet') return cat.includes('crochet') || cat.includes('sew') || cat.includes('knit');
        if (selectedCategory === 'jewelry') return cat.includes('jewelry') || cat.includes('decor') || cat.includes('artisan');
        
        return cat.includes(selectedCategory);
    });

    return (
        <div className="bg-slate-50/50 min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Hero Header Banner */}
                <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-xl border border-indigo-950/20">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl -ml-16 -mb-16"></div>

                    <div className="relative z-10 space-y-4 max-w-xl">
                        <span className="inline-flex items-center gap-1 bg-indigo-500/20 border border-indigo-500/30 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-indigo-300">
                            <FaPalette className="text-xs" /> Aisle Creators Movement
                        </span>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none text-white">
                            Discover Talented Creators Near You
                        </h1>
                        <p className="text-sm text-indigo-200/80 leading-relaxed font-semibold">
                            Meet your neighborhood home bakers, crochet artists, traditional pickle makers, and custom gift creators. No warehouses. No middlemen markups.
                        </p>
                    </div>
                </div>

                {/* Filter and Radius Selection Control Panel */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Location Badge */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                            <FaMapMarkerAlt />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Searching Around</span>
                            <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{currentCity}</span>
                        </div>
                    </div>

                    {/* Radius selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Radius:</span>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            {[2, 5, 10, 20].map((km) => (
                                <button
                                    key={km}
                                    onClick={() => setRadiusKm(km)}
                                    className={`px-4 py-2 rounded-lg text-xs font-black tracking-tight transition-all cursor-pointer
                                        ${radiusKm === km 
                                            ? 'bg-white text-slate-800 shadow-sm' 
                                            : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                >
                                    {km} km
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Categories Row */}
                <div className="flex gap-2 overflow-x-auto pb-1 shrink-0 custom-scrollbar">
                    {CREATOR_CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-5 py-3.5 rounded-xl text-xs font-black tracking-tight uppercase whitespace-nowrap transition-all border cursor-pointer
                                ${selectedCategory === cat.id
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Creators List */}
                {loading ? (
                    <div className="py-24 text-center">
                        <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 rounded-full border-t-transparent mb-4"></div>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Locating Nearby Creators...</p>
                    </div>
                ) : displayCreators.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mb-4 border border-slate-100">
                            <FaCompass size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">No Creators Found</h3>
                        <p className="text-slate-500 text-sm mt-1 max-w-md">No active creators found within {radiusKm} km. Try expanding your search radius or selecting another category.</p>
                        <button 
                            onClick={() => setRadiusKm(10)}
                            className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider py-3 px-6 rounded-xl transition-all shadow shadow-indigo-600/10 active:scale-95"
                        >
                            Search 10 km
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {displayCreators.map(c => (
                            <CreatorCard
                                key={c._id}
                                _id={c._id}
                                name={c.name}
                                category={c.category}
                                isOpen={c.isOpen}
                                image={c.shopImage}
                                distance={c.distance}
                                rating={c.rating}
                                numReviews={c.numReviews}
                                creationCount={c.creationCount}
                                story={c.story}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerCreators;
