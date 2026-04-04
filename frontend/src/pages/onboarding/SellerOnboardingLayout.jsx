import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const SellerOnboardingLayout = () => {
    const location = useLocation();

    // Simple Step Indicator
    const getStep = () => {
        if (location.pathname.includes('basics')) return 2;
        if (location.pathname.includes('account')) return 3;
        return 1;
    };

    const step = getStep();

    return (
        <div className="bg-slate-900 min-h-screen flex flex-col text-white">
            <Navbar />

            <main className="flex-grow pt-28 pb-20 px-4">
                <div className="max-w-xl mx-auto">
                    {/* Progress Bar */}
                    <div className="mb-8 flex items-center justify-between px-2">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex flex-col items-center gap-2 relative z-10">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all ${step >= s ? 'bg-cyan-500 text-slate-900 scale-110' : 'bg-slate-700 text-slate-400'
                                    }`}>
                                    {s}
                                </div>
                                <span className="text-xs text-slate-500 font-medium">
                                    {s === 1 ? 'Details' : s === 2 ? 'Shop' : 'Account'}
                                </span>
                            </div>
                        ))}
                        {/* Connecting Line */}
                        <div className="absolute left-0 w-full top-4 h-0.5 bg-slate-800 -z-0 hidden"></div>
                    </div>

                    <Outlet />
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default SellerOnboardingLayout;
