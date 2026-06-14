import React from 'react';
import { FaMapMarkerAlt, FaStar, FaStore, FaPalette, FaCheckCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// Helper for image URLs
const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('data:')) return path; // Base64
    if (path.startsWith('http')) return path; // External or full URL
    // Return relative path to utilize Vite proxy and avoid CORS/CORP issues
    return `${path.startsWith('/') ? '' : '/'}${path}`;
};

const CreatorCard = ({ _id, name, category, isOpen, image, distance, rating, numReviews, creationCount, story }) => {
    const navigate = useNavigate();

    // Format distance nicely
    const formatDistance = (distMeters) => {
        if (distMeters === null || distMeters === undefined) return "Near you";
        return distMeters < 1000 
            ? `${Math.round(distMeters)} m` 
            : `${(distMeters / 1000).toFixed(1)} km`;
    };

    return (
        <div
            onClick={() => navigate(`/creator/${_id}`)}
            className="group creator-card bg-white rounded-3xl p-5 flex flex-col sm:flex-row gap-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)] border border-slate-100/60 hover:border-slate-200/80 transition-all duration-300 cursor-pointer relative overflow-hidden"
        >
            {/* Visual background badge */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-full -mr-6 -mt-6"></div>

            {/* 1. Image Showcase */}
            <div className="relative w-full sm:w-[130px] h-[130px] bg-slate-50 rounded-2xl shrink-0 overflow-hidden shadow-inner border border-slate-100 flex items-center justify-center">
                {image ? (
                    <img
                        src={getImageUrl(image)}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=400&q=80" }}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50/20 text-indigo-400">
                        <FaPalette className="text-3xl mb-1 opacity-70" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Creator</span>
                    </div>
                )}

                {/* Categories Badge */}
                <span className="absolute top-2.5 left-2.5 bg-black/60 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md backdrop-blur-xs select-none">
                    ✨ Creator
                </span>
            </div>

            {/* 2. Details Area */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
                <div className="space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                            <h3 className="text-base font-extrabold text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                                {name}
                                <FaCheckCircle className="text-teal-500 text-xs flex-shrink-0" title="Verified Creator" />
                            </h3>
                            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mt-0.5">{category}</p>
                        </div>

                        {/* Rating block */}
                        <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-xl">
                            <FaStar className="text-amber-500 text-xs" />
                            <span className="text-xs font-black text-amber-700">{rating > 0 ? rating.toFixed(1) : "5.0"}</span>
                            {numReviews > 0 && (
                                <span className="text-[10px] text-slate-500 font-semibold">({numReviews})</span>
                            )}
                        </div>
                    </div>

                    {/* Story Snippet */}
                    <p className="text-xs text-slate-500 font-semibold line-clamp-2 leading-relaxed">
                        "{story}"
                    </p>

                    {/* Meta stats bar */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-bold text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                            <FaMapMarkerAlt className="text-slate-400" />
                            {formatDistance(distance)} away
                        </span>
                        <span className="select-none">•</span>
                        <span className="text-slate-600 font-black">
                            📦 {creationCount || 0} Creations
                        </span>
                        <span className="select-none">•</span>
                        <span className={`flex items-center gap-1 font-black ${isOpen ? 'text-teal-600' : 'text-slate-400'}`}>
                            {isOpen ? '🟢 Accepting Requests' : '🔴 Fully Booked'}
                        </span>
                    </div>
                </div>

                {/* CTA Action */}
                <div className="flex justify-end mt-4">
                    <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/creator/${_id}`); }}
                        className="text-[10px] font-black bg-indigo-600 text-white hover:bg-black px-6 py-2.5 rounded-xl transition-all uppercase tracking-widest shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                    >
                        View Creations
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreatorCard;
