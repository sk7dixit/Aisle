import React from 'react';
import { FaBell, FaCircle, FaStar, FaBoxOpen, FaCheck } from 'react-icons/fa';

const RightLiveSignals = ({ interests }) => {
    const liveUpdates = [
        { id: 1, shop: 'Gupta General', action: 'updated stock', time: '1m' },
        { id: 2, shop: 'City Medicos', action: 'has medicines', time: '5m' },
        { id: 3, shop: 'New Shop', action: 'opened recently', time: '12m' },
    ];

    return (
        <div className="sticky top-24 space-y-6">
            {/* Live Updates Feed */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Live Updates</span>
                    </div>
                </div>
                <div className="divide-y divide-slate-50">
                    {liveUpdates.map(update => (
                        <div key={update.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{update.shop}</span>
                                <span className="text-[10px] text-slate-400 font-medium">{update.time}</span>
                            </div>
                            <p className="text-xs text-slate-500">{update.action}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Your Interests */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                    <FaStar className="text-yellow-400" />
                    <span className="text-sm font-bold text-slate-800">Your Interests</span>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 border border-red-100/50">
                        <div className="flex items-center gap-3">
                            <FaBoxOpen className="text-red-400" />
                            <span className="text-sm font-medium text-slate-700">Rice</span>
                        </div>
                        <span className="text-[10px] font-bold text-red-500 bg-white px-2 py-1 rounded-md border border-red-100 shadow-sm">Unavail.</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-green-50/50 border border-green-100/50">
                        <div className="flex items-center gap-3">
                            <FaCheck className="text-green-500" />
                            <span className="text-sm font-medium text-slate-700">Milk</span>
                        </div>
                        <span className="text-[10px] font-bold text-green-600 bg-white px-2 py-1 rounded-md border border-green-100 shadow-sm">Nearby</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RightLiveSignals;
