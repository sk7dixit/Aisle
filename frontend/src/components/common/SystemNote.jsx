import React from 'react';

const SystemNote = ({ children, className = "", align = "center" }) => {
    const alignmentClass = align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";
    
    return (
        <p className={`text-xs text-gray-500/80 font-medium leading-relaxed max-w-2xl mx-auto py-2 ${alignmentClass} ${className}`}>
            {children}
        </p>
    );
};

export default SystemNote;
