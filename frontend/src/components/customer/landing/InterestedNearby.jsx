import React from 'react';

const InterestedNearby = ({ interestedIntents = [] }) => {
    // If no interests, don't render anything (keep UI clean)
    if (!interestedIntents || interestedIntents.length === 0) return null;

    // Hardcoded Availability Mapping (Mock for now, normally from backend aggregation)
    const availabilityMap = {
        "Need groceries now": { distance: "120m", label: "Open now" },
        "Pharmacy near me": { distance: "350m", label: "Open now" },
        "Quick snacks & drinks": { distance: "0.5km", label: "Closes soon" },
    };

    return (
        <section className="px-6 mb-12 max-w-4xl mx-auto animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-bold text-gray-900">Interested nearby</h2>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {interestedIntents.length}
                </span>
            </div>

            <div className="flex flex-wrap gap-3">
                {interestedIntents.map((intent, i) => {
                    const meta = availabilityMap[intent.label] || { distance: "Nearby", label: "Check availability" };
                    return (
                        <div key={i} className="flex items-center gap-3 bg-blue-50/50 border border-blue-100 px-4 py-3 rounded-xl min-w-[180px]">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-900">{intent.label}</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-semibold text-blue-600">{meta.distance}</span>
                                    <span className="text-[10px] text-gray-400">• {meta.label}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default InterestedNearby;
