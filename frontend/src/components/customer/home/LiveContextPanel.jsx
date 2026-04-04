import React from 'react';
import { FaMapMarkerAlt, FaStore, FaClock, FaCheckCircle, FaFireAlt } from 'react-icons/fa';

const LiveContextPanel = ({ location }) => {
    return (
        <div className="sticky top-24 space-y-6">
            {/* Location Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <FaMapMarkerAlt />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Your Area</p>
                        <p className="text-sm font-bold text-slate-800">{location?.area || 'Vadodara'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium pl-11">
                    <FaClock className="text-slate-300" />
                    <span>Last updated: 2 min ago</span>
                </div>
            </div>

            {/* Filters / Toggles */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Filters</p>

                <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3 text-slate-600 group-hover:text-blue-600 transition-colors">
                        <FaStore className="text-slate-300 group-hover:text-blue-400" />
                        <span className="text-sm font-semibold">Open Now</span>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </div>
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3 text-slate-600 group-hover:text-blue-600 transition-colors">
                        <FaMapMarkerAlt className="text-slate-300 group-hover:text-blue-400" />
                        <span className="text-sm font-semibold">Within 1 km</span>
                    </div>
                    <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3 text-slate-600 group-hover:text-blue-600 transition-colors">
                        <FaCheckCircle className="text-slate-300 group-hover:text-blue-400" />
                        <span className="text-sm font-semibold">Verified Only</span>
                    </div>
                    <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                </label>
            </div>

            {/* Trending */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-5 border border-blue-100/50 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <FaFireAlt className="text-orange-500" />
                    <span className="text-sm font-bold text-slate-800">Trending Today</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {['Milk', 'Medicines', 'Snacks', 'Bread'].map(tag => (
                        <span key={tag} className="px-3 py-1.5 bg-white border border-blue-100 rounded-full text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors cursor-pointer shadow-sm">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LiveContextPanel;
