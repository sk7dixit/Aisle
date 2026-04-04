import React from 'react';
import { FaMapMarkerAlt, FaCircle } from 'react-icons/fa';
import { useSidebarState } from '../../../context/SidebarStateContext';
import { useAuth } from '../../../context/AuthContext';

const MarketContextStrip = () => {
    const { user } = useAuth();
    const { inputSignals } = useSidebarState();

    return (
        <div className="bg-[#181411] border-b border-white/5 sticky top-0 z-20 px-4 py-2 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--bg-paper)] bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                    <FaMapMarkerAlt className="text-blue-600" />
                    <span>Showing shops near {user?.customerLocation?.city || 'Vadodara'}</span>
                </div>

                {inputSignals?.openShopsCount > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-green-700">
                        <FaCircle className="text-[6px] text-green-500 animate-pulse" />
                        {inputSignals.openShopsCount} shops open now
                    </div>
                )}
            </div>

            <div className="text-[10px] text-[var(--bg-paper)]/40 font-medium">
                Real-time updates
            </div>
        </div>
    );
};

export default MarketContextStrip;
