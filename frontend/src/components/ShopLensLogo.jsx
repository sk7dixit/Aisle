import React from 'react';

const ShopLensLogo = ({ className = "" }) => {
    return (
        <div className={`logo flex items-center gap-2.5 ${className}`}>
            {/* Logo Image */}
            <img
                src="/shoplens_logo_transparent.png"
                alt="ShopLens Logo"
                className="h-[54px] w-auto object-contain"
            />
            {/* Brand Text Block Removed as per user request */}
        </div>
    );
};

export default ShopLensLogo;