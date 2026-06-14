import React from 'react';
import { MapPin, ShoppingBag, Star, ArrowRight, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ExploreCard = ({ shop }) => {
    const navigate = useNavigate();

    const handleInteraction = () => {
        // "Interaction Gate": Redirect to Login with return intent
        navigate(`/login?redirect=/shop/${shop._id}`);
    };

    // Derived category label
    const categoryLabel = shop.category === 'Home Businesses' ? '🏠 Home Business' : `🏪 ${shop.category || 'Retail Shop'}`;

    return (
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col overflow-hidden h-full">
            {/* Cover Banner Area */}
            <div className="h-32 w-full relative overflow-hidden bg-gradient-to-br from-teal-500/20 via-amber-500/10 to-rose-500/10">
                {shop.shopImage ? (
                    <img 
                        src={shop.shopImage} 
                        alt={shop.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                            e.target.style.display = 'none'; // Fallback to gradient if image fails
                        }}
                    />
                ) : null}
                
                {/* Status Float Badge */}
                <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase inline-flex items-center gap-1.5 backdrop-blur-md border ${
                        shop.isOpen 
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-950 font-black shadow-sm' 
                            : 'bg-slate-900/60 border-slate-800 text-slate-100 font-semibold'
                    }`}>
                        {shop.isOpen ? (
                            <>
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                <span>Open Now</span>
                            </>
                        ) : (
                            <>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                <span>Closed</span>
                            </>
                        )}
                    </span>
                </div>

                {/* Category Floating Tag */}
                <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur shadow border border-slate-100 px-3 py-1 rounded-full text-[9px] font-black text-slate-700 uppercase tracking-wider">
                    {categoryLabel}
                </div>
            </div>

            {/* Content Area */}
            <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                
                {/* Title and Ratings */}
                <div className="space-y-1 text-left">
                    <h3 className="text-base font-extrabold text-slate-800 line-clamp-1 group-hover:text-teal-600 transition-colors">
                        {shop.name}
                    </h3>
                    
                    {/* Stars and Reviews */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-0.5 text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="font-extrabold text-slate-800">{shop.rating ? Number(shop.rating).toFixed(1) : "4.7"}</span>
                        </div>
                        <span>•</span>
                        <span>{shop.numReviews || 12} reviews</span>
                    </div>
                </div>

                {/* Details list */}
                <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 text-left">
                        <MapPin className="w-4 h-4 text-teal-600 flex-shrink-0" />
                        <span className="truncate">{shop.address || 'Vadodara'}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-teal-700 font-bold flex-shrink-0">📍 {shop.distance || 'Nearby'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 text-left">
                        <ShoppingBag className="w-4 h-4 text-rose-500 flex-shrink-0" />
                        <span className="text-slate-500">Inventory:</span>
                        <span className="text-rose-600 font-black">🛒 {shop.productCount || 0} Products available</span>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-50 w-full" />

                {/* Button Action */}
                <button
                    onClick={handleInteraction}
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 text-white font-extrabold text-xs tracking-wider uppercase hover:bg-teal-600 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 group-hover:shadow-md shadow-sm"
                >
                    <span>View Shop</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>

            </div>
        </div>
    );
};

export default ExploreCard;
