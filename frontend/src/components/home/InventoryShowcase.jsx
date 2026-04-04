import React, { useState, useEffect } from 'react';
import { productCategories } from '../../data/mockData';
import * as Icons from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

import { useNavigate } from 'react-router-dom';

const InventoryShowcase = () => {
    const navigate = useNavigate();
    const [currentCategory, setCurrentCategory] = useState(0);
    const [displayedItems, setDisplayedItems] = useState([]);

    useEffect(() => {
        // Auto-rotate categories every 8 seconds
        const categoryInterval = setInterval(() => {
            setCurrentCategory((prev) => (prev + 1) % productCategories.length);
        }, 8000);

        return () => clearInterval(categoryInterval);
    }, []);

    useEffect(() => {
        // Update displayed items when category changes
        const category = productCategories[currentCategory];
        setDisplayedItems(category.items);
    }, [currentCategory]);

    const currentCategoryData = productCategories[currentCategory];

    return (
        <section className="py-20 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, rgb(20 184 166) 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }}></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <Badge className="mb-4 px-4 py-2 bg-teal-100 text-teal-700 border-teal-200">
                        NEIGHBORHOOD PULSE
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Fresh Stock in Your Neighborhood
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Real-time inventory from local stores. What you see is what's available right now.
                    </p>
                </div>

                {/* Category Tabs */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    {productCategories.map((category, index) => (
                        <button
                            key={category.id}
                            onClick={() => setCurrentCategory(index)}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${currentCategory === index
                                ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-xl'
                                : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md border border-gray-200'
                                }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {displayedItems.map((item, index) => {
                        const IconComponent = Icons[item.icon] || Icons.Package;

                        return (
                            <Card
                                key={index}
                                className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 animate-fadeInUp"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {/* Icon */}
                                <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <IconComponent className="w-8 h-8 text-teal-700" />
                                </div>

                                {/* Stock Badge */}
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <span className="text-xs font-semibold text-emerald-600 uppercase">In Stock</span>
                                    </div>
                                    <span className="text-xs text-gray-400">{item.time}</span>
                                </div>

                                {/* Product Name */}
                                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">
                                    {item.name}
                                </h3>

                                {/* Location Info */}
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                        <Icons.Store className="w-4 h-4 text-gray-400" />
                                        {item.shop}
                                    </p>
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <Icons.MapPin className="w-4 h-4 text-coral-500" />
                                        {item.location}
                                    </p>
                                </div>

                                {/* Hover Action */}
                                <div className="mt-4 pt-4 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <button className="w-full text-sm font-semibold text-teal-600 hover:text-teal-700 flex items-center justify-center gap-2">
                                        View on Map
                                        <Icons.ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Category Indicator */}
                <div className="flex justify-center gap-2 mt-12">
                    {productCategories.map((_, index) => (
                        <div
                            key={index}
                            className={`h-2 rounded-full transition-all duration-300 ${currentCategory === index ? 'w-12 bg-teal-600' : 'w-2 bg-gray-300'
                                }`}
                        ></div>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center mt-12">
                    <button
                        onClick={() => navigate('/explore')}
                        className="px-8 py-4 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2 mx-auto"
                    >
                        Explore Local Inventory
                        <Icons.ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default InventoryShowcase;
