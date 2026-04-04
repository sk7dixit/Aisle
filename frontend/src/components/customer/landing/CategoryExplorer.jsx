import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getGenericImage } from '../../../utils/GenericImages';

const CategoryExplorer = () => {
    const navigate = useNavigate();

    const categories = [
        'Grocery', 'Medical', 'Stationery', 'Electronics', 'Fruit & Veg', 'Bakery'
    ];

    return (
        <section className="px-6 mb-16 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6 border-t border-gray-100 pt-8">
                <h2 className="text-lg font-bold text-gray-900">Explore by Shop Type</h2>
                <button onClick={() => navigate('/categories')} className="text-xs font-bold text-blue-600 hover:underline">View All</button>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {categories.map((cat, i) => (
                    <button
                        key={i}
                        onClick={() => navigate(`/market/search?q=${cat}`)}
                        className="group flex flex-col items-center gap-2"
                    >
                        <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-100 overflow-hidden group-hover:border-blue-300 transition-colors shadow-sm">
                            <img src={getGenericImage(cat)} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={cat} />
                        </div>
                        <span className="text-xs font-medium text-gray-600 group-hover:text-blue-700 text-center">{cat}</span>
                    </button>
                ))}
            </div>
        </section>
    );
};

export default CategoryExplorer;
