import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Headphones, Laptop, Clock, Store, Watch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LiveInventory = ({ userLocation }) => {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState("Electronics");

    const categories = [
        "Electronics", "Fashion", "Home Goods", "Sports & Fitness", "Books & Stationery"
    ];

    // Mock Data based on Screenshot
    const inventoryData = {
        "Electronics": [
            { title: "iPhone 15 Pro", shop: "Tech Hub", area: "Downtown", time: "2 min ago", icon: Smartphone },
            { title: "Sony WH-1000XM5", shop: "Audio World", area: "Market Street", time: "5 min ago", icon: Headphones },
            { title: "MacBook Air M3", shop: "Apple Store", area: "Mall Road", time: "8 min ago", icon: Laptop },
            { title: "Samsung Galaxy Watch", shop: "Gadget Zone", area: "Park Avenue", time: "12 min ago", icon: Watch },
        ],
        "Fashion": [
            { title: "Levi's 501 Original", shop: "Denim Store", area: "High Street", time: "1 min ago", icon: Store },
            { title: "Nike Air Max", shop: "Shoe Palace", area: "Sports Complex", time: "10 min ago", icon: Store },
            { title: "Ray-Ban Aviator", shop: "Vision Express", area: "Downtown", time: "15 min ago", icon: Store },
            { title: "Zara Summer Dress", shop: "Zara", area: "Mall Road", time: "20 min ago", icon: Store },
        ],
        // Fallback for others
        "Home Goods": [],
        "Sports & Fitness": [],
        "Books & Stationery": []
    };

    const currentItems = inventoryData[selectedCategory] && inventoryData[selectedCategory].length > 0
        ? inventoryData[selectedCategory]
        : inventoryData["Electronics"]; // Fallback

    return (
        <section className="py-24 bg-surface relative overflow-hidden">
            {/* Background dots pattern */}
            <div className="absolute inset-0 opacity-[0.4]"
                style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Section Header */}
                <div className="text-center mb-12">
                    <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-primary-subtle text-primary font-bold text-xs tracking-widest uppercase border border-primary-light/20">
                        Neighborhood Pulse
                    </div>
                    <h2 className="text-3xl md:text-5xl font-extrabold text-dark mb-4 tracking-tight">
                        Fresh Stock in Your Neighborhood
                    </h2>
                    <p className="text-lg text-dark-muted max-w-2xl mx-auto font-medium">
                        Real-time inventory from local stores. What you see is what's available right now.
                    </p>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 border ${selectedCategory === cat
                                ? 'bg-primary text-white border-primary shadow-soft'
                                : 'bg-white text-dark-muted border-gray-200 hover:border-gray-300 hover:bg-surface-muted'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <AnimatePresence mode="wait">
                        {currentItems.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    className="bg-white rounded-3xl p-6 shadow-card border border-surface-muted hover:shadow-soft hover:border-primary-subtle transition-all duration-300 cursor-pointer group"
                                    onClick={() => navigate('/browse')}
                                >
                                    {/* Icon */}
                                    <div className="h-12 w-12 rounded-2xl bg-primary-subtle text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                        <Icon size={24} />
                                    </div>

                                    {/* Status */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="text-[10px] font-bold text-green-600 tracking-wider uppercase">IN STOCK</span>
                                        <span className="text-[10px] text-dark-subtle font-medium">{item.time}</span>
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-lg font-bold text-dark mb-2 group-hover:text-primary transition-colors line-clamp-1">
                                        {item.title}
                                    </h3>

                                    <div className="flex flex-col gap-1 text-xs text-dark-subtle font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <Store className="text-dark-subtle" size={12} />
                                            {item.shop}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="text-dark-subtle" size={12} /> {/* Location Icon replacement? */}
                                            {item.area}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Explore Button */}
                <div className="flex flex-col items-center gap-4">
                    {/* Dots Indicator */}
                    <div className="flex gap-1.5 mb-4">
                        <div className="w-8 h-1.5 rounded-full bg-primary"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                    </div>

                    <button
                        onClick={() => navigate('/browse', { state: { userLocation } })}
                        className="group flex items-center px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold transition-all shadow-soft hover:-translate-y-0.5"
                    >
                        Explore Local Inventory
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </button>
                </div>

            </div>
        </section>
    );
};

export default LiveInventory;
