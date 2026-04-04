import React from 'react';
import { FaMapMarkerAlt, FaStar, FaArrowRight, FaShieldAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ShopList = () => {
    const navigate = useNavigate();

    const shops = [
        {
            id: 1,
            name: 'Dixit Mart',
            category: 'General Store',
            rating: 4.8,
            distance: '0.8 km',
            status: 'Open Now',
            stockStatus: 'High Stock',
            image: 'https://images.unsplash.com/photo-1604719312566-b7e605f6d433?auto=format&fit=crop&q=80&w=400',
            address: 'Near Parul Uni, Vadodara'
        },
        {
            id: 2,
            name: 'Radhe Medicals',
            category: 'Pharmacy',
            rating: 4.5,
            distance: '1.2 km',
            status: 'Open Now',
            stockStatus: 'Moderate',
            image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&q=80&w=400',
            address: 'Waghodia Road, Vadodara'
        },
        {
            id: 3,
            name: 'Fresh Greens',
            category: 'Vegetables',
            rating: 4.9,
            distance: '2.5 km',
            status: 'Closing Soon',
            stockStatus: 'Refilling',
            image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
            address: 'Main Market Area'
        }
    ];

    return (
        <div className="w-full max-w-5xl mx-auto px-4 md:px-8 mb-24">

            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Nearby Shops</h2>
                <button
                    onClick={() => navigate('/nearby')}
                    className="text-[#E35336] font-medium hover:text-orange-700 flex items-center gap-1 transition-colors"
                >
                    View all <FaArrowRight className="w-3 h-3" />
                </button>
            </div>

            {/* List of Cards */}
            <div className="flex flex-col gap-4">
                {shops.map((shop) => (
                    <div
                        key={shop.id}
                        onClick={() => navigate(`/market/shop/${shop.id}`)}
                        className="group bg-white rounded-2xl p-4 border border-slate-100 shadow-sm 
                       hover:shadow-md hover:border-[#E35336]/30 transition-all duration-300
                       flex flex-col md:flex-row gap-6 items-start md:items-center cursor-pointer"
                    >

                        {/* 1. Shop Image (Rounded Square) */}
                        <div className="w-full md:w-32 h-32 md:h-24 rounded-xl overflow-hidden shrink-0 relative bg-slate-100">
                            <img
                                src={shop.image}
                                alt={shop.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {/* Floating Rating Badge */}
                            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md text-xs font-bold text-slate-800 flex items-center gap-1 shadow-sm">
                                <FaStar className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {shop.rating}
                            </div>
                        </div>

                        {/* 2. Shop Details */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#E35336] bg-orange-50 px-2 py-0.5 rounded-md">
                                    {shop.category}
                                </span>
                                {shop.status === 'Open Now' && (
                                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Open
                                    </span>
                                )}
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 truncate group-hover:text-[#E35336] transition-colors">{shop.name}</h3>

                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                <div className="flex items-center gap-1">
                                    <FaMapMarkerAlt className="w-3.5 h-3.5 text-slate-400" /> {shop.distance}
                                </div>
                                <div className="flex items-center gap-1">
                                    <FaMapMarkerAlt className="w-3.5 h-3.5 text-slate-400" /> {shop.address}
                                </div>
                            </div>
                        </div>

                        {/* 3. Action Side (Right) */}
                        <div className="w-full md:w-auto flex md:flex-col items-center justify-between md:items-end gap-3 md:pl-6 md:border-l border-slate-100">

                            {/* Trust Badge */}
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                <FaShieldAlt className="w-3.5 h-3.5 text-emerald-500" />
                                Verified Owner
                            </div>

                            {/* Action Button */}
                            <button className="w-full md:w-auto bg-[#F77F00] hover:bg-[#E35336] text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-orange-900/20 group-hover:shadow-orange-900/40">
                                Visit Shop
                            </button>
                        </div>

                    </div>
                ))}
            </div>

        </div>
    );
};

export default ShopList;
