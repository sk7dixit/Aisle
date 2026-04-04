import SystemNote from '../../common/SystemNote';
import { FaMapMarkerAlt, FaStore, FaShoppingBasket } from 'react-icons/fa';

const LiveLocalSignals = ({ openShopsCount, closestShop, loading }) => {

    if (loading) return (
        // ... (keep skeleton or better: use ScanningMap in parent, so this might not even render if loading)
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-6 mb-8 max-w-4xl mx-auto">
             {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>)}
        </div>
    );

    if (openShopsCount === 0) return null;

    return (
        <section className="px-6 mb-10 max-w-4xl mx-auto">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Happening Now</h3>
            <SystemNote align="left" className="mb-4 -mt-1">These highlights update based on shop activity in your area.</SystemNote>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Signal 1: Proximity */}
                {closestShop && (
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 active:scale-95 transition-transform cursor-pointer hover:border-blue-200">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                            <FaMapMarkerAlt />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase mb-0.5">Closest Shop</p>
                            <p className="font-bold text-gray-900 leading-tight">{closestShop.distance} away</p>
                            <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 rounded">Open right now</span>
                        </div>
                    </div>
                )}

                {/* Signal 2: Availability */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 active:scale-95 transition-transform cursor-pointer hover:border-blue-200">
                    <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
                        <FaStore />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase mb-0.5">Nearby Activity</p>
                        <p className="font-bold text-gray-900 leading-tight">{openShopsCount} shops open</p>
                        <p className="text-[10px] text-gray-400">Groceries • Meds • More</p>
                    </div>
                </div>

                {/* Signal 3: Daily Needs */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 active:scale-95 transition-transform cursor-pointer hover:border-blue-200">
                    <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
                        <FaShoppingBasket />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase mb-0.5">Daily Essentials</p>
                        <p className="font-bold text-gray-900 leading-tight">In stock nearby</p>
                        <p className="text-[10px] text-gray-400">Ready for pickup</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LiveLocalSignals;
