import React from 'react';
import { NavLink } from 'react-router-dom';

const CustomerNavStrip = () => {
    // Navigation Links Data matching routes
    const navItems = [
        { name: 'Home', path: '/home', end: true },
        { name: 'Shops', path: '/shops' },
        { name: 'Services', path: '/services' },
        { name: 'Interested', path: '/interested' },
    ];

    return (
        // 1. The Sticky Container (Glass effect) - Adapted to top-[72px] to sit below Header
        <div className="sticky top-[72px] z-20 w-full bg-[#181411]/90 backdrop-blur-md border-b border-white/5 shadow-sm transition-all duration-300">

            {/* 2. Centered Inner Wrapper */}
            <div className="flex justify-center items-center h-16 max-w-[1440px] mx-auto px-4">

                {/* 3. The Navigation Links */}
                <nav className="flex items-center space-x-1 bg-white/60 p-1.5 rounded-full border border-white/60 shadow-inner ring-1 ring-white/50">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) => `
                                relative px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ease-out
                                ${isActive
                                    ? 'bg-[#E35336] text-white shadow-md shadow-orange-900/10 scale-100' // Active State: Terracotta
                                    : 'text-slate-500 hover:text-[#E35336] hover:bg-[#E35336]/5' // Inactive State
                                }
                            `}
                        >
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

            </div>
        </div>
    );
};



export default CustomerNavStrip;
