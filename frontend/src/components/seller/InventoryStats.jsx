import React from 'react';
import { FaBox, FaRupeeSign, FaExclamationTriangle } from 'react-icons/fa';

const InventoryStats = ({ metrics, loading }) => {
    const stats = [
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
                        <div className="h-12 bg-slate-200 rounded mb-3"></div>
                        <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className="bg-white rounded-2xl border border-[#F3E8D3] p-6 hover:shadow-md transition-shadow shadow-sm"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                            {stat.icon}
                        </div>
                    </div>
                    <p className="text-[#92817A] text-sm font-medium mb-1">{stat.label}</p>
                    <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
                </div>
            ))}
        </div>
    );
};

export default InventoryStats;
