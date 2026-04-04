import React from 'react';

const StockLevelBar = ({ current, min = 5, max = 100 }) => {
    const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;

    const getColor = () => {
        if (current === 0) return 'bg-red-500';
        if (current <= min) return 'bg-orange-500';
        return 'bg-green-500';
    };

    const getBackgroundColor = () => {
        if (current === 0) return 'bg-red-100';
        if (current <= min) return 'bg-orange-100';
        return 'bg-green-100';
    };

    return (
        <div className="flex items-center gap-3">
            <div className="flex-1">
                <div className={`h-2 rounded-full ${getBackgroundColor()} overflow-hidden`}>
                    <div
                        className={`h-full ${getColor()} transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
            <span className="text-sm text-slate-600 font-medium whitespace-nowrap min-w-[80px] text-right">
                {current} / {max} units
            </span>
        </div>
    );
};

export default StockLevelBar;
