import React from 'react';
import { FaMapMarkerAlt, FaStore, FaClock, FaChevronRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ExploreCard = ({ shop }) => {
    const navigate = useNavigate();

    const handleInteraction = () => {
        // "Interaction Gate": Redirect to Login with return intent
        navigate(`/login?redirect=/shop/${shop._id}`);
    };

    return (
        <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col items-start gap-3">
            {/* 1. Shop Name */}
            <h3 className="text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-teal-600 transition-colors">
                {shop.name}
            </h3>

            {/* 2. Open / Closed Badge */}
            <div className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${shop.isOpen ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                <div className={`w-2 h-2 rounded-full ${shop.isOpen ? 'bg-green-500' : 'bg-slate-400'}`} />
                {shop.isOpen ? 'Open now' : 'Closed'}
            </div>

            {/* 3. Category • Distance */}
            <div className="text-sm text-slate-500 font-medium">
                {shop.category || 'General Shop'} • {shop.distance || 'Nearby'}
            </div>

            {/* Small Divider */}
            <div className="w-full h-px bg-slate-100 my-1" />

            {/* 4. Live Inventory Line */}
            <div className="text-sm text-slate-500 font-medium">
                {shop.productCount || 0} products available
            </div>

            {/* 5. Primary Action */}
            <button
                onClick={handleInteraction}
                className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-teal-600 transition-all active:scale-[0.98] mt-2"
            >
                View Shop
            </button>
        </div>
    );
};

export default ExploreCard;
