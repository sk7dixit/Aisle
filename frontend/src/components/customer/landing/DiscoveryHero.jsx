import React from 'react';
import { useSidebarState } from '../../../context/SidebarStateContext';

const DiscoveryHero = () => {
    const { signalBrowsing } = useSidebarState();

    return (
        <section className="px-6 py-8 md:py-12 text-center max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 tracking-tight leading-tight">
                Discover what nearby businesses <span className="text-blue-600">actually have</span>.
            </h1>
            <p className="text-gray-500 text-sm md:text-base mb-8 max-w-md mx-auto leading-relaxed">
                Browse real inventory from nearby businesses — updated by the owners themselves.
            </p>

            <button
                onClick={() => {
                    const intentSection = document.getElementById('intent-discovery');
                    if (intentSection) intentSection.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-black text-white px-8 py-3.5 rounded-full font-bold text-sm shadow-lg shadow-gray-200 hover:scale-105 transition-transform active:scale-95"
            >
                See what’s available nearby
            </button>
        </section>
    );
};

export default DiscoveryHero;
