import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../../context/LocationContext';
import { FaMapMarkerAlt, FaSearch } from 'react-icons/fa';
import { CATEGORIES } from '../../constants/categories'; // NEW: Master List

const CustomerCategories = () => {
    const navigate = useNavigate();
    const { userLocation, refreshLocation, isLocating } = useLocation();

    // Group Categories
    const groupedCategories = useMemo(() => {
        return CATEGORIES.reduce((groups, category) => {
            const groupName = category.group || 'Other';
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(category);
            return groups;
        }, {});
    }, []);

    // CASE A: No location selected
    if (!userLocation && !isLocating) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
                <div className="w-24 h-24 bg-black/5 rounded-[40px] flex items-center justify-center text-[var(--accent-orange)] text-4xl mb-8 shadow-inner border border-black/5">
                    <FaMapMarkerAlt />
                </div>
                <h2 className="text-2xl font-black text-[var(--text-primary)] mb-3 uppercase tracking-tight">Choose your location</h2>
                <p className="text-[var(--text-muted)] text-[11px] font-black uppercase tracking-widest max-w-xs mx-auto mb-10 opacity-60 leading-relaxed">
                    Set your location to explore local providers and products nearby.
                </p>
                <button
                    onClick={() => refreshLocation(true)}
                    className="bg-[var(--accent-orange)] text-black font-black py-4 px-10 rounded-2xl shadow-xl hover:bg-black hover:text-white transition-all active:scale-95 flex items-center gap-3 uppercase tracking-widest text-[11px]"
                >
                    <FaMapMarkerAlt className="text-lg" /> Set Location
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans bg-transparent">
            {/* 1. Header Area: Standard & Clean */}
            <div className="max-w-[1280px] mx-auto px-6 pt-12 pb-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-[26px] font-semibold text-gray-900 mb-1.5 leading-tight">
                            Explore Categories
                        </h1>
                        <p className="text-sm text-gray-500 font-medium">
                            Browse nearby categories available around you
                        </p>
                    </div>

                    {/* Location Pill (Subtle) */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                        <FaMapMarkerAlt className="text-[var(--accent-orange)]" />
                        <span className="truncate max-w-[200px]">{userLocation ? userLocation.area : 'Locating...'}</span>
                    </div>
                </div>
            </div>

            {/* 2. Main Content: Structured Grid */}
            <div className="max-w-[1280px] mx-auto px-6 pb-20 space-y-9">
                {Object.entries(groupedCategories).map(([groupName, items], groupIndex) => (
                    <div
                        key={groupName}
                        className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-backwards"
                        style={{ animationDelay: `${groupIndex * 100}ms` }}
                    >
                        {/* Section Header */}
                        <div className="flex items-center gap-4 mb-4">
                            <h2 className="text-base font-semibold text-gray-800">{groupName}</h2>
                            <div className="h-[1px] flex-1 bg-gray-100"></div>
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-5">
                            {items.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => navigate(`/category/${cat.id}`)}
                                    className="group transition-all duration-300 ease-in-out 
                                            hover:-translate-y-2 hover:shadow-xl
                                            bg-white/70 backdrop-blur-md border border-white/40
                                            p-5 rounded-2xl w-full text-center cursor-pointer"
                                >
                                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center 
                                                  rounded-full bg-orange-50 group-hover:bg-orange-100 
                                                  transition-colors duration-300 text-[var(--accent-orange)] text-lg">
                                        {cat.icon}
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-800">
                                        {cat.label}
                                    </h3>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="h-20"></div>
        </div>
    );
};

export default CustomerCategories;
