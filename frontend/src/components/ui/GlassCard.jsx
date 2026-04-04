import React from 'react';

const GlassCard = ({ children, className = '', hoverEffect = false, onClick, type = 'default' }) => {
    // Types: 'decision' (High), 'info' (Medium), 'log' (Low)

    // Base quiet style
    const baseStyle = "bg-white border border-[#CBCBCB] rounded-lg";

    // Type modifier (optional usage, mostly keeping generic for now but ensuring border color is strict)

    return (
        <div
            onClick={onClick}
            className={`
                ${baseStyle}
                ${hoverEffect ? 'hover:border-[#999] cursor-pointer' : ''}
                ${className}
            `}
        >
            {children}
        </div>
    );
};

export default GlassCard;
