import React from 'react';
import { FaBox, FaRupeeSign, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaShoppingCart, FaHistory } from 'react-icons/fa';

const InventoryStats = ({ metrics, loading }) => {
    const isAvailabilityMode = metrics?.isAvailabilityMode;

    const formatLastConfirmed = (timestamp) => {
        if (!timestamp) return 'Never';
        const date = new Date(timestamp);
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const stats = isAvailabilityMode ? [
        {
            label: 'Products Available',
            value: metrics?.availableCount || 0,
            icon: <FaCheckCircle className="text-emerald-500" size={24} />,
            bgColor: 'bg-emerald-50 border-emerald-100',
            textColor: 'text-emerald-700'
        },
        {
            label: 'Products Unavailable',
            value: metrics?.unavailableCount || 0,
            icon: <FaTimesCircle className="text-rose-500" size={24} />,
            bgColor: 'bg-rose-50 border-rose-100',
            textColor: 'text-rose-700'
        },
        {
            label: "Today's Online Orders",
            value: metrics?.onlineOrdersCountToday || 0,
            icon: <FaShoppingCart className="text-blue-500" size={24} />,
            bgColor: 'bg-blue-50 border-blue-100',
            textColor: 'text-blue-700'
        },
        {
            label: 'Availability Confirmed',
            value: formatLastConfirmed(metrics?.lastConfirmed),
            icon: <FaHistory className="text-stone-500" size={24} />,
            bgColor: 'bg-stone-50 border-stone-100',
            textColor: 'text-stone-750'
        }
    ] : [
        {
            label: 'Total Products',
            value: metrics?.totalProducts || 0,
            icon: <FaBox className="text-[#0369A1]" size={24} />,
            bgColor: 'bg-[#E0F2FE]',
            textColor: 'text-[#433422]'
        },
        {
            label: 'Stock Value',
            value: `₹${(metrics?.stockValue || 0).toLocaleString('en-IN')}`,
            icon: <FaRupeeSign className="text-[#D97706]" size={24} />,
            bgColor: 'bg-[#FEF3C7]',
            textColor: 'text-[#D97706]'
        },
        {
            label: 'Low Stock Alerts',
            value: metrics?.lowStockCount || 0,
            icon: <FaExclamationTriangle className="text-[#B45309]" size={24} />,
            bgColor: 'bg-[#FEF3C7]',
            textColor: 'text-[#B45309]'
        }
    ];

    if (loading) {
        return (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${isAvailabilityMode ? '4' : '3'} gap-6 mb-6`}>
                {[1, 2, 3, 4].slice(0, isAvailabilityMode ? 4 : 3).map(i => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
                        <div className="h-12 bg-slate-200 rounded mb-3"></div>
                        <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${isAvailabilityMode ? '4' : '3'} gap-6 mb-6`}>
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className={`bg-white rounded-2xl border ${stat.bgColor || 'border-[#F3E8D3]'} p-6 hover:shadow-md transition-shadow shadow-sm`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                            {stat.icon}
                        </div>
                    </div>
                    <p className="text-[#92817A] text-sm font-medium mb-1">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                </div>
            ))}
        </div>
    );
};

export default InventoryStats;
