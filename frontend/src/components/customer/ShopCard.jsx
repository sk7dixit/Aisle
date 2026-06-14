import React from 'react';
import { FaMapMarkerAlt, FaStar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useActivity } from '../../context/ActivityContext';
import CertaintyBadge from '../common/CertaintyBadge';
import { calculateDistance } from '../../utils/distance';
import { estimateWalkingTime } from '../../utils/estimateWalkingTime';
import { formatDistance } from '../../utils/formatDistance';

// Helper for image URLs
const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('data:')) return path; // Base64
    if (path.startsWith('http')) return path; // External or full URL
    // Return relative path to utilize Vite proxy and avoid CORS/CORP issues
    return `${path.startsWith('/') ? '' : '/'}${path}`;
};

const ShopCard = ({ _id, name, category, location, isVerified, isOpen, image, distanceKm, distanceMeters, shopLocation, planId, rating, operatingMode }) => {
    const navigate = useNavigate();

    // Location & Distance Calculation (Mandatory Requirement)
    let distanceText = distanceMeters !== undefined ?
        (distanceMeters < 1000 ? `${Math.round(distanceMeters)} m` : `${(distanceMeters / 1000).toFixed(1)} km`) :
        (distanceKm ? `${distanceKm} km` : "Near you");

    // Subscription Badges (Strict Requirement)
    const renderBadge = () => {
        if (planId === 'pro') {
            return <span className="badge-pro ml-2 inline-flex items-center">Verified & Priority</span>;
        }
        if (planId === 'growth') {
            return <span className="badge-growth ml-2 inline-flex items-center">Trusted Seller</span>;
        }
        return null;
    };

    const handleVisit = (e) => {
        e.stopPropagation();
        if (_id) navigate(`/shop/${_id}`);
    };

    return (
        <div
            onClick={() => _id && navigate(`/shop/${_id}`)}
            className="group shop-card relative bg-white rounded-2xl p-[14px] flex gap-[14px] shadow-[0_8px_22px_rgba(0,0,0,0.06)] hover:shadow-lg transition-all cursor-pointer border border-transparent hover:border-gray-100"
        >
            {/* 1. IMAGE AREA (Fixed Square) */}
            <div className="relative w-[100px] h-[100px] bg-gray-50 rounded-xl shrink-0 overflow-hidden">
                {image ? (
                    <img
                        src={getImageUrl(image)}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1604719312566-b7e677c66235?auto=format&fit=crop&w=400&q=80" }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 grayscale opacity-40">
                        <span className="text-2xl">🏪</span>
                    </div>
                )}
            </div>

            {/* 2. CONTENT AREA */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h3 className="text-[15px] font-bold text-gray-900 truncate flex items-center">
                            {name}
                            {renderBadge()}
                        </h3>
                    </div>

                    {rating > 0 && (
                        <div className="flex items-center gap-1 mb-1">
                            <FaStar className="text-yellow-400 text-[10px]" />
                            <span className="text-[11px] font-bold text-gray-600">{rating.toFixed(1)}</span>
                        </div>
                    )}

                    <p className="text-[12px] text-gray-500 font-medium truncate mb-0.5">
                        {category || 'General Store'}
                    </p>

                    {/* Modernized Availability System Badges */}
                    <div className="flex items-center gap-1.5 mb-2">
                        {operatingMode === 'GUARANTEED' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                🟢 Live Inventory
                            </span>
                        )}
                        {operatingMode === 'BEST_EFFORT' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                🔵 Verified Availability
                            </span>
                        )}
                        {operatingMode === 'RUSH' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                🟡 Check Before Visit
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold text-gray-400">
                            {distanceText} away
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className={`text-[12px] font-bold ${isOpen ? 'text-[#137333]' : 'text-gray-400'}`}>
                            {isOpen ? 'OPEN' : 'CLOSED'}
                        </span>
                    </div>
                </div>

                <div className="flex justify-end mt-2">
                    <button
                        onClick={handleVisit}
                        className="text-[11px] font-bold bg-[#E07A5F] text-white px-6 py-2 rounded-xl hover:bg-black transition-all uppercase tracking-wider shadow-sm active:scale-95"
                    >
                        VISIT
                    </button>
                </div>
            </div>

            <style sx>{`
                .badge-growth {
                    font-size: 11px;
                    padding: 3px 8px;
                    border-radius: 999px;
                    background: #e6f4ea;
                    color: #137333;
                    font-weight: 700;
                    white-space: nowrap;
                }
                .badge-pro {
                    font-size: 11px;
                    padding: 3px 8px;
                    border-radius: 999px;
                    background: #ede9fe;
                    color: #5b21b6;
                    font-weight: 700;
                    white-space: nowrap;
                }
            `}</style>
        </div>
    );
};

export default ShopCard;

