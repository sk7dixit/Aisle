import React from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaInfoCircle, FaStore, FaMobileAlt, FaTshirt, FaHome, FaPills, FaUtensils, FaPenNib, FaSearch } from 'react-icons/fa';

const ShopTypeGuideModal = ({ onClose }) => {
    const guides = [
        {
            type: "Grocery & Kirana",
            icon: <FaStore className="text-emerald-500" />,
            items: "Rice, Flour, Pulses, Biscuits, Chocolates, Soft Drinks, Milk, Bread, Spices, Soap, Detergent."
        },
        {
            type: "Electronics & Mobile",
            icon: <FaMobileAlt className="text-blue-500" />,
            items: "Smartphones, Headphones, Chargers, Cables, Tablets, Laptops, Power Banks, Small Appliances."
        },
        {
            type: "Fashion & Clothing",
            icon: <FaTshirt className="text-pink-500" />,
            items: "T-shirts, Jeans, Dresses, Sarees, Footwear, Jewelry, Belts, Watches, Bags, Perfumes."
        },
        {
            type: "Home & Kitchen",
            icon: <FaHome className="text-orange-500" />,
            items: "Pots, Pans, Containers, Decor, Bedding, Small Furniture, Tools, Gardening Supplies."
        },
        {
            type: "Pharmacy & Medical",
            icon: <FaPills className="text-red-500" />,
            items: "Medicines, Vitamin Supplements, First Aid, Hygiene products, Baby care, sanitizers."
        },
        {
            type: "Restaurants & Food",
            icon: <FaUtensils className="text-amber-500" />,
            items: "Prepared Meals, Snacks (Samosa/Patties), Cakes, Sweets, Bakery items, Fast Food."
        },
        {
            type: "Stationery & Gifts",
            icon: <FaPenNib className="text-purple-500" />,
            items: "Notebooks, Pens, Art supplies, Office files, Gift wrappers, Greeting cards, Toys."
        },
        {
            type: "Other",
            icon: <FaSearch className="text-gray-500" />,
            items: "Services, Specialized repairs, Hardware stores, or anything not fitting above."
        }
    ];

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            ></div>

            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-zoom-in">
                {/* ... existing guide content ... */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white">
                    <div className="flex justify-between items-start mb-2">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                            <FaInfoCircle size={24} />
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <FaTimes size={20} />
                        </button>
                    </div>
                    <h2 className="text-2xl font-bold">Shop Type Guide</h2>
                    <p className="text-emerald-100 text-sm mt-1">Select the most relevant type for your inventory.</p>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        {guides.map((guide, idx) => (
                            <div key={idx} className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    {guide.icon}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">{guide.type}</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed mt-1">
                                        {guide.items}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-center">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:translate-y-[-2px] active:translate-y-0 transition-all shadow-lg shadow-slate-900/20"
                    >
                        Got it, Thanks!
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ShopTypeGuideModal;
