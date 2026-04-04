import React from 'react';
import { FaStore, FaWalking, FaClock, FaShoppingBasket, FaPrescriptionBottleAlt } from 'react-icons/fa';

const DiscoveryEntryBlocks = ({ onSignal }) => {
    return (
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Block 1: Closest */}
            <button
                onClick={() => onSignal('closest')}
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left flex flex-col justify-between h-28 group"
            >
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FaWalking className="text-sm" />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700">Walking Distance</p>
                    <p className="text-[10px] text-gray-500">Shops within 500m</p>
                </div>
            </button>

            {/* Block 2: Essentials */}
            <button
                onClick={() => onSignal('essentials')}
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all text-left flex flex-col justify-between h-28 group"
            >
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <FaShoppingBasket className="text-sm" />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-amber-700">Daily Essentials</p>
                    <p className="text-[10px] text-gray-500">Groceries & Milk</p>
                </div>
            </button>

            {/* Block 3: Pharmacy */}
            <button
                onClick={() => onSignal('pharmacy')}
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all text-left flex flex-col justify-between h-28 group"
            >
                <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <FaPrescriptionBottleAlt className="text-sm" />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-green-700">Pharmacy</p>
                    <p className="text-[10px] text-gray-500">Meds & First Aid</p>
                </div>
            </button>

            {/* Block 4: All Open */}
            <button
                onClick={() => onSignal('open_now')}
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all text-left flex flex-col justify-between h-28 group"
            >
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <FaClock className="text-sm" />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-purple-700">Open Now</p>
                    <p className="text-[10px] text-gray-500">View all active shops</p>
                </div>
            </button>
        </div>
    );
};

export default DiscoveryEntryBlocks;
