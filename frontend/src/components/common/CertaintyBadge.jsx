import React from 'react';
import { FaCheckCircle, FaClock, FaShieldAlt } from 'react-icons/fa';

const CertaintyBadge = ({ type }) => {
    const config = {
        AVAILABILITY: {
            text: 'Availability Confirmed',
            icon: <FaCheckCircle className="text-[var(--accent-green)]" />,
            bg: 'bg-[var(--accent-green)]/10',
            border: 'border-[var(--accent-green)]/20',
            textColor: 'text-[var(--accent-green)]'
        },
        PAY_ON_VISIT: {
            text: 'Pay on Visit Available',
            icon: <FaClock className="text-[var(--accent-orange)]" />,
            bg: 'bg-[var(--accent-orange)]/10',
            border: 'border-[var(--accent-orange)]/20',
            textColor: 'text-[var(--accent-orange)]'
        },
        SELLER_ACTIVE: {
            text: 'Seller Active',
            icon: <FaShieldAlt className="text-[var(--accent-green)]" />,
            bg: 'bg-[var(--accent-green)]/5',
            border: 'border-[var(--accent-green)]/10',
            textColor: 'text-[var(--accent-green)]'
        },
        ONLINE_PAY: {
            text: 'Online Payment Available',
            icon: <FaShieldAlt className="text-blue-500" />,
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            textColor: 'text-blue-600'
        }
    };

    const badge = config[type];
    if (!badge) return null;

    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 ${badge.bg} ${badge.border} ${badge.textColor} rounded-full border text-[10px] font-black uppercase tracking-tight shadow-sm transition-all hover:scale-105`}>
            {badge.icon}
            <span>{badge.text}</span>
        </div>
    );
};

export default CertaintyBadge;
