import React from 'react';
import { FaShoppingBasket, FaPills, FaBoxOpen, FaCoffee, FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const CategoryGrid = () => {
    const navigate = useNavigate();

    const categories = [
        {
            id: 'groceries',
            name: 'Groceries',
            icon: FaShoppingBasket,
            desc: 'Fresh produce & staples',
            color: 'bg-green-50 text-green-600',
            query: 'groceries'
        },
        {
            id: 'pharmacy',
            name: 'Pharmacy',
            icon: FaPills,
            desc: 'Medicines & care',
            color: 'bg-blue-50 text-blue-600',
            query: 'pharmacy'
        },
        {
            id: 'essentials',
            name: 'Essentials',
            icon: FaBoxOpen,
            desc: 'Daily household items',
            color: 'bg-orange-50 text-orange-600',
            query: 'essentials'
        },
        {
            id: 'snacks',
            name: 'Snacks',
            icon: FaCoffee,
            desc: 'Drinks & quick bites',
            color: 'bg-purple-50 text-purple-600',
            query: 'snacks'
        },
    ];

    return (
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 mt-2 mb-16">

            {/* Grid Layout: 2 columns on mobile, 4 on desktop */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">

                {categories.map((cat) => (
                    <div
                        key={cat.id}
                        onClick={() => navigate(`/market/search?q=${cat.query}`)}
                        className="group relative bg-white p-6 rounded-2xl border border-slate-100 shadow-sm 
                       hover:shadow-lg hover:-translate-y-1 hover:border-[#E35336]/20 
                       transition-all duration-300 cursor-pointer overflow-hidden"
                    >
                        {/* Hover Gradient Background (Subtle) */}
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity" />

                        {/* Icon Wrapper */}
                        <div className={`w-12 h-12 mb-4 rounded-xl flex items-center justify-center text-lg transition-colors ${cat.color} group-hover:bg-[#E35336] group-hover:text-white`}>
                            <cat.icon className="w-6 h-6" />
                        </div>

                        {/* Text Content */}
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#E35336] transition-colors">
                                {cat.name}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1 group-hover:text-slate-600">
                                {cat.desc}
                            </p>
                        </div>

                        {/* Floating Arrow (Appears on Hover) */}
                        <div className="absolute bottom-4 right-4 opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                            <FaArrowRight className="w-5 h-5 text-[#E35336]" />
                        </div>

                    </div>
                ))}

            </div>
        </div>
    );
};

export default CategoryGrid;
