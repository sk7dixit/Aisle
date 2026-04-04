import React from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';

const StockStatusBadge = ({ stock, minStock = 5 }) => {
    const getStatus = () => {
        if (stock === 0) {
            return {
                label: 'Out of Stock',
                color: 'bg-red-100 text-red-700 border-red-200',
                icon: <FaTimesCircle className="text-red-600" />
            };
        } else if (stock <= minStock) {
            return {
                label: 'Low Stock',
                color: 'bg-orange-100 text-orange-700 border-orange-200',
                icon: <FaExclamationTriangle className="text-orange-600" />
            };
        } else {
            return {
                label: 'In Stock',
                color: 'bg-green-100 text-green-700 border-green-200',
                icon: <FaCheckCircle className="text-green-600" />
            };
        }
    };

    const status = getStatus();

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
            {status.icon}
            {status.label}
        </span>
    );
};

export default StockStatusBadge;
