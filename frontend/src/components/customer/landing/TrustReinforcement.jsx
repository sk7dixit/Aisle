import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';

const TrustReinforcement = () => {
    return (
        <section className="px-6 pb-20 pt-8 text-center border-t border-gray-50">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
                <FaCheckCircle className="text-gray-400 text-xs" />
                <p className="text-[10px] md:text-xs font-medium text-gray-500">
                    <span className="font-bold text-gray-700">Aisle</span> shows real shops and real availability — not estimated listings.
                </p>
            </div>
        </section>
    );
};

export default TrustReinforcement;
