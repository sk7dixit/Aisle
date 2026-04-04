import React from 'react';
import { FaInfoCircle } from 'react-icons/fa';

/**
 * ConfidenceSignal Component
 * STRICTLY enforces the AI Confidence & Color System rules.
 * 
 * Labels:
 * - High -> "Likely available"
 * - Medium -> "Availability varies"
 * - Low -> "Limited availability"
 * 
 * Colors:
 * - Green (text-green-700) -> Open + High
 * - Amber (text-amber-700) -> Open + Medium
 * - Red (text-red-700) -> Closed OR Low
 */
const ConfidenceSignal = ({ level = 'medium', shopStatus = 'OPEN', showTooltip = true }) => {

    // 1. Determine Label
    let label = '';
    let tooltipText = '';

    switch (level) {
        case 'high':
            label = 'Likely available';
            tooltipText = 'Based on recent shop updates and nearby demand.';
            break;
        case 'medium':
            label = 'Availability varies';
            tooltipText = 'Shops nearby may or may not have this item right now.';
            break;
        case 'low':
            label = 'Limited availability';
            tooltipText = 'Few nearby shops show recent availability.';
            break;
        default:
            label = 'Availability varies';
            tooltipText = 'Shops nearby may or may not have this item right now.';
    }

    // 2. Determine Color
    // Rule: Closed shops are always RED (unavailable context)
    // Rule: Low confidence is always RED
    let colorClass = 'text-gray-500';

    if (shopStatus !== 'OPEN') {
        colorClass = 'text-red-700'; // Risk
    } else {
        if (level === 'high') colorClass = 'text-green-700'; // Safe
        else if (level === 'medium') colorClass = 'text-amber-700'; // Caution
        else colorClass = 'text-red-700'; // Risk
    }

    return (
        <div className={`flex items-center gap-1.5 text-xs font-bold ${colorClass} group relative cursor-help`}>
            <span>{label}</span>

            {showTooltip && (
                <>
                    <FaInfoCircle className="text-[10px] opacity-50 group-hover:opacity-100 transition-opacity" />

                    {/* Tooltip (Hover Only) */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-800 text-white text-[10px] font-medium p-2 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-center leading-relaxed pointer-events-none">
                        {tooltipText}
                        {/* Tiny triangle */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ConfidenceSignal;
