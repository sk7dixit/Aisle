import React from 'react';

// Standardized Page Wrapper to enforce entry motion
// "Motion is opacity + translateY only"
// "No scale on load"
const PageWrapper = ({ children, className = "" }) => {
    return (
        <div className={`animate-page-fade w-full ${className}`}>
            {children}
        </div>
    );
};

export default PageWrapper;
