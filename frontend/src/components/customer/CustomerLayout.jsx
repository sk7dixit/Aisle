import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import CustomerTopBar from './CustomerTopBar';
import CustomerBottomNav from './CustomerBottomNav';
import SupportPanel from './SupportPanel';

const CustomerLayout = ({ children }) => {
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    // No Sidebar Logic anymore. 
    // The layout is strictly single-column, centered.

    return (
        <div className="min-h-screen w-full font-sans selection:bg-[var(--accent-terracotta)] selection:text-white pb-20 md:pb-0 relative bg-gradient-to-br from-pink-50 via-white to-orange-50">

            {/* AURORA GLOW HANDLED BY CSS BODY::BEFORE */}


            {/* Application Container (Z-Index 10 to float above bg) */}
            <div className="max-w-7xl mx-auto min-h-screen relative flex flex-col z-content">

                {/* Fixed Top Bar (Includes Nav) */}
                <CustomerTopBar onSupportClick={() => setIsSupportOpen(true)} />

                {/* Main Content Area */}
                <div className="flex-1 w-full pt-[120px]">
                    {/* Header is approx h-20 (80px) + pb-3 nav area ~ 30px + padding ~ 110-120px total height context */}
                    {/* Actually:
                        .h-20 = 5rem = 80px
                        nav area = ~40px
                        Total fixed header height ~ 120px
                    */}

                    <main className="w-full bg-transparent min-h-[85vh] relative text-[var(--text-primary)] page-content pt-4">
                        <Outlet />
                    </main>
                </div>

                <CustomerBottomNav />

                {/* SLIDE-IN SUPPORT PANEL */}
                <SupportPanel isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
            </div>
        </div>
    );

};

export default CustomerLayout;
